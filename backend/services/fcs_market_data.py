"""
FCS API market data service for fetching real-time BTCUSDT data from FCS API.
Supports REST API for latest price and historical candles.
"""
import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Callable, List
from dataclasses import dataclass, field
from threading import Lock
import requests
import websockets
import ssl

from backend.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class CandleData:
    """Represents a single OHLCV candle."""
    timestamp: int  # milliseconds
    open: float
    high: float
    low: float
    close: float
    volume: float
    
    @property
    def timestamp_iso(self) -> str:
        return datetime.fromtimestamp(self.timestamp / 1000, tz=timezone.utc).isoformat()
    
    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp_iso,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
        }


@dataclass
class MarketSnapshot:
    """Current market snapshot with price, candle, and metadata."""
    candle: CandleData
    price_usdt: float
    timestamp: datetime
    source: str = "FCS API"
    is_live: bool = True


class FCSRestClient:
    """REST client for FCS API v4."""
    
    def __init__(self, api_key: str, timeout: int = 10):
        self.api_key = api_key
        self.timeout = timeout
        self.base_url = "https://api-v4.fcsapi.com"
        self.session = requests.Session()
        self.session.params = {"access_key": api_key}
        self._valid_key = bool(api_key and api_key != "your_fcs_api_key_here")
    
    def _make_request(self, endpoint: str, params: dict = None) -> Optional[Dict]:
        """Make a request to FCS API with error handling."""
        if not self._valid_key:
            logger.warning("FCS API key not configured, skipping FCS API call")
            return None
            
        try:
            params = params or {}
            params["access_key"] = self.api_key
            resp = self.session.get(f"{self.base_url}{endpoint}", params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            
            if data.get("status") != True:
                logger.error(f"FCS API error: {data.get('message', 'Unknown error')}")
                return None
            
            return data.get("response", [])
        except Exception as e:
            logger.error(f"Failed to fetch from FCS API: {e}")
            return None
    
    def get_latest_price(self, symbol: str = "BINANCE:BTCUSDT") -> Optional[float]:
        """Get latest price from FCS API."""
        data = self._make_request("/crypto/latest", {"symbol": symbol})
        if data and isinstance(data, list) and len(data) > 0:
            try:
                return float(data[0].get("c", 0))
            except (KeyError, ValueError, TypeError):
                pass
        return None
    
    def get_latest_candle(self, symbol: str = "BINANCE:BTCUSDT", interval: str = "5m") -> Optional[Dict]:
        """Get the latest completed candle from FCS API."""
        # FCS history endpoint with limit=1 for latest candle
        data = self._make_request("/crypto/history", {
            "symbol": symbol,
            "period": self._convert_interval(interval),
            "limit": 2  # Get 2 to get the last completed candle
        })
        if data and isinstance(data, list) and len(data) >= 2:
            # Return the second-to-last (completed) candle
            k = data[-2]
            return {
                "timestamp": int(k.get("t", 0)) * 1000,  # FCS returns seconds, convert to ms
                "open": float(k.get("o", 0)),
                "high": float(k.get("h", 0)),
                "low": float(k.get("l", 0)),
                "close": float(k.get("c", 0)),
                "volume": float(k.get("v", 0)),
            }
        return None
    
    def get_historical_candles(
        self, 
        symbol: str = "BINANCE:BTCUSDT", 
        interval: str = "5m", 
        limit: int = 200,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None
    ) -> List[Dict]:
        """Get historical candles from FCS API."""
        params = {
            "symbol": symbol,
            "period": self._convert_interval(interval),
            "limit": min(limit, 1000),  # FCS API max limit
        }
        if start_time:
            params["from"] = start_time // 1000  # Convert ms to seconds
        if end_time:
            params["to"] = end_time // 1000
        
        data = self._make_request("/crypto/history", params)
        if data and isinstance(data, list):
            return [
                {
                    "timestamp": int(k.get("t", 0)) * 1000,  # FCS returns seconds
                    "open": float(k.get("o", 0)),
                    "high": float(k.get("h", 0)),
                    "low": float(k.get("l", 0)),
                    "close": float(k.get("c", 0)),
                    "volume": float(k.get("v", 0)),
                }
                for k in data
            ]
        return []
    
    def _convert_interval(self, interval: str) -> str:
        """Convert interval format to FCS API format."""
        mapping = {
            "1m": "1m",
            "5m": "5m",
            "15m": "15m",
            "30m": "30m",
            "1h": "1h",
            "4h": "4h",
            "1d": "1d",
            "1w": "1w",
            "1M": "1M",
        }
        return mapping.get(interval, "5m")


class FCSWebSocketClient:
    """WebSocket client for FCS real-time kline stream."""
    
    WS_BASE_URL = "wss://ws-v4.fcsapi.com/ws"
    
    def __init__(self, api_key: str, symbol: str = "BINANCE:BTCUSDT", interval: str = "5m"):
        self.api_key = api_key
        self.symbol = symbol
        self.interval = interval
        # FCS API expects the access_key as a query parameter
        self.ws_url = f"{self.WS_BASE_URL}?access_key={api_key}"
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.running = False
        self.on_kline_callback: Optional[Callable[[CandleData], None]] = None
        self.on_error_callback: Optional[Callable[[Exception], None]] = None
        self.on_connect_callback: Optional[Callable[[], None]] = None
        self.on_disconnect_callback: Optional[Callable[[], None]] = None
        self._lock = Lock()
        self._reconnect_task: Optional[asyncio.Task] = None
        self._listen_task: Optional[asyncio.Task] = None
        self._reconnect_attempts = 0
        self._max_reconnect_attempts = 5  # Reduced from 10
        self._reconnect_delay = 1
        self._max_reconnect_delay = 60
        self._subscribed = False
        # Create SSL context with system CA certificates
        import ssl
        self._ssl_context = ssl.create_default_context()
        self._ssl_context.check_hostname = True
        self._ssl_context.verify_mode = ssl.CERT_REQUIRED
        # Check if API key is valid
        self._valid_key = bool(api_key and api_key != "your_fcs_api_key_here")
    
    def set_callbacks(
        self,
        on_kline: Optional[Callable[[CandleData], None]] = None,
        on_error: Optional[Callable[[Exception], None]] = None,
        on_connect: Optional[Callable[[], None]] = None,
        on_disconnect: Optional[Callable[[], None]] = None,
    ):
        self.on_kline_callback = on_kline
        self.on_error_callback = on_error
        self.on_connect_callback = on_connect
        self.on_disconnect_callback = on_disconnect
    
    async def connect(self):
        """Connect to FCS WebSocket stream."""
        if self.running:
            return
        
        # Don't attempt connection if API key is not configured
        if not self._valid_key:
            logger.warning("FCS API key not configured, skipping WebSocket connection")
            return
        
        self.running = True
        self._reconnect_attempts = 0
        
        while self.running:
            try:
                logger.info(f"Connecting to FCS WebSocket: {self.ws_url}")
                async with websockets.connect(
                    self.ws_url,
                    ping_interval=20,
                    ping_timeout=10,
                    close_timeout=10,
                    ssl=self._ssl_context,
                ) as ws:
                    self.websocket = ws
                    self._reconnect_attempts = 0
                    self._reconnect_delay = 1
                    self._subscribed = False
                    
                    if self.on_connect_callback:
                        self.on_connect_callback()
                    
                    logger.info("FCS WebSocket connected")
                    
                    # Subscribe to the symbol and interval
                    await self._subscribe()
                    
                    await self._listen()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"WebSocket connection error: {e}")
                if self.on_error_callback:
                    self.on_error_callback(e)
                
                if not self.running:
                    break
                
                # Check if it's a 429 rate limit error - don't retry indefinitely
                if "429" in str(e) or "rate limit" in str(e).lower():
                    logger.error("FCS WebSocket rate limited (429), stopping reconnection attempts")
                    break
                
                # Reconnect logic
                self._reconnect_attempts += 1
                if self._reconnect_attempts >= self._max_reconnect_attempts:
                    logger.error(f"Max reconnect attempts ({self._max_reconnect_attempts}) reached, stopping")
                    break
                
                logger.info(f"Reconnecting in {self._reconnect_delay}s (attempt {self._reconnect_attempts})")
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(self._reconnect_delay * 2, self._max_reconnect_delay)
        
        logger.info("WebSocket client stopped")
    
    async def _subscribe(self):
        """Subscribe to the kline stream."""
        if self.websocket and not self._subscribed:
            subscribe_msg = {
                "event": "subscribe",
                "channel": f"kline_{self.interval}",
                "symbol": self.symbol
            }
            await self.websocket.send(json.dumps(subscribe_msg))
            self._subscribed = True
            logger.info(f"Subscribed to {self.symbol} {self.interval} kline stream")
    
    async def _listen(self):
        """Listen for incoming messages."""
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    self._handle_message(data)
                except json.JSONDecodeError:
                    logger.warning("Received invalid JSON from WebSocket")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
        except Exception as e:
            logger.error(f"Listen error: {e}")
        finally:
            self.websocket = None
            if self.on_disconnect_callback:
                self.on_disconnect_callback()
    
    def _handle_message(self, data: dict):
        """Process incoming WebSocket message."""
        # FCS WebSocket message format
        if data.get("event") == "kline" and "data" in data:
            k = data["data"]
            # Only process closed candles (x = true or is_closed = true)
            if k.get("x", False) or k.get("is_closed", False):
                candle = CandleData(
                    timestamp=int(k.get("t", 0)) * 1000,  # FCS returns seconds
                    open=float(k.get("o", 0)),
                    high=float(k.get("h", 0)),
                    low=float(k.get("l", 0)),
                    close=float(k.get("c", 0)),
                    volume=float(k.get("v", 0)),
                )
                if self.on_kline_callback:
                    self.on_kline_callback(candle)
    
    def disconnect(self):
        """Disconnect gracefully."""
        self.running = False
        if self._reconnect_task:
            self._reconnect_task.cancel()
        if self._listen_task:
            self._listen_task.cancel()
        if self.websocket:
            asyncio.create_task(self.websocket.close())


class FCSMarketDataService:
    """
    Service for fetching and streaming live BTCUSDT market data from FCS API.
    Combines REST API polling with WebSocket streaming for real-time updates.
    Falls back to Binance if FCS is unavailable.
    """
    
    def __init__(
        self,
        symbol: str = "BINANCE:BTCUSDT",
        interval: str = "5m",
        rest_poll_interval: int = 10,  # seconds
    ):
        settings = get_settings()
        self.symbol = symbol
        self.interval = interval
        self.rest_poll_interval = rest_poll_interval
        
        self.fcs_rest_client = FCSRestClient(settings.FCS_API_KEY)
        self.fcs_ws_client = FCSWebSocketClient(settings.FCS_API_KEY, symbol, interval)
        
        # Binance fallback (REST only for now - WebSocket disabled)
        from backend.services.live_market_data import BinanceRestClient
        self.binance_rest_client = BinanceRestClient(verify_ssl=False)
        
        self._latest_candle: Optional[CandleData] = None
        self._latest_price: Optional[float] = None
        self._latest_ticker_24h: Optional[Dict] = None
        self._historical_candles: List[Dict] = []
        self._candle_history: List[CandleData] = []  # For real-time chart updates
        self._max_history = 500
        
        self._lock = Lock()
        self._running = False
        self._poll_task: Optional[asyncio.Task] = None
        self._ws_task: Optional[asyncio.Task] = None
        self._fcs_ws_task: Optional[asyncio.Task] = None
        
        # Callbacks for real-time updates
        self.on_price_update: Optional[Callable[[float], None]] = None
        self.on_candle_update: Optional[Callable[[CandleData], None]] = None
        self.on_candle_close: Optional[Callable[[CandleData], None]] = None
        self.on_error: Optional[Callable[[Exception], None]] = None
        
        # Set up FCS WebSocket callbacks
        self.fcs_ws_client.set_callbacks(
            on_kline=self._on_ws_kline,
            on_error=self._on_ws_error,
            on_connect=self._on_ws_connect,
            on_disconnect=self._on_ws_disconnect,
        )
    
    def _on_ws_connect(self):
        logger.info("FCS WebSocket connected - live data streaming started")
    
    def _on_ws_disconnect(self):
        logger.warning("FCS WebSocket disconnected")
    
    def _on_ws_error(self, error: Exception):
        logger.error(f"WebSocket error: {error}")
        if self.on_error:
            self.on_error(error)
    
    def _on_ws_kline(self, candle: CandleData):
        """Handle incoming closed candle from WebSocket."""
        with self._lock:
            self._latest_candle = candle
            self._candle_history.append(candle)
            if len(self._candle_history) > self._max_history:
                self._candle_history = self._candle_history[-self._max_history:]
        
        logger.debug(f"New candle closed: {candle.timestamp_iso} close={candle.close}")
        
        if self.on_candle_close:
            self.on_candle_close(candle)
        
        # Also update price
        with self._lock:
            self._latest_price = candle.close
        
        if self.on_price_update:
            self.on_price_update(candle.close)
    
    async def start(self):
        """Start the live market data service."""
        if self._running:
            return
        
        self._running = True
        
        # Load initial historical candles
        await self._load_initial_candles()
        
        # Fetch initial price
        await self._fetch_initial_price()
        
        # Start WebSocket connection
        self._ws_task = asyncio.create_task(self.fcs_ws_client.connect())
        
        # Start REST polling as backup
        self._poll_task = asyncio.create_task(self._poll_loop())
        
        logger.info("FCS Live market data service started")
    
    async def stop(self):
        """Stop the service."""
        self._running = False
        
        if self._poll_task:
            self._poll_task.cancel()
            try:
                await self._poll_task
            except asyncio.CancelledError:
                pass
        
        if self._ws_task:
            self._ws_task.cancel()
            try:
                await self._ws_task
            except asyncio.CancelledError:
                pass
        
        if self._fcs_ws_task:
            self._fcs_ws_task.cancel()
            try:
                await self._fcs_ws_task
            except asyncio.CancelledError:
                pass
        
        self.fcs_ws_client.disconnect()
        logger.info("FCS Live market data service stopped")
    
    async def _load_initial_candles(self):
        """Load historical candles for chart initialization with fallback."""
        try:
            candles = self.fcs_rest_client.get_historical_candles(
                symbol=self.symbol,
                interval=self.interval,
                limit=200
            )
            if not candles:
                # Fallback to Binance
                from backend.services.live_market_data import BinanceRestClient
                binance_client = BinanceRestClient(verify_ssl=False)
                candles = binance_client.get_historical_klines(
                    symbol=self.symbol.replace("BINANCE:", ""),
                    interval=self.interval,
                    limit=200
                )
            else:
                candles = candles
            
            with self._lock:
                self._historical_candles = candles
                # Also populate candle history for real-time updates
                self._candle_history = [
                    CandleData(
                        timestamp=c["timestamp"],
                        open=c["open"],
                        high=c["high"],
                        low=c["low"],
                        close=c["close"],
                        volume=c["volume"],
                    )
                    for c in candles[-100:]  # Keep last 100 for history
                ]
            logger.info(f"Loaded {len(candles)} historical candles")
        except Exception as e:
            logger.error(f"Failed to load initial candles: {e}")
    
    async def _fetch_initial_price(self):
        """Fetch initial price from REST API with fallback."""
        try:
            price = self.fcs_rest_client.get_latest_price(self.symbol)
            if price is None:
                # Fallback to Binance
                price = self.binance_rest_client.get_ticker_price(self.symbol.replace("BINANCE:", ""))
            if price:
                with self._lock:
                    self._latest_price = price
                logger.info(f"Initial price loaded: {price} USDT")
        except Exception as e:
            logger.error(f"Failed to fetch initial price: {e}")
    
    async def _poll_loop(self):
        """Polling loop for REST API as backup to WebSocket with fallback."""
        while self._running:
            try:
                await asyncio.sleep(self.rest_poll_interval)
                if not self._running:
                    break
                
                # Try FCS first
                price = self.fcs_rest_client.get_latest_price(self.symbol)
                if price is None:
                    # Fallback to Binance
                    price = self.binance_rest_client.get_ticker_price(self.symbol.replace("BINANCE:", ""))
                
                if price:
                    with self._lock:
                        self._latest_price = price
                    if self.on_price_update:
                        self.on_price_update(price)
                
                # Fetch latest candle
                candle_data = self.fcs_rest_client.get_latest_candle(self.symbol, self.interval)
                if candle_data is None:
                    # Fallback to Binance
                    candle_data = self.binance_rest_client.get_latest_kline(
                        self.symbol.replace("BINANCE:", ""), self.interval
                    )
                if candle_data:
                    candle = CandleData(**candle_data)
                    with self._lock:
                        self._latest_candle = candle
                    if self.on_candle_update:
                        self.on_candle_update(candle)
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Poll loop error: {e}")
                await asyncio.sleep(5)
    
    def get_latest_candle(self) -> Optional[CandleData]:
        """Get the latest candle (thread-safe)."""
        with self._lock:
            return self._latest_candle
    
    def get_latest_price(self) -> Optional[float]:
        """Get the latest price (thread-safe)."""
        with self._lock:
            return self._latest_price
    
    def get_historical_candles(self, limit: int = 200) -> List[Dict]:
        """Get historical candles for chart initialization (thread-safe)."""
        with self._lock:
            return self._historical_candles[-limit:] if self._historical_candles else []
    
    def get_candle_history(self, limit: int = 200) -> List[CandleData]:
        """Get candle history for real-time chart (thread-safe)."""
        with self._lock:
            return self._candle_history[-limit:] if self._candle_history else []
    
    def get_market_snapshot(self) -> Optional[Dict]:
        """Get complete market snapshot for API response."""
        with self._lock:
            if not self._latest_candle or self._latest_price is None:
                return None
            
            return {
                "candle": self._latest_candle.to_dict(),
                "indicators": {},  # Will be filled by indicators service
                "regime": "unknown",  # Will be filled by regime service
                "regime_confidence": 0.0,
                "price_usdt": self._latest_price,
                "price_change_24h": None,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "FCS API",
                "is_live": True,
            }


# Global service instance
_fcs_market_service: Optional[FCSMarketDataService] = None


async def get_fcs_market_service() -> FCSMarketDataService:
    """Get or create the global FCS market data service."""
    global _fcs_market_service
    if _fcs_market_service is None:
        _fcs_market_service = FCSMarketDataService()
        await _fcs_market_service.start()
    return _fcs_market_service


async def close_fcs_market_service():
    """Close the global FCS market data service."""
    global _fcs_market_service
    if _fcs_market_service:
        await _fcs_market_service.stop()
        _fcs_market_service = None
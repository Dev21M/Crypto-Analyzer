"""
Live market data service for fetching real-time BTCUSDT data from Binance.
Supports both REST API polling and WebSocket streaming.
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
import certifi

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
    source: str = "Binance Spot API"
    is_live: bool = True


class BinanceRestClient:
    """REST client for Binance Spot API."""
    
    BASE_URL = "https://api.binance.com/api/v3"
    
    def __init__(self, timeout: int = 10, verify_ssl: bool = False):
        self.timeout = timeout
        self.verify_ssl = verify_ssl
        self.session = requests.Session()
        # SSL verification configuration
        # Note: On Windows with corporate proxies/antivirus doing SSL inspection,
        # certificate verification may fail. For local development, verify_ssl=False
        # is used as a workaround. In production, ensure proper CA certificates are installed.
        if verify_ssl:
            import ssl
            # Create a custom adapter that uses system SSL context
            from requests.adapters import HTTPAdapter
            
            class SystemSSLAdapter(HTTPAdapter):
                def init_poolmanager(self, *args, **kwargs):
                    # Use system default SSL context
                    kwargs['ssl_context'] = ssl.create_default_context()
                    return super().init_poolmanager(*args, **kwargs)
            
            self.session.mount('https://', SystemSSLAdapter())
            self.session.verify = True
        else:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            self.session.verify = False
            logger.warning(
                "Binance SSL verification DISABLED - only use for local development! "
                "In production, set verify_ssl=True and ensure proper CA certificates."
            )
    
    def get_ticker_price(self, symbol: str = "BTCUSDT") -> Optional[float]:
        """Get latest price from Binance ticker endpoint."""
        try:
            resp = self.session.get(
                f"{self.BASE_URL}/ticker/price",
                params={"symbol": symbol},
                timeout=5,
            )
            resp.raise_for_status()
            return float(resp.json()["price"])
        except Exception as e:
            logger.error(f"Failed to fetch ticker price: {e}")
            return None
    
    def get_ticker_24hr(self, symbol: str = "BTCUSDT") -> Optional[Dict]:
        """Get 24hr ticker statistics."""
        try:
            resp = self.session.get(
                f"{self.BASE_URL}/ticker/24hr",
                params={"symbol": symbol},
                timeout=5,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch 24hr ticker: {e}")
            return None
    
    def get_latest_kline(self, symbol: str = "BTCUSDT", interval: str = "5m") -> Optional[Dict]:
        """Get the latest completed kline/candle."""
        try:
            resp = self.session.get(
                f"https://api.binance.com/api/v3/klines",
                params={"symbol": "BTCUSDT", "interval": interval, "limit": 2},
                timeout=5,
            )
            resp.raise_for_status()
            klines = resp.json()
            if len(klines) >= 2:
                # Return the second-to-last (completed) candle
                k = klines[-2]
                return {
                    "timestamp": int(k[0]),
                    "open": float(k[1]),
                    "high": float(k[2]),
                    "low": float(k[3]),
                    "close": float(k[4]),
                    "volume": float(k[5]),
                }
            return None
        except Exception as e:
            logger.error(f"Failed to fetch latest kline: {e}")
            return None
    
    def get_historical_klines(
        self, 
        symbol: str = "BTCUSDT", 
        interval: str = "5m", 
        limit: int = 200
    ) -> List[Dict]:
        """Get historical klines for chart initialization."""
        try:
            resp = self.session.get(
                f"{self.BASE_URL}/klines",
                params={"symbol": symbol, "interval": interval, "limit": limit},
                timeout=10,
            )
            resp.raise_for_status()
            klines = resp.json()
            return [
                {
                    "timestamp": int(k[0]),
                    "open": float(k[1]),
                    "high": float(k[2]),
                    "low": float(k[3]),
                    "close": float(k[4]),
                    "volume": float(k[5]),
                }
                for k in klines
            ]
        except Exception as e:
            logger.error(f"Failed to fetch historical klines: {e}")
            return []

    def get_24h_ticker(self, symbol: str = "BTCUSDT") -> Optional[Dict]:
        """Get 24hr ticker statistics (alias for get_ticker_24hr)."""
        return self.get_ticker_24hr(symbol)

    def get_all_24h_tickers(self) -> Optional[List[Dict]]:
        """Get 24hr ticker statistics for all symbols."""
        try:
            resp = self.session.get(
                f"{self.BASE_URL}/ticker/24hr",
                timeout=10,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch all 24hr tickers: {e}")
            return None

    def get_exchange_info(self) -> Optional[Dict]:
        """Get exchange trading rules and symbol information."""
        try:
            resp = self.session.get(
                f"{self.BASE_URL}/exchangeInfo",
                timeout=10,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch exchange info: {e}")
            return None


class BinanceWebSocketClient:
    """WebSocket client for Binance kline stream."""
    
    WS_BASE_URL = "wss://stream.binance.com:9443/ws"
    
    def __init__(self, symbol: str = "btcusdt", interval: str = "5m"):
        self.symbol = symbol.lower()
        self.interval = interval
        self.stream_name = f"{self.symbol}@kline_{self.interval}"
        self.ws_url = f"{self.WS_BASE_URL}/{self.stream_name}"
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
        self._max_reconnect_attempts = 10
        self._reconnect_delay = 1
        self._max_reconnect_delay = 30
        # SSL context with system CA certificates
        self._ssl_context = ssl.create_default_context(cafile=certifi.where())
    
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
        """Connect to Binance WebSocket stream."""
        if self.running:
            return
        
        self.running = True
        self._reconnect_attempts = 0
        
        while self.running:
            try:
                logger.info(f"Connecting to Binance WebSocket: {self.ws_url}")
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
                    
                    if self.on_connect_callback:
                        self.on_connect_callback()
                    
                    logger.info("Binance WebSocket connected")
                    await self._listen()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"WebSocket connection error: {e}")
                if self.on_error_callback:
                    self.on_error_callback(e)
                
                if not self.running:
                    break
                
                # Reconnect logic
                self._reconnect_attempts += 1
                if self._reconnect_attempts >= self._max_reconnect_attempts:
                    logger.error("Max reconnect attempts reached")
                    break
                
                logger.info(f"Reconnecting in {self._reconnect_delay}s (attempt {self._reconnect_attempts})")
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(self._reconnect_delay * 2, self._max_reconnect_delay)
        
        logger.info("WebSocket client stopped")
    
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
        if "e" in data and data["e"] == "kline":
            k = data["k"]
            # Only process closed candles (x = true)
            if k.get("x", False):
                candle = CandleData(
                    timestamp=int(k["t"]),
                    open=float(k["o"]),
                    high=float(k["h"]),
                    low=float(k["l"]),
                    close=float(k["c"]),
                    volume=float(k["v"]),
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


class LiveMarketDataService:
    """
    Service for fetching and streaming live BTCUSDT market data from Binance.
    Combines REST API polling with WebSocket streaming for real-time updates.
    """
    
    def __init__(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "5m",
        rest_poll_interval: int = 10,  # seconds
    ):
        self.symbol = symbol
        self.interval = interval
        self.rest_poll_interval = rest_poll_interval
        
        self.rest_client = BinanceRestClient()
        self.ws_client = BinanceWebSocketClient(symbol, interval)
        
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
        
        # Callbacks for real-time updates
        self.on_price_update: Optional[Callable[[float], None]] = None
        self.on_candle_update: Optional[Callable[[CandleData], None]] = None
        self.on_candle_close: Optional[Callable[[CandleData], None]] = None
        self.on_error: Optional[Callable[[Exception], None]] = None
        
        # Set up WebSocket callbacks
        self.ws_client.set_callbacks(
            on_kline=self._on_ws_kline,
            on_error=self._on_ws_error,
            on_connect=self._on_ws_connect,
            on_disconnect=self._on_ws_disconnect,
        )
    
    def _on_ws_connect(self):
        logger.info("Binance WebSocket connected - live data streaming started")
    
    def _on_ws_disconnect(self):
        logger.warning("Binance WebSocket disconnected")
    
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
        self._ws_task = asyncio.create_task(self.ws_client.connect())
        
        # Start REST polling as backup
        self._poll_task = asyncio.create_task(self._poll_loop())
        
        logger.info("Binance Live market data service started")
    
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
        
        self.ws_client.disconnect()
        logger.info("Binance Live market data service stopped")
    
    async def _load_initial_candles(self):
        """Load historical candles for chart initialization."""
        try:
            candles = self.rest_client.get_historical_klines(
                symbol=self.symbol,
                interval=self.interval,
                limit=200
            )
            
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
        """Fetch initial price from REST API."""
        try:
            price = self.rest_client.get_ticker_price(self.symbol)
            if price:
                with self._lock:
                    self._latest_price = price
                logger.info(f"Initial price loaded: {price} USDT")
        except Exception as e:
            logger.error(f"Failed to fetch initial price: {e}")
    
    async def _poll_loop(self):
        """Polling loop for REST API as backup to WebSocket."""
        while self._running:
            try:
                await asyncio.sleep(self.rest_poll_interval)
                if not self._running:
                    break
                
                price = self.rest_client.get_ticker_price(self.symbol)
                if price:
                    with self._lock:
                        self._latest_price = price
                    if self.on_price_update:
                        self.on_price_update(price)
                
                # Fetch latest candle
                candle_data = self.rest_client.get_latest_kline(self.symbol, self.interval)
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
                "source": "Binance Spot API",
                "is_live": True,
            }


# Global service instance
_live_market_service: Optional[LiveMarketDataService] = None


async def get_live_market_service() -> LiveMarketDataService:
    """Get or create the global live market data service."""
    global _live_market_service
    if _live_market_service is None:
        _live_market_service = LiveMarketDataService()
        await _live_market_service.start()
    return _live_market_service


async def close_live_market_service():
    """Close the global live market data service."""
    global _live_market_service
    if _live_market_service:
        await _live_market_service.stop()
        _live_market_service = None
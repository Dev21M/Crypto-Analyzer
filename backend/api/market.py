"""
Market data and regime API endpoints.
"""
from datetime import datetime, timedelta
from typing import Optional, List
import pandas as pd
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.schemas.models import (
    MarketSnapshot,
    RegimeResponse,
    RegimeType,
    CandleData,
    TechnicalIndicators,
    ErrorResponse,
)
from backend.services.prediction import DataService, RegimeService
from backend.services.fcs_market_data import get_fcs_market_service, FCSMarketDataService
from backend.core.config import get_settings
from backend.services.live_market_data import BinanceRestClient

router = APIRouter(prefix="/market", tags=["Market Data"])

logger = logging.getLogger(__name__)

# Global service references
data_service = None
regime_service = None
fcs_market_service = None


def set_data_service(service):
    global data_service
    data_service = service


def set_regime_service(service):
    global regime_service
    regime_service = service


async def get_live_service():
    """Get or initialize the live market data service."""
    global fcs_market_service
    if fcs_market_service is None:
        fcs_market_service = await get_fcs_market_service()
    return fcs_market_service


# ==================== NEW MARKET ENDPOINTS FOR FRONTEND ====================

@router.get("/overview")
async def get_market_overview():
    """
    Get market overview with major coins, total market cap, volume, BTC dominance, Fear & Greed.
    Falls back to static data if live service unavailable.
    """
    try:
        service = await get_live_service()
        # Try to get live data from FCS/Binance
        btc_price = service.get_latest_price()
        
        if btc_price:
            # Get 24h ticker for BTC from Binance (has change, volume, etc.)
            binance_client = BinanceRestClient(verify_ssl=False)
            btc_ticker = binance_client.get_24h_ticker("BTCUSDT")
            eth_ticker = binance_client.get_24h_ticker("ETHUSDT")
            
            # Calculate market cap (approximate)
            btc_market_cap = btc_price * 19_700_000  # approximate BTC supply
            eth_market_cap = float(eth_ticker.get("lastPrice", 0)) * 120_000_000 if eth_ticker else 0
            
            total_market_cap = btc_market_cap + eth_market_cap + 1_000_000_000_000  # rough estimate
            total_volume = float(btc_ticker.get("volume", 0)) * btc_price + (float(eth_ticker.get("volume", 0)) * float(eth_ticker.get("lastPrice", 0)) if eth_ticker else 0)
            
            btc_dominance = (btc_market_cap / total_market_cap * 100) if total_market_cap > 0 else 0
            
            return {
                "btc": {
                    "price": btc_price,
                    "change24h": float(btc_ticker.get("priceChangePercent", 0)) if btc_ticker else 0,
                    "volume24h": float(btc_ticker.get("volume", 0)) * btc_price if btc_ticker else 0,
                    "high24h": float(btc_ticker.get("highPrice", 0)) if btc_ticker else 0,
                    "low24h": float(btc_ticker.get("lowPrice", 0)) if btc_ticker else 0,
                },
                "eth": {
                    "price": float(eth_ticker.get("lastPrice", 0)) if eth_ticker else 0,
                    "change24h": float(eth_ticker.get("priceChangePercent", 0)) if eth_ticker else 0,
                    "volume24h": float(eth_ticker.get("volume", 0)) * float(eth_ticker.get("lastPrice", 0)) if eth_ticker else 0,
                },
                "totalMarketCap": total_market_cap,
                "totalVolume": total_volume,
                "marketCapChange24h": 0,  # Would need historical data
                "btcDominance": btc_dominance,
                "fearGreedIndex": "—",  # Not available without external API
                "fearGreedLabel": "N/A",
                "timestamp": datetime.utcnow().isoformat(),
                "source": "Binance/FCS API (live)",
                "isLive": True,
            }
    except Exception as e:
        logger.warning(f"Live market overview unavailable: {e}")
    
    # Fallback to static data from data_service
    if not data_service or not regime_service:
        raise HTTPException(status_code=503, detail="Services not initialized")
    
    try:
        candle_data = data_service.get_latest_candle()
        candle = CandleData(**candle_data)
        
        # Get regime
        regime_info = regime_service.get_current_regime()
        
        return {
            "btc": {
                "price": candle.close,
                "change24h": 0,
                "volume24h": candle.volume,
                "high24h": candle.high,
                "low24h": candle.low,
            },
            "eth": {
                "price": 0,
                "change24h": 0,
                "volume24h": 0,
            },
            "totalMarketCap": 0,
            "totalVolume": 0,
            "marketCapChange24h": 0,
            "btcDominance": 0,
            "fearGreedIndex": "—",
            "fearGreedLabel": "N/A",
            "timestamp": datetime.utcnow().isoformat(),
            "source": "Static historical data",
            "isLive": False,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get market overview: {str(e)}")


@router.get("/gainers")
async def get_top_gainers(limit: int = Query(default=10, ge=1, le=50)):
    """Get top gaining cryptocurrencies in 24h."""
    try:
        binance_client = BinanceRestClient(verify_ssl=False)
        tickers = binance_client.get_all_24h_tickers()
        
        if tickers:
            # Filter USDT pairs and sort by 24h change
            usdt_tickers = [t for t in tickers if t.get("symbol", "").endswith("USDT")]
            sorted_tickers = sorted(
                usdt_tickers, 
                key=lambda x: float(x.get("priceChangePercent", 0)), 
                reverse=True
            )
            
            result = []
            for t in sorted_tickers[:limit]:
                result.append({
                    "symbol": t["symbol"].replace("USDT", ""),
                    "name": t["symbol"].replace("USDT", ""),
                    "price": float(t.get("lastPrice", 0)),
                    "change24h": float(t.get("priceChangePercent", 0)),
                    "volume": float(t.get("volume", 0)) * float(t.get("lastPrice", 0)),
                    "high24h": float(t.get("highPrice", 0)),
                    "low24h": float(t.get("lowPrice", 0)),
                })
            return result
    except Exception as e:
        logger.warning(f"Failed to fetch gainers from Binance: {e}")
    
    # Fallback: return empty array
    return []


@router.get("/losers")
async def get_top_losers(limit: int = Query(default=10, ge=1, le=50)):
    """Get top losing cryptocurrencies in 24h."""
    try:
        binance_client = BinanceRestClient(verify_ssl=False)
        tickers = binance_client.get_all_24h_tickers()
        
        if tickers:
            usdt_tickers = [t for t in tickers if t.get("symbol", "").endswith("USDT")]
            sorted_tickers = sorted(
                usdt_tickers, 
                key=lambda x: float(x.get("priceChangePercent", 0))
            )
            
            result = []
            for t in sorted_tickers[:limit]:
                result.append({
                    "symbol": t["symbol"].replace("USDT", ""),
                    "name": t["symbol"].replace("USDT", ""),
                    "price": float(t.get("lastPrice", 0)),
                    "change24h": float(t.get("priceChangePercent", 0)),
                    "volume": float(t.get("volume", 0)) * float(t.get("lastPrice", 0)),
                    "high24h": float(t.get("highPrice", 0)),
                    "low24h": float(t.get("lowPrice", 0)),
                })
            return result
    except Exception as e:
        logger.warning(f"Failed to fetch losers from Binance: {e}")
    
    return []


@router.get("/search")
async def search_coins(q: str = Query(..., min_length=1)):
    """Search for coins by symbol or name."""
    try:
        binance_client = BinanceRestClient(verify_ssl=False)
        # Use exchange info to get all symbols
        exchange_info = binance_client.get_exchange_info()
        
        if exchange_info and "symbols" in exchange_info:
            query = q.upper()
            results = []
            for s in exchange_info["symbols"]:
                symbol = s.get("symbol", "")
                base_asset = s.get("baseAsset", "")
                if query in symbol or query in base_asset:
                    if symbol.endswith("USDT") and s.get("status") == "TRADING":
                        results.append({
                            "symbol": base_asset,
                            "name": base_asset,
                            "fullSymbol": symbol,
                        })
                if len(results) >= 10:
                    break
            return results
    except Exception as e:
        logger.warning(f"Failed to search coins: {e}")
    
    return []


@router.get("/coins")
async def get_supported_coins():
    """Get list of supported trading pairs (USDT pairs from Binance)."""
    try:
        binance_client = BinanceRestClient(verify_ssl=False)
        exchange_info = binance_client.get_exchange_info()
        
        if exchange_info and "symbols" in exchange_info:
            coins = []
            for s in exchange_info["symbols"]:
                symbol = s.get("symbol", "")
                base_asset = s.get("baseAsset", "")
                if symbol.endswith("USDT") and s.get("status") == "TRADING":
                    coins.append({
                        "symbol": base_asset,
                        "name": base_asset,
                        "fullSymbol": symbol,
                    })
            return coins[:100]  # Limit to top 100
    except Exception as e:
        logger.warning(f"Failed to get coins: {e}")
    
    return []


@router.get("/coins/{symbol}")
async def get_coin_details(symbol: str):
    """Get detailed information for a specific coin."""
    try:
        binance_client = BinanceRestClient(verify_ssl=False)
        ticker = binance_client.get_24h_ticker(f"{symbol.upper()}USDT")
        
        if ticker:
            return {
                "symbol": symbol.upper(),
                "name": symbol.upper(),
                "price": float(ticker.get("lastPrice", 0)),
                "change24h": float(ticker.get("priceChangePercent", 0)),
                "volume24h": float(ticker.get("volume", 0)) * float(ticker.get("lastPrice", 0)),
                "high24h": float(ticker.get("highPrice", 0)),
                "low24h": float(ticker.get("lowPrice", 0)),
                "bid": float(ticker.get("bidPrice", 0)),
                "ask": float(ticker.get("askPrice", 0)),
            }
    except Exception as e:
        logger.warning(f"Failed to get coin details: {e}")
    
    raise HTTPException(status_code=404, detail=f"Coin {symbol} not found")


@router.get("/snapshot", response_model=MarketSnapshot)
async def get_market_snapshot():
    """Get current market snapshot with price, indicators, and regime."""
    # Try live market data first
    try:
        service = await get_live_service()
        snapshot = service.get_market_snapshot()
        if snapshot:
            # Get regime info
            if regime_service:
                regime_info = regime_service.get_current_regime()
                snapshot["regime"] = RegimeType(regime_info["regime"])
                snapshot["regime_confidence"] = regime_info["regime_confidence"]
            
            # Get indicators
            if data_service:
                df = data_service.load_features()
                latest = df.iloc[-1]
                indicator_cols = [
                    'sma_12', 'sma_24', 'sma_96', 'ema_12', 'ema_26', 'rsi_14',
                    'macd', 'macd_signal', 'macd_hist', 'bb_upper', 'bb_lower',
                    'bb_width', 'bb_pct_b', 'atr_14', 'rolling_vol_12', 'rolling_vol_24',
                    'rolling_vol_96', 'atr_ratio', 'log_returns'
                ]
                indicators = TechnicalIndicators(
                    **{k: (float(v) if pd.notna(v) else None) for k, v in latest.items() if k in indicator_cols}
                )
                snapshot["indicators"] = indicators
            
            return MarketSnapshot(**snapshot)
    except Exception as e:
        logger.warning(f"Live market data unavailable, falling back to static data: {e}")
    
    # Fallback to static data
    if not data_service or not regime_service:
        raise HTTPException(status_code=503, detail="Services not initialized")

    try:
        # Get latest candle
        candle_data = data_service.get_latest_candle()
        candle = CandleData(**candle_data)

        # Get latest indicators
        df = data_service.load_features()
        latest = df.iloc[-1]
        indicator_cols = [
            'sma_12', 'sma_24', 'sma_96', 'ema_12', 'ema_26', 'rsi_14',
            'macd', 'macd_signal', 'macd_hist', 'bb_upper', 'bb_lower',
            'bb_width', 'bb_pct_b', 'atr_14', 'rolling_vol_12', 'rolling_vol_24',
            'rolling_vol_96', 'atr_ratio', 'log_returns'
        ]
        indicators = TechnicalIndicators(
            **{k: (float(v) if pd.notna(v) else None) for k, v in latest.items() if k in indicator_cols}
        )

        # Get regime
        regime_info = regime_service.get_current_regime()

        return MarketSnapshot(
            candle=candle,
            indicators=indicators,
            regime=RegimeType(regime_info["regime"]),
            regime_confidence=regime_info["regime_confidence"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get market snapshot: {str(e)}")


@router.get("/candles", response_model=List[CandleData])
async def get_candles(
    limit: int = Query(default=100, ge=1, le=1000),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """Get historical OHLCV candles."""
    # Try live service first
    try:
        service = await get_live_service()
        candles = service.get_historical_candles(limit)
        if candles:
            return [
                CandleData(
                    timestamp=c["timestamp"],
                    open=float(c["open"]),
                    high=float(c["high"]),
                    low=float(c["low"]),
                    close=float(c["close"]),
                    volume=float(c["volume"]),
                )
                for c in candles
            ]
    except Exception as e:
        logger.warning(f"Live candles unavailable, falling back: {e}")
    
    # Fallback to static data
    if not data_service:
        raise HTTPException(status_code=503, detail="Data service not initialized")

    try:
        df = data_service.load_raw()

        if start_date:
            df = df[df['timestamp'] >= start_date]
        if end_date:
            df = df[df['timestamp'] <= end_date]

        df = df.tail(limit)

        return [
            CandleData(
                timestamp=row['timestamp'],
                open=float(row['open']),
                high=float(row['high']),
                low=float(row['low']),
                close=float(row['close']),
                volume=float(row['volume']),
            )
            for _, row in df.iterrows()
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get candles: {str(e)}")


@router.get("/regimes", response_model=RegimeResponse)
async def get_regimes(
    limit: int = Query(default=100, ge=1, le=500),
):
    """Get current regime and historical regime distribution."""
    if not regime_service:
        raise HTTPException(status_code=503, detail="Regime service not initialized")

    try:
        current = regime_service.get_current_regime()
        history = regime_service.get_regime_history(limit)

        # Calculate distribution
        regime_counts = {}
        for h in history:
            r = h["regime"]
            regime_counts[r] = regime_counts.get(r, 0) + 1

        total = len(history)
        distribution = [
            {
                "regime": RegimeType(regime),
                "count": count,
                "percentage": count / total * 100 if total > 0 else 0,
                "avg_return": None,
                "avg_volatility": None,
                "model_performance": {},
            }
            for regime, count in regime_counts.items()
        ]

        return RegimeResponse(
            current_regime=RegimeType(current["regime"]),
            regime_confidence=current["regime_confidence"],
            regime_distribution=distribution,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get regimes: {str(e)}")


@router.get("/indicators", response_model=TechnicalIndicators)
async def get_latest_indicators():
    """Get latest technical indicator values."""
    if not data_service:
        raise HTTPException(status_code=503, detail="Data service not initialized")

    try:
        df = data_service.load_features()
        latest = df.iloc[-1]
        indicator_cols = [
            'sma_12', 'sma_24', 'sma_96', 'ema_12', 'ema_26', 'rsi_14',
            'macd', 'macd_signal', 'macd_hist', 'bb_upper', 'bb_lower',
            'bb_width', 'bb_pct_b', 'atr_14', 'rolling_vol_12', 'rolling_vol_24',
            'rolling_vol_96', 'atr_ratio', 'log_returns'
        ]

        return TechnicalIndicators(
            **{k: (float(v) if pd.notna(v) else None) for k, v in latest.items() if k in indicator_cols}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get indicators: {str(e)}")


@router.get("/stats")
async def get_market_stats():
    """Get summary statistics for the dataset."""
    if not data_service:
        raise HTTPException(status_code=503, detail="Data service not initialized")

    try:
        df_raw = data_service.load_raw()
        df_feat = data_service.load_features()

        return {
            "raw_data": {
                "rows": len(df_raw),
                "date_range": {
                    "start": df_raw['timestamp'].min().isoformat(),
                    "end": df_raw['timestamp'].max().isoformat(),
                },
                "price_range": {
                    "min": float(df_raw['low'].min()),
                    "max": float(df_raw['high'].max()),
                },
                "avg_volume": float(df_raw['volume'].mean()),
            },
            "features": {
                "rows": len(df_feat),
                "columns": len(df_feat.columns) - 1,  # exclude timestamp
                "feature_names": [c for c in df_feat.columns if c != 'timestamp'],
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
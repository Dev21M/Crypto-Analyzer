"""
WebSocket connection manager for real-time updates.
"""
import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any, List, Literal
from datetime import datetime
from fastapi import WebSocket
from collections import defaultdict
from pydantic import BaseModel, ConfigDict
from enum import Enum


logger = logging.getLogger(__name__)


class WSMessageType(str, Enum):
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    PREDICTION = "prediction"
    MARKET_UPDATE = "market_update"
    REGIME_CHANGE = "regime_change"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    ACK = "ack"


class WSSubscribePayload(BaseModel):
    model_config = ConfigDict(extra="allow")
    channels: List[str]
    experiment: Optional[str] = None
    model: Optional[str] = None
    interval_seconds: int = 300


class WSMessage(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: WSMessageType
    payload: dict
    timestamp: datetime = datetime.utcnow()
    request_id: Optional[str] = None


class ConnectionManager:
    """Manages WebSocket connections and subscriptions."""

    def __init__(self):
        # channel -> set of websockets
        self.channels: Dict[str, Set[WebSocket]] = defaultdict(set)
        # websocket -> subscription info
        self.subscriptions: Dict[WebSocket, dict] = {}
        # heartbeat tracking
        self.last_heartbeat: Dict[WebSocket, datetime] = {}

    async def connect(self, websocket: WebSocket):
        """Accept new connection."""
        await websocket.accept()
        self.last_heartbeat[websocket] = datetime.utcnow()
        logger.info(f"New WebSocket connection: {websocket.client}")

    def disconnect(self, websocket: WebSocket):
        """Remove connection and clean up subscriptions."""
        if websocket in self.subscriptions:
            for channel in self.subscriptions[websocket].get("channels", []):
                self.channels[channel].discard(websocket)
            del self.subscriptions[websocket]
        self.last_heartbeat.pop(websocket, None)
        logger.info(f"WebSocket disconnected: {websocket.client}")

    async def subscribe(self, websocket: WebSocket, channels: list, params: dict):
        """Subscribe websocket to channels."""
        self.subscriptions[websocket] = {
            "channels": channels,
            "params": params,
            "subscribed_at": datetime.utcnow(),
        }
        for channel in channels:
            self.channels[channel].add(websocket)
        await self._send_ack(websocket, {"channels": channels})

    async def unsubscribe(self, websocket: WebSocket, channels: list):
        """Unsubscribe websocket from channels."""
        if websocket not in self.subscriptions:
            return
        for channel in channels:
            self.channels[channel].discard(websocket)
        self.subscriptions[websocket]["channels"] = [
            c for c in self.subscriptions[websocket]["channels"]
            if c not in channels
        ]

    async def broadcast(self, channel: str, message: dict):
        """Broadcast message to all subscribers of a channel."""
        if channel not in self.channels:
            return

        disconnected = set()
        for websocket in self.channels[channel]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to {websocket.client}: {e}")
                disconnected.add(websocket)

        # Clean up disconnected
        for ws in disconnected:
            self.disconnect(ws)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to specific websocket."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send personal message: {e}")
            self.disconnect(websocket)

    async def _send_ack(self, websocket: WebSocket, payload: dict):
        await self.send_personal(websocket, {
            "type": "ack",
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat(),
        })

    async def handle_heartbeat(self, websocket: WebSocket):
        """Update heartbeat timestamp."""
        self.last_heartbeat[websocket] = datetime.utcnow()
        await self.send_personal(websocket, {
            "type": "heartbeat",
            "timestamp": datetime.utcnow().isoformat(),
        })

    def get_connection_count(self) -> int:
        return len(self.subscriptions)

    def get_channel_subscribers(self, channel: str) -> int:
        return len(self.channels.get(channel, set()))

    async def cleanup_stale_connections(self, timeout_seconds: int = 60):
        """Remove connections that haven't sent heartbeat."""
        now = datetime.utcnow()
        stale = [
            ws for ws, last_hb in self.last_heartbeat.items()
            if (now - last_hb).total_seconds() > timeout_seconds
        ]
        for ws in stale:
            logger.info(f"Removing stale connection: {ws.client}")
            self.disconnect(ws)


# Global manager instance
manager = ConnectionManager()


# Background task for cleanup
async def cleanup_task(interval: int = 30):
    """Periodic cleanup of stale connections."""
    while True:
        await asyncio.sleep(interval)
        await manager.cleanup_stale_connections()


# Background task for periodic predictions
async def prediction_broadcaster(interval_seconds: int = 300):
    """Periodically broadcast predictions to subscribers."""
    while True:
        try:
            # Check if there are subscribers for predictions channel
            # Note: In a real implementation, you'd inject the model_service and data_service here
            # For now, this is a placeholder that shows the structure
            if hasattr(manager, 'channels') and manager.get_channel_subscribers("predictions") > 0:
                logger.info("Broadcasting prediction update (placeholder)")
                await manager.broadcast("predictions", {
                    "type": "prediction",
                    "payload": {
                        "timestamp": datetime.utcnow().isoformat(),
                        "experiment": "EXP_D_FULL",
                        "model": "xgboost",
                        "direction": 1,
                        "direction_label": "UP",
                        "confidence": 0.65,
                        "probability_up": 0.65,
                        "probability_down": 0.35,
                    },
                })

            await asyncio.sleep(interval_seconds)

        except Exception as e:
            logger.error(f"Prediction broadcaster error: {e}")
            await asyncio.sleep(60)


# Background task for periodic market data
async def market_data_broadcaster(interval_seconds: int = 30):
    """Periodically broadcast market data updates."""
    while True:
        try:
            if manager.get_channel_subscribers("market") > 0:
                # This would need data_service injected in a real implementation
                logger.info("Broadcasting market data update (placeholder)")
                await manager.broadcast("market", {
                    "type": "market_update",
                    "payload": {
                        "timestamp": datetime.utcnow().isoformat(),
                        "candle": {
                            "timestamp": datetime.utcnow().isoformat(),
                            "open": 0.0,
                            "high": 0.0,
                            "low": 0.0,
                            "close": 0.0,
                            "volume": 0.0,
                        },
                    },
                })

            await asyncio.sleep(interval_seconds)

        except Exception as e:
            logger.error(f"Market data broadcaster error: {e}")
            await asyncio.sleep(30)


# Background task for periodic regime updates
async def regime_broadcaster(interval_seconds: int = 60):
    """Periodically broadcast regime changes."""
    while True:
        try:
            if manager.get_channel_subscribers("regimes") > 0:
                logger.info("Broadcasting regime update (placeholder)")
                await manager.broadcast("regimes", {
                    "type": "regime_change",
                    "payload": {
                        "timestamp": datetime.utcnow().isoformat(),
                        "regime": "HIGH_VOLATILITY",
                        "confidence": 1.0,
                    },
                })

            await asyncio.sleep(interval_seconds)

        except Exception as e:
            logger.error(f"Regime broadcaster error: {e}")
            await asyncio.sleep(60)
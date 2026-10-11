"""
WebSocket endpoints for real-time updates.
"""
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from backend.services.websocket_manager import manager, WSMessage, WSMessageType, WSSubscribePayload
from backend.services.prediction import ModelService, DataService
from backend.services.fcs_market_data import get_fcs_market_service, FCSMarketDataService
from backend.core.config import get_settings
import json
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSocket"])

# Global service references
model_service: ModelService = None
data_service: DataService = None
fcs_market_service = None


def set_services(ms: ModelService, ds: DataService):
    global model_service, data_service
    model_service = ms
    data_service = ds


@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),  # Optional auth token
):
    """Main WebSocket endpoint for real-time updates."""
    await manager.connect(websocket)

    # Default subscriptions
    subscriptions = {
        "channels": ["market"],
        "params": {
            "experiment": "EXP_D_FULL",
            "model": "xgboost",
            "interval_seconds": 300,
        },
    }

    try:
        while True:
            # Receive message
            data = await websocket.receive_text()

            try:
                msg = json.loads(data)
                msg_type = msg.get("type")

                if msg_type == WSMessageType.SUBSCRIBE.value:
                    payload = WSSubscribePayload(**msg.get("payload", {}))
                    subscriptions["channels"] = payload.channels
                    subscriptions["params"].update({
                        "experiment": payload.experiment or subscriptions["params"]["experiment"],
                        "model": payload.model or subscriptions["params"]["model"],
                        "interval_seconds": payload.interval_seconds,
                    })
                    await manager.subscribe(websocket, payload.channels, subscriptions["params"])

                elif msg_type == WSMessageType.UNSUBSCRIBE.value:
                    channels = msg.get("payload", {}).get("channels", [])
                    await manager.unsubscribe(websocket, channels)

                elif msg_type == WSMessageType.HEARTBEAT.value:
                    await manager.handle_heartbeat(websocket)

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "payload": {"message": "Invalid JSON"},
                    "timestamp": datetime.utcnow().isoformat(),
                })
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "payload": {"message": f"Error processing message: {str(e)}"},
                    "timestamp": datetime.utcnow().isoformat(),
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


# Background task for periodic predictions
async def prediction_broadcaster(interval_seconds: int = 60):
    """Periodically broadcast predictions to subscribers."""
    logger.info("Starting prediction broadcaster")
    while True:
        try:
            if model_service and data_service:
                # Get subscribers for predictions channel
                sub_count = manager.get_channel_subscribers("predictions")
                if sub_count > 0:
                    logger.info(f"Broadcasting prediction to {sub_count} subscribers")
                    # Get latest features and predict
                    experiment = "EXP_D_FULL"
                    model = "xgboost"
                    task = "classification"
                    horizon = 12
                    features = data_service.get_latest_features(experiment, n_rows=60)

                    # Run prediction
                    start_time = datetime.utcnow()
                    result = model_service.predict_baseline(
                        model_name=model,
                        experiment=experiment,
                        task=task,
                        features=features,
                    )
                    inference_time = (datetime.utcnow() - start_time).total_seconds() * 1000

                    # Get experiment config for features_used
                    config = model_service._get_experiment_config(experiment)

                    # Broadcast
                    await manager.broadcast("predictions", {
                        "type": "prediction",
                        "payload": {
                            "timestamp": datetime.utcnow().isoformat(),
                            "experiment": experiment,
                            "model": model,
                            "task": task,
                            "horizon": horizon,
                            "model_version": "1.0.0",
                            "inference_time_ms": inference_time,
                            "features_used": config["n_features"],
                            "direction": result["direction"],
                            "direction_label": result["direction_label"],
                            "confidence": result["confidence"],
                            "probability_up": result["probability_up"],
                            "probability_down": result["probability_down"],
                        },
                    })

            await asyncio.sleep(interval_seconds)

        except Exception as e:
            logger.error(f"Prediction broadcaster error: {e}")
            await asyncio.sleep(60)


async def market_data_broadcaster(interval_seconds: int = 10):
    """Periodically broadcast market data updates from live market service."""
    logger.info("Starting market data broadcaster")
    while True:
        try:
            # Try to get live market service
            try:
                service = await get_fcs_market_service()
                live_service = service
            except Exception:
                live_service = None

            if live_service and manager.get_channel_subscribers("market") > 0:
                sub_count = manager.get_channel_subscribers("market")
                logger.info(f"Broadcasting live market data to {sub_count} subscribers")
                
                # Get latest candle from live service
                candle = live_service.get_latest_candle()
                if candle:
                    await manager.broadcast("market", {
                        "type": "market_update",
                        "payload": {
                            "timestamp": datetime.utcnow().isoformat(),
                            "candle": candle.to_dict(),
                        },
                    })

            await asyncio.sleep(interval_seconds)

        except Exception as e:
            logger.error(f"Market data broadcaster error: {e}")
            await asyncio.sleep(30)


async def regime_broadcaster(interval_seconds: int = 20):
    """Periodically broadcast regime changes."""
    logger.info("Starting regime broadcaster")
    while True:
        try:
            if data_service and manager.get_channel_subscribers("regimes") > 0:
                sub_count = manager.get_channel_subscribers("regimes")
                logger.info(f"Broadcasting regime to {sub_count} subscribers")
                from backend.services.prediction import RegimeService
                regime_svc = RegimeService(data_service)
                regime_info = regime_svc.get_current_regime()

                await manager.broadcast("regimes", {
                    "type": "regime_change",
                    "payload": {
                        "timestamp": datetime.utcnow().isoformat(),
                        "regime": regime_info["regime"],
                        "confidence": regime_info["regime_confidence"],
                    },
                })

            await asyncio.sleep(interval_seconds)

        except Exception as e:
            logger.error(f"Regime broadcaster error: {e}")
            await asyncio.sleep(60)
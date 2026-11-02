"""
Main FastAPI application entry point.
"""
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

# Add src to path for crypto_analyzer imports
SRC_PATH = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(SRC_PATH))

from backend.core.config import get_settings, Settings
from backend.api import health, prediction, market, websocket
from backend.services.prediction import DataService, ModelService, MetricsService, RegimeService
from backend.services.websocket_manager import manager, cleanup_task
from backend.api.websocket import prediction_broadcaster, market_data_broadcaster, regime_broadcaster
from backend.services.fcs_market_data import get_fcs_market_service, close_fcs_market_service
import asyncio
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global service instances
data_service: DataService = None
model_service: ModelService = None
metrics_service: MetricsService = None
regime_service: RegimeService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    global data_service, model_service, metrics_service, regime_service

    settings = get_settings()

    # Startup
    logger.info("Starting CryptoAnalyzer API...")

    # Initialize services
    data_service = DataService(
        features_path=str(settings.FEATURES_DATA_PATH),
        raw_path=str(settings.RAW_DATA_PATH),
    )
    model_service = ModelService(
        data_service=data_service,
        checkpoint_dir=str(settings.MODEL_CHECKPOINT_DIR),
        tensor_dir=str(settings.SEQUENCE_TENSOR_DIR),
    )
    metrics_service = MetricsService(str(settings.EXPERIMENT_RESULTS_DIR))
    regime_service = RegimeService(data_service)

    # Initialize FCS live market data service
    from backend.services.fcs_market_data import get_fcs_market_service, close_fcs_market_service
    fcs_market_service = await get_fcs_market_service()

    # Inject services into API modules
    health.set_data_service(data_service)
    prediction.set_services(model_service, metrics_service)
    market.set_data_service(data_service)
    market.set_regime_service(regime_service)
    websocket.set_services(model_service, data_service)

    logger.info("Services initialized successfully")

    # Start background tasks
    asyncio.create_task(cleanup_task())
    asyncio.create_task(prediction_broadcaster())
    asyncio.create_task(market_data_broadcaster())
    asyncio.create_task(regime_broadcaster())

    logger.info("Background tasks started")

    yield

    # Shutdown
    logger.info("Shutting down CryptoAnalyzer API...")
    from backend.services.fcs_market_data import close_fcs_market_service
    await close_fcs_market_service()


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="CryptoAnalyzer API - BTC/USDT 1-Hour Horizon Prediction",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API Routes
    app.include_router(health.router, prefix="/api/v1")
    app.include_router(prediction.router, prefix="/api/v1")
    app.include_router(market.router, prefix="/api/v1")
    app.include_router(websocket.router, prefix="/api/v1")

    # Serve React frontend in production
    frontend_build = Path(__file__).parent.parent.parent / "frontend" / "build"
    if frontend_build.exists():
        app.mount("/", StaticFiles(directory=frontend_build, html=True), name="frontend")

    @app.get("/")
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/api/v1/health",
        }

    @app.get("/health", include_in_schema=False)
    async def health_redirect():
        """Redirect /health to /api/v1/health"""
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/api/v1/health")

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
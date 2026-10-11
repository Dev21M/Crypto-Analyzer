"""
Health check and system endpoints.
"""
from datetime import datetime
from fastapi import APIRouter, Depends
from backend.schemas.models import HealthResponse, ErrorResponse
from backend.core.config import get_settings
from backend.services.prediction import DataService

router = APIRouter(prefix="/health", tags=["Health"])

# Global service references (set in main.py)
data_service: DataService = None


def set_data_service(service: DataService):
    global data_service
    data_service = service


@router.get(
    "",
    response_model=HealthResponse,
    responses={503: {"model": ErrorResponse}},
)
async def health_check(settings = Depends(get_settings)):
    """System health check endpoint."""
    services = {}
    model_loaded = False

    # Check data service
    try:
        if data_service:
            df = data_service.load_features()
            services["data"] = {
                "status": "healthy",
                "rows": len(df),
                "latest_timestamp": df['timestamp'].max().isoformat() if len(df) > 0 else None,
            }
        else:
            services["data"] = {"status": "unavailable"}
    except Exception as e:
        services["data"] = {"status": "unhealthy", "error": str(e)}

    # Check Redis
    services["redis"] = {"status": "not_configured"}  # TODO: Add Redis check

    # Overall status
    all_healthy = all(s.get("status") == "healthy" for s in services.values())
    status = "healthy" if all_healthy else "degraded"

    return HealthResponse(
        status=status,
        timestamp=datetime.utcnow(),
        version=settings.APP_VERSION,
        uptime_seconds=0,  # TODO: Track uptime
        services=services,
        model_loaded=model_loaded,
    )


@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe."""
    return {"ready": True}
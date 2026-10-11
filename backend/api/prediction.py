"""
Prediction API endpoints.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from backend.schemas.models import (
    PredictionRequest,
    PredictionResponse,
    HistoricalPredictionRequest,
    HistoricalPredictionResponse,
    MetricsRequest,
    MetricsResponse,
    ModelComparisonResponse,
    ExperimentType,
    ModelType,
    TaskType,
    ErrorResponse,
)
from backend.services.prediction import ModelService, MetricsService
from backend.core.config import get_settings

router = APIRouter(prefix="/predict", tags=["Prediction"])

# Global service references
model_service: ModelService = None
metrics_service: MetricsService = None


def set_services(ms: ModelService, mets: MetricsService):
    global model_service, metrics_service
    model_service = ms
    metrics_service = mets


@router.post(
    "",
    response_model=PredictionResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def predict(request: PredictionRequest):
    """
    Get a single prediction for the latest market data.
    
    Uses the specified model and experiment configuration to predict
    the next 1-hour (12 candles) direction or return.
    """
    if not model_service:
        raise HTTPException(status_code=503, detail="Model service not initialized")

    try:
        start_time = datetime.utcnow()

        # Get latest features
        experiment_str = request.experiment.value
        features = model_service.data_service.get_latest_features(
            experiment_str,
            n_rows=60
        )

        # Run prediction
        task_str = request.task.value
        if request.model.value in ["naive", "linear", "logistic", "random_forest", "xgboost"]:
            result = model_service.predict_baseline(
                model_name=request.model.value,
                experiment=experiment_str,
                task=task_str,
                features=features,
            )
        else:
            result = model_service.predict_dl(
                model_name=request.model.value,
                experiment=experiment_str,
                task=task_str,
                features=features,
            )

        inference_time = (datetime.utcnow() - start_time).total_seconds() * 1000

        # Build response
        config = model_service._get_experiment_config(experiment_str)

        response = PredictionResponse(
            timestamp=datetime.utcnow(),
            experiment=request.experiment,
            model=request.model,
            task=request.task,
            horizon=request.horizon,
            model_version="1.0.0",
            inference_time_ms=inference_time,
            features_used=config["n_features"],
            **result,
        )

        return response

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/historical", response_model=HistoricalPredictionResponse)
async def predict_historical(request: HistoricalPredictionRequest):
    """
    Get historical predictions for a date range.
    
    Returns model predictions vs actual values for backtesting.
    """
    if not model_service:
        raise HTTPException(status_code=503, detail="Model service not initialized")

    try:
        # Load features for date range
        df = model_service.data_service.load_features()
        
        if request.start_date:
            df = df[df['timestamp'] >= request.start_date]
        if request.end_date:
            df = df[df['timestamp'] <= request.end_date]
        
        df = df.tail(request.limit)
        
        if len(df) == 0:
            raise HTTPException(status_code=404, detail="No data in requested range")

        experiment_str = request.experiment.value
        feature_cols = model_service.data_service.data_service.get_feature_columns(experiment_str) \
            if hasattr(model_service.data_service, 'get_feature_columns') \
            else model_service._get_experiment_config(experiment_str)["input_dim"]
        
        # Actually get feature columns properly
        from crypto_analyzer.features.pipeline import get_feature_columns
        feature_cols = get_feature_columns(experiment_str)
        
        predictions = []
        actuals = []
        timestamps = []

        for _, row in df.iterrows():
            # Get features at this point (would need proper sequence building)
            # Simplified for now
            pass

        return HistoricalPredictionResponse(
            predictions=[],
            actual_values=[],
            timestamps=[],
            summary={"message": "Historical prediction not fully implemented yet"},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Historical prediction failed: {str(e)}")


@router.get("/models", response_model=dict)
async def list_models():
    """List all available models and experiments."""
    return {
        "experiments": [
            {"id": "EXP_A_PRICE", "name": "Price Only", "features": 4},
            {"id": "EXP_B_PRICE_VOL", "name": "Price + Volume", "features": 5},
            {"id": "EXP_C_TECH_IND", "name": "Price + Volume + Technical Indicators", "features": 19},
            {"id": "EXP_D_FULL", "name": "Full Feature Set", "features": 24},
        ],
        "models": [
            {"id": "naive", "name": "Naive Baseline", "type": "baseline"},
            {"id": "linear", "name": "Ridge Regression", "type": "baseline"},
            {"id": "logistic", "name": "Logistic Regression", "type": "baseline"},
            {"id": "random_forest", "name": "Random Forest", "type": "baseline"},
            {"id": "xgboost", "name": "XGBoost", "type": "baseline"},
            {"id": "lstm", "name": "LSTM", "type": "deep_learning"},
            {"id": "gru", "name": "GRU", "type": "deep_learning"},
            {"id": "cnn1d", "name": "1D-CNN", "type": "deep_learning"},
        ],
        "tasks": [
            {"id": "regression", "name": "Return Regression"},
            {"id": "classification", "name": "Directional Classification"},
        ],
    }


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(request: MetricsRequest = Depends()):
    """Get model performance metrics."""
    if not metrics_service:
        raise HTTPException(status_code=503, detail="Metrics service not initialized")

    metrics = metrics_service.load_metrics(
        experiment=request.experiment.value if request.experiment else None,
        model=request.model.value if request.model else None,
    )

    # Filter by regime if specified
    if request.regime:
        metrics = [m for m in metrics if m.get("regime") == request.regime.value]

    return MetricsResponse(
        metrics=metrics,
        summary={
            "total": len(metrics),
            "experiments": list(set(m["experiment"] for m in metrics)),
            "models": list(set(m["model"] for m in metrics)),
        },
    )


@router.get("/compare", response_model=ModelComparisonResponse)
async def compare_models(experiment: ExperimentType = ExperimentType.EXP_D_FULL):
    """Compare all models for a given experiment."""
    if not metrics_service:
        raise HTTPException(status_code=503, detail="Metrics service not initialized")

    metrics = metrics_service.load_metrics(experiment=experiment.value)

    # Group by model
    model_metrics = {}
    for m in metrics:
        if m["model"] not in model_metrics:
            model_metrics[m["model"]] = {}
        model_metrics[m["model"]][m["metric_name"]] = m["metric_value"]

    # Find best for each metric
    comparison = []
    for model_name, metrics_dict in model_metrics.items():
        comparison.append({
            "model": model_name,
            "metrics": metrics_dict,
        })

    # Determine best model (simplified: highest directional accuracy)
    best = max(comparison, key=lambda x: x["metrics"].get("directional_accuracy", 0))

    return ModelComparisonResponse(
        comparison=comparison,
        best_model=best,
    )
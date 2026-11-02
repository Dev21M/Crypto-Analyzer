"""
Pydantic schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# ─── Enums ───
class ExperimentType(str, Enum):
    EXP_A_PRICE = "EXP_A_PRICE"
    EXP_B_PRICE_VOL = "EXP_B_PRICE_VOL"
    EXP_C_TECH_IND = "EXP_C_TECH_IND"
    EXP_D_FULL = "EXP_D_FULL"


class ModelType(str, Enum):
    NAIVE = "naive"
    LINEAR = "linear"
    LOGISTIC = "logistic"
    RANDOM_FOREST = "random_forest"
    XGBOOST = "xgboost"
    LSTM = "lstm"
    GRU = "gru"
    CNN1D = "cnn1d"


class TaskType(str, Enum):
    REGRESSION = "regression"
    CLASSIFICATION = "classification"


class RegimeType(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    UNKNOWN = "unknown"


# ─── Request Schemas ───
class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    experiment: ExperimentType = Field(default=ExperimentType.EXP_D_FULL)
    model: ModelType = Field(default=ModelType.XGBOOST)
    task: TaskType = Field(default=TaskType.CLASSIFICATION)
    horizon: int = Field(default=12, ge=1, le=48, description="Prediction horizon in candles")
    use_latest_data: bool = Field(default=True, description="Use most recent data for prediction")


class HistoricalPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    experiment: ExperimentType = Field(default=ExperimentType.EXP_D_FULL)
    model: ModelType = Field(default=ModelType.XGBOOST)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=100, ge=1, le=1000)


class MetricsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    experiment: Optional[ExperimentType] = None
    model: Optional[ModelType] = None
    regime: Optional[RegimeType] = None


# ─── Response Schemas ───
class CandleData(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class TechnicalIndicators(BaseModel):
    sma_12: Optional[float] = None
    sma_24: Optional[float] = None
    sma_96: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_lower: Optional[float] = None
    bb_width: Optional[float] = None
    bb_pct_b: Optional[float] = None
    atr_14: Optional[float] = None
    rolling_vol_12: Optional[float] = None
    rolling_vol_24: Optional[float] = None
    rolling_vol_96: Optional[float] = None
    atr_ratio: Optional[float] = None
    log_returns: Optional[float] = None


class MarketSnapshot(BaseModel):
    candle: CandleData
    indicators: TechnicalIndicators
    regime: RegimeType
    regime_confidence: float


class PredictionResponse(BaseModel):
    timestamp: datetime
    experiment: ExperimentType
    model: ModelType
    task: TaskType
    horizon: int

    # Classification
    direction: Optional[int] = Field(None, description="0=DOWN, 1=UP")
    direction_label: Optional[str] = Field(None, description="DOWN or UP")
    confidence: Optional[float] = Field(None, ge=0, le=1)
    probability_up: Optional[float] = None
    probability_down: Optional[float] = None

    # Regression
    predicted_return_pct: Optional[float] = None
    confidence_interval: Optional[List[float]] = None  # [lower, upper]

    # Metadata
    model_version: str
    inference_time_ms: float
    features_used: int


class HistoricalPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    actual_values: List[float]
    timestamps: List[datetime]
    summary: dict


class MetricPoint(BaseModel):
    experiment: ExperimentType
    model: ModelType
    task: TaskType
    metric_name: str
    metric_value: float
    regime: Optional[RegimeType] = None
    sample_size: int


class MetricsResponse(BaseModel):
    metrics: List[MetricPoint]
    summary: dict


class ModelComparisonResponse(BaseModel):
    comparison: List[dict]
    best_model: dict


class RegimeData(BaseModel):
    regime: RegimeType
    count: int
    percentage: float
    avg_return: Optional[float] = None
    avg_volatility: Optional[float] = None
    model_performance: dict


class RegimeResponse(BaseModel):
    current_regime: RegimeType
    regime_confidence: float
    regime_distribution: List[RegimeData]
    timestamp: datetime


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    timestamp: datetime
    version: str
    uptime_seconds: float
    services: dict
    model_loaded: bool


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: datetime
    path: str


# ─── WebSocket Schemas ───
class WSMessageType(str, Enum):
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    PREDICTION = "prediction"
    MARKET_UPDATE = "market_update"
    REGIME_CHANGE = "regime_change"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    ACK = "ack"


class WSMessage(BaseModel):
    type: WSMessageType
    payload: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None


class WSSubscribePayload(BaseModel):
    channels: List[str] = Field(..., description="Channels: predictions, market, regimes")
    experiment: Optional[ExperimentType] = None
    model: Optional[ModelType] = None
    interval_seconds: int = Field(default=300, ge=60, description="Prediction interval in seconds")
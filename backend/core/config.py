"""
Application configuration using Pydantic Settings.
All settings loaded from environment variables with sensible defaults.
"""
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "CryptoAnalyzer API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=True, description="Enable debug mode")
    ENVIRONMENT: str = Field(default="development", description="Environment: development|staging|production")

    # API
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="Allowed CORS origins"
    )

    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_MAX_MESSAGE_SIZE: int = 1024 * 1024  # 1MB

    # Redis (for caching & pub/sub)
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_CACHE_TTL: int = 60  # seconds

    # Model paths
    MODEL_CHECKPOINT_DIR: Path = Path("D:/CryptoAnalyzer/models/checkpoints")
    SEQUENCE_TENSOR_DIR: Path = Path("D:/CryptoAnalyzer/data/processed/tensors")
    EXPERIMENT_RESULTS_DIR: Path = Path("D:/CryptoAnalyzer/experiments/results")

    # Data
    RAW_DATA_PATH: Path = Path("D:/CryptoAnalyzer/data/raw/btcusdt_5m_raw.csv")
    FEATURES_DATA_PATH: Path = Path("D:/CryptoAnalyzer/data/processed/btcusdt_5m_features.csv")

    # FCS API (primary live data provider)
    FCS_API_KEY: str = Field(default="", description="FCS API Key from environment")
    FCS_BASE_URL: str = "https://api-v4.fcsapi.com"
    FCS_SYMBOL: str = "BINANCE:BTCUSDT"
    FCS_WS_URL: str = "wss://ws-v4.fcsapi.com/ws"

    # Binance API (fallback/backup)
    BINANCE_BASE_URL: str = "https://api.binance.com/api/v3"
    BINANCE_SYMBOL: str = "BTCUSDT"
    BINANCE_INTERVAL: str = "5m"
    BINANCE_LIMIT: int = 1000

    # Prediction settings
    PREDICTION_HORIZON: int = 12  # candles (1 hour)
    LOOKBACK_WINDOW: int = 60  # candles (5 hours)
    DEFAULT_EXPERIMENT: str = "EXP_D_FULL"
    DEFAULT_MODEL: str = "xgboost"  # or lstm, gru, cnn1d

    # Security
    SECRET_KEY: str = Field(default="dev-secret-change-in-production-please-use-long-random-string", min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
"""
Feature engineering package for CryptoAnalyzer.
Provides technical indicator computation and experiment-aware feature pipeline.
"""

from crypto_analyzer.features.indicators import (
    compute_atr,
    compute_atr_ratio,
    compute_bollinger_bands,
    compute_ema,
    compute_log_returns,
    compute_macd,
    compute_returns,
    compute_rolling_volatility,
    compute_rsi,
    compute_sma,
)
from crypto_analyzer.features.pipeline import (
    EXPECTED_FEATURE_COUNTS,
    EXPERIMENT_FEATURES,
    MAX_WARM_UP_ROWS,
    build_features,
    get_feature_columns,
    get_feature_summary,
    get_warm_up_rows,
)

__all__ = [
    "EXPECTED_FEATURE_COUNTS",
    "EXPERIMENT_FEATURES",
    "MAX_WARM_UP_ROWS",
    "build_features",
    "compute_atr",
    "compute_atr_ratio",
    "compute_bollinger_bands",
    "compute_ema",
    "compute_log_returns",
    "compute_macd",
    "compute_returns",
    "compute_rolling_volatility",
    "compute_rsi",
    "compute_sma",
    "get_feature_columns",
    "get_feature_summary",
    "get_warm_up_rows",
]

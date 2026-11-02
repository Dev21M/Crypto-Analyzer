"""
Models package for CryptoAnalyzer.
"""
from .baselines import (
    LogisticModel,
    NaiveBaseline,
    RandomForestModel,
    RidgeRegressorModel,
    compute_classification_metrics,
    compute_regression_metrics,
    flatten_sequences,
)

__all__ = [
    "LogisticModel",
    "NaiveBaseline",
    "RandomForestModel",
    "RidgeRegressorModel",
    "compute_classification_metrics",
    "compute_regression_metrics",
    "flatten_sequences",
]

"""
Service layer for model inference.
Loads trained models and provides prediction interface.
"""
import sys
import json
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import numpy as np
import pandas as pd
import joblib
import torch
import logging

# Add src to path for crypto_analyzer imports
SRC_PATH = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(SRC_PATH))

from crypto_analyzer.models.baselines import (
    NaiveBaseline,
    RidgeRegressorModel,
    LogisticModel,
    RandomForestModel,
    XGBoostModel,
    flatten_sequences,
    compute_regression_metrics,
    compute_classification_metrics,
)
from crypto_analyzer.models.dl import LSTMModel, GRUModel, CNN1DModel, DLTrainer, DLConfig
from crypto_analyzer.features.pipeline import build_features, get_feature_columns
from crypto_analyzer.preprocessing.sequences import fit_transform_scaler, extract_3d_sequences
from crypto_analyzer.regimes.classifier import compute_rolling_regimes

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Registry for all available models."""

    BASELINE_MODELS = {
        "naive": NaiveBaseline,
        "linear": RidgeRegressorModel,
        "logistic": LogisticModel,
        "random_forest": RandomForestModel,
        "xgboost": XGBoostModel,
    }

    DL_MODELS = {
        "lstm": LSTMModel,
        "gru": GRUModel,
        "cnn1d": CNN1DModel,
    }

    @classmethod
    def get_baseline_model(cls, name: str):
        if name not in cls.BASELINE_MODELS:
            raise ValueError(f"Unknown baseline model: {name}")
        return cls.BASELINE_MODELS[name]()

    @classmethod
    def get_dl_model(cls, name: str, input_size: int, task: str = "classification"):
        if name not in cls.DL_MODELS:
            raise ValueError(f"Unknown DL model: {name}")
        model_class = cls.DL_MODELS[name]
        if name == "cnn1d":
            return model_class(input_size=input_size, task=task)
        return model_class(input_size=input_size, hidden_size=64, num_layers=2, dropout=0.2, task=task)


class DataService:
    """Service for loading and preparing data."""

    def __init__(self, features_path: str, raw_path: str):
        self.features_path = Path(features_path)
        self.raw_path = Path(raw_path)
        self._features_cache: Optional[pd.DataFrame] = None
        self._raw_cache: Optional[pd.DataFrame] = None

    def load_features(self, force_reload: bool = False) -> pd.DataFrame:
        if self._features_cache is None or force_reload:
            if not self.features_path.exists():
                raise FileNotFoundError(f"Features file not found: {self.features_path}")
            df = pd.read_csv(self.features_path)
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms', utc=True)
            self._features_cache = df.sort_values('timestamp').reset_index(drop=True)
        return self._features_cache

    def load_raw(self, force_reload: bool = False) -> pd.DataFrame:
        if self._raw_cache is None or force_reload:
            if not self.raw_path.exists():
                raise FileNotFoundError(f"Raw data file not found: {self.raw_path}")
            df = pd.read_csv(self.raw_path)
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms', utc=True)
            self._raw_cache = df.sort_values('timestamp').reset_index(drop=True)
        return self._raw_cache

    def get_latest_features(self, experiment: str, n_rows: int = 60) -> np.ndarray:
        """Get latest feature rows for prediction."""
        df = self.load_features()
        feature_cols = get_feature_columns(experiment)
        latest = df[feature_cols].tail(n_rows).values
        if len(latest) < n_rows:
            raise ValueError(f"Not enough data: need {n_rows} rows, got {len(latest)}")
        return latest

    def get_latest_candle(self) -> dict:
        """Get latest raw candle for display."""
        df = self.load_raw()
        latest = df.iloc[-1]
        return {
            "timestamp": latest['timestamp'].isoformat(),
            "open": float(latest['open']),
            "high": float(latest['high']),
            "low": float(latest['low']),
            "close": float(latest['close']),
            "volume": float(latest['volume']),
        }


class ModelService:
    """Service for loading and running model predictions."""

    def __init__(
        self,
        data_service: DataService,
        checkpoint_dir: str,
        tensor_dir: str,
    ):
        self.data_service = data_service
        self.checkpoint_dir = Path(checkpoint_dir)
        self.tensor_dir = Path(tensor_dir)
        self._baseline_cache: Dict[str, Any] = {}
        self._dl_cache: Dict[str, Any] = {}
        self._scalers: Dict[str, Any] = {}
        self._tensor_shapes: Dict[str, Tuple] = {}

    def _get_experiment_config(self, experiment: str) -> dict:
        """Get experiment configuration."""
        configs = {
            "EXP_A_PRICE": {"n_features": 4, "input_dim": 4},
            "EXP_B_PRICE_VOL": {"n_features": 5, "input_dim": 5},
            "EXP_C_TECH_IND": {"n_features": 19, "input_dim": 19},
            "EXP_D_FULL": {"n_features": 24, "input_dim": 24},
        }
        return configs.get(experiment, configs["EXP_D_FULL"])

    def load_baseline_model(self, model_name: str, experiment: str) -> Any:
        """Load a trained baseline model."""
        cache_key = f"{model_name}_{experiment}"
        if cache_key in self._baseline_cache:
            return self._baseline_cache[cache_key]

        # Load tensors for this experiment
        tensor_path = self.tensor_dir / f"{experiment}_tensors.npz"
        if not tensor_path.exists():
            raise FileNotFoundError(f"Tensor file not found: {tensor_path}")
        
        data = np.load(tensor_path)
        X_train = data['X_train']
        Y_train = data['Y_train']
        
        # Flatten for baseline models
        X_train_flat = X_train.reshape(X_train.shape[0], -1)

        model = ModelRegistry.get_baseline_model(model_name)
        
        # Train the model on full training data
        # The model expects Y to be 2D with [regression_target, classification_target]
        logger.info(f"Training baseline {model_name} for {experiment} on {X_train.shape[0]} samples")
        model.fit(X_train_flat, Y_train)

        self._baseline_cache[cache_key] = model
        return model

    def load_dl_model(
        self,
        model_name: str,
        experiment: str,
        task: str = "classification",
    ) -> Tuple[torch.nn.Module, Any]:
        """Load a trained deep learning model from checkpoint."""
        cache_key = f"{model_name}_{experiment}_{task}"
        if cache_key in self._dl_cache:
            return self._dl_cache[cache_key]

        config = self._get_experiment_config(experiment)
        input_size = config["input_dim"]

        model = ModelRegistry.get_dl_model(model_name, input_size, task)

        # Load checkpoint
        checkpoint_path = self.checkpoint_dir / f"{model_name}_{experiment}_{task}.pt"
        if not checkpoint_path.exists():
            # Try generic checkpoint
            checkpoint_path = self.checkpoint_dir / "checkpoint.pt"

        if checkpoint_path.exists():
            logger.info(f"Loading DL checkpoint from {checkpoint_path}")
            checkpoint = torch.load(checkpoint_path, map_location="cpu")
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                model.load_state_dict(checkpoint["model_state_dict"])
            else:
                model.load_state_dict(checkpoint)
        else:
            logger.warning(f"No checkpoint found for {model_name} {experiment} {task}")

        model.eval()
        self._dl_cache[cache_key] = (model, config)
        return model, config

    def predict_baseline(
        self,
        model_name: str,
        experiment: str,
        task: str,
        features: np.ndarray,
    ) -> dict:
        """Run prediction with a baseline model."""
        model = self.load_baseline_model(model_name, experiment)

        # Flatten for baseline models: (1, 60, K) -> (1, 60*K)
        if features.ndim == 3:
            features_flat = features.reshape(1, -1)
        else:
            features_flat = features.reshape(1, -1)

        if task == "classification":
            pred = model.predict_classification(features_flat) if hasattr(model, 'predict_classification') else model.predict(features_flat)
            proba = model.predict_proba(features_flat) if hasattr(model, 'predict_proba') else None

            return {
                "direction": int(pred[0]),
                "direction_label": "UP" if pred[0] == 1 else "DOWN",
                "probability_up": float(proba[0][1]) if proba is not None and proba.shape[1] > 1 else None,
                "probability_down": float(proba[0][0]) if proba is not None and proba.shape[1] > 1 else None,
                "confidence": float(np.max(proba[0])) if proba is not None else None,
            }
        else:
            pred = model.predict_regression(features_flat) if hasattr(model, 'predict_regression') else model.predict(features_flat)
            return {
                "predicted_return_pct": float(pred[0]),
            }

    def predict_dl(
        self,
        model_name: str,
        experiment: str,
        task: str,
        features: np.ndarray,
    ) -> dict:
        """Run prediction with a deep learning model."""
        model, config = self.load_dl_model(model_name, experiment, task)

        # Prepare input: (1, 60, K)
        if features.ndim == 2:
            features = features.reshape(1, *features.shape)

        x = torch.tensor(features, dtype=torch.float32)

        with torch.no_grad():
            logits = model(x)

        if task == "classification":
            probs = torch.sigmoid(logits).squeeze().numpy()
            pred = int(probs > 0.5)
            return {
                "direction": pred,
                "direction_label": "UP" if pred == 1 else "DOWN",
                "probability_up": float(probs),
                "probability_down": float(1 - probs),
                "confidence": float(max(probs, 1 - probs)),
            }
        else:
            pred = logits.squeeze().numpy()
            return {
                "predicted_return_pct": float(pred),
            }


class RegimeService:
    """Service for market regime detection."""

    def __init__(self, data_service: DataService):
        self.data_service = data_service

    def get_current_regime(self) -> dict:
        """Get current market regime."""
        df = self.data_service.load_features()
        regimes_df, _, _ = compute_rolling_regimes(
            df['close'],
            window=288,
            theta_slope=0.00004,  # Derived from training data
            theta_vol_high=0.0019,
        )
        current = regimes_df.iloc[-1]
        # Map regime names to enum values
        regime_map = {
            "Bullish": "bullish",
            "Bearish": "bearish",
            "Sideways": "sideways",
            "High Volatility": "high_volatility",
            "Warmup": "unknown",
        }
        regime_name = current['regime']
        mapped_regime = regime_map.get(regime_name, "unknown")
        return {
            "regime": mapped_regime,
            "regime_confidence": 1.0,  # Could compute based on distance to thresholds
            "slope": float(current['slope']),
            "volatility": float(current['volatility']),
        }

    def get_regime_history(self, n: int = 100) -> List[dict]:
        """Get recent regime history."""
        df = self.data_service.load_features()
        regimes_df, _, _ = compute_rolling_regimes(
            df['close'],
            window=288,
            theta_slope=0.00004,
            theta_vol_high=0.0019,
        )
        # Add timestamp column from the features dataframe
        regimes_df = regimes_df.copy()
        regimes_df['timestamp'] = df['timestamp'].values
        recent = regimes_df.tail(n)
        
        # Map regime names to enum values
        regime_map = {
            "Bullish": "bullish",
            "Bearish": "bearish",
            "Sideways": "sideways",
            "High Volatility": "high_volatility",
            "Warmup": "unknown",
        }
        
        return [
            {
                "timestamp": row['timestamp'].isoformat() if pd.notna(row['timestamp']) else None,
                "regime": regime_map.get(row['regime'], "unknown"),
                "slope": float(row['slope']),
                "volatility": float(row['volatility']),
            }
            for _, row in recent.iterrows()
        ]


class MetricsService:
    """Service for loading experiment metrics."""

    def __init__(self, results_dir: str):
        self.results_dir = Path(results_dir)
        
        # Map internal model names to API enum values
        self.model_name_map = {
            "naive": "naive",
            "ridge": "linear",
            "logistic": "logistic",
            "random_forest": "random_forest",
            "xgboost": "xgboost",
            "lstm": "lstm",
            "gru": "gru",
            "cnn1d": "cnn1d",
        }

    def load_metrics(
        self,
        experiment: Optional[str] = None,
        model: Optional[str] = None,
    ) -> List[dict]:
        """Load metrics from experiment result files."""
        all_metrics = []

        # Support _baselines.json files only
        for pattern in ["*_baselines.json"]:
            for file_path in self.results_dir.glob(pattern):
                try:
                    with open(file_path) as f:
                        data = json.load(f)

                    # Check if this is the combined file (all_baselines_results.json)
                    # which has format: {experiment: {model: {...}}}
                    # vs individual files (EXP_X_baselines.json) which have format: {model: {...}}
                    is_combined = False
                    for key, value in data.items():
                        # Combined file has experiment names as keys (EXP_A_PRICE, etc.)
                        if key.startswith("EXP_") and isinstance(value, dict):
                            is_combined = True
                            break
                    
                    # Extract experiment name from filename for individual files
                    import re
                    filename = file_path.stem
                    match = re.match(r'^(EXP_[A-Z]+(?:_[A-Z]+)*)', filename)
                    file_exp_name = match.group(1) if match else None

                    if is_combined:
                        # Format: {experiment: {model: {...}}}
                        for exp_name, exp_data in data.items():
                            if exp_name in ["experiment", "models", "summary"]:
                                continue
                            if experiment and exp_name != experiment:
                                continue
                            if not isinstance(exp_data, dict):
                                continue

                            for model_name, model_data in exp_data.items():
                                self._extract_metrics(all_metrics, exp_name, model_name, model_data, experiment, model)
                    else:
                        # Format: {model: {...}} - experiment name from filename
                        exp_name = file_exp_name or "UNKNOWN"
                        if experiment and exp_name != experiment:
                            continue

                        for model_name, model_data in data.items():
                            if model_name in ["experiment", "models", "summary"]:
                                continue
                            self._extract_metrics(all_metrics, exp_name, model_name, model_data, experiment, model)

                except Exception as e:
                    logger.warning(f"Failed to load {file_path}: {e}")

        return all_metrics

    def _extract_metrics(self, all_metrics: List[dict], exp_name: str, model_name: str, model_data: dict, filter_exp: Optional[str], filter_model: Optional[str]):
        """Extract metrics from model data."""
        if filter_model and model_name.lower() != filter_model.lower():
            return
        
        # Map model name to API enum
        api_model_name = self.model_name_map.get(model_name.lower(), model_name)
        
        # Check for new format (val_metrics, test_metrics)
        for split_key, split_name in [("val_metrics", "validation"), ("test_metrics", "test")]:
            metrics = model_data.get(split_key, {})
            for task_type, task_metrics in metrics.items():
                for metric_name, value in task_metrics.items():
                    if not isinstance(value, (int, float)) or np.isnan(value):
                        continue
                    all_metrics.append({
                        "experiment": exp_name,
                        "model": api_model_name,
                        "task": task_type,
                        "metric_name": metric_name,
                        "metric_value": float(value),
                        "regime": None,
                        "sample_size": 1282,
                    })
        
        # Also support old format
        for split in ["test", "validation"]:
            metrics = model_data.get(split, {})
            for metric_name, value in metrics.items():
                if not isinstance(value, (int, float)) or np.isnan(value):
                    continue
                all_metrics.append({
                    "experiment": exp_name,
                    "model": api_model_name,
                    "task": "classification" if metric_name in ["accuracy", "precision", "recall", "f1", "directional_accuracy"] else "regression",
                    "metric_name": metric_name,
                    "metric_value": float(value),
                    "regime": None,
                    "sample_size": 1282,
                })
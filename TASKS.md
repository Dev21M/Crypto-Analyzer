# CryptoAnalyzer Task Tracker (TASKS.md)

## COMPLETED (Phase 2)
- [x] Implement Binance BTC/USDT 5-minute historical candle downloader module (`BinanceDownloader`)
- [x] Implement dataset integrity & boundary validator (`DataValidator`):
  - [x] Strictly increasing timestamps
  - [x] Expected 5-minute intervals (300,000 ms)
  - [x] UTC normalization
  - [x] Duplicate timestamp detection
  - [x] Missing candle detection
  - [x] OHLC logic consistency check ($\text{High} \ge \max(\text{Open}, \text{Close})$, $\text{Low} \le \min(\text{Open}, \text{Close})$)
  - [x] Positive OHLC values check ($\text{Open}, \text{High}, \text{Low}, \text{Close} > 0$)
  - [x] Non-negative volume check ($\text{Volume} \ge 0$)
  - [x] NaN / Inf value detection
  - [x] Schema validation
  - [x] Date coverage verification
  - [x] Row count validation
  - [x] Dataset provenance logging
  - [x] File hash / checksum verification (SHA-256)
- [x] Store raw immutable datasets in `data/raw/btcusdt_5m_raw.csv` (8,640 rows, SHA-256: `a722751b...`)
- [x] Output dataset metadata summary report (`dataset_metadata.json`, `validation_report.json`)
- [x] Create CLI script `scripts/download_data.py`
- [x] Implement unit test suite `tests/test_data_pipeline.py` (13 passed)
- [x] Record Decision 015 in `DECISIONS.md`
- [x] Mark Phase 2 COMPLETE and STOP for Human Approval for Phase 3

## COMPLETED (Phase 3 — Feature Engineering)
- [x] Implement return & log-return generators ($R_t, r_t$, lag returns)
- [x] Implement technical indicators (SMA_12/24/96, EMA_12/26, RSI_14, MACD/Signal/Hist, Bollinger Upper/Lower/Width/%B, ATR_14)
- [x] Implement volatility feature calculators (rolling std dev of 5m returns over 12/24/96 periods, normalized ATR ratio)
- [x] Validate temporal alignment and NaN handling with zero future look-ahead bias

- [x] Mark Phase 3 COMPLETE and STOP for Human Approval for Phase 4

## COMPLETED (Phase 4 — Target & Sequence Pipeline)
- [x] Implement `compute_targets()` generating `R_t_12` and `D_t_12` via the locked formulas
- [x] Explicitly drop final H=12 rows with no valid future target
- [x] Implement `fit_transform_scaler()` fitting `StandardScaler` on training rows only
- [x] Implement `extract_3d_sequences()` with chronological sliding-window of shape (N, 60, K)
- [x] Prevent cross-split target leakage by assigning sequences via `t+12` realization index
- [x] Support all four experiment configurations: K = 4, 5, 19, 24
- [x] Implement `build_experiment_tensors()` orchestrator pipeline
- [x] Create `build_sequences.py` CLI and verify shapes on real 8544-row dataset
- [x] Wrote `tests/test_targets.py` (7 tests) and `tests/test_sequences.py` (4 tests)
- [x] Full test suite: 116 tests passing
- [x] Mark Phase 4 COMPLETE and STOP for Human Approval for Phase 5

## COMPLETED (Phase 5 — Baseline Models)
- [x] Implement Naive / Lag baseline model class (`NaiveBaseline`)
- [x] Implement Ridge Regressor baseline model class (`RidgeRegressorModel`)
- [x] Implement Logistic Classifier baseline model class (`LogisticModel`)
- [x] Implement Random Forest Regressor & Classifier model classes (`RandomForestModel`)
- [x] Implement XGBoost Regressor & Classifier model classes (`XGBoostModel`)
- [x] Implement experiment orchestration runner (`ExperimentRunner`) with $(N, 60, K) \to (N, 60 \times K)$ tensor flattening
- [x] Implement evaluation metrics computation (MAE, RMSE, MAPE, Accuracy, Precision, Recall, F1, Confusion Matrix)
- [x] Create CLI runner script `scripts/run_baselines.py`
- [x] Implement unit test suite `tests/test_baselines.py` (31/31 passed)
- [x] Execute complete real-data baseline experiment run generating JSON artifacts in `experiments/results/`
- [x] Verify raw data SHA-256 integrity remains untouched
- [x] Record Decision 018 in `DECISIONS.md`
- [x] Mark Phase 5 COMPLETE and STOP for Human Approval for Phase 6

## COMPLETED (Phase 10 — Crypto Analyzer Application)
- [x] Create Streamlit dashboard `src/crypto_analyzer/app.py` with 5 interactive pages
- [x] Page 1: Data Explorer — Interactive candlestick charts with indicator overlays, date range selection
- [x] Page 2: Model Performance — Metric comparison tables, bar charts, radar charts across 4 experiments × 7 models
- [x] Page 3: Regime Analysis — Market regime distribution, performance by regime, detailed regime tables
- [x] Page 4: Statistical Tests — Wilcoxon signed-rank test results with Holm correction display
- [x] Page 5: Reports — Markdown tables, generated figures, summary files viewer
- [x] Mandatory scientific disclaimer banner on all pages (not financial advice warning)
- [x] Create CLI runner script `scripts/run_app.py`
- [x] Add streamlit and plotly to requirements.txt
- [x] Implement unit test suite `tests/test_app.py` (13/13 passed)
- [x] Mark Phase 10 COMPLETE and STOP for Human Approval for Phase 11

## COMPLETED (Phase 11 — Final Validation)
- [x] Run complete end-to-end unit test suite (195 tests passing)
- [x] Perform clean-environment installation and execution check (`scripts/clean_env_check.py`)
- [x] Audit code against PEP 8 and docstring standards (ruff: 0 errors)
- [x] Apply automatic code fixes (import sorting, type hints, mutable defaults, unused variables)
- [x] Verify no data leakage: chronological splits, train-only scaling, no future data in features
- [x] Create missing directories for completeness (evaluation, visualization, utils, experiments/configs)
- [x] Mark Phase 11 COMPLETE and STOP for Human Approval for Phase 12

## COMPLETED (Phase 12 — Research Deliverables)
- [x] Write final research paper `reports/research/final_paper.md`
- [x] Document all 12 phases, experimental results, statistical significance, regime analysis
- [x] Report hypothesis outcomes: H1 (Rejected), H2 (Rejected), H3 (Inconclusive), H4 (Supported)
- [x] Document key findings: Naive ≈ XGBoost on DA, 1D-CNN best MAE, no feature benefit, metric divergence
- [x] Document limitations: single asset, 30-day window, 100% High Vol test regime, frictionless assumption
- [x] Provide future research directions: multi-asset, order book features, alternative horizons, walk-forward
- [x] Include full reproducibility statement with execution commands
- [x] Mark Phase 12 COMPLETE

## BACKLOG
- None (all planned phases complete)

## BLOCKED
- None at present.

## COMPLETED
- [x] Phase 0 project foundation & environment setup (2026-09-16)
- [x] Phase 1 research foundation & scientific specification (2026-09-16)
- [x] Phase 2 BTC/USDT raw data pipeline & 14-point validation (2026-09-16)
- [x] Phase 3 feature engineering — 24 features, 84 tests, zero look-ahead (2026-09-16)
- [x] Phase 4 target & sequence pipeline — 3D tensors, 11 tests, 116 full suite (2026-09-16)
- [x] Phase 5 baseline models (2026-09-17)
- [x] Phase 6 deep learning models (2026-09-18)
- [x] Phase 7 feature ablation study (2026-09-18)
- [x] Phase 8 market regime analysis (2026-09-18)
- [x] Phase 9 statistical analysis & comparative reports (2026-09-19)
- [x] Phase 10 Streamlit dashboard — 5 pages, interactive charts, regime analysis, statistical tests (2026-10-08)
- [x] Phase 11 Final validation — 195 tests passing, ruff clean, clean-env verified, no leakage (2026-10-08)
- [x] Phase 12 Research deliverables — Final paper, hypothesis outcomes, limitations, reproducibility (2026-10-08)

# Phase 8: Market Regime Analysis Report

## Methodology
- **Regime window (W_regime):** 288 candles (24.0 hours)
- **Theta slope threshold (documented default):** 0.0005
- **Theta slope threshold (used):** 0.00008587
  *(50th percentile of abs(slope) over training partition (rows 0..5979) — data-adaptive, train-only)*
- **Theta vol_high threshold:** 0.00210690
  *(derived as 90.0th percentile of training-partition rolling volatility — training partition only (rows 0..5979))*
- **Warm-up rows (regime):** 287 rows (rows lacking a full 288-candle lookback are labelled 'Warmup')

## Regime Classification Precedence
1. **High Volatility** — sigma_t > theta_vol_high (regardless of slope)
2. **Bullish** — S_t > +theta_slope AND sigma_t <= theta_vol_high
3. **Bearish** — S_t < -theta_slope AND sigma_t <= theta_vol_high
4. **Sideways** — |S_t| <= theta_slope AND sigma_t <= theta_vol_high

## Dataset Partitions
| Partition | Rows |
|---|---|
| Train | 5980 |
| Validation | 1282 |
| Test | 1282 |
| Total Feature Rows | 8544 |

## Test Partition Regime Counts & Proportions
| Regime | Count | Proportion |
|---|---|---|
| Bullish | 300 | 23.40% |
| Bearish | 668 | 52.11% |
| Sideways | 305 | 23.79% |
| High Volatility | 9 | 0.70% |
| Warmup | 0 | 0.00% |

*(Out of 1282 test observations; 1282 classified, 0 in warm-up.)*

## Descriptive Statistics by Regime (Test Partition)
| Regime | Count | Mean Close | Mean Return % | Std Return % | Mean Slope | Mean Volatility |
|---|---|---|---|---|---|---|
| Bullish | 300 | 43565.6105 | 0.010146 | 0.200238 | 0.00021052 | 0.00198856 |
| Bearish | 668 | 41950.6712 | -0.006518 | 0.217176 | -0.00018909 | 0.00200624 |
| Sideways | 305 | 42428.4026 | -0.004601 | 0.290185 | -0.00002934 | 0.00201713 |
| High Volatility | 9 | 41113.9133 | -0.090783 | 0.290228 | -0.00028069 | 0.00211085 |

## Observations
- Results are purely descriptive and observational.
- No causal claims are made about regime types and model performance.
- The theta_vol_high threshold was derived exclusively from training-partition data to prevent look-ahead leakage.
- Regime labels are produced independently of any model predictions.
- These regime labels are available for downstream use in Phase 9 (significance testing) and Phase 10 (visualization).

## Limitations
- Regime classification is based on a single rolling 24-hour window. Regime transitions may not be precisely aligned to exact structural breaks.
- Short sideways or high-volatility episodes that are subsumed into adjacent longer regimes may be underrepresented.
- The slope threshold theta_slope is a pre-specified constant rather than a data-adaptive threshold.
- Warm-up rows at the start of the test partition (if any) are excluded from regime-conditioned analysis.
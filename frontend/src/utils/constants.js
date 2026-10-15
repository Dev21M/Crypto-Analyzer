/**
 * Application constants
 */

// Supported timeframes for charts
export const TIMEFRAMES = [
  { value: '5m', label: '5 Minutes', seconds: 300 },
  { value: '15m', label: '15 Minutes', seconds: 900 },
  { value: '1h', label: '1 Hour', seconds: 3600 },
  { value: '4h', label: '4 Hours', seconds: 14400 },
  { value: '1d', label: '1 Day', seconds: 86400 },
  { value: '1w', label: '1 Week', seconds: 604800 },
];

export const TIMEFRAME_LABELS = {
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

export const TIMEFRAME_MS = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
};

// Prediction horizons (in candles)
export const HORIZONS = [
  { value: 1, label: '1 candle (5 min)', minutes: 5 },
  { value: 3, label: '3 candles (15 min)', minutes: 15 },
  { value: 6, label: '6 candles (30 min)', minutes: 30 },
  { value: 12, label: '12 candles (1 hour)', minutes: 60 },
  { value: 24, label: '24 candles (2 hours)', minutes: 120 },
  { value: 48, label: '48 candles (4 hours)', minutes: 240 },
];

// Experiment configurations
export const EXPERIMENTS = [
  { id: 'EXP_A_PRICE', label: 'Price Only', features: 4, description: 'OHLC prices only' },
  { id: 'EXP_B_PRICE_VOL', label: 'Price + Volume', features: 5, description: 'OHLC + volume' },
  { id: 'EXP_C_TECH_IND', label: 'Price + Vol + Tech', features: 19, description: 'OHLC + volume + technical indicators' },
  { id: 'EXP_D_FULL', label: 'Full Feature Set', features: 24, description: 'All available features' },
];

// Model configurations
export const MODELS = [
  // Baseline models
  { id: 'naive', label: 'Naive', type: 'baseline', category: 'Baseline' },
  { id: 'linear', label: 'Linear/Ridge', type: 'baseline', category: 'Baseline' },
  { id: 'logistic', label: 'Logistic', type: 'baseline', category: 'Baseline' },
  { id: 'random_forest', label: 'Random Forest', type: 'baseline', category: 'Baseline' },
  { id: 'xgboost', label: 'XGBoost', type: 'baseline', category: 'Baseline' },
  // Deep learning models
  { id: 'lstm', label: 'LSTM', type: 'deep_learning', category: 'Deep Learning' },
  { id: 'gru', label: 'GRU', type: 'deep_learning', category: 'Deep Learning' },
  { id: 'cnn1d', label: '1D-CNN', type: 'deep_learning', category: 'Deep Learning' },
];

export const MODEL_TYPES = {
  baseline: ['naive', 'linear', 'logistic', 'random_forest', 'xgboost'],
  deep_learning: ['lstm', 'gru', 'cnn1d'],
};

export const MODEL_CATEGORIES = {
  'Baseline': ['naive', 'linear', 'logistic', 'random_forest', 'xgboost'],
  'Deep Learning': ['lstm', 'gru', 'cnn1d'],
};

// Task types
export const TASKS = [
  { id: 'classification', label: 'Directional Classification', description: 'Predict UP/DOWN direction' },
  { id: 'regression', label: 'Return Regression', description: 'Predict percentage return' },
];

// Market regimes
export const REGIMES = [
  { id: 'bullish', label: 'Bullish', color: '#3fb950', description: 'Upward trending market' },
  { id: 'bearish', label: 'Bearish', color: '#f85149', description: 'Downward trending market' },
  { id: 'sideways', label: 'Sideways', color: '#8b949e', description: 'Range-bound market' },
  { id: 'high_volatility', label: 'High Volatility', color: '#d29922', description: 'High volatility regime' },
  { id: 'unknown', label: 'Unknown', color: '#a371f7', description: 'Insufficient data' },
];

export const REGIME_COLORS = {
  bullish: '#3fb950',
  bearish: '#f85149',
  sideways: '#8b949e',
  high_volatility: '#d29922',
  unknown: '#a371f7',
};

// Technical indicators
export const INDICATORS = {
  trend: [
    { key: 'sma_12', label: 'SMA 12', description: 'Simple Moving Average (12 periods)' },
    { key: 'sma_24', label: 'SMA 24', description: 'Simple Moving Average (24 periods)' },
    { key: 'sma_96', label: 'SMA 96', description: 'Simple Moving Average (96 periods)' },
    { key: 'ema_12', label: 'EMA 12', description: 'Exponential Moving Average (12 periods)' },
    { key: 'ema_26', label: 'EMA 26', description: 'Exponential Moving Average (26 periods)' },
  ],
  momentum: [
    { key: 'rsi_14', label: 'RSI 14', description: 'Relative Strength Index (14 periods)' },
    { key: 'macd', label: 'MACD', description: 'Moving Average Convergence Divergence' },
    { key: 'macd_signal', label: 'MACD Signal', description: 'MACD Signal Line' },
    { key: 'macd_hist', label: 'MACD Histogram', description: 'MACD Histogram' },
    { key: 'roc', label: 'Rate of Change', description: 'Price Rate of Change' },
  ],
  volatility: [
    { key: 'bb_upper', label: 'BB Upper', description: 'Bollinger Bands Upper' },
    { key: 'bb_lower', label: 'BB Lower', description: 'Bollinger Bands Lower' },
    { key: 'bb_width', label: 'BB Width', description: 'Bollinger Bands Width' },
    { key: 'bb_pct_b', label: 'BB %B', description: 'Bollinger Bands %B' },
    { key: 'atr_14', label: 'ATR 14', description: 'Average True Range (14 periods)' },
    { key: 'rolling_vol_12', label: 'Vol 12', description: 'Rolling Volatility (12 periods)' },
    { key: 'rolling_vol_24', label: 'Vol 24', description: 'Rolling Volatility (24 periods)' },
    { key: 'rolling_vol_96', label: 'Vol 96', description: 'Rolling Volatility (96 periods)' },
    { key: 'atr_ratio', label: 'ATR Ratio', description: 'ATR to Price Ratio' },
  ],
  volume: [
    { key: 'volume', label: 'Volume', description: 'Trading Volume' },
    { key: 'volume_sma', label: 'Volume SMA', description: 'Volume Moving Average' },
  ],
  other: [
    { key: 'log_returns', label: 'Log Returns', description: 'Logarithmic Returns' },
  ],
};

export const ALL_INDICATORS = [
  ...INDICATORS.trend,
  ...INDICATORS.momentum,
  ...INDICATORS.volatility,
  ...INDICATORS.volume,
  ...INDICATORS.other,
];

// API endpoints
export const API_ENDPOINTS = {
  health: '/api/v1/health',
  market: {
    snapshot: '/api/v1/market/snapshot',
    candles: '/api/v1/market/candles',
    regimes: '/api/v1/market/regimes',
    indicators: '/api/v1/market/indicators',
    stats: '/api/v1/market/stats',
    coins: '/api/v1/market/coins',
    overview: '/api/v1/market/overview',
    gainers: '/api/v1/market/gainers',
    losers: '/api/v1/market/losers',
    search: '/api/v1/market/search',
  },
  prediction: {
    predict: '/api/v1/predict',
    historical: '/api/v1/predict/historical',
    models: '/api/v1/predict/models',
    metrics: '/api/v1/predict/metrics',
    compare: '/api/v1/predict/compare',
  },
  websocket: '/api/v1/ws',
};

// WebSocket channels
export const WS_CHANNELS = {
  predictions: 'predictions',
  market: 'market',
  regimes: 'regimes',
};

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'system',
  autoRefresh: true,
  refreshInterval: 300,
  defaultExperiment: 'EXP_D_FULL',
  defaultModel: 'xgboost',
  defaultTask: 'classification',
  defaultHorizon: 12,
  enablePredictions: true,
  enableMarketUpdates: true,
  enableRegimeChanges: true,
  debugMode: false,
  logLevel: 'info',
};

// Chart colors
export const CHART_COLORS = {
  categorical: [
    '#58a6ff', '#3fb950', '#f59e0b', '#f85149', '#a371f7',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  ],
  sequential: [
    '#0d1117', '#161b22', '#21262d', '#30363d', '#484f58',
    '#6e7681', '#8b949e', '#b1bac4', '#d0d7de', '#f0f6fc',
  ],
  diverging: [
    '#f85149', '#ff7b72', '#ffa657', '#ffdf5d', '#d29922',
    '#3fb950', '#56d364', '#7ee787', '#a3e9b5', '#c6f0d6',
  ],
};

// Pagination defaults
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  maxPageSize: 100,
};

// Debounce delays
export const DEBOUNCE = {
  search: 300,
  input: 150,
  resize: 100,
  scroll: 50,
};

// Animation durations
export const ANIMATION = {
  fast: 100,
  base: 150,
  slow: 250,
  modal: 200,
  toast: 300,
};

// Z-index layers
export const Z_INDEX = {
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
};

// Breakpoints (matching CSS)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Local storage keys
export const STORAGE_KEYS = {
  theme: 'cryptoanalyzer_theme',
  settings: 'cryptoanalyzer_settings',
  watchlist: 'cryptoanalyzer_watchlist',
  portfolio: 'cryptoanalyzer_portfolio',
  lastVisited: 'cryptoanalyzer_last_visited',
  dismissedAlerts: 'cryptoanalyzer_dismissed_alerts',
};

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  unauthorized: 'Please sign in to continue.',
  forbidden: 'You do not have permission to access this resource.',
  notFound: 'The requested resource was not found.',
  server: 'Server error. Please try again later.',
  validation: 'Please check your input and try again.',
  timeout: 'Request timed out. Please try again.',
  unknown: 'An unexpected error occurred.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  saved: 'Changes saved successfully.',
  created: 'Created successfully.',
  updated: 'Updated successfully.',
  deleted: 'Deleted successfully.',
  copied: 'Copied to clipboard.',
  exported: 'Exported successfully.',
  imported: 'Imported successfully.',
};

export default {
  TIMEFRAMES,
  TIMEFRAME_LABELS,
  TIMEFRAME_MS,
  HORIZONS,
  EXPERIMENTS,
  MODELS,
  MODEL_TYPES,
  MODEL_CATEGORIES,
  TASKS,
  REGIMES,
  REGIME_COLORS,
  INDICATORS,
  ALL_INDICATORS,
  API_ENDPOINTS,
  WS_CHANNELS,
  DEFAULT_SETTINGS,
  CHART_COLORS,
  PAGINATION,
  DEBOUNCE,
  ANIMATION,
  Z_INDEX,
  BREAKPOINTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
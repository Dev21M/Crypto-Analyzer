import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Star, Share2, 
  Download, Maximize2, Minimize2, Loader2, AlertTriangle, Info,
  BarChart3, Target, Zap, RotateCw, Search, ChevronDown
} from 'lucide-react';
import { Button, Card, MetricCard, Badge, Avatar, Tabs, Table, createColumn, Skeleton, Input } from '../../components/ui';
import { CandlestickChart, LineChart } from '../../components/charts';
import { marketApi, predictionApi } from '../../services/api';
import { formatPrice, formatChange, formatCompactNumber, formatPercentage, formatRelativeTime, parseSymbolPair } from '../../utils/formatters';
import { TIMEFRAMES, INDICATORS, REGIMES, REGIME_COLORS, EXPERIMENTS, MODELS, TASKS, HORIZONS } from '../../utils/constants';
import { clsx } from 'clsx';

// Memoized tab content components to prevent re-renders on tab switch

export function CoinAnalysis() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [coin, setCoin] = useState(null);
  const [candles, setCandles] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [regime, setRegime] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [candlesLoading, setCandlesLoading] = useState(false);
  const [chartHeight, setChartHeight] = useState(500);
  const [activeTab, setActiveTab] = useState('chart');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const [coinSearchQuery, setCoinSearchQuery] = useState('');
  const [availableCoins, setAvailableCoins] = useState([]);
  const [coinsLoading, setCoinsLoading] = useState(false);
  const coinSelectorRef = useRef(null);

  // Normalize symbol: default to BTC, remove USDT suffix if present
  const normalizedSymbol = useMemo(() => {
    if (!symbol) return 'BTC';
    return symbol.replace('USDT', '').toUpperCase();
  }, [symbol]);

  // Load available coins for the selector
  const loadAvailableCoins = useCallback(async () => {
    if (availableCoins.length > 0) return;
    setCoinsLoading(true);
    try {
      const data = await marketApi.getCoins();
      setAvailableCoins(data || []);
    } catch (err) {
      console.error('Failed to load coins:', err);
    } finally {
      setCoinsLoading(false);
    }
  }, [availableCoins.length]);

  // Filter coins based on search query
  const filteredCoins = useMemo(() => {
    if (!coinSearchQuery) return availableCoins.slice(0, 50);
    const query = coinSearchQuery.toLowerCase();
    return availableCoins.filter(coin => 
      coin.symbol.toLowerCase().includes(query) ||
      coin.name.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [availableCoins, coinSearchQuery]);

  const handleCoinSelect = (selectedSymbol) => {
    navigate(`/coin/${selectedSymbol}`);
    setShowCoinSelector(false);
    setCoinSearchQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (coinSelectorRef.current && !coinSelectorRef.current.contains(event.target)) {
        setShowCoinSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadCoinData();
    checkWatchlist();
  }, [normalizedSymbol]);

  // Clear predictions when symbol changes
  useEffect(() => {
    setPredictions([]);
    setPredictionsLoading(false);
  }, [normalizedSymbol]);

  useEffect(() => {
    loadCandles();
  }, [normalizedSymbol, timeframe]);

  // Load predictions when tab is activated or on initial load
  const loadPredictions = useCallback(async () => {
    try {
      setPredictionsLoading(true);
      // Try to get historical predictions
      const data = await predictionApi.getHistorical({
        experiment: 'EXP_D_FULL',
        model: 'xgboost',
        task: 'classification',
        horizon: 12,
        limit: 20
      });
      if (data && data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (err) {
      console.error('Failed to load predictions:', err);
    } finally {
      setPredictionsLoading(false);
    }
  }, []);

  // Load predictions when predictions tab is activated
  useEffect(() => {
    if (activeTab === 'predictions') {
      loadPredictions();
    }
  }, [activeTab, loadPredictions]);

  const loadCoinData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coinData, indicatorsData, regimeData] = await Promise.all([
        marketApi.getCoinDetails(normalizedSymbol),
        marketApi.getIndicators(normalizedSymbol),
        marketApi.getRegime(normalizedSymbol),
      ]);
      setCoin(coinData);
      setIndicators(indicatorsData);
      setRegime(regimeData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCandles = async () => {
    try {
      setCandlesLoading(true);
      const data = await marketApi.getCandles(normalizedSymbol, { 
        interval: timeframe, 
        limit: 500 
      });
      setCandles(data);
    } catch (err) {
      console.error('Failed to load candles:', err);
    } finally {
      setCandlesLoading(false);
    }
  };

  const checkWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('cryptoanalyzer_watchlist') || '[]');
    setInWatchlist(watchlist.includes(normalizedSymbol));
  };

  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem('cryptoanalyzer_watchlist') || '[]');
    const newWatchlist = inWatchlist 
      ? watchlist.filter(s => s !== normalizedSymbol)
      : [...watchlist, normalizedSymbol];
    localStorage.setItem('cryptoanalyzer_watchlist', JSON.stringify(newWatchlist));
    setInWatchlist(!inWatchlist);
  };

  const shareCoin = async () => {
    if (navigator.share) {
      await navigator.share({
        title: coin.name + ' (' + normalizedSymbol + ') Analysis',
        text: 'Check out ' + coin.name + ' analysis on CryptoAnalyzer',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // If no symbol in URL and we're on /analysis route, show coin selector
  const isAnalysisRoute = !symbol;

  if (isAnalysisRoute) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="bg-secondary border-b border-primary">
          <div className="container py-6">
            <div className="flex items-center gap-4">
              <Link to="/markets" className="text-muted hover:text-primary text-sm inline-flex items-center gap-1">
                <ChevronLeft size={16} /> Markets
              </Link>
              <h1 className="text-2xl font-bold">Coin Analysis</h1>
            </div>
            <p className="text-muted mt-2">Select a cryptocurrency to analyze</p>
          </div>
        </div>
        <main className="flex-1">
          <div className="container py-8">
            <Card className="max-w-2xl mx-auto">
              <div className="card-header">
                <h3 className="card-title">Search Coins</h3>
                <p className="card-subtitle">Type to search by symbol or name</p>
              </div>
              <div className="card-content">
                <div className="relative" ref={coinSelectorRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type="text"
                      placeholder="Search coins (BTC, ETH, SOL...)"
                      value={coinSearchQuery}
                      onChange={(e) => {
                        setCoinSearchQuery(e.target.value);
                        loadAvailableCoins();
                      }}
                      onFocus={() => {
                        setShowCoinSelector(true);
                        loadAvailableCoins();
                      }}
                      className="form-input pl-10"
                      autoComplete="off"
                      aria-label="Search cryptocurrencies"
                    />
                  </div>
                  {showCoinSelector && (
                    <div className="search-dropdown animate-fadeIn mt-1" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {coinsLoading ? (
                        <div className="search-loading p-4 text-center">
                          <div className="spinner spinner-sm mx-auto mb-2" />
                          <span className="text-muted">Loading coins...</span>
                        </div>
                      ) : filteredCoins.length === 0 ? (
                        <div className="search-empty p-4 text-center text-muted">
                          No coins found
                        </div>
                      ) : (
                        filteredCoins.map((coin) => (
                          <button
                            key={coin.symbol}
                            className="search-result-item w-full text-left"
                            onClick={() => handleCoinSelect(coin.symbol)}
                            type="button"
                          >
                            <div className="coin-avatar-sm" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                              {coin.symbol.charAt(0)}
                            </div>
                            <div className="coin-info">
                              <span className="coin-symbol">{coin.symbol}</span>
                              <span className="coin-name">{coin.name}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return <CoinAnalysisSkeleton symbol={normalizedSymbol} />;
  }

  if (error) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Coin Data</h2>
          <p className="text-muted mb-6">{error}</p>
          <Button variant="secondary" onClick={loadCoinData}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Coin Not Found</h2>
          <p className="text-muted mb-6">The requested cryptocurrency could not be found.</p>
          <Link to="/markets">
            <Button variant="secondary">Browse Markets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const priceChange24h = coin.change24h || 0;
  const isPositive = priceChange24h >= 0;
  const { base, quote } = parseSymbolPair(normalizedSymbol + 'USDT');

  return (
    <div className="min-h-screen bg-primary">
      {/* Coin Header with Price */}
      <div className="bg-secondary border-b border-primary">
        <div className="container py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link to="/markets" className="text-muted hover:text-primary text-sm mb-2 inline-flex items-center gap-1">
                <ChevronLeft size={16} /> Markets
              </Link>
              <div className="flex items-center gap-4">
                <Avatar symbol={normalizedSymbol} name={coin.name} size="xl" src={coin.icon} />
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    {coin.name}
                    <span className="text-muted text-xl font-normal">{normalizedSymbol}</span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isPositive ? 'success' : 'danger'} size="sm">
                      {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}% (24h)
                    </Badge>
                    {regime && (
                      <Badge variant="neutral" size="sm" className="bg-tertiary">
                        {regime.regime}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="ghost" size="icon" onClick={toggleWatchlist} aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}>
                <Star size={20} className={inWatchlist ? 'text-warning fill-warning' : 'text-muted'} />
              </Button>
              <Button variant="ghost" size="icon" onClick={shareCoin} aria-label="Share">
                <Share2 size={20} />
              </Button>
              <Button variant="secondary" onClick={() => setChartHeight(chartHeight === 500 ? 800 : 500)}>
                {chartHeight === 500 ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
              </Button>
            </div>
          </div>

          {/* Price & Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
            <MetricCard
              label="Current Price"
              value={formatPrice(coin.price, quote)}
              prefix=""
              className="lg:col-span-2"
            />
            <MetricCard
              label="24h Change"
              value={isPositive ? '+' : ''}
              suffix={priceChange24h.toFixed(2) + '%'}
              trend={isPositive ? 'up' : 'down'}
              change={Math.abs(priceChange24h).toFixed(2)}
              changeLabel="%"
            />
            <MetricCard
              label="24h High"
              value={formatPrice(coin.high24h, quote)}
              prefix=""
            />
            <MetricCard
              label="24h Low"
              value={formatPrice(coin.low24h, quote)}
              prefix=""
            />
            <MetricCard
              label="24h Volume"
              value={formatCompactNumber(coin.volume24h, { currency: true })}
            />
            <MetricCard
              label="Market Cap"
              value={coin.marketCap ? formatCompactNumber(coin.marketCap, { currency: true }) : 'N/A'}
            />
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Main Content Tabs */}
        <div className="container py-8">
          <Tabs
            tabs={[
              { 
                key: 'chart', 
                label: 'Chart', 
                icon: <TrendingUp size={16} />,
                content: (
                  <ChartSection 
                    symbol={normalizedSymbol} 
                    candles={candles} 
                    timeframe={timeframe} 
                    setTimeframe={setTimeframe}
                    height={chartHeight}
                    coin={coin}
                    loading={candlesLoading}
                  />
                )
              },
              { 
                key: 'indicators', 
                label: 'Indicators', 
                icon: <BarChart3 size={16} />,
                content: (
                  <IndicatorsSection indicators={indicators} />
                )
              },
              { 
                key: 'regime', 
                label: 'Market Regime', 
                icon: <Target size={16} />,
                content: (
                  <RegimeSection regime={regime} />
                )
              },
              { 
                key: 'predictions', 
                label: 'AI Predictions', 
                icon: <Zap size={16} />,
                content: (
                  <PredictionsSection symbol={normalizedSymbol} predictions={predictions} predictionsLoading={predictionsLoading} setPredictionsLoading={setPredictionsLoading} onRunPrediction={loadPredictions} />
                )
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="line"
            fullWidth
          />
        </div>

        {/* Disclaimer */}
        <div className="container pb-8">
          <Card className="bg-warning-bg/20 border-warning/50">
            <div className="flex items-start gap-3">
              <Info className="text-warning mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-warning mb-2">Important Disclaimer</h4>
                <p className="text-sm text-muted">
                  This analysis is for informational purposes only and does not constitute financial advice. 
                  Cryptocurrency markets are highly volatile and unpredictable. Past performance is not indicative 
                  of future results. AI predictions are based on historical patterns and may not accurately predict 
                  future price movements. Always do your own research and consult with a qualified financial advisor 
                  before making investment decisions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}


const ChartSection = React.memo(function ChartSection({ symbol, candles, timeframe, setTimeframe, height, coin, loading }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="h-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Price Chart</h3>
          <Badge variant="neutral" size="sm">{timeframe}</Badge>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-tertiary rounded-lg p-1" role="radiogroup" aria-label="Chart timeframe">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                role="radio"
                aria-checked={timeframe === tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeframe === tf.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted hover:text-primary'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Minimize chart' : 'Expand chart'}>
            {expanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </Button>
        </div>
      </div>
      <CandlestickChart
        candles={candles}
        height={expanded ? 800 : height}
        showVolume={true}
        theme="dark"
        loading={loading}
      />
      <div className="mt-4 text-xs text-muted flex items-center justify-between">
        <span>Data source: {coin?.dataSource || 'FCS API'}</span>
        <span>Last updated: {formatRelativeTime(candles[candles.length - 1]?.timestamp)}</span>
      </div>
    </Card>
  );
});

const IndicatorsSection = React.memo(function IndicatorsSection({ indicators }) {
  if (!indicators) {
    return (
      <Card>
        <div className="text-center py-12">
          <AlertTriangle size={48} className="text-muted mx-auto mb-4 opacity-50" />
          <p className="text-muted">No indicator data available</p>
        </div>
      </Card>
    );
  }

  const indicatorGroups = {
    Trend: INDICATORS.trend,
    Momentum: INDICATORS.momentum,
    Volatility: INDICATORS.volatility,
    Volume: INDICATORS.volume,
    Other: INDICATORS.other,
  };

  return (
    <div className="space-y-6">
      {Object.entries(indicatorGroups).map(([group, items]) => {
        const validItems = items.filter(item => indicators[item.key] !== undefined && indicators[item.key] !== null);
        if (validItems.length === 0) return null;

        return (
          <Card key={group}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {group}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {validItems.map(item => {
                const value = indicators[item.key];
                return (
                  <div key={item.key} className="p-4 bg-tertiary/50 rounded-lg">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted mb-1">{item.label}</p>
                    <p className="font-mono text-lg font-semibold">{isValidNumber(value) ? value.toFixed(4) : '—'}</p>
                    <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
});

const RegimeSection = React.memo(function RegimeSection({ regime }) {
  if (!regime) {
    return (
      <Card>
        <div className="text-center py-12">
          <AlertTriangle size={48} className="text-muted mx-auto mb-4 opacity-50" />
          <p className="text-muted">No regime data available</p>
        </div>
      </Card>
    );
  }

  const regimeConfig = REGIMES.find(r => r.id === regime.regime) || REGIMES[4];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: regimeConfig.color + '20' }}>
              <span style={{ fontSize: '3rem', color: regimeConfig.color }}>📊</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">{regimeConfig.label}</h3>
              <p className="text-muted">Current Market Regime</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <MetricCard
              label="Confidence"
              value={`${(regime.confidence * 100).toFixed(0)}%`}
              icon={<Target size={20} />}
            />
            <MetricCard
              label="Slope"
              value={regime.slope ? regime.slope.toFixed(6) : 'N/A'}
            />
            <MetricCard
              label="Volatility"
              value={regime.volatility ? regime.volatility.toFixed(4) : 'N/A'}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Regime Description</h3>
        <p className="text-muted mb-4">{regimeConfig.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {REGIMES.filter(r => r.id !== 'unknown').map(r => (
            <div 
              key={r.id} 
              className={`p-4 rounded-lg border-2 transition-colors ${r.id === regime.regime ? 'border-primary' : 'border-primary/10'}`}
              style={{ backgroundColor: r.color + '10' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="font-medium">{r.label}</span>
              </div>
              <p className="text-sm text-muted">{r.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});

const PredictionsSection = React.memo(function PredictionsSection({ symbol, predictions, predictionsLoading, setPredictionsLoading, onRunPrediction }) {
  const [selectedExperiment, setSelectedExperiment] = useState('EXP_D_FULL');
  const [selectedModel, setSelectedModel] = useState('xgboost');
  const [selectedTask, setSelectedTask] = useState('classification');
  const [selectedHorizon, setSelectedHorizon] = useState(12);
  const [lastPrediction, setLastPrediction] = useState(null);

  const handleRunPrediction = async () => {
    try {
      setPredictionsLoading(true);
      const data = await predictionApi.predict({
        experiment: selectedExperiment,
        model: selectedModel,
        task: selectedTask,
        horizon: selectedHorizon,
        use_latest_data: true
      });
      if (data) {
        setLastPrediction(data);
        onRunPrediction();
      }
    } catch (err) {
      console.error('Failed to run prediction:', err);
    } finally {
      setPredictionsLoading(false);
    }
  };

  return (
    <Card>
      {/* Configuration Panel */}
      <div className="mb-4 p-4 bg-tertiary/50 rounded-lg">
        <h4 className="font-medium mb-3">Prediction Configuration</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Experiment</label>
            <select
              value={selectedExperiment}
              onChange={(e) => setSelectedExperiment(e.target.value)}
              className="form-select form-select-sm"
              disabled={predictionsLoading}
            >
              {EXPERIMENTS.map(exp => (
                <option key={exp.id} value={exp.id}>{exp.label} ({exp.features} features)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="form-select form-select-sm"
              disabled={predictionsLoading}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label} ({m.category})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Task</label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="form-select form-select-sm"
              disabled={predictionsLoading}
            >
              {TASKS.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted block mb-1">Horizon</label>
            <select
              value={selectedHorizon}
              onChange={(e) => setSelectedHorizon(Number(e.target.value))}
              className="form-select form-select-sm"
              disabled={predictionsLoading}
            >
              {HORIZONS.map(h => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleRunPrediction}
            disabled={predictionsLoading}
          >
            {predictionsLoading ? (
              <>
                <RotateCw size={16} className="mr-2 spin" />
                Running...
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Run Prediction
              </>
            )}
          </Button>
          <span className="text-xs text-muted">
            Research tool - Not financial advice
          </span>
        </div>
      </div>

      {/* Latest Prediction Result */}
      {lastPrediction && (
        <div className="mb-4 p-4 bg-primary-bg/50 border border-primary/50 rounded-lg">
          <h4 className="font-medium mb-2">Latest Prediction Result</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted block mb-1">Direction</span>
              <span className={`${lastPrediction.direction === 1 ? 'text-success' : 'text-danger'} font-mono font-semibold`}>
                {lastPrediction.direction === 1 ? 'UP ▲' : 'DOWN ▼'}
              </span>
            </div>
            <div>
              <span className="text-muted block mb-1">Confidence</span>
              <span className="font-mono font-semibold">
                {(lastPrediction.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted block mb-1">Horizon</span>
              <span className="font-mono font-semibold">
                {lastPrediction.horizon} candles
              </span>
            </div>
            <div>
              <span className="text-muted block mb-1">Model</span>
              <span className="font-mono font-semibold">
                {lastPrediction.model}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted mt-2">
            Predicted at {formatRelativeTime(lastPrediction.timestamp)} | 
            Experiment: {lastPrediction.experiment} | 
            Task: {lastPrediction.task}
          </p>
        </div>
      )}

      {/* Historical Predictions Table */}
      {predictions.length === 0 && !predictionsLoading && !lastPrediction ? (
        <div className="text-center py-12">
          <Zap size={48} className="text-muted mx-auto mb-4 opacity-50" />
          <p className="text-muted mb-4">No predictions available yet</p>
          <p className="text-xs text-muted mb-4">Configure parameters above and click "Run Prediction"</p>
        </div>
      ) : predictionsLoading ? (
        <div className="text-center py-12">
          <RotateCw size={48} className="text-primary mx-auto mb-4 spin" />
          <p className="text-muted">Running prediction...</p>
        </div>
      ) : (
        <Table
          columns={[
            createColumn({ key: 'model', header: 'Model', accessor: 'model' }),
            createColumn({ key: 'experiment', header: 'Experiment', accessor: 'experiment' }),
            createColumn({ key: 'task', header: 'Task', accessor: 'task' }),
            createColumn({ key: 'horizon', header: 'Horizon', accessor: 'horizon', cell: (v) => `${v} candles` }),
            createColumn({ key: 'direction', header: 'Direction', accessor: 'direction', cell: (v) => v === 1 ? 'UP ▲' : 'DOWN ▼' }),
            createColumn({ key: 'confidence', header: 'Confidence', accessor: 'confidence', cell: (v) => `${(v * 100).toFixed(1)}%` }),
            createColumn({ key: 'timestamp', header: 'Time', accessor: 'timestamp', cell: (v) => formatRelativeTime(v) }),
          ]}
          data={predictions}
        />
      )}
    </Card>
  );
});

function TabPanel({ active, children }) {
  if (!active) return null;
  return <div className="animate-fadeIn">{children}</div>;
}

function CoinAnalysisSkeleton({ symbol }) {
  return (
    <div className="min-h-screen bg-primary">
      <div className="bg-secondary border-b border-primary">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
      <main className="flex-1">
        <div className="container py-8">
          <Skeleton className="h-40 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Tabs
            tabs={[
              { key: 'chart', label: 'Chart' },
              { key: 'indicators', label: 'Indicators' },
              { key: 'regime', label: 'Regime' },
              { key: 'predictions', label: 'Predictions' },
            ]}
            activeTab="chart"
            onChange={() => {}}
          />
          <Skeleton className="h-96 mt-6" />
        </div>
      </main>
    </div>
  );
}

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export default CoinAnalysis;
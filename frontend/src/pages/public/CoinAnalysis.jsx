import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Star, Share2, 
  Download, Maximize2, Minimize2, Loader2, AlertTriangle, Info,
  BarChart3, Target, Zap, RotateCw
} from 'lucide-react';
import { Button, Card, MetricCard, Badge, Avatar, Tabs, Table, createColumn, Skeleton } from '../../components/ui';
import { CandlestickChart, LineChart } from '../../components/charts';
import { marketApi, predictionApi } from '../../services/api';
import { formatPrice, formatChange, formatCompactNumber, formatPercentage, formatRelativeTime, parseSymbolPair } from '../../utils/formatters';
import { TIMEFRAMES, INDICATORS, REGIMES, REGIME_COLORS } from '../../utils/constants';

export function CoinAnalysis() {
  const { symbol } = useParams();
  const [coin, setCoin] = useState(null);
  const [candles, setCandles] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [regime, setRegime] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [chartHeight, setChartHeight] = useState(500);
  const [activeTab, setActiveTab] = useState('chart');
  const [inWatchlist, setInWatchlist] = useState(false);

  // Normalize symbol: default to BTC, remove USDT suffix if present
  const normalizedSymbol = useMemo(() => {
    if (!symbol) return 'BTC';
    return symbol.replace('USDT', '').toUpperCase();
  }, [symbol]);

  useEffect(() => {
    loadCoinData();
    checkWatchlist();
  }, [normalizedSymbol]);

  useEffect(() => {
    loadCandles();
  }, [normalizedSymbol, timeframe]);

  // Load predictions when tab is activated or on initial load
  const loadPredictions = useCallback(async () => {
    if (predictions.length > 0) return; // Already loaded
    
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
  }, [predictions.length]);

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
      const data = await marketApi.getCandles(normalizedSymbol, { 
        interval: timeframe, 
        limit: 500 
      });
      setCandles(data);
    } catch (err) {
      console.error('Failed to load candles:', err);
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
        title: `${coin?.name} (${normalizedSymbol}) Analysis`,
        text: `Check out ${coin?.name} analysis on CryptoAnalyzer`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

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
              suffix={`${priceChange24h.toFixed(2)}%`}
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
              value={formatCompactNumber(coin.marketCap, { currency: true })}
            />
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Main Content Tabs */}
        <div className="container py-8">
          <Tabs
            tabs={[
              { key: 'chart', label: 'Chart', icon: <TrendingUp size={16} /> },
              { key: 'indicators', label: 'Indicators', icon: <BarChart3 size={16} /> },
              { key: 'regime', label: 'Market Regime', icon: <Target size={16} /> },
              { key: 'predictions', label: 'AI Predictions', icon: <Zap size={16} /> },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="line"
            fullWidth
          >
            <TabPanel active={activeTab === 'chart'}>
              <ChartSection 
                symbol={normalizedSymbol} 
                candles={candles} 
                timeframe={timeframe} 
                setTimeframe={setTimeframe}
                height={chartHeight}
                coin={coin}
              />
            </TabPanel>
            <TabPanel active={activeTab === 'indicators'}>
              <IndicatorsSection indicators={indicators} />
            </TabPanel>
            <TabPanel active={activeTab === 'regime'}>
              <RegimeSection regime={regime} />
            </TabPanel>
            <TabPanel active={activeTab === 'predictions'}>
              <PredictionsSection symbol={normalizedSymbol} predictions={predictions} />
            </TabPanel>
          </Tabs>
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

function ChartSection({ symbol, candles, timeframe, setTimeframe, height, coin }) {
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
      />
      <div className="mt-4 text-xs text-muted flex items-center justify-between">
        <span>Data source: {coin?.dataSource || 'FCS API'}</span>
        <span>Last updated: {formatRelativeTime(candles[candles.length - 1]?.timestamp)}</span>
      </div>
    </Card>
  );
}

function IndicatorsSection({ indicators }) {
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
}

function RegimeSection({ regime }) {
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
}

function PredictionsSection({ symbol, predictions }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI Predictions</h3>
        <Button variant="secondary" size="sm">
          <Zap size={16} className="mr-2" />
          Run Prediction
        </Button>
      </div>
      {predictions.length === 0 ? (
        <div className="text-center py-12">
          <Zap size={48} className="text-muted mx-auto mb-4 opacity-50" />
          <p className="text-muted mb-4">No predictions available yet</p>
          <Button variant="primary" onClick={() => {}}>
            Generate Prediction
          </Button>
        </div>
      ) : (
        <Table
          columns={[
            createColumn({ key: 'model', header: 'Model', accessor: 'model' }),
            createColumn({ key: 'experiment', header: 'Experiment', accessor: 'experiment' }),
            createColumn({ key: 'horizon', header: 'Horizon', accessor: 'horizon', cell: (v) => `${v} candles` }),
            createColumn({ key: 'direction', header: 'Direction', accessor: 'direction', cell: (v) => v === 1 ? 'UP' : 'DOWN' }),
            createColumn({ key: 'confidence', header: 'Confidence', accessor: 'confidence', cell: (v) => `${(v * 100).toFixed(1)}%` }),
            createColumn({ key: 'timestamp', header: 'Time', accessor: 'timestamp', cell: (v) => formatRelativeTime(v) }),
          ]}
          data={predictions}
        />
      )}
    </Card>
  );
}

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
   
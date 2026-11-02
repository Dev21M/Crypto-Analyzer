import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Zap, BarChart3, Target, Shield, 
  BookOpen, ChevronRight, Loader2, RefreshCw,
  AlertTriangle, CheckCircle, HelpCircle, Globe, Database,
  TrendingUp, TrendingDown,
  ArrowUpRight, Star, MessageSquare
} from 'lucide-react';
import { Button, Card, MetricCard, Badge, Skeleton, Table, createColumn } from '../../components/ui';
import { marketApi, predictionApi } from '../../services/api';
import { formatPrice, formatCompactNumber, formatMarketCap, formatRelativeTime } from '../../utils/formatters';
import { clsx } from 'clsx';

export function Homepage() {
  const navigate = useNavigate();
  const [marketOverview, setMarketOverview] = useState(null);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [aiSignals, setAiSignals] = useState({ bullish: [], bearish: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [aiSignalsLoading, setAiSignalsLoading] = useState(true);
  const [activeAITab, setActiveAITab] = useState('bullish'); // 'bullish' | 'bearish' | 'all'
  
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadMarketData = useCallback(async () => {
    try {
      setLoading(true);
      const [overview, gainersData, losersData] = await Promise.all([
        marketApi.getOverview(),
        marketApi.getGainers(10),
        marketApi.getLosers(10),
      ]);
      setMarketOverview(overview);
      setGainers(gainersData || []);
      setLosers(losersData || []);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAISignals = useCallback(async () => {
    try {
      setAiSignalsLoading(true);
      // Fetch recent predictions from multiple models/experiments for AI radar
      const experiments = ['EXP_D_FULL', 'EXP_C_TECH_IND', 'EXP_B_PRICE_VOL', 'EXP_A_PRICE'];
      const models = ['xgboost', '1d_cnn', 'lstm', 'gru'];
      const tasks = ['classification'];
      const horizons = [12, 24];
      
      const promises = [];
      for (const experiment of experiments) {
        for (const model of models) {
          for (const task of tasks) {
            for (const horizon of horizons) {
              promises.push(
                predictionApi.getHistorical({ experiment, model, task, horizon, limit: 5 })
                  .catch(() => null) // Gracefully handle missing data
              );
            }
          }
        }
      }
      
      const results = await Promise.all(promises);
      const allPredictions = results
        .filter(r => r && r.predictions && r.predictions.length > 0)
        .flatMap(r => r.predictions.map(p => ({
          ...p,
          experiment: r.experiment || p.experiment,
          model: r.model || p.model,
          task: r.task || p.task,
          horizon: r.horizon || p.horizon,
        })));
      
      // Sort by timestamp descending and take most recent
      allPredictions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recentPredictions = allPredictions.slice(0, 20);
      
      // Group by direction
      const bullish = recentPredictions.filter(p => p.direction === 1);
      const bearish = recentPredictions.filter(p => p.direction === -1 || p.direction === 0);
      
      setAiSignals({ bullish, bearish, all: recentPredictions });
    } catch (err) {
      console.error('Failed to load AI signals:', err);
      setAiSignals({ bullish: [], bearish: [], all: [] });
    } finally {
      setAiSignalsLoading(false);
    }
  }, []);

  

  useEffect(() => {
    loadMarketData();
    loadAISignals();
  }, [loadMarketData, loadAISignals]);

  const handleAnalyzeCoin = () => {
    navigate('/analysis');
  };

  const handleExploreMarkets = () => {
    navigate('/markets');
  };

  const handleViewCoin = (symbol) => {
    navigate(`/coin/${symbol}`);
  };

  const getAISignalsForTab = useCallback(() => {
    switch (activeAITab) {
      case 'bullish':
        return aiSignals.bullish || [];
      case 'bearish':
        return aiSignals.bearish || [];
      default:
        return aiSignals.all || [];
    }
  }, [activeAITab, aiSignals]);

  const isLive = marketOverview?.isLive === true;
  const dataSource = marketOverview?.source || 'Static data';

  // Trust indicators - aligned with Trust & Authority pattern
  const trustIndicators = [
    { icon: Globe, label: 'Multi-Source Data', desc: 'FCS API, Binance, CoinGecko' },
    { icon: Database, label: 'Real-time Updates', desc: 'WebSocket + REST fallback' },
    { icon: Shield, label: 'Research-Grade', desc: 'Validated ML models, no leakage' },
    { icon: CheckCircle, label: 'Open Source', desc: 'Transparent methodology' },
  ];

  // Research highlights - key findings from Phase 12
  const researchHighlights = [
    { 
      icon: CheckCircle, 
      title: 'Metric Divergence Confirmed', 
      description: 'Classification accuracy (DA) and regression error (MAE) can disagree on model rankings',
      status: 'validated'
    },
    { 
      icon: TrendingUp, 
      title: 'Naive ≈ XGBoost on DA', 
      description: 'Simple naive baseline matches complex ML models on directional accuracy (56.4%)',
      status: 'validated'
    },
    { 
      icon: Target, 
      title: '1D-CNN Best MAE', 
      description: '1D-CNN achieves lowest regression error (0.523%) among deep learning models',
      status: 'validated'
    },
    { 
      icon: AlertTriangle, 
      title: 'No Feature Benefit', 
      description: 'Additional features beyond price-only provide no consistent improvement',
      status: 'finding'
    },
  ];

  // Feature cards
  const features = [
    { 
      icon: Zap, 
      title: 'AI-Powered Predictions', 
      description: 'Machine learning models trained on historical data to predict price direction and returns across multiple timeframes and feature sets.',
      features: ['Classification & Regression', '4 Experiment Configurations', '7 Model Types', 'Regime-Aware Evaluation']
    },
    { 
      icon: BarChart3, 
      title: 'Technical Analysis', 
      description: 'Comprehensive suite of technical indicators including RSI, MACD, Bollinger Bands, moving averages, and volume profiles.',
      features: ['24+ Indicators', 'Multi-Timeframe Charts', 'Support/Resistance', 'Pattern Recognition']
    },
    { 
      icon: Target, 
      title: 'Market Regime Detection', 
      description: 'Automated identification of market regimes (bullish, bearish, sideways, high volatility) with confidence scores and history.',
      features: ['4 Regime Types', 'Confidence Scoring', 'Regime Transitions', 'Performance by Regime']
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <main className="flex-1">
          <HeroSkeleton />
          <MarketOverviewSkeleton />
          <GainersLosersSkeleton />
          <AISignalsSkeleton />
          <CommunityAnalysesSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <main className="flex-1">
        {/* Hero Section - Trust & Authority Pattern */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="container">
            <div className="hero-badge">
              <Shield size={14} aria-hidden="true" />
              <span>Professional Cryptocurrency Analysis Platform</span>
            </div>
            <h1 id="hero-title" className="hero-title">
              Understand the Crypto Market with Data-Driven Analysis
            </h1>
            <p className="hero-subtitle">
              Explore cryptocurrency markets, technical indicators, market trends, and AI-assisted insights.
              Real-time data • AI predictions • Technical analysis
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={handleAnalyzeCoin}>
                <Search size={18} className="mr-2" aria-hidden="true" />
                Analyze Coin
              </Button>
              <Button size="lg" variant="secondary" onClick={handleExploreMarkets}>
                <BarChart3 size={18} className="mr-2" aria-hidden="true" />
                Explore Markets
              </Button>
            </div>
            {/* Trust Indicators - Social Proof */}
            <div className="trust-indicators" role="list" aria-label="Trust indicators">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="trust-item" role="listitem">
                  <div className="trust-icon" aria-hidden="true">
                    <indicator.icon size={16} />
                  </div>
                  <div>
                    <span className="trust-label">{indicator.label}</span>
                    <span className="trust-desc">{indicator.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Market Overview - Real-Time Operations Pattern */}
        <section id="markets-section" className="section bg-secondary" aria-labelledby="market-overview-title">
          <div className="container">
            <div className="section-header flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 id="market-overview-title" className="section-title">Market Overview</h2>
                <p className="section-subtitle">Real-time market statistics</p>
              </div>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className={clsx(
                  'flex items-center gap-2 px-3 py-1 rounded-full',
                  isLive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                )}>
                  <span className={clsx(
                    'w-2 h-2 rounded-full animate-pulse',
                    isLive ? 'bg-success' : 'bg-warning'
                  )} aria-hidden="true" />
                  {isLive ? 'Live Data' : 'Static Data'}
                </span>
                <span className="text-muted">Source: {dataSource}</span>
                <span className="text-muted">
                  Updated {lastUpdated ? formatRelativeTime(lastUpdated) : 'just now'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadMarketData}
                  disabled={loading}
                  aria-label="Refresh market data"
                >
                  <RefreshCw size={14} className={clsx(loading ? 'spin' : '')} aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="metrics-grid" role="list" aria-label="Market metrics">
              {marketOverview?.btc && (
                <MetricCard
                  label="Bitcoin (BTC)"
                  value={formatPrice(marketOverview.btc.price)}
                  change={marketOverview.btc.change24h}
                  trend={marketOverview.btc.change24h >= 0 ? 'up' : 'down'}
                  icon={<TrendingUp size={24} aria-hidden="true" />}
                  role="listitem"
                />
              )}
              {marketOverview?.eth && (
                <MetricCard
                  label="Ethereum (ETH)"
                  value={formatPrice(marketOverview.eth.price)}
                  change={marketOverview.eth.change24h}
                  trend={marketOverview.eth.change24h >= 0 ? 'up' : 'down'}
                  icon={<TrendingUp size={24} aria-hidden="true" />}
                  role="listitem"
                />
              )}
              <MetricCard
                label="Total Market Cap"
                value={formatMarketCap(marketOverview?.totalMarketCap || 0)}
                change={marketOverview?.marketCapChange24h}
                trend={marketOverview?.marketCapChange24h >= 0 ? 'up' : 'down'}
                icon={<BarChart3 size={24} aria-hidden="true" />}
                role="listitem"
              />
              <MetricCard
                label="24h Volume"
                value={formatCompactNumber(marketOverview?.totalVolume || 0, { currency: true })}
                icon={<Zap size={24} aria-hidden="true" />}
                role="listitem"
              />
              <MetricCard
                label="BTC Dominance"
                value={marketOverview?.btcDominance ? `${marketOverview.btcDominance.toFixed(1)}%` : '—'}
                icon={<Target size={24} aria-hidden="true" />}
                role="listitem"
              />
              <MetricCard
                label="Fear & Greed Index"
                value={marketOverview?.fearGreedIndex || '—'}
                change={marketOverview?.fearGreedLabel ? `${marketOverview.fearGreedLabel}` : undefined}
                trend="neutral"
                icon={<Shield size={24} aria-hidden="true" />}
                role="listitem"
              />
            </div>
          </div>
        </section>

        {/* Top Gainers & Losers */}
        <section className="section" aria-labelledby="top-movers-title">
          <div className="container">
            <div className="section-header">
              <h2 id="top-movers-title" className="section-title">Top Movers</h2>
              <p className="section-subtitle">Biggest gainers and losers in the last 24h</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Gainers */}
              <Card>
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <TrendingUp className="text-success" size={20} aria-hidden="true" />
                        Top Gainers
                      </h3>
                    </div>
                    <Link to="/markets?filter=gainers" className="text-sm text-primary hover:underline">
                      View all
                      <ChevronRight size={14} className="inline-block ml-1" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <div className="card-content p-0">
                  <Table
                    columns={[
                      createColumn({ 
                        key: 'coin', 
                        header: 'Coin', 
                        accessor: 'symbol',
                        cell: (row) => (
                          <Link to={`/coin/${row.symbol}`} className="coin-cell" onClick={(e) => { e.preventDefault(); handleViewCoin(row.symbol); }}>
                            <div className="coin-avatar" style={{ background: `hsl(${row.symbol.charCodeAt(0) * 10} 70% 50%)` }} aria-hidden="true">
                              {row.symbol.charAt(0)}
                            </div>
                            <div className="coin-info">
                              <span className="coin-symbol">{row.name}</span>
                              <span className="coin-name">{row.symbol}</span>
                            </div>
                          </Link>
                        )
                      }),
                      createColumn({ 
                        key: 'price', 
                        header: 'Price', 
                        accessor: 'price',
                        align: 'right',
                        cell: (row) => <span className="font-mono">{formatPrice(row.price)}</span>
                      }),
                      createColumn({ 
                        key: 'change', 
                        header: '24h Change', 
                        accessor: 'change24h',
                        align: 'right',
                        cell: (row) => (
                          <span className="change-cell positive">+{row.change24h?.toFixed(2)}%</span>
                        )
                      }),
                      createColumn({ 
                        key: 'volume', 
                        header: 'Volume', 
                        accessor: 'volume',
                        align: 'right',
                        cell: (row) => (
                          <span className="volume-cell text-muted font-mono">{formatCompactNumber(row.volume, { currency: true })}</span>
                        )
                      }),
                    ]}
                    data={gainers.slice(0, 10)}
                    emptyMessage="No gainer data available"
                    hoverable
                    striped
                  />
                </div>
              </Card>

              {/* Losers */}
              <Card>
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <TrendingDown className="text-danger" size={20} aria-hidden="true" />
                        Top Losers
                      </h3>
                    </div>
                    <Link to="/markets?filter=losers" className="text-sm text-primary hover:underline">
                      View all
                      <ChevronRight size={14} className="inline-block ml-1" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <div className="card-content p-0">
                  <Table
                    columns={[
                      createColumn({ 
                        key: 'coin', 
                        header: 'Coin', 
                        accessor: 'symbol',
                        cell: (row) => (
                          <Link to={`/coin/${row.symbol}`} className="coin-cell" onClick={(e) => { e.preventDefault(); handleViewCoin(row.symbol); }}>
                            <div className="coin-avatar" style={{ background: `hsl(${row.symbol.charCodeAt(0) * 10} 70% 50%)` }} aria-hidden="true">
                              {row.symbol.charAt(0)}
                            </div>
                            <div className="coin-info">
                              <span className="coin-symbol">{row.name}</span>
                              <span className="coin-name">{row.symbol}</span>
                            </div>
                          </Link>
                        )
                      }),
                      createColumn({ 
                        key: 'price', 
                        header: 'Price', 
                        accessor: 'price',
                        align: 'right',
                        cell: (row) => <span className="font-mono">{formatPrice(row.price)}</span>
                      }),
                      createColumn({ 
                        key: 'change', 
                        header: '24h Change', 
                        accessor: 'change24h',
                        align: 'right',
                        cell: (row) => (
                          <span className="change-cell negative">{row.change24h?.toFixed(2)}%</span>
                        )
                      }),
                      createColumn({ 
                        key: 'volume', 
                        header: 'Volume', 
                        accessor: 'volume',
                        align: 'right',
                        cell: (row) => (
                          <span className="volume-cell text-muted font-mono">{formatCompactNumber(row.volume, { currency: true })}</span>
                        )
                      }),
                    ]}
                    data={losers.slice(0, 10)}
                    emptyMessage="No loser data available"
                    hoverable
                    striped
                  />
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* AI Opportunity Radar - Real-Time Data Pattern */}
        <section id="ai-radar-section" className="section bg-secondary" aria-labelledby="ai-radar-title">
          <div className="container">
            <div className="section-header flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 id="ai-radar-title" className="section-title flex items-center gap-3">
                  <Zap size={24} className="text-accent" aria-hidden="true" />
                  AI Opportunity Radar
                </h2>
                <p className="section-subtitle">ML model predictions for potential trading setups</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadAISignals}
                  disabled={aiSignalsLoading}
                  aria-label="Refresh AI signals"
                >
                  <RefreshCw size={14} className={clsx(aiSignalsLoading ? 'spin' : '')} aria-hidden="true" />
                </Button>
                <span className="text-xs text-muted hidden sm:inline">Updated {formatRelativeTime(new Date().toISOString())}</span>
              </div>
            </div>

            {/* AI Signal Tabs - Accessible Tabs Pattern */}
            <div className="tabs" role="tablist" aria-label="AI signal direction">
              <button
                role="tab"
                aria-selected={activeAITab === 'bullish'}
                aria-controls="bullish-panel"
                id="bullish-tab"
                className={clsx('tab', activeAITab === 'bullish' && 'active')}
                onClick={() => setActiveAITab('bullish')}
              >
                <TrendingUp size={16} className="text-success" aria-hidden="true" />
                <span>Bullish Setups</span>
                <span className="tab-count">{(aiSignals.bullish?.length || 0)}</span>
              </button>
              <button
                role="tab"
                aria-selected={activeAITab === 'bearish'}
                aria-controls="bearish-panel"
                id="bearish-tab"
                className={clsx('tab', activeAITab === 'bearish' && 'active')}
                onClick={() => setActiveAITab('bearish')}
              >
                <TrendingDown size={16} className="text-danger" aria-hidden="true" />
                <span>Bearish Setups</span>
                <span className="tab-count">{(aiSignals.bearish?.length || 0)}</span>
              </button>
              <button
                role="tab"
                aria-selected={activeAITab === 'all'}
                aria-controls="all-panel"
                id="all-tab"
                className={clsx('tab', activeAITab === 'all' && 'active')}
                onClick={() => setActiveAITab('all')}
              >
                <BarChart3 size={16} className="text-accent" aria-hidden="true" />
                <span>All Signals</span>
                <span className="tab-count">{(aiSignals.all?.length || 0)}</span>
              </button>
            </div>

            {/* AI Signals Table */}
            <Card>
              <div className="card-content p-0">
                {aiSignalsLoading ? (
                  <div className="ai-signals-loading">
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="spin text-accent" aria-hidden="true" />
                      <span className="ml-3 text-muted">Loading AI signals...</span>
                    </div>
                  </div>
                ) : getAISignalsForTab().length === 0 ? (
                  <div className="empty-state" role="status" aria-live="polite">
                    <AlertTriangle className="empty-state-icon" size={48} aria-hidden="true" />
                    <h4 className="empty-state-title">No AI Signals Available</h4>
                    <p className="empty-state-message">
                      {activeAITab === 'bullish' ? 'No bullish setups detected at this time.' : 
                       activeAITab === 'bearish' ? 'No bearish setups detected at this time.' :
                       'No AI predictions available yet. Models may still be training.'}
                    </p>
                    <p className="text-xs text-muted mt-4">
                      AI signals are generated from ML models trained on historical data.
                      <Link to="/predictions" className="text-primary underline ml-1">View all predictions →</Link>
                    </p>
                  </div>
                ) : (
                  <Table
                    columns={[
                      createColumn({ 
                        key: 'coin', 
                        header: 'Coin', 
                        accessor: 'symbol',
                        cell: (row) => (
                          <Link to={`/coin/${row.symbol}`} className="coin-cell" onClick={(e) => { e.preventDefault(); handleViewCoin(row.symbol); }}>
                            <div className="coin-avatar" style={{ background: `hsl(${row.symbol.charCodeAt(0) * 10} 70% 50%)` }} aria-hidden="true">
                              {row.symbol.charAt(0)}
                            </div>
                            <div className="coin-info">
                              <span className="coin-symbol">{row.symbol}</span>
                              <span className="coin-name">{row.name || row.symbol}</span>
                            </div>
                          </Link>
                        )
                      }),
                      createColumn({ 
                        key: 'direction', 
                        header: 'Direction', 
                        accessor: 'direction',
                        align: 'center',
                        cell: (row) => (
                          <Badge variant={row.direction === 1 ? 'success' : 'danger'} size="sm">
                            {row.direction === 1 ? (
                              <> <TrendingUp size={12} className="inline mr-1" aria-hidden="true" /> Bullish </>
                            ) : (
                              <> <TrendingDown size={12} className="inline mr-1" aria-hidden="true" /> Bearish </>
                            )}
                          </Badge>
                        )
                      }),
                      createColumn({ 
                        key: 'confidence', 
                        header: 'Confidence', 
                        accessor: 'confidence',
                        align: 'center',
                        cell: (row) => (
                          <div className="confidence-cell">
                            <div className="confidence-bar" role="progressbar" aria-valuenow={Math.round(row.confidence * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Confidence ${Math.round(row.confidence * 100)}%`}>
                              <div className="confidence-fill" style={{ width: `${row.confidence * 100}%` }} />
                            </div>
                            <span className="confidence-text font-mono">{(row.confidence * 100).toFixed(1)}%</span>
                          </div>
                        )
                      }),
                      createColumn({ 
                        key: 'model', 
                        header: 'Model', 
                        accessor: 'model',
                        cell: (row) => (
                          <span className="model-badge">{row.model?.toUpperCase() || '—'}</span>
                        )
                      }),
                      createColumn({ 
                        key: 'experiment', 
                        header: 'Experiment', 
                        accessor: 'experiment',
                        cell: (row) => (
                          <span className="exp-badge text-xs text-muted">{row.experiment?.replace('EXP_', '') || '—'}</span>
                        )
                      }),
                      createColumn({ 
                        key: 'horizon', 
                        header: 'Horizon', 
                        accessor: 'horizon',
                        align: 'center',
                        cell: (row) => (
                          <span className="font-mono text-sm">{row.horizon} candles</span>
                        )
                      }),
                      createColumn({ 
                        key: 'timestamp', 
                        header: 'Time', 
                        accessor: 'timestamp',
                        align: 'right',
                        cell: (row) => (
                          <span className="text-muted text-sm">{formatRelativeTime(row.timestamp)}</span>
                        )
                      }),
                      createColumn({ 
                        key: 'action', 
                        header: '', 
                        accessor: 'symbol',
                        align: 'center',
                        cell: (row) => (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewCoin(row.symbol)}
                            aria-label={`Analyze ${row.symbol}`}
                          >
                            <ArrowUpRight size={14} aria-hidden="true" />
                          </Button>
                        )
                      }),
                    ]}
                    data={getAISignalsForTab().slice(0, 15)}
                    hoverable
                    striped
                  />
                )}
              </div>
            </Card>

            {/* AI Disclaimer - Required for financial content */}
            <div className="ai-disclaimer mt-4 p-4 bg-warning-bg/50 border border-warning/30 rounded-lg flex items-start gap-3" role="alert">
              <AlertTriangle size={20} className="text-warning mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="text-sm text-muted">
                <strong className="text-warning">Important:</strong> AI predictions are based on historical patterns and do not guarantee future results. 
                These signals are for research and educational purposes only. Always conduct your own analysis and consult a qualified financial advisor before making investment decisions.
              </div>
            </div>
          </div>
        </section>

        {/* Latest Community Analyses - Coming Soon */}
        <section id="community-section" className="section" aria-labelledby="community-title">
          <div className="container">
            <div className="section-header flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 id="community-title" className="section-title flex items-center gap-3">
                  <MessageSquare size={24} className="text-accent" aria-hidden="true" />
                  Latest Community Analyses
                </h2>
                <p className="section-subtitle">Insights and analyses shared by the community</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/learn')}>
                <BookOpen size={16} className="mr-2" aria-hidden="true" />
                Browse Learn Section
              </Button>
            </div>

            <Card>
              <div className="card-content">
                <div className="empty-state">
                  <MessageSquare className="empty-state-icon" size={48} aria-hidden="true" />
                  <h4 className="empty-state-title">Community Analyses Coming Soon</h4>
                  <p className="empty-state-message max-w-md mx-auto">
                    This feature will allow users to share and discover technical analyses, 
                    trading ideas, and market commentary from the community.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="secondary" onClick={() => navigate('/learn')}>
                      <BookOpen size={16} className="mr-2" aria-hidden="true" />
                      Explore Learn Section
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/login')}>
                      <Star size={16} className="mr-2" aria-hidden="true" />
                      Sign Up to Contribute
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Features - Solution Overview Section */}
        <section className="section bg-secondary" aria-labelledby="features-title">
          <div className="container">
            <div className="text-center mb-12">
              <h2 id="features-title" className="section-title">Why CryptoAnalyzer?</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Professional-grade tools for cryptocurrency analysis, combining real-time data, 
                technical indicators, and machine learning predictions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Research Highlights - Proof Section */}
        <section className="section" aria-labelledby="research-title">
          <div className="container">
            <div className="text-center mb-12">
              <h2 id="research-title" className="section-title">Research Highlights</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Key findings from our comprehensive research on cryptocurrency price prediction
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {researchHighlights.map((highlight, index) => (
                <ResearchHighlight key={index} {...highlight} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA - Clear CTA Path */}
        <section className="section text-center" aria-labelledby="cta-title">
          <div className="container">
            <Card className="bg-primary/50 border-primary/30 max-w-3xl mx-auto">
              <h3 id="cta-title" className="text-2xl font-bold mb-4">Ready to Analyze?</h3>
              <p className="text-muted mb-6">Start exploring cryptocurrency markets with professional tools. No account required for basic features.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={handleAnalyzeCoin}>
                  <Search size={18} className="mr-2" aria-hidden="true" />
                  Analyze a Coin
                </Button>
                <Button size="lg" variant="secondary" onClick={handleExploreMarkets}>
                  <BarChart3 size={18} className="mr-2" aria-hidden="true" />
                  Browse Markets
                </Button>
              </div>
              <p className="text-xs text-muted mt-6">
                <HelpCircle size={14} className="inline-block align-middle mr-1" aria-hidden="true" />
                Not financial advice • Research purposes only • 
                <Link href="/docs" className="underline hover:text-primary">Methodology</Link> • 
                <Link href="https://github.com" className="underline hover:text-primary">GitHub</Link>
              </p>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

// Feature Card Component - Swiss Style
function FeatureCard({ icon: Icon, title, description, features }) {
  return (
    <Card className="feature-card h-full">
      <div className="feature-icon bg-primary/10 text-primary">
        <Icon size={28} aria-hidden="true" />
      </div>
      <h4 className="feature-title">{title}</h4>
      <p className="feature-description">{description}</p>
      <ul className="feature-list mt-4">
        {features.map((feature, index) => (
          <li key={index} className="feature-item flex items-center gap-2 text-sm text-muted">
            <CheckCircle size={14} className="text-success flex-shrink-0" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// Research Highlight Component
function ResearchHighlight({ icon: Icon, title, description, status }) {
  const statusConfig = {
    validated: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Validated' },
    finding: { icon: HelpCircle, color: 'text-primary', bg: 'bg-primary/10', label: 'Key Finding' },
  };
  const config = statusConfig[status] || statusConfig.validated;
  const StatusIcon = config.icon;

  return (
    <Card className="research-card h-full">
      <div className="flex items-start gap-4">
        <div className={clsx('research-icon flex-shrink-0', config.bg)}>
          <Icon size={24} className={config.color} aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon size={12} className={config.color} aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: `var(--color-${status === 'validated' ? 'success' : 'primary'})` }}>
              {config.label}
            </span>
          </div>
          <h4 className="font-semibold mb-2">{title}</h4>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
    </Card>
  );
}

// Skeleton components for loading states
function HeroSkeleton() {
  return (
    <section className="hero">
      <div className="container max-w-2xl mx-auto">
        <Skeleton className="h-6 w-1/3 mx-auto mb-6" />
        <Skeleton className="h-10 w-full mb-6" />
        <Skeleton className="h-8 w-2/3 mx-auto mb-8" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-40" />
        </div>
        <div className="mt-10 max-w-2xl mx-auto">
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-40" />
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketOverviewSkeleton() {
  return (
    <section className="section bg-secondary">
      <div className="container">
        <Skeleton className="h-6 w-1/4 mb-8" />
        <div className="metrics-grid">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    </section>
  );
}

function GainersLosersSkeleton() {
  return (
    <section className="section">
      <div className="container">
        <Skeleton className="h-6 w-1/4 mb-8" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </section>
  );
}

function AISignalsSkeleton() {
  return (
    <section className="section bg-secondary">
      <div className="container">
        <Skeleton className="h-6 w-1/3 mb-6" />
        <div className="tabs">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 mt-4" />
      </div>
    </section>
  );
}

function CommunityAnalysesSkeleton() {
  return (
    <section className="section">
      <div className="container">
        <Skeleton className="h-6 w-1/3 mb-8" />
        <Skeleton className="h-64" />
      </div>
    </section>
  );
}

export default Homepage;
with open(r'D:\CryptoAnalyzer\frontend\src\pages\public\CoinAnalysis.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the position to insert the main CoinAnalysis component
# It should be after the imports and before ChartSection
chart_pos = content.find('const ChartSection = React.memo(function ChartSection')

if chart_pos == -1:
    print("Could not find ChartSection")
    exit(1)

# The main CoinAnalysis component
main_component = '''
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
        title: coin.name + ' (' + normalizedSymbol + ') Analysis',
        text: 'Check out ' + coin.name + ' analysis on CryptoAnalyzer',
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
                  <PredictionsSection symbol={normalizedSymbol} predictions={predictions} predictionsLoading={predictionsLoading} onRunPrediction={loadPredictions} />
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
'''

# Find the position to insert the main component (before ChartSection)
chart_pos = content.find('const ChartSection = React.memo(function ChartSection')

if chart_pos == -1:
    print("Could not find ChartSection")
    exit(1)

# Insert the main component before ChartSection
new_content = content[:chart_pos] + main_component + '\n\n' + content[chart_pos:]

with open(r'D:\CryptoAnalyzer\frontend\src\pages\public\CoinAnalysis.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Successfully restored main CoinAnalysis component!')
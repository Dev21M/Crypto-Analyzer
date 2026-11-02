import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  Activity as ActivityIcon, 
  Target as TargetIcon, 
  AlertTriangle as AlertTriangleIcon, 
  RefreshCw as RefreshCwIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Zap as ZapIcon,
  BarChart3 as BarChart3Icon,
  Cpu as CpuIcon,
  MessageSquare as MessageSquareIcon,
  Clock as ClockIcon,
  Check as CheckIcon,
  Shield,
  LineChart,
  Search,
} from 'lucide-react';
import Plot from 'react-plotly.js';
import { Card, MetricCard, ChartContainer } from '../components/Card';
import { Button, Skeleton } from '../components/ui';
import { marketApi } from '../services/api';
import { formatPrice, formatCompactNumber, formatMarketCap } from '../utils/formatters';

export function Dashboard({ data, wsStatus, lastMessage }) {
  const [marketData, setMarketData] = useState(null);
  const [candles, setCandles] = useState([]);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [wsMessages, setWsMessages] = useState([]);
  const [marketOverview, setMarketOverview] = useState(null);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [snapshotRes, candlesRes, overviewRes, gainersRes, losersRes] = await Promise.all([
          fetch('/api/v1/market/snapshot'),
          fetch('/api/v1/market/candles?limit=200'),
          fetch('/api/v1/market/overview'),
          fetch('/api/v1/market/gainers?limit=5'),
          fetch('/api/v1/market/losers?limit=5'),
        ]);
        
        const [snapshot, candlesData, overview, gainersData, losersData] = await Promise.all([
          snapshotRes.json(),
          candlesRes.json(),
          overviewRes.json(),
          gainersRes.json(),
          losersRes.json(),
        ]);
        
        setMarketData(snapshot);
        setCandles(candlesData);
        setMarketOverview(overview);
        setGainers(gainersData || []);
        setLosers(losersData || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;
    
    if (lastMessage.type === 'market_update' && lastMessage.payload?.candle) {
      const newCandle = lastMessage.payload.candle;
      // Update marketData with latest candle
      setMarketData(prev => prev ? { ...prev, candle: newCandle } : null);
      
      // Update candles array for chart
      setCandles(prev => {
        if (!prev.length) return prev;
        const lastIdx = prev.length - 1;
        const lastCandle = prev[lastIdx];
        // Compare timestamps as numbers to handle format differences
        const lastTs = new Date(lastCandle.timestamp).getTime();
        const newTs = new Date(newCandle.timestamp).getTime();
        // If same timestamp, update the last candle (in-progress update)
        if (lastTs === newTs) {
          const updated = [...prev];
          updated[lastIdx] = newCandle;
          return updated;
        }
        // If new timestamp, append new candle (but keep max 200)
        if (newTs > lastTs) {
          const updated = [...prev, newCandle];
          return updated.slice(-200);
        }
        return prev;
      });
    }
    if (lastMessage.type === 'prediction') {
      setPredictionHistory(prev => [lastMessage.payload, ...prev.slice(0, 19)]);
    }
    if (lastMessage.type === 'regime_change') {
      setMarketData(prev => prev ? { ...prev, regime: lastMessage.payload.regime, regime_confidence: lastMessage.payload.confidence } : null);
    }
    // Store all WS messages for the feed
    setWsMessages(prev => [{ ...lastMessage, receivedAt: new Date().toISOString() }, ...prev.slice(0, 49)]);
  }, [lastMessage]);

  // Compute metrics from data
  const currentPrice = marketData?.candle?.close || 0;
  // Get 24h change from candles (288 candles = 24h at 5-min intervals)
  const priceChange24h = candles.length >= 288 
    ? ((currentPrice - candles[candles.length - 288].open) / candles[candles.length - 288].open * 100)
    : (marketData?.candle ? ((currentPrice - marketData.candle.open) / marketData.candle.open * 100) : 0);
  const currentRegime = marketData?.regime || 'UNKNOWN';
  const regimeConfidence = marketData?.regime_confidence || 0;

  // Latest prediction from WebSocket
  const latestPrediction = predictionHistory[0];

  // Compute feed content
  const feedContent = wsMessages.length === 0 ? (
    <div className="text-center py-8 text-muted">
      <MessageSquareIcon size={24} className="mx-auto mb-2 opacity-50" />
      <div>No WebSocket messages yet. Connecting...</div>
    </div>
  ) : (
    <>
      {wsMessages.map((msg, i) => {
        const time = msg.receivedAt ? new Date(msg.receivedAt).toLocaleTimeString() : '';
        const typeColors = {
          market_update: 'var(--accent-primary)',
          prediction: 'var(--accent-success)',
          regime_change: 'var(--accent-warning)',
          ack: 'var(--text-muted)',
          heartbeat: 'var(--text-muted)',
          error: 'var(--accent-error)',
        };
        const typeIcons = {
          market_update: <ActivityIcon size={12} />,
          prediction: <ZapIcon size={12} />,
          regime_change: <AlertTriangleIcon size={12} />,
          ack: <CheckIcon size={12} />,
          heartbeat: <ClockIcon size={12} />,
          error: <AlertTriangleIcon size={12} />,
        };
        return (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-primary/50">
            <span style={{ color: typeColors[msg.type] || 'var(--text-secondary)', minWidth: '120px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {typeIcons[msg.type] || null}
              {msg.type.toUpperCase()}
            </span>
            <span style={{ flex: 1 }}>
              {msg.type === 'market_update' && msg.payload?.candle && `BTC: ${msg.payload.candle.close.toLocaleString()} USDT`}
              {msg.type === 'prediction' && msg.payload && `${msg.payload.direction_label} (${(msg.payload.confidence * 100).toFixed(1)}%)`}
              {msg.type === 'regime_change' && msg.payload && `${msg.payload.regime} (${(msg.payload.confidence * 100).toFixed(0)}%)`}
              {msg.type === 'ack' && `Subscribed to ${msg.payload?.channels?.join(', ')}`}
              {msg.type === 'heartbeat' && 'Heartbeat'}
              {msg.type === 'error' && msg.payload?.message}
            </span>
            <span className="text-muted text-xs">{time}</span>
          </div>
        );
      })}
    </>
  );

  const isLive = marketData?.isLive === true || marketOverview?.isLive === true;
  const dataSource = marketData?.source || marketOverview?.source || 'Static data';

  if (loading) {
    return (
      <div className="dashboard">
        <div className="metrics-grid">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-2 gap-6 mb-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <div className="grid grid-2 gap-6 mb-8">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div className="dashboard">
        <div className="text-center py-16">
          <AlertTriangleIcon size={48} className="text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Dashboard Data</h2>
          <p className="text-muted mb-6">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            <RefreshCwIcon size={16} className="mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Market Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 p-4 bg-secondary/50 border border-primary/50 rounded-lg">
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${isLive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-warning'}`} />
            {isLive ? 'Live Data' : 'Static Data'}
          </span>
          <span className="text-sm text-muted">Source: {dataSource}</span>
          <span className="text-sm text-muted">Updated {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard/market" className="text-sm text-primary hover:underline flex items-center gap-1">
            <Search size={14} /> View Full Market
          </Link>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="metrics-grid mb-8">
        <MetricCard
          label="BTC/USDT Price"
          value={marketData?.candle ? formatPrice(marketData.candle.close) : '—'}
          change={priceChange24h}
          changeLabel="24h"
          icon={<TrendingUpIcon size={24} />}
          trend={priceChange24h >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="Market Regime"
          value={currentRegime}
          change={regimeConfidence > 0 ? `${(regimeConfidence * 100).toFixed(0)}%` : 'N/A'}
          changeLabel="Confidence"
          icon={<ActivityIcon size={24} />}
          trend="neutral"
        />
        <MetricCard
          label="WS Status"
          value={wsStatus === 'connected' ? 'Connected' : wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          change={wsStatus === 'connected' ? 'Live Data' : 'Offline'}
          icon={wsStatus === 'connected' ? <WifiIcon size={24} /> : <WifiOffIcon size={24} />}
          trend={wsStatus === 'connected' ? 'up' : 'down'}
        />
        <MetricCard
          label="Next Prediction"
          value="In ~5 min"
          change="Auto-updates"
          icon={<TargetIcon size={24} />}
          trend="neutral"
        />
      </div>

      {/* Market Overview Stats */}
      {marketOverview && (
        <Card className="mb-8" title="Market Overview" subtitle="Global cryptocurrency market statistics">
          <div className="metrics-grid">
            {marketOverview.btc && (
              <MetricCard
                label="Bitcoin (BTC)"
                value={formatPrice(marketOverview.btc.price)}
                change={marketOverview.btc.change24h}
                trend={marketOverview.btc.change24h >= 0 ? 'up' : 'down'}
                icon={<TrendingUpIcon size={20} />}
              />
            )}
            {marketOverview.eth && (
              <MetricCard
                label="Ethereum (ETH)"
                value={formatPrice(marketOverview.eth.price)}
                change={marketOverview.eth.change24h}
                trend={marketOverview.eth.change24h >= 0 ? 'up' : 'down'}
                icon={<TrendingUpIcon size={20} />}
              />
            )}
            <MetricCard
              label="Total Market Cap"
              value={formatMarketCap(marketOverview.totalMarketCap || 0)}
              change={marketOverview.marketCapChange24h}
              trend={marketOverview.marketCapChange24h >= 0 ? 'up' : 'down'}
              icon={<LineChart size={20} />}
            />
            <MetricCard
              label="24h Volume"
              value={formatCompactNumber(marketOverview.totalVolume || 0, { currency: true })}
              icon={<ZapIcon size={20} />}
            />
            <MetricCard
              label="BTC Dominance"
              value={marketOverview.btcDominance ? `${marketOverview.btcDominance.toFixed(1)}%` : '—'}
              icon={<TargetIcon size={20} />}
            />
            <MetricCard
              label="Fear & Greed"
              value={marketOverview.fearGreedIndex || '—'}
              change={marketOverview.fearGreedLabel}
              icon={<Shield size={20} />}
            />
          </div>
        </Card>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-2 gap-6 mb-8">
        <Card title="BTC/USDT Price Chart (Real-time)" subtitle="5-minute candles">
          <ChartContainer>
            <PriceChart candles={candles} />
          </ChartContainer>
        </Card>
        
        <Card title="Prediction History" subtitle="Last 20 predictions vs actual">
          <ChartContainer>
            <PredictionChart history={predictionHistory} />
          </ChartContainer>
        </Card>
      </div>

      {/* Top Gainers & Losers */}
      <div className="grid grid-2 gap-6 mb-8">
        <Card title="Top Gainers (24h)" subtitle="Biggest gainers">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Coin</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">24h Change</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Volume</th>
                </tr>
              </thead>
              <tbody>
                {gainers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted">No gainer data available</td>
                  </tr>
                ) : (
                  gainers.slice(0, 5).map((coin) => (
                    <tr key={coin.symbol} className="border-b border-primary/50 hover:bg-hover transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/coin/${coin.symbol}`} className="flex items-center gap-3">
                          <div className="coin-avatar" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                            {coin.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-sm text-muted">{coin.symbol}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatPrice(coin.price)}</td>
                      <td className="px-4 py-3 text-right text-success font-medium">+{coin.change24h?.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right text-muted font-mono">{formatCompactNumber(coin.volume, { currency: true })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Top Losers (24h)" subtitle="Biggest losers">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Coin</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">24h Change</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Volume</th>
                </tr>
              </thead>
              <tbody>
                {losers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted">No loser data available</td>
                  </tr>
                ) : (
                  losers.slice(0, 5).map((coin) => (
                    <tr key={coin.symbol} className="border-b border-primary/50 hover:bg-hover transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/coin/${coin.symbol}`} className="flex items-center gap-3">
                          <div className="coin-avatar" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                            {coin.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{coin.name}</p>
                            <p className="text-sm text-muted">{coin.symbol}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatPrice(coin.price)}</td>
                      <td className="px-4 py-3 text-right text-danger font-medium">{coin.change24h?.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right text-muted font-mono">{formatCompactNumber(coin.volume, { currency: true })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Latest Prediction */}
      <div className="grid grid-2 gap-6 mb-8">
        <Card title="Quick Actions">
          <div className="space-y-3">
            <Link to="/dashboard/predictions" className="btn btn-primary btn-lg w-full justify-center">
              <ZapIcon size={18} className="mr-2" /> Get Latest Prediction
            </Link>
            <Link to="/dashboard/models" className="btn btn-secondary w-full justify-center">
              <BarChart3Icon size={18} className="mr-2" /> View Model Comparison
            </Link>
            <Link to="/dashboard/regimes" className="btn btn-secondary w-full justify-center">
              <ActivityIcon size={18} className="mr-2" /> View Regime Analysis
            </Link>
            <Link to="/dashboard/models" className="btn btn-secondary w-full justify-center">
              <CpuIcon size={18} className="mr-2" /> Model Performance
            </Link>
          </div>
        </Card>

        <Card title="Latest Prediction" subtitle={latestPrediction ? `${latestPrediction.model?.toUpperCase()} • ${latestPrediction.experiment} • ${latestPrediction.task}` : 'Waiting for WebSocket...'}>
          <div className="text-center py-8">
            {latestPrediction && latestPrediction.task === 'classification' ? (
              <>
                <div className={`
                  text-5xl font-bold font-mono mb-4 ${latestPrediction.direction === 1 ? 'text-success' : 'text-danger'}
                  uppercase
                `}>
                  {latestPrediction.direction === 1 ? 'UP' : 'DOWN'}
                </div>
                <div className="text-secondary mb-4">
                  Confidence: {(latestPrediction.confidence * 100).toFixed(1)}% • Probability UP: {(latestPrediction.probability_up * 100).toFixed(1)}%
                </div>
                <div className="text-muted text-sm">
                  Based on latest 5-hour window (60 candles) • {new Date(latestPrediction.timestamp).toLocaleTimeString()}
                </div>
              </>
            ) : latestPrediction && latestPrediction.task === 'regression' ? (
              <>
                <div className={`
                  text-5xl font-bold font-mono mb-4 ${latestPrediction.predicted_return_pct >= 0 ? 'text-success' : 'text-danger'}
                `}>
                  {latestPrediction.predicted_return_pct?.toFixed(2)}%
                </div>
                <div className="text-secondary mb-4">Predicted 1-hour return</div>
                <div className="text-muted text-sm">
                  Inference time: {latestPrediction.inference_time_ms?.toFixed(1)}ms • Features: {latestPrediction.features_used}
                </div>
              </>
            ) : (
              <div className="text-secondary">
                <MessageSquareIcon size={32} className="mx-auto mb-4 text-muted opacity-50" />
                <div>Waiting for WebSocket prediction...</div>
                <div className="text-muted text-sm mt-2">Connects to /api/v1/ws for real-time predictions</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Real-time WebSocket Feed */}
      <Card title="Real-time Feed" subtitle="WebSocket messages">
        <div className="max-h-[200px] overflow-y-auto font-mono text-sm text-secondary">
          {feedContent}
        </div>
      </Card>
    </div>
  );
}

// Real Price Chart Component using actual candles
function PriceChart({ candles }) {
  if (!candles?.length) return (
    <div className="chart-container flex items-center justify-center h-[300px] text-muted">
      Loading price data...
    </div>
  );

  // Use last 200 candles for chart
  const displayCandles = candles.slice(-200);

  return (
    <Plot
      data={[
        {
          x: displayCandles.map(c => new Date(c.timestamp)),
          open: displayCandles.map(c => c.open),
          high: displayCandles.map(c => c.high),
          low: displayCandles.map(c => c.low),
          close: displayCandles.map(c => c.close),
          type: 'candlestick',
          increasing: { line: { color: '#3fb950' } },
          decreasing: { line: { color: '#f85149' } },
          name: 'BTC/USDT',
        }
      ]}
      layout={{
        margin: { t: 10, r: 10, b: 40, l: 50 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: { 
          showgrid: true, 
          gridcolor: 'rgba(48, 54, 61, 0.5)',
          color: '#8b949e',
          rangeslider: { visible: false },
          title: '',
        },
        yaxis: { 
          showgrid: true, 
          gridcolor: 'rgba(48, 54, 61, 0.5)',
          color: '#8b949e',
          tickformat: '$,.0f',
        },
        hovermode: 'x unified',
        showlegend: false,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// Real Prediction Chart using actual WebSocket predictions
function PredictionChart({ history }) {
  if (!history?.length) {
    return (
      <div className="chart-container flex items-center justify-center h-[300px] text-muted flex-col gap-2">
        <div>No predictions yet</div>
        <div className="text-xs">WebSocket predictions will appear here</div>
      </div>
    );
  }

  // Take last 20 predictions
  const displayHistory = history.slice(0, 20).reverse(); // oldest first for chart
  
  return (
    <Plot
      data={[
        {
          x: displayHistory.map((p, i) => i),
          y: displayHistory.map(p => p.direction === 1 ? 1 : 0),
          type: 'bar',
          name: 'Predicted',
          marker: { color: displayHistory.map(p => p.direction === 1 ? 'rgba(63, 185, 80, 0.7)' : 'rgba(248, 81, 73, 0.7)') },
          offsetgroup: 0,
        },
        {
          x: displayHistory.map((_, i) => i),
          y: displayHistory.map(p => p.direction === 1 ? 1 : 0),
          type: 'scatter',
          mode: 'markers',
          name: 'Direction',
          marker: { 
            color: displayHistory.map(p => p.direction === 1 ? '#3fb950' : '#f85149'),
            size: 10,
            symbol: 'diamond',
          },
          offsetgroup: 1,
        }
      ]}
      layout={{
        margin: { t: 10, r: 10, b: 40, l: 50 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: { 
          showgrid: false, 
          color: '#8b949e',
          tickvals: [],
        },
        yaxis: { 
          showgrid: true, 
          gridcolor: 'rgba(48, 54, 61, 0.5)',
          color: '#8b949e',
          tickvals: [0, 1],
          ticktext: ['DOWN', 'UP'],
          range: [-0.5, 1.5],
        },
        hovermode: 'x unified',
        barmode: 'group',
        legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 },
        showlegend: true,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default Dashboard;




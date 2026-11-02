import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { Card, MetricCard, ChartContainer } from '../components/Card';
import { Button, Skeleton } from '../components/ui';
import { marketApi } from '../services/api';
import { Search, ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, Info, TrendingUp, TrendingDown, Zap, RefreshCw as RefreshCwIcon, AlertTriangle } from 'lucide-react';
import { formatPrice, formatCompactNumber } from '../utils/formatters';
import { TIMEFRAMES } from '../utils/constants';

export function Market({ data }) {
  const [candles, setCandles] = useState([]);
  const [regimeHistory, setRegimeHistory] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [timeRange, setTimeRange] = useState('5m');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [chartHeight, setChartHeight] = useState(500);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [candlesRes, regimesRes, indicatorsRes] = await Promise.all([
        fetch(`/api/v1/market/candles?symbol=${symbol}&interval=${timeRange}&limit=500`),
        fetch(`/api/v1/market/regimes?limit=100`),
        fetch(`/api/v1/market/indicators?symbol=${symbol}`),
      ]);
      
      const [candlesData, regimesData, indicatorsData] = await Promise.all([
        candlesRes.json(),
        regimesRes.json(),
        indicatorsRes.json(),
      ]);
      
      setCandles(candlesData);
      setRegimeHistory(regimesData.regime_distribution || []);
      setIndicators(indicatorsData);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol.toUpperCase());
  };

  if (loading) {
    return (
      <div className="market-page">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40 ml-2" />
          </div>
        </div>
        <div className="grid grid-2 gap-6 mb-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <div className="grid grid-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-page">
        <div className="text-center py-16">
          <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Market Data</h2>
          <p className="text-muted mb-6">{error}</p>
          <Button variant="primary" onClick={fetchData}>
            <RefreshCwIcon size={16} className="mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const priceChange24h = candles.length >= 288 
    ? ((currentPrice - candles[candles.length - 288].open) / candles[candles.length - 288].open * 100)
    : 0;

  return (
    <div className="market-page">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">{symbol.replace('USDT', '/USDT')}</h2>
          <p className="text-muted mt-1">Real-time market data and technical analysis</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search symbol (e.g., ETHUSDT)..."
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSymbolChange(e.target.value)}
              className="form-input pl-10 pr-4 py-2 w-64"
            />
          </div>
          <div className="flex items-center gap-1 bg-tertiary rounded-lg p-1" role="radiogroup" aria-label="Chart timeframe">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                role="radio"
                aria-checked={timeRange === tf.value}
                onClick={() => setTimeRange(tf.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === tf.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted hover:text-primary'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </Button>
        </div>
      </div>

      {/* Price Summary */}
      <div className="metrics-grid mb-8">
        <MetricCard
          label="Current Price"
          value={currentPrice ? formatPrice(currentPrice) : '—'}
          change={priceChange24h}
          changeLabel="24h"
          icon={<TrendingUp size={24} />}
          trend={priceChange24h >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="24h High"
          value={candles.length > 0 ? formatPrice(Math.max(...candles.map(c => c.high))) : '—'}
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          label="24h Low"
          value={candles.length > 0 ? formatPrice(Math.min(...candles.map(c => c.low))) : '—'}
          icon={<TrendingDown size={20} />}
        />
        <MetricCard
          label="24h Volume"
          value={candles.length > 0 ? formatCompactNumber(candles[candles.length - 1].volume, { currency: true }) : '—'}
          icon={<Zap size={20} />}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-2 gap-6 mb-8">
        <Card title={`${symbol.replace('USDT', '/USDT')} Candlestick Chart`} subtitle={`${timeRange} intervals`}>
          <ChartContainer height={expanded ? 800 : chartHeight}>
            <CandlestickChart candles={candles} />
          </ChartContainer>
          <div className="mt-4 text-xs text-muted flex items-center justify-between">
            <span>Data source: Static historical data</span>
            <span>Last updated: {candles.length > 0 ? new Date(candles[candles.length - 1].timestamp).toLocaleTimeString() : 'N/A'}</span>
          </div>
        </Card>

        <Card title="Volume Profile" subtitle="Trading volume over time">
          <ChartContainer>
            <VolumeChart candles={candles} />
          </ChartContainer>
        </Card>
      </div>

      {/* Regime & Indicators */}
      <div className="grid grid-2 gap-6 mb-8">
        <Card title="Regime Distribution" subtitle="Last 100 periods">
          <ChartContainer style={{ height: 250 }}>
            <RegimeDistributionChart data={regimeHistory} />
          </ChartContainer>
        </Card>

        <Card title="Technical Indicators" subtitle="Latest values">
          <IndicatorsTable data={indicators} />
        </Card>
      </div>
    </div>
  );
}

function CandlestickChart({ candles }) {
  if (!candles?.length) return (
    <div className="chart-container flex items-center justify-center h-[300px] text-muted">
      No data available
    </div>
  );

  return (
    <Plot
      data={[
        {
          x: candles.map(c => new Date(c.timestamp)),
          open: candles.map(c => c.open),
          high: candles.map(c => c.high),
          low: candles.map(c => c.low),
          close: candles.map(c => c.close),
          type: 'candlestick',
          increasing: { line: { color: '#3fb950' } },
          decreasing: { line: { color: '#f85149' } },
        }
      ]}
      layout={{
        margin: { t: 10, r: 10, b: 40, l: 50 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: { showgrid: true, gridcolor: 'rgba(48, 54, 61, 0.5)', color: '#8b949e', rangeslider: { visible: false } },
        yaxis: { showgrid: true, gridcolor: 'rgba(48, 54, 61, 0.5)', color: '#8b949e', tickformat: '$,.0f' },
        hovermode: 'x unified',
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

function VolumeChart({ candles }) {
  if (!candles?.length) return (
    <div className="chart-container flex items-center justify-center h-[200px] text-muted">
      No data available
    </div>
  );

  return (
    <Plot
      data={[
        {
          x: candles.map(c => new Date(c.timestamp)),
          y: candles.map(c => c.volume),
          type: 'bar',
          marker: { color: candles.map(c => c.close >= c.open ? '#3fb950' : '#f85149') },
          opacity: 0.7,
        }
      ]}
      layout={{
        margin: { t: 10, r: 10, b: 40, l: 50 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: { showgrid: true, gridcolor: 'rgba(48, 54, 61, 0.5)', color: '#8b949e', rangeslider: { visible: false } },
        yaxis: { showgrid: true, gridcolor: 'rgba(48, 54, 61, 0.5)', color: '#8b949e' },
        showlegend: false,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

function RegimeDistributionChart({ data }) {
  if (!data?.length) return (
    <div className="chart-container flex items-center justify-center h-[250px] text-muted">
      No regime data
    </div>
  );

  const regimeColors = {
    BULLISH: '#3fb950',
    BEARISH: '#f85149',
    SIDEWAYS: '#8b949e',
    HIGH_VOLATILITY: '#d29922',
    UNKNOWN: '#a371f7',
  };

  return (
    <Plot
      data={[
        {
          labels: data.map(d => d.regime),
          values: data.map(d => d.count),
          type: 'pie',
          hole: 0.5,
          marker: { colors: data.map(d => regimeColors[d.regime] || '#8b949e') },
          textinfo: 'label+percent',
        }
      ]}
      layout={{
        margin: { t: 10, r: 10, b: 10, l: 10 },
        paper_bgcolor: 'transparent',
        showlegend: true,
        legend: { orientation: 'h', yanchor: 'bottom', y: -0.1, xanchor: 'center', x: 0.5 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

function IndicatorsTable({ data }) {
  if (!data) return (
    <div className="text-center py-8 text-muted">
      <Info size={32} className="mx-auto mb-2 opacity-50" />
      <p>No indicator data available</p>
    </div>
  );

  const indicators = [
    { label: 'SMA 12', key: 'sma_12' },
    { label: 'SMA 24', key: 'sma_24' },
    { label: 'SMA 96', key: 'sma_96' },
    { label: 'EMA 12', key: 'ema_12' },
    { label: 'EMA 26', key: 'ema_26' },
    { label: 'RSI 14', key: 'rsi_14' },
    { label: 'MACD', key: 'macd' },
    { label: 'MACD Signal', key: 'macd_signal' },
    { label: 'MACD Hist', key: 'macd_hist' },
    { label: 'BB Upper', key: 'bb_upper' },
    { label: 'BB Lower', key: 'bb_lower' },
    { label: 'BB Width', key: 'bb_width' },
    { label: 'BB %B', key: 'bb_pct_b' },
    { label: 'ATR 14', key: 'atr_14' },
    { label: 'Vol 12', key: 'rolling_vol_12' },
    { label: 'Vol 24', key: 'rolling_vol_24' },
    { label: 'Vol 96', key: 'rolling_vol_96' },
    { label: 'ATR Ratio', key: 'atr_ratio' },
    { label: 'Log Returns', key: 'log_returns' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {indicators.map(({ label, key }) => (
        <div key={key} className="p-3 bg-tertiary/50 rounded-lg">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-1">{label}</p>
          <p className="font-mono text-base font-semibold">
            {data[key] !== undefined && data[key] !== null ? data[key].toFixed(4) : '—'}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Market;
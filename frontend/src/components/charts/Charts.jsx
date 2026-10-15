import React, { useRef, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { clsx } from 'clsx';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui';

/**
 * Candlestick Chart with volume
 */
export function CandlestickChart({
  candles = [],
  volume = [],
  height = 400,
  width = '100%',
  className = '',
  theme = 'dark',
  showVolume = true,
  showCrosshair = true,
  showGrid = true,
  timeframe = '5m',
  lastUpdate,
  onTimeframeChange,
  timeframes = ['5m', '15m', '1h', '4h', '1d', '1w'],
  loading = false,
  error = null,
  ...props
}) {
  const plotRef = useRef(null);

  const themeColors = useMemo(() => ({
    dark: {
      bg: 'transparent',
      grid: 'rgba(48, 54, 61, 0.5)',
      text: '#8b949e',
      up: '#3fb950',
      down: '#f85149',
      volumeUp: 'rgba(63, 185, 80, 0.7)',
      volumeDown: 'rgba(248, 81, 73, 0.7)',
    },
    light: {
      bg: 'transparent',
      grid: 'rgba(208, 215, 222, 0.5)',
      text: '#57606a',
      up: '#1a7f37',
      down: '#cf222e',
      volumeUp: 'rgba(26, 127, 55, 0.5)',
      volumeDown: 'rgba(207, 34, 46, 0.5)',
    },
  }), [theme])[theme];

  const chartData = useMemo(() => {
    if (!candles.length) return [];

    const dates = candles.map(c => new Date(c.timestamp));
    const opens = candles.map(c => c.open);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);

    const traces = [
      {
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        type: 'candlestick',
        name: 'Price',
        increasing: { line: { color: themeColors.up } },
        decreasing: { line: { color: themeColors.down } },
        xaxis: 'x',
        yaxis: 'y',
      },
    ];

    if (showVolume) {
      traces.push({
        x: dates,
        y: volumes,
        type: 'bar',
        name: 'Volume',
        marker: {
          color: candles.map((c, i) => 
            c.close >= c.open ? themeColors.volumeUp : themeColors.volumeDown
          ),
        },
        opacity: 0.7,
        xaxis: 'x',
        yaxis: 'y2',
        yhoverformat: ',.0f',
      });
    }

    return traces;
  }, [candles, showVolume, themeColors]);

  const layout = useMemo(() => ({
    margin: { t: 20, r: 10, b: 40, l: 60 },
    paper_bgcolor: themeColors.bg,
    plot_bgcolor: themeColors.bg,
    xaxis: {
      showgrid: showGrid,
      gridcolor: themeColors.grid,
      color: themeColors.text,
      rangeslider: { visible: false },
      type: 'date',
      tickformat: '%H:%M\n%d %b',
      showspikes: showCrosshair,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikecolor: themeColors.text,
      spikethickness: 1,
      spikedash: 'dot',
    },
    yaxis: {
      showgrid: showGrid,
      gridcolor: themeColors.grid,
      color: themeColors.text,
      tickformat: '$,.0f',
      side: 'right',
      title: 'Price (USDT)',
      showspikes: showCrosshair,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikecolor: themeColors.text,
      spikethickness: 1,
      spikedash: 'dot',
    },
    yaxis2: showVolume ? {
      showgrid: false,
      color: themeColors.text,
      overlaying: 'y',
      side: 'left',
      anchor: 'x',
      domain: [0, 0.2],
      showticklabels: false,
      zeroline: false,
    } : undefined,
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: theme === 'dark' ? '#21262d' : '#ffffff',
      bordercolor: themeColors.grid,
      font: { color: themeColors.text },
    },
    showlegend: false,
    dragmode: 'pan',
    uirevision: timeframe, // Preserve zoom/pan on data update
  }), [showGrid, showCrosshair, themeColors, showVolume, timeframe]);

  const config = useMemo(() => ({
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d',
      'autoScale2d', 'resetScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian'
    ],
    responsive: true,
    scrollZoom: true,
    doubleClick: 'reset',
  }), []);

  // Format last update time
  const formattedUpdate = lastUpdate 
    ? new Date(lastUpdate).toLocaleTimeString() 
    : null;

  if (loading) {
    return (
      <div className={clsx('chart-container', className)} style={{ width, height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="spinner spinner-lg mx-auto mb-3" />
            <p className="text-muted">Loading chart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('chart-container', className)} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <AlertTriangle size={48} className="text-muted mb-3 opacity-50" />
          <p className="text-muted mb-3">{error.message || 'Failed to load chart'}</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('chart-wrapper', className)} style={{ width }}>
      {/* Toolbar */}
      <div className="chart-toolbar flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Timeframe:</span>
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange?.(e.target.value)}
            className="form-select form-select-sm w-auto"
            disabled={loading}
          >
            {timeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
        {formattedUpdate && (
          <span className="text-xs text-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            Updated {formattedUpdate}
          </span>
        )}
      </div>

      {/* Chart */}
      <Plot
        ref={plotRef}
        data={chartData}
        layout={layout}
        config={config}
        style={{ width: '100%', height }}
        useResizeHandler={true}
        {...props}
      />
    </div>
  );
}

/**
 * Line Chart for simple price/indicator lines
 */
export function LineChart({
  series = [],
  height = 300,
  width = '100%',
  className = '',
  theme = 'dark',
  showGrid = true,
  showLegend = true,
  yAxisLabel,
  xAxisFormat = '%H:%M',
  loading = false,
  error = null,
  annotations = [],
  ...props
}) {
  const themeColors = useMemo(() => ({
    dark: {
      bg: 'transparent',
      grid: 'rgba(48, 54, 61, 0.5)',
      text: '#8b949e',
      colors: ['#58a6ff', '#3fb950', '#f59e0b', '#f85149', '#a371f7', '#06b6d4'],
    },
    light: {
      bg: 'transparent',
      grid: 'rgba(208, 215, 222, 0.5)',
      text: '#57606a',
      colors: ['#0969da', '#1a7f37', '#9a6700', '#cf222e', '#8250df', '#0891b2'],
    },
  }), [theme])[theme];

  const chartData = useMemo(() => {
    return series.map((s, i) => ({
      x: s.x || s.data?.map(d => d.x),
      y: s.y || s.data?.map(d => d.y),
      type: 'scatter',
      mode: 'lines',
      name: s.name || `Series ${i + 1}`,
      line: {
        color: s.color || themeColors.colors[i % themeColors.colors.length],
        width: s.width || 2,
        dash: s.dash || 'solid',
      },
      fill: s.fill ? 'tozeroy' : 'none',
      fillcolor: s.fillColor || `${s.color || themeColors.colors[i]}40`,
      hovertemplate: s.hoverTemplate || '%{y:.4f}<extra>%{fullData.name}</extra>',
    }));
  }, [series, themeColors]);

  const layout = useMemo(() => ({
    margin: { t: showLegend ? 40 : 10, r: 10, b: 40, l: 60 },
    paper_bgcolor: themeColors.bg,
    plot_bgcolor: themeColors.bg,
    xaxis: {
      showgrid: showGrid,
      gridcolor: themeColors.grid,
      color: themeColors.text,
      tickformat: xAxisFormat,
    },
    yaxis: {
      showgrid: showGrid,
      gridcolor: themeColors.grid,
      color: themeColors.text,
      title: yAxisLabel,
      tickformat: ',.4f',
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: theme === 'dark' ? '#21262d' : '#ffffff',
      bordercolor: themeColors.grid,
      font: { color: themeColors.text },
    },
    showlegend: showLegend,
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1,
      font: { color: themeColors.text },
    },
    annotations,
    uirevision: 'line-chart',
  }), [showGrid, showLegend, themeColors, yAxisLabel, xAxisFormat, annotations]);

  const config = {
    displayModeBar: false,
    responsive: true,
    scrollZoom: false,
  };

  if (loading || error) {
    return (
      <div className={clsx('chart-container', className)} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          {loading && <div className="spinner spinner-lg mb-3" />}
          {error && <p className="text-muted">{error.message || 'Failed to load chart'}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('chart-container', className)} style={{ width, height }}>
      <Plot
        data={chartData}
        layout={layout}
        config={config}
        style={{ width: '100%', height }}
        useResizeHandler={true}
        {...props}
      />
    </div>
  );
}

/**
 * Area Chart for stacked metrics
 */
export function AreaChart({
  series = [],
  height = 300,
  width = '100%',
  className = '',
  theme = 'dark',
  stacked = false,
  showGrid = true,
  showLegend = true,
  yAxisLabel,
  loading = false,
  error = null,
  ...props
}) {
  const themeColors = useMemo(() => ({
    dark: {
      bg: 'transparent',
      grid: 'rgba(48, 54, 61, 0.5)',
      text: '#8b949e',
      colors: ['#58a6ff', '#3fb950', '#f59e0b', '#f85149', '#a371f7'],
    },
    light: {
      bg: 'transparent',
      grid: 'rgba(208, 215, 222, 0.5)',
      text: '#57606a',
      colors: ['#0969da', '#1a7f37', '#9a6700', '#cf222e', '#8250df'],
    },
  }), [theme])[theme];

  const chartData = useMemo(() => {
    return series.map((s, i) => ({
      x: s.x,
      y: s.y,
      type: 'scatter',
      mode: 'lines',
      name: s.name,
      line: {
        color: s.color || themeColors.colors[i % themeColors.colors.length],
        width: 1,
      },
      fill: 'tozeroy',
      fillcolor: s.fillColor || `${s.color || themeColors.colors[i]}30`,
      stackgroup: stacked ? 'one' : undefined,
    }));
  }, [series, stacked, themeColors]);

  const layout = {
    margin: { t: showLegend ? 40 : 10, r: 10, b: 40, l: 60 },
    paper_bgcolor: themeColors.bg,
    plot_bgcolor: themeColors.bg,
    xaxis: { showgrid: showGrid, gridcolor: themeColors.grid, color: themeColors.text },
    yaxis: { showgrid: showGrid, gridcolor: themeColors.grid, color: themeColors.text, title: yAxisLabel },
    hovermode: 'x unified',
    showlegend: showLegend,
    legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 },
  };

  if (loading || error) {
    return (
      <div className={clsx('chart-container', className)} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          {loading && <div className="spinner spinner-lg mb-3" />}
          {error && <p className="text-muted">{error.message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('chart-container', className)} style={{ width, height }}>
      <Plot
        data={chartData}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height }}
        useResizeHandler={true}
        {...props}
      />
    </div>
  );
}

/**
 * Bar Chart for categorical data
 */
export function BarChart({
  categories = [],
  values = [],
  series = [],
  height = 300,
  width = '100%',
  className = '',
  theme = 'dark',
  horizontal = false,
  grouped = false,
  stacked = false,
  showGrid = true,
  showLegend = true,
  yAxisLabel,
  xAxisLabel,
  loading = false,
  error = null,
  colors,
  ...props
}) {
  const themeColors = useMemo(() => ({
    dark: {
      bg: 'transparent',
      grid: 'rgba(48, 54, 61, 0.5)',
      text: '#8b949e',
      colors: ['#58a6ff', '#3fb950', '#f59e0b', '#f85149', '#a371f7', '#06b6d4'],
    },
    light: {
      bg: 'transparent',
      grid: 'rgba(208, 215, 222, 0.5)',
      text: '#57606a',
      colors: ['#0969da', '#1a7f37', '#9a6700', '#cf222e', '#8250df', '#0891b2'],
    },
  }), [theme])[theme];

  const chartData = useMemo(() => {
    if (series.length > 0) {
      return series.map((s, i) => ({
        x: horizontal ? s.values : s.categories,
        y: horizontal ? s.categories : s.values,
        type: 'bar',
        name: s.name,
        orientation: horizontal ? 'h' : 'v',
        marker: {
          color: s.color || themeColors.colors[i % themeColors.colors.length],
        },
      }));
    }
    return [{
      x: horizontal ? values : categories,
      y: horizontal ? categories : values,
      type: 'bar',
      orientation: horizontal ? 'h' : 'v',
      marker: { color: colors || themeColors.colors[0] },
    }];
  }, [series, categories, values, horizontal, colors, themeColors]);

  const layout = {
    margin: { t: showLegend ? 40 : 10, r: horizontal ? 100 : 10, b: horizontal ? 60 : 40, l: horizontal ? 60 : 60 },
    paper_bgcolor: themeColors.bg,
    plot_bgcolor: themeColors.bg,
    xaxis: { showgrid: showGrid, gridcolor: themeColors.grid, color: themeColors.text, title: horizontal ? yAxisLabel : xAxisLabel },
    yaxis: { showgrid: showGrid, gridcolor: themeColors.grid, color: themeColors.text, title: horizontal ? xAxisLabel : yAxisLabel },
    barmode: stacked ? 'stack' : grouped ? 'group' : 'relative',
    hovermode: 'x unified',
    showlegend: showLegend && series.length > 1,
    legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 },
  };

  if (loading || error) {
    return (
      <div className={clsx('chart-container', className)} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          {loading && <div className="spinner spinner-lg mb-3" />}
          {error && <p className="text-muted">{error.message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('chart-container', className)} style={{ width, height }}>
      <Plot
        data={chartData}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height }}
        useResizeHandler={true}
        {...props}
      />
    </div>
  );
}

/**
 * Pie/Donut Chart
 */
export function PieChart({
  labels = [],
  values = [],
  height = 300,
  width = '100%',
  className = '',
  theme = 'dark',
  donut = true,
  hole = 0.5,
  showLegend = true,
  colors,
  loading = false,
  error = null,
  ...props
}) {
  const themeColors = useMemo(() => ({
    dark: {
      bg: 'transparent',
      text: '#e6edf3',
      colors: ['#58a6ff', '#3fb950', '#f59e0b', '#f85149', '#a371f7', '#06b6d4', '#84cc16', '#f97316'],
    },
    light: {
      bg: 'transparent',
      text: '#1f2328',
      colors: ['#0969da', '#1a7f37', '#9a6700', '#cf222e', '#8250df', '#0891b2', '#65a30d', '#ea580c'],
    },
  }), [theme])[theme];

  const chartData = [{
    labels,
    values,
    type: 'pie',
    hole: donut ? hole : 0,
    marker: {
      colors: colors || themeColors.colors,
      line: { color: theme === 'dark' ? '#161b22' : '#ffffff', width: 2 },
    },
    textinfo: 'label+percent',
    textfont: { color: themeColors.text, size: 12 },
    hovertemplate: '%{label}: %{value} (%{percent})<extra></extra>',
  }];

  const layout = {
    margin: { t: 10, r: 10, b: 10, l: 10 },
    paper_bgcolor: themeColors.bg,
    showlegend: showLegend,
    legend: { orientation: 'h', yanchor: 'bottom', y: -0.1, xanchor: 'center', x: 0.5, font: { color: themeColors.text } },
  };

  if (loading || error) {
    return (
      <div className={clsx('chart-container', className)} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          {loading && <div className="spinner spinner-lg mb-3" />}
          {error && <p className="text-muted">{error.message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('chart-container', className)} style={{ width, height }}>
      <Plot
        data={chartData}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height }}
        useResizeHandler={true}
        {...props}
      />
    </div>
  );
}

/**
 * Radar Chart for multi-dimensional comparison
 */
export function RadarChart({
  series = [],
  categories = [],
  height = 300,
  width = '100%',
  className = '',
  theme = 'dark',
  showLegend = true,
  maxValue = 1,
  loading = false,
  error = null,
  ...props
}) {
  const themeColors = useMemo(() => ({
    dark: {
      bg: 'transparent',
      grid: 'rgba(48, 54, 61, 0.5)',
      text: '#8b949e',
      colors: ['#58a6ff', '#3fb950', '#f59e0b', '#f85149', '#a371f7'],
    },
    light: {
      bg: 'transparent',
      grid: 'rgba(208, 215, 222, 0.5)',
      text: '#57606a',
      colors: ['#0969da', '#1a7f37', '#9a6700', '#cf222e', '#8250df'],
    },
  }), [theme])[theme];

  const chartData = useMemo(() => {
    return series.map((s, i) => ({
      r: s.values,
      theta: s.labels || categories,
      fill: 'toself',
      name: s.name,
      opacity: 0.6,
      line: { color: s.color || themeColors.colors[i % themeColors.colors.length], width: 2 },
      fillcolor: `${s.color || themeColors.colors[i]}40`,
    }));
  }, [series, categories, themeColors]);

  const layout = {
    margin: { t: 10, r: 10, b: 10, l: 10 },
    paper_bgcolor: themeColors.bg,
    polar: {
      radialaxis: {
        visible: true,
        range: [0, maxValue],
        color: themeColors.grid,
        gridcolor: themeColors.grid,
        tickfont: { color: themeColors.text },
      },
      angularaxis: {
        color: themeColors.grid,
        gridcolor: themeColors.grid,
        tickfont: { color: themeColors.text },
      },
      bgcolor: themeColors.bg,
    },
    showlegend: showLegend,
    legend: { orientation: 'h', yanchor: 'bottom', y: -0.15, xanchor: 'center', x: 0.5, font: { color: themeColors.text } },
  };

  if (loading || error) {
    return (
      <div className={clsx('chart-container', className)} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          {loading && <div className="spinner spinner-lg mb-3" />}
          {error && <p className="text-muted">{error.message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('chart-container', className)} style={{ width, height }}>
      <Plot
        data={chartData}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height }}
        useResizeHandler={true}
        {...props}
      />
    </div>
  );
}

export default CandlestickChart;
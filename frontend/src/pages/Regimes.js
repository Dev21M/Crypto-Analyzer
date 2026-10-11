import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Card, ChartContainer, MetricCard } from '../components/Card';

export function Regimes({ data }) {
  const [regimeData, setRegimeData] = useState(null);
  const [regimeHistory, setRegimeHistory] = useState([]);
  const [modelMetrics, setModelMetrics] = useState({});
  const [selectedExperiment, setSelectedExperiment] = useState('EXP_D_FULL');
  const [selectedMetric, setSelectedMetric] = useState('directional_accuracy');
  const [loading, setLoading] = useState(true);

  const experiments = ['EXP_A_PRICE', 'EXP_B_PRICE_VOL', 'EXP_C_TECH_IND', 'EXP_D_FULL'];
  const metrics = [
    { value: 'directional_accuracy', label: 'Directional Accuracy' },
    { value: 'accuracy', label: 'Accuracy' },
    { value: 'f1', label: 'F1 Score' },
    { value: 'mae', label: 'MAE' },
    { value: 'rmse', label: 'RMSE' },
  ];

  const regimeColors = {
    BULLISH: '#3fb950',
    BEARISH: '#f85149',
    SIDEWAYS: '#8b949e',
    HIGH_VOLATILITY: '#d29922',
    UNKNOWN: '#a371f7',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regimesRes, metricsRes] = await Promise.all([
          fetch('/api/v1/market/regimes?limit=500'),
          fetch(`/api/v1/predict/metrics`),
        ]);
        const [regimesData, metricsData] = await Promise.all([
          regimesRes.json(),
          metricsRes.json(),
        ]);
        setRegimeData(regimesData);
        setRegimeHistory(regimesData.regime_distribution || []);
        
        // Process metrics by regime
        setModelMetrics(metricsData.metrics || []);
      } catch (err) {
        console.error('Failed to fetch regime data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  const currentRegime = regimeData?.current_regime || 'UNKNOWN';
  const regimeConfidence = regimeData?.regime_confidence || 0;

  return (
    <div className="regimes-page">
      {/* Current Regime */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <MetricCard
          label="Current Regime"
          value={currentRegime}
          change={`${(regimeConfidence * 100).toFixed(0)}% confidence`}
          icon="📊"
          trend="neutral"
        />
        <MetricCard
          label="Distribution"
          value={`${regimeHistory.length} periods`}
          change="Last 100"
          icon="📈"
        />
        <MetricCard
          label="Avg Regime Duration"
          value="N/A"
          change="Not computed"
          icon="⏱️"
        />
        <MetricCard
          label="Regime Changes"
          value="N/A"
          change="Not computed"
          icon="🔄"
        />
      </div>

      {/* Regime Distribution */}
      <Card title="Regime Distribution" subtitle="Full dataset breakdown" style={{ marginBottom: 24 }}>
        <ChartContainer style={{ height: 300 }}>
          <RegimePieChart data={regimeHistory} colors={regimeColors} />
        </ChartContainer>
      </Card>

      {/* Detailed Regime Tables - Only show real data from modelMetrics */}
      <Card title="Detailed Regime Metrics" subtitle="Per-model breakdown by regime (requires regime-specific metrics)" style={{ marginBottom: 24 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Type</th>
                {Object.keys(regimeColors).map(r => (
                  <th key={r} style={{ color: regimeColors[r] }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['xgboost', 'random_forest', 'linear', 'lstm', 'gru', 'cnn1d', 'naive'].map(model => {
                const type = ['naive', 'linear', 'logistic', 'random_forest', 'xgboost'].includes(model) ? 'Baseline' : 'Deep Learning';
                return (
                  <tr key={model}>
                    <td style={{ fontWeight: 600 }}>{model.toUpperCase()}</td>
                    <td><span className={`badge ${type === 'Baseline' ? 'badge-info' : 'badge-success'}`}>{type}</span></td>
                    {Object.keys(regimeColors).map(regime => (
                      <td key={regime}>
                        <span style={{ color: regimeColors[regime] }}>
                          N/A
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', marginTop: 16, fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> Regime-specific model performance metrics are not currently available in the API. 
            The regime_analysis_results.json file contains this data but is not exposed via the REST API. 
            Run the regime analysis scripts to generate these metrics.
          </div>
        </div>
      </Card>
    </div>
  );
}

function RegimePieChart({ data, colors }) {
  if (!data?.length) return <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>No data</div>;

  return (
    <Plot
      data={[
        {
          labels: data.map(d => d.regime),
          values: data.map(d => d.count),
          type: 'pie',
          hole: 0.5,
          marker: { colors: data.map(d => colors[d.regime] || '#8b949e') },
          textinfo: 'label+percent',
          textfont: { color: '#e6edf3', size: 12 },
        }
      ]}
      layout={{
        margin: { t: 10, r: 10, b: 10, l: 10 },
        paper_bgcolor: 'transparent',
        showlegend: true,
        legend: { orientation: 'h', yanchor: 'bottom', y: -0.1, xanchor: 'center', x: 0.5, font: { color: '#e6edf3' } },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default Regimes;
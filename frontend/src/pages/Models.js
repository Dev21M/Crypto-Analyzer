import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Card, ChartContainer } from '../components/Card';

export function Models({ data }) {
  const [metrics, setMetrics] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState('EXP_D_FULL');
  const [selectedMetric, setSelectedMetric] = useState('directional_accuracy');
  const [loading, setLoading] = useState(true);

  const experiments = ['EXP_A_PRICE', 'EXP_B_PRICE_VOL', 'EXP_C_TECH_IND', 'EXP_D_FULL'];
  const metricOptions = [
    { value: 'directional_accuracy', label: 'Directional Accuracy' },
    { value: 'accuracy', label: 'Accuracy' },
    { value: 'f1', label: 'F1 Score' },
    { value: 'mae', label: 'MAE' },
    { value: 'rmse', label: 'RMSE' },
    { value: 'mape', label: 'MAPE' },
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/v1/predict/metrics');
        const data = await res.json();
        setMetrics(data.metrics || []);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  // Filter metrics
  const filtered = metrics.filter(m => m.experiment === selectedExperiment);
  
  // Group by model
  const modelMetrics = {};
  filtered.forEach(m => {
    if (!modelMetrics[m.model]) modelMetrics[m.model] = {};
    modelMetrics[m.model][m.metric_name] = m.metric_value;
  });

  const models = Object.keys(modelMetrics);

  return (
    <div className="models-page">
      {/* Controls */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Experiment</label>
            <select className="form-select" value={selectedExperiment} onChange={e => setSelectedExperiment(e.target.value)}>
              {experiments.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Primary Metric</label>
            <select className="form-select" value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}>
              {metricOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Comparison Table */}
      <Card title="Model Comparison" subtitle={`${selectedExperiment} • ${metricOptions.find(m => m.value === selectedMetric)?.label}`} style={{ marginBottom: 24 }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Type</th>
                <th>Dir. Accuracy</th>
                <th>Accuracy</th>
                <th>F1 Score</th>
                <th>MAE</th>
                <th>RMSE</th>
                <th>MAPE</th>
                <th>Params</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => {
                const m = modelMetrics[model];
                const type = ['naive', 'linear', 'logistic', 'random_forest', 'xgboost'].includes(model) ? 'Baseline' : 'Deep Learning';
                const params = ['lstm', 'gru'].includes(model) ? '~50K' : model === 'cnn1d' ? '~7K' : '—';
                return (
                  <tr key={model}>
                    <td style={{ fontWeight: 600 }}>{model.toUpperCase()}</td>
                    <td><span className={`badge ${type === 'Baseline' ? 'badge-info' : 'badge-success'}`}>{type}</span></td>
                    <td>{(m.directional_accuracy * 100).toFixed(1)}%</td>
                    <td>{(m.accuracy * 100).toFixed(1)}%</td>
                    <td>{m.f1 ? (m.f1 * 100).toFixed(1) + '%' : '—'}</td>
                    <td>{m.mae ? m.mae.toFixed(4) : '—'}</td>
                    <td>{m.rmse ? m.rmse.toFixed(4) : '—'}</td>
                    <td>{m.mape ? m.mape.toFixed(1) + '%' : '—'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>{params}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Metric Comparison Chart */}
      <Card title="Metric Comparison" subtitle="Bar chart across all models" style={{ marginBottom: 24 }}>
        <ChartContainer>
          <MetricBarChart modelMetrics={modelMetrics} metric={selectedMetric} models={models} />
        </ChartContainer>
      </Card>

      {/* Radar Chart */}
      <Card title="Multi-Metric Radar" subtitle="Normalized comparison (higher = better for all)">
        <ChartContainer>
          <RadarChart modelMetrics={modelMetrics} models={models} />
        </ChartContainer>
      </Card>
    </div>
  );
}

function MetricBarChart({ modelMetrics, metric, models }) {
  const isLowerBetter = ['mae', 'rmse', 'mape'].includes(metric);
  
  const sortedModels = [...models].sort((a, b) => {
    const va = modelMetrics[a][metric] || 0;
    const vb = modelMetrics[b][metric] || 0;
    return isLowerBetter ? va - vb : vb - va;
  });

  return (
    <Plot
      data={[
        {
          x: sortedModels.map(m => m.toUpperCase()),
          y: sortedModels.map(m => modelMetrics[m][metric] || 0),
          type: 'bar',
          marker: { 
            color: sortedModels.map(m => ['naive', 'linear', 'logistic', 'random_forest', 'xgboost'].includes(m) ? '#58a6ff' : '#f85149'),
          },
          text: sortedModels.map(m => {
            const v = modelMetrics[m][metric];
            if (!v) return 'N/A';
            return ['mae', 'rmse'].includes(metric) ? v.toFixed(4) : 
                   metric === 'mape' ? v.toFixed(1) : (v * 100).toFixed(1) + '%';
          }),
          textposition: 'auto',
        }
      ]}
      layout={{
        margin: { t: 10, r: 10, b: 60, l: 60 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: { color: '#8b949e', tickangle: -45 },
        yaxis: { showgrid: true, gridcolor: 'rgba(48, 54, 61, 0.5)', color: '#8b949e', title: metric.toUpperCase() },
        showlegend: false,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

function RadarChart({ modelMetrics, models }) {
  const metrics = ['directional_accuracy', 'accuracy', 'f1', 'mae', 'rmse'];

  // Normalize values 0-1 (higher = better)
  const getNormalized = (model, metricName) => {
    const val = modelMetrics[model][metricName];
    if (!val) return 0;
    if (['mae', 'rmse'].includes(metricName)) {
      // For MAE/RMSE: lower is better, invert
      return Math.max(0, 1 - Math.min(val / 2, 1));
    }
    return Math.min(val, 1);
  };

  return (
    <Plot
      data={models.map(model => ({
        r: metrics.map(m => getNormalized(model, m)),
        theta: metrics.map(m => m.toUpperCase()),
        fill: 'toself',
        name: model.toUpperCase(),
        opacity: 0.6,
        line: { color: ['naive', 'linear', 'logistic', 'random_forest', 'xgboost'].includes(model) ? '#58a6ff' : '#f85149' },
      }))}
      layout={{
        margin: { t: 10, r: 10, b: 10, l: 10 },
        paper_bgcolor: 'transparent',
        polar: { radialaxis: { visible: true, range: [0, 1], color: '#8b949e' } },
        showlegend: true,
        legend: { orientation: 'h', yanchor: 'bottom', y: -0.15, xanchor: 'center', x: 0.5 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default Models;
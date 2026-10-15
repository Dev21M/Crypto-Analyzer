import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap as ZapIcon, 
  Target as TargetIcon, 
  RotateCcw as RotateCcwIcon, 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  X as XIcon, 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon 
} from 'lucide-react';
import { Card, MetricCard } from '../components/Card';

export function Predictions({ data }) {
  const [experiment, setExperiment] = useState('EXP_D_FULL');
  const [model, setModel] = useState('xgboost');
  const [task, setTask] = useState('classification');
  const [horizon, setHorizon] = useState(12);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const experiments = [
    { id: 'EXP_A_PRICE', label: 'Price Only (4)', features: 4 },
    { id: 'EXP_B_PRICE_VOL', label: 'Price + Volume (5)', features: 5 },
    { id: 'EXP_C_TECH_IND', label: 'Price + Vol + Tech (19)', features: 19 },
    { id: 'EXP_D_FULL', label: 'Full Set (24)', features: 24 },
  ];

  const models = [
    { id: 'naive', label: 'Naive', type: 'baseline' },
    { id: 'linear', label: 'Linear/Ridge', type: 'baseline' },
    { id: 'logistic', label: 'Logistic', type: 'baseline' },
    { id: 'random_forest', label: 'Random Forest', type: 'baseline' },
    { id: 'xgboost', label: 'XGBoost', type: 'baseline' },
    { id: 'lstm', label: 'LSTM', type: 'dl' },
    { id: 'gru', label: 'GRU', type: 'dl' },
    { id: 'cnn1d', label: '1D-CNN', type: 'dl' },
  ];

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiment, model, task, horizon, use_latest_data: true }),
      });
      const result = await res.json();
      setPrediction(result);
      setHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  }, [experiment, model, task, horizon]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchPrediction, 300000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchPrediction]);

  const directionColor = prediction?.direction === 1 ? '#3fb950' : '#f85149';
  const directionLabel = prediction?.direction === 1 ? 'UP' : 'DOWN';

  return (
    <div className="predictions-page">
      {/* Controls */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Experiment</label>
            <select className="form-select" value={experiment} onChange={e => setExperiment(e.target.value)}>
              {experiments.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Model</label>
            <select className="form-select" value={model} onChange={e => setModel(e.target.value)}>
              {models.map(m => <option key={m.id} value={m.id}>{m.label} ({m.type})</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Task</label>
            <select className="form-select" value={task} onChange={e => setTask(e.target.value)}>
              <option value="classification">Directional Classification</option>
              <option value="regression">Return Regression</option>
            </select>
          </div>
          <div>
            <label className="form-label">Horizon (candles)</label>
            <select className="form-select" value={horizon} onChange={e => setHorizon(Number(e.target.value))}>
              <option value={1}>1 (5 min)</option>
              <option value={3}>3 (15 min)</option>
              <option value={6}>6 (30 min)</option>
              <option value={12}>12 (1 hour)</option>
              <option value={24}>24 (2 hours)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={fetchPrediction} disabled={loading}>
              <RotateCcwIcon size={16} className="spin" /> Predict
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} style={{ width: '20px', height: '20px' }} />
              Auto (5 min)
            </label>
          </div>
        </div>
      </Card>

      {/* Current Prediction */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <Card title="Current Prediction" subtitle={`${models.find(m => m.id === model)?.label} • ${experiments.find(e => e.id === experiment)?.label} • ${task}`}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <RotateCcwIcon size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
              <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Generating prediction...</p>
            </div>
          ) : prediction ? (
            (task === 'classification' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '64px', 
                  fontWeight: 700, 
                  fontFamily: 'JetBrains Mono, monospace',
                  color: directionColor,
                  marginBottom: 8,
                  textTransform: 'uppercase'
                }}>
                  {directionLabel}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
                  <MetricCard 
                    label="Confidence" 
                    value={`${(prediction.confidence * 100).toFixed(1)}%`}
                    icon={<TargetIcon size={18} />}
                  />
                  <MetricCard 
                    label="Probability UP" 
                    value={`${(prediction.probability_up * 100).toFixed(1)}%`}
                    icon={<TrendingUpIcon size={18} />}
                  />
                  <MetricCard 
                    label="Probability DOWN" 
                    value={`${(prediction.probability_down * 100).toFixed(1)}%`}
                    icon={<TrendingDownIcon size={18} />}
                  />
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-muted)', 
                  textAlign: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid var(--border-primary)'
                }}>
                  Inference time: {prediction.inference_time_ms?.toFixed(1)}ms • Features: {prediction.features_used} • Horizon: {prediction.horizon} candles
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '64px', 
                  fontWeight: 700, 
                  fontFamily: 'JetBrains Mono, monospace',
                  color: directionColor,
                  marginBottom: 8
                }}>
                  {prediction.predicted_return_pct?.toFixed(2)}%
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Predicted 1-hour return
                </div>
                {prediction.confidence_interval && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    95% CI: [{prediction.confidence_interval[0].toFixed(2)}%, {prediction.confidence_interval[1].toFixed(2)}%]
                  </div>
                )}
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-muted)', 
                  textAlign: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid var(--border-primary)'
                }}>
                  Inference time: {prediction.inference_time_ms?.toFixed(1)}ms • Features: {prediction.features_used}
                </div>
              </div>
            ))
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                No prediction available. Click "Predict" to generate one.
              </div>
            )}
        </Card>

        <Card title="Prediction History" subtitle="Last 10 predictions">
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Model</th>
                  <th>Experiment</th>
                  <th>Task</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No predictions yet. Click "Predict" to generate.</td></tr>
                ) : (
                  history.map((p, i) => (
                    <tr key={i}>
                      <td>{new Date(p.timestamp).toLocaleTimeString()}</td>
                      <td>{p.model}</td>
                      <td>{p.experiment}</td>
                      <td>{p.task}</td>
                      <td>
                        {p.task === 'classification' ? (
                          <span style={{ color: p.direction === 1 ? '#3fb950' : '#f85149', fontWeight: 600 }}>
                            {p.direction === 1 ? 'UP' : 'DOWN'}
                          </span>
                        ) : (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {p.predicted_return_pct?.toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td>{p.confidence ? (p.confidence * 100).toFixed(1) + '%' : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Accuracy Tracking */}
        <Card title="Prediction Accuracy Tracking">
          <div className="grid grid-4">
            <MetricCard label="Total Predictions" value={history.length} icon={<TargetIcon size={20} />} />
            <MetricCard label="Correct (Dir.)" value={history.filter(p => p.task === 'classification').length > 0 ? '—' : '—'} icon={<TrendingUpIcon size={20} />} />
            <MetricCard label="Avg Confidence" value={history.length > 0 ? (history.reduce((a, b) => a + (b.confidence || 0), 0) / history.length * 100).toFixed(1) + '%' : '—'} icon={<TargetIcon size={20} />} />
            <MetricCard label="Avg Latency" value={history.length > 0 ? (history.reduce((a, b) => a + (b.inference_time_ms || 0), 0) / history.length).toFixed(1) + 'ms' : '—'} icon={<RotateCcwIcon size={20} />} />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Predictions;
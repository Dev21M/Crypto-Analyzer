import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  Target, 
  RotateCw, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Clock,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button, Card, MetricCard, Badge, Table, createColumn, Skeleton } from '../components/ui';
import { predictionApi } from '../services/api';
import { formatRelativeTime } from '../utils/formatters';
import { EXPERIMENTS, MODELS, TASKS, HORIZONS } from '../utils/constants';
import { clsx } from 'clsx';

export function Predictions() {
  const [experiment, setExperiment] = useState('EXP_D_FULL');
  const [model, setModel] = useState('xgboost');
  const [task, setTask] = useState('classification');
  const [horizon, setHorizon] = useState(12);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await predictionApi.predict({
        experiment,
        model,
        task,
        horizon,
        use_latest_data: true,
      });
      setPrediction(result);
      setHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err.message || 'Prediction failed');
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
    const interval = setInterval(fetchPrediction, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, fetchPrediction]);

  const directionColor = prediction?.direction === 1 ? 'text-success' : 'text-danger';
  const directionLabel = prediction?.direction === 1 ? 'UP ▲' : 'DOWN ▼';

  return (
    <div className="predictions-page container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Predictions</h1>
          <p className="text-muted mt-1">
            Generate directional or return predictions using trained ML models.
            <span className="ml-2 px-2 py-0.5 bg-warning/20 text-warning text-xs rounded-full">
              Research Tool
            </span>
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <div className="card-header">
          <h3 className="card-title">Prediction Configuration</h3>
          <p className="card-subtitle">Select model parameters and generate a prediction</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="form-label">Experiment</label>
              <select 
                className="form-select" 
                value={experiment} 
                onChange={e => setExperiment(e.target.value)}
                disabled={loading}
              >
                {EXPERIMENTS.map(e => (
                  <option key={e.id} value={e.id}>{e.label} ({e.features} features)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Model</label>
              <select 
                className="form-select" 
                value={model} 
                onChange={e => setModel(e.target.value)}
                disabled={loading}
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label} ({m.category})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Task</label>
              <select 
                className="form-select" 
                value={task} 
                onChange={e => setTask(e.target.value)}
                disabled={loading}
              >
                {TASKS.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Horizon (candles)</label>
              <select 
                className="form-select" 
                value={horizon} 
                onChange={e => setHorizon(Number(e.target.value))}
                disabled={loading}
              >
                {HORIZONS.map(h => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 sm:flex-row flex-col sm:items-end">
              <Button 
                variant="primary" 
                className="w-full sm:w-auto flex-1"
                onClick={fetchPrediction} 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <RotateCw size={16} className="mr-2 spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap size={16} className="mr-2" />
                    Generate Prediction
                  </>
                )}
              </Button>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary">
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={e => setAutoRefresh(e.target.checked)} 
                  className="form-checkbox"
                  disabled={loading}
                />
                Auto-refresh (5 min)
              </label>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <Card variant="danger" className="mb-6">
          <div className="card-content">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-danger mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-danger mb-1">Prediction Error</h4>
                <p className="text-sm">{error}</p>
                <Button variant="ghost" size="sm" onClick={fetchPrediction} className="mt-2">
                  <RefreshCw size={14} className="mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Current Prediction */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="card-header">
            <h3 className="card-title">Current Prediction</h3>
            <p className="card-subtitle">
              {MODELS.find(m => m.id === model)?.label} • 
              {EXPERIMENTS.find(e => e.id === experiment)?.label} • 
              {TASKS.find(t => t.id === task)?.label} • 
              {horizon} candles
            </p>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="text-center py-12">
                <RotateCw size={32} className="spin mx-auto mb-3 text-primary" />
                <p className="text-muted">Generating prediction...</p>
              </div>
            ) : prediction ? (
              task === 'classification' ? (
                <ClassificationResult prediction={prediction} directionColor={directionColor} directionLabel={directionLabel} />
              ) : (
                <RegressionResult prediction={prediction} directionColor={directionColor} />
              )
            ) : (
              <div className="text-center py-12 text-muted">
                <Zap size={48} className="mx-auto mb-3 opacity-50" />
                <p>No prediction generated yet</p>
                <p className="text-sm mt-1">Configure parameters and click "Generate Prediction"</p>
              </div>
            )}
          </div>
        </Card>

        {/* Model Info & Stats */}
        <Card>
          <div className="card-header">
            <h3 className="card-title">Model Information</h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <ModelInfoRow label="Model" value={MODELS.find(m => m.id === model)?.label} />
              <ModelInfoRow label="Type" value={MODELS.find(m => m.id === model)?.category} />
              <ModelInfoRow label="Experiment" value={EXPERIMENTS.find(e => e.id === experiment)?.label} />
              <ModelInfoRow label="Features" value={`${EXPERIMENTS.find(e => e.id === experiment)?.features} features`} />
              <ModelInfoRow label="Task" value={TASKS.find(t => t.id === task)?.label} />
              <ModelInfoRow label="Horizon" value={`${horizon} candles (${HORIZONS.find(h => h.value === horizon)?.label})`} />
              <ModelInfoRow label="Data Source" value="Latest market data (live)" />
            </div>
          </div>
        </Card>
      </div>

      {/* Prediction History */}
      <Card>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Prediction History</h3>
            <span className="text-sm text-muted">Last {history.length} predictions</span>
          </div>
        </div>
        <div className="card-content p-0">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Clock size={48} className="mx-auto mb-3 opacity-50" />
              <p>No predictions generated yet</p>
              <p className="text-sm mt-1">Generate a prediction to see history</p>
            </div>
          ) : (
            <Table
              columns={[
                createColumn({ 
                  key: 'time', 
                  header: 'Time', 
                  accessor: 'timestamp',
                  cell: (row) => formatRelativeTime(row.timestamp)
                }),
                createColumn({ 
                  key: 'model', 
                  header: 'Model', 
                  accessor: 'model' 
                }),
                createColumn({ 
                  key: 'experiment', 
                  header: 'Experiment', 
                  accessor: 'experiment' 
                }),
                createColumn({ 
                  key: 'task', 
                  header: 'Task', 
                  accessor: 'task',
                  cell: (row) => (
                    <Badge variant={row.task === 'classification' ? 'info' : 'secondary'} size="sm">
                      {TASKS.find(t => t.id === row.task)?.label}
                    </Badge>
                  )
                }),
                createColumn({ 
                  key: 'prediction', 
                  header: 'Prediction', 
                  accessor: 'direction',
                  cell: (row) => {
                    if (row.task === 'classification') {
                      return (
                        <span className={clsx('font-semibold', row.direction === 1 ? 'text-success' : 'text-danger')}>
                          {row.direction === 1 ? 'UP ▲' : 'DOWN ▼'}
                        </span>
                      );
                    }
                    return (
                      <span className="font-mono font-semibold">
                        {row.predicted_return_pct?.toFixed(2)}%
                      </span>
                    );
                  }
                }),
                createColumn({ 
                  key: 'confidence', 
                  header: 'Confidence', 
                  accessor: 'confidence',
                  cell: (row) => row.confidence ? `${(row.confidence * 100).toFixed(1)}%` : '—'
                }),
              ]}
              data={history}
              hoverable
              striped
              emptyMessage="No predictions in history"
            />
          )}
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-warning-bg/20 border-warning/50 mt-6">
        <div className="card-content">
          <div className="flex items-start gap-3">
            <Info className="text-warning mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-warning mb-2">Important Disclaimer</h4>
              <p className="text-sm text-muted">
                These predictions are generated by machine learning models trained on historical data.
                They are for research and educational purposes only and do not constitute financial advice.
                Cryptocurrency markets are highly volatile and unpredictable. Past performance is not indicative 
                of future results. Always do your own research and consult with a qualified financial advisor 
                before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ClassificationResult({ prediction, directionColor, directionLabel }) {
  return (
    <div className="text-center">
      <div className={clsx('font-mono font-bold text-4xl sm:text-5xl mb-4', directionColor)}>
        {directionLabel}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <MetricCard 
          label="Confidence" 
          value={`${(prediction.confidence * 100).toFixed(1)}%`}
          icon={<Target size={18} />}
        />
        <MetricCard 
          label="Probability UP" 
          value={`${(prediction.probability_up * 100).toFixed(1)}%`}
          icon={<TrendingUp size={18} />}
          trend="up"
        />
        <MetricCard 
          label="Probability DOWN" 
          value={`${(prediction.probability_down * 100).toFixed(1)}%`}
          icon={<TrendingDown size={18} />}
          trend="down"
        />
      </div>
      <div className="text-xs text-muted pt-4 border-t border-primary">
        Inference: {prediction.inference_time_ms?.toFixed(1)}ms • Features: {prediction.features_used} • Horizon: {prediction.horizon} candles
      </div>
    </div>
  );
}

function RegressionResult({ prediction, directionColor }) {
  return (
    <div className="text-center">
      <div className={clsx('font-mono font-bold text-4xl sm:text-5xl mb-2', directionColor)}>
        {prediction.predicted_return_pct?.toFixed(2)}%
      </div>
      <div className="text-muted mb-4">Predicted 1-hour return</div>
      {prediction.confidence_interval && (
        <div className="text-sm text-secondary mb-4">
          95% CI: [{prediction.confidence_interval[0].toFixed(2)}%, {prediction.confidence_interval[1].toFixed(2)}%]
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <MetricCard 
          label="Confidence" 
          value={`${(prediction.confidence * 100).toFixed(1)}%`}
          icon={<Target size={18} />}
        />
        <MetricCard 
          label="Inference Time" 
          value={`${prediction.inference_time_ms?.toFixed(1)}ms`}
          icon={<RotateCw size={18} />}
        />
        <MetricCard 
          label="Features Used" 
          value={prediction.features_used}
          icon={<Target size={18} />}
        />
      </div>
      <div className="text-xs text-muted pt-4 border-t border-primary">
        Inference: {prediction.inference_time_ms?.toFixed(1)}ms • Features: {prediction.features_used} • Horizon: {prediction.horizon} candles
      </div>
    </div>
  );
}

function ModelInfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-primary/50 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-mono font-medium text-primary">{value}</span>
    </div>
  );
}

export default Predictions;
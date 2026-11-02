import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { 
  Settings as SettingsIcon, 
  Database as DatabaseIcon, 
  Cpu as CpuIcon, 
  Wifi as WifiIcon, 
  Shield as ShieldIcon, 
  Bell as BellIcon, 
  User as UserIcon, 
  Save as SaveIcon, 
  AlertTriangle as AlertTriangleIcon,
  Check as CheckIcon
} from 'lucide-react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General
    theme: 'dark',
    autoRefresh: true,
    refreshInterval: 300,
    // API
    apiUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000',
    // Models
    defaultExperiment: 'EXP_D_FULL',
    defaultModel: 'xgboost',
    defaultTask: 'classification',
    defaultHorizon: 12,
    // Notifications
    enablePredictions: true,
    enableMarketUpdates: true,
    enableRegimeChanges: true,
    // Advanced
    debugMode: false,
    logLevel: 'info',
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('cryptoanalyzer_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem('cryptoanalyzer_settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'api', label: 'API & Connection', icon: WifiIcon },
    { id: 'models', label: 'Models', icon: CpuIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'advanced', label: 'Advanced', icon: AlertTriangleIcon },
  ];

  return (
    <div className="settings-page" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Settings</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saved}>
          <SaveIcon size={16} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <Card title="General Settings" subtitle="Application preferences">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label">Theme</label>
              <select className="form-select" value={settings.theme} onChange={e => handleChange('theme', e.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Auto Refresh</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automatically refresh data</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.autoRefresh} onChange={e => handleChange('autoRefresh', e.target.checked)} style={{ width: '20px', height: '20px' }} />
              </label>
            </div>
            <div>
              <label className="form-label">Refresh Interval (seconds)</label>
              <input type="number" className="form-input" value={settings.refreshInterval} onChange={e => handleChange('refreshInterval', Number(e.target.value))} min={30} max={3600} step={30} />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'api' && (
        <Card title="API & WebSocket Configuration" subtitle="Connection settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label">REST API Base URL</label>
              <input type="url" className="form-input" value={settings.apiUrl} onChange={e => handleChange('apiUrl', e.target.value)} placeholder="http://localhost:8000" />
            </div>
            <div>
              <label className="form-label">WebSocket URL</label>
              <input type="url" className="form-input" value={settings.wsUrl} onChange={e => handleChange('wsUrl', e.target.value)} placeholder="ws://localhost:8000" />
            </div>
            <div style={{ padding: '16px', background: 'rgba(88, 166, 255, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 500, color: 'var(--accent-primary)', marginBottom: 8 }}>Connection Test</div>
              <button className="btn btn-primary" style={{ width: 'fit-content' }}>Test Connection</button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'models' && (
        <Card title="Default Model Settings" subtitle="Default values for prediction page">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label className="form-label">Default Experiment</label>
              <select className="form-select" value={settings.defaultExperiment} onChange={e => handleChange('defaultExperiment', e.target.value)}>
                <option value="EXP_A_PRICE">Price Only (4)</option>
                <option value="EXP_B_PRICE_VOL">Price + Volume (5)</option>
                <option value="EXP_C_TECH_IND">Price + Vol + Tech (19)</option>
                <option value="EXP_D_FULL">Full Set (24)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Default Model</label>
              <select className="form-select" value={settings.defaultModel} onChange={e => handleChange('defaultModel', e.target.value)}>
                <option value="naive">Naive</option>
                <option value="linear">Linear/Ridge</option>
                <option value="logistic">Logistic</option>
                <option value="random_forest">Random Forest</option>
                <option value="xgboost">XGBoost</option>
                <option value="lstm">LSTM</option>
                <option value="gru">GRU</option>
                <option value="cnn1d">1D-CNN</option>
              </select>
            </div>
            <div>
              <label className="form-label">Default Task</label>
              <select className="form-select" value={settings.defaultTask} onChange={e => handleChange('defaultTask', e.target.value)}>
                <option value="classification">Directional Classification</option>
                <option value="regression">Return Regression</option>
              </select>
            </div>
            <div>
              <label className="form-label">Default Horizon (candles)</label>
              <select className="form-select" value={settings.defaultHorizon} onChange={e => handleChange('defaultHorizon', Number(e.target.value))}>
                <option value={1}>1 (5 min)</option>
                <option value={3}>3 (15 min)</option>
                <option value={6}>6 (30 min)</option>
                <option value={12}>12 (1 hour)</option>
                <option value={24}>24 (2 hours)</option>
                <option value={48}>48 (4 hours)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card title="Real-time Notifications" subtitle="WebSocket subscription preferences">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'enablePredictions', label: 'Prediction Updates', desc: 'Receive new predictions via WebSocket' },
              { key: 'enableMarketUpdates', label: 'Market Data', desc: 'Real-time price and volume updates' },
              { key: 'enableRegimeChanges', label: 'Regime Changes', desc: 'Market regime transition alerts' },
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <input type="checkbox" checked={settings[item.key]} onChange={e => handleChange(item.key, e.target.checked)} style={{ width: '20px', height: '20px' }} />
              </label>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'advanced' && (
        <>
          <Card title="Debug & Logging" subtitle="Developer options">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Debug Mode</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enable verbose logging and debug endpoints</div>
                </div>
                <input type="checkbox" checked={settings.debugMode} onChange={e => handleChange('debugMode', e.target.checked)} style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <label className="form-label">Log Level</label>
                <select className="form-select" value={settings.logLevel} onChange={e => handleChange('logLevel', e.target.value)}>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </Card>

          <Card title="Data Management" subtitle="Cache and storage">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary">Clear API Cache</button>
              <button className="btn btn-secondary">Reset Settings</button>
              <button className="btn btn-danger">Clear All Data</button>
            </div>
          </Card>

          <Card title="About" subtitle="Version information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>App Version</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>1.0.0</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Build Date</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>2026-10-08</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Python Backend</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>FastAPI 0.111</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Frontend</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>React 18.2</div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Save indicator */}
      {saved && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, animation: 'slideIn 300ms ease' }}>
          <div style={{ background: 'var(--accent-success)', color: 'var(--bg-primary)', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckIcon size={16} /> Settings saved
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
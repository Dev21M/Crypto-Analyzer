import React from 'react';
import { AlertTriangle as AlertTriangleIcon, X as XIcon } from 'lucide-react';

export function DisclaimerBanner({ onDismiss }) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <div className="disclaimer-banner" role="alert">
      <AlertTriangleIcon className="disclaimer-icon" size={20} strokeWidth={2} />
      <div className="disclaimer-content">
        <strong>⚠️ Research Disclaimer:</strong> This is an academic research tool for educational purposes only. 
        The predictions, models, and analysis presented here are <strong>experimental</strong> and 
        <strong>must NOT be used for financial decisions, trading, or investment advice.</strong> 
        Cryptocurrency markets are highly volatile and unpredictable. Past performance does not guarantee future results.
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="toggle-btn"
        aria-label="Dismiss disclaimer"
        style={{ flexShrink: 0, marginTop: 2 }}
      >
        <XIcon size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

export default DisclaimerBanner;
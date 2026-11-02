import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <App />
  </React.StrictMode>
);
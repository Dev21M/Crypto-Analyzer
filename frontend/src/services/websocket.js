/**
 * WebSocket Service for real-time updates
 */

import { useWebSocket } from '../hooks/useTheme';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/api/v1/ws';
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.connecting = false;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.connecting) {
      return Promise.resolve();
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.connecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startHeartbeat();
          this.emit('open', {});
          resolve();
        };

        this.ws.onclose = (event) => {
          this.connecting = false;
          this.stopHeartbeat();
          this.emit('close', event);
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          this.connecting = false;
          this.emit('error', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (e) {
            console.error('WS Message parse error:', e);
          }
        };
      } catch (error) {
        this.connecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached', {});
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
      this.connect();
    }, this.reconnectDelay);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('heartbeat', {});
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  subscribe(channels, params = {}) {
    this.send('subscribe', { channels, ...params });
  }

  unsubscribe(channels) {
    this.send('unsubscribe', { channels });
  }

  handleMessage(message) {
    const { type, payload, timestamp } = message;
    
    // Emit specific event
    this.emit(type, { ...payload, timestamp });
    
    // Emit generic message event
    this.emit('message', message);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`WS listener error for ${event}:`, error);
        }
      });
    }
  }

  // Convenience methods for specific channels
  subscribeToPredictions(params = {}) {
    this.subscribe(['predictions'], {
      experiment: 'EXP_D_FULL',
      model: 'xgboost',
      interval_seconds: 60,
      ...params,
    });
  }

  subscribeToMarket(symbol = 'BTCUSDT') {
    this.subscribe(['market'], { symbol });
  }

  subscribeToRegimes(symbol = 'BTCUSDT') {
    this.subscribe(['regimes'], { symbol });
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// React hook for using WebSocket in components
export function useWebSocketService() {
  return wsService;
}

// Specialized hooks for different channels
export function usePredictionsWebSocket(params = {}) {
  const [lastPrediction, setLastPrediction] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    wsService.connect();
    wsService.subscribeToPredictions(params);

    const unsubscribe = wsService.on('prediction', (payload) => {
      const prediction = { ...payload, timestamp: payload.timestamp || new Date().toISOString() };
      setLastPrediction(prediction);
      setHistory(prev => [prediction, ...prev.slice(0, 19)]);
    });

    return () => unsubscribe();
  }, [params]);

  return { lastPrediction, history };
}

export function useMarketWebSocket(symbol = 'BTCUSDT') {
  const [lastCandle, setLastCandle] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);

  useEffect(() => {
    wsService.connect();
    wsService.subscribeToMarket(symbol);

    const unsubscribe = wsService.on('market_update', (payload) => {
      if (payload.candle) {
        setLastCandle(payload.candle);
        setLastPrice(payload.candle.close);
      }
    });

    return () => unsubscribe();
  }, [symbol]);

  return { lastCandle, lastPrice };
}

export function useRegimeWebSocket(symbol = 'BTCUSDT') {
  const [currentRegime, setCurrentRegime] = useState(null);

  useEffect(() => {
    wsService.connect();
    wsService.subscribeToRegimes(symbol);

    const unsubscribe = wsService.on('regime_change', (payload) => {
      setCurrentRegime({
        regime: payload.regime,
        confidence: payload.confidence,
        timestamp: payload.timestamp,
      });
    });

    return () => unsubscribe();
  }, [symbol]);

  return { currentRegime };
}

import { useState, useEffect } from 'react';

export default wsService;
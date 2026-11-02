import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export function useApi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [marketRes, metricsRes, modelsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/market/snapshot`),
        fetch(`${API_BASE}/api/v1/predict/metrics`),
        fetch(`${API_BASE}/api/v1/predict/models`),
      ]);

      const [market, metrics, models] = await Promise.all([
        marketRes.json(),
        metricsRes.json(),
        modelsRes.json(),
      ]);

      setData({ market, metrics, models });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const heartbeatIntervalRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_BASE}/api/v1/ws`);

    ws.onopen = () => {
      console.log('WS Connected');
      setConnected(true);
      reconnectAttempts.current = 0;

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat', payload: {} }));
        }
      }, 30000);

      // Subscribe to channels
      ws.send(JSON.stringify({
        type: 'subscribe',
        payload: {
          channels: ['predictions', 'market', 'regimes'],
          experiment: 'EXP_D_FULL',
          model: 'xgboost',
          interval_seconds: 60
        }
      }));
    };

    ws.onclose = (event) => {
      console.log('WS Disconnected:', event.code, event.reason);
      setConnected(false);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      // Reconnect logic
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 5000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WS Connection Error:', error);
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ack') {
          console.log('WS Ack:', msg.payload);
        } else if (msg.type === 'heartbeat') {
          // Heartbeat response - connection is alive
        } else {
          setLastMessage({ 
            type: msg.type, 
            payload: msg.payload, 
            timestamp: msg.timestamp || new Date().toISOString() 
          });
        }
      } catch (e) {
        console.error('WS Message parse error:', e);
      }
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setConnected(false);
    }
  }, []);

  const send = useCallback((type, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const subscribe = useCallback((channels, params = {}) => {
    send('subscribe', { channels, ...params });
  }, [send]);

  const unsubscribe = useCallback((channels) => {
    send('unsubscribe', { channels });
  }, [send]);

  const subscribeToPredictions = useCallback(() => {
    subscribe(['predictions'], { experiment: 'EXP_D_FULL', model: 'xgboost', interval_seconds: 60 });
  }, [subscribe]);

  const subscribeToMarket = useCallback(() => {
    subscribe(['market']);
  }, [subscribe]);

  const subscribeToRegimes = useCallback(() => {
    subscribe(['regimes']);
  }, [subscribe]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connected,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    subscribeToPredictions,
    subscribeToMarket,
    subscribeToRegimes,
    lastMessage,
  };
}
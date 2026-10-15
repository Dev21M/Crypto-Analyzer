/**
 * API Client for backend communication
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message || 'Network error', 0, { originalError: error });
    }
  }

  get(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    return this.request(url.pathname + url.search);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Market API
export const marketApi = {
  // Get market snapshot for a symbol
  getSnapshot: (symbol = 'BTCUSDT') => 
    apiClient.get(`/api/v1/market/snapshot`, { symbol }),

  // Get historical candles
  getCandles: (symbol = 'BTCUSDT', params = {}) =>
    apiClient.get(`/api/v1/market/candles`, { symbol, ...params }),

  // Get current regime
  getRegime: (symbol = 'BTCUSDT') =>
    apiClient.get(`/api/v1/market/regimes`, { symbol }),

  // Get technical indicators
  getIndicators: (symbol = 'BTCUSDT') =>
    apiClient.get(`/api/v1/market/indicators`, { symbol }),

  // Get market stats
  getStats: () => apiClient.get('/api/v1/market/stats'),

  // Get supported coins
  getCoins: () => apiClient.get('/api/v1/market/coins'),

  // Get market overview
  getOverview: () => apiClient.get('/api/v1/market/overview'),

  // Get top gainers
  getGainers: (limit = 10) => apiClient.get('/api/v1/market/gainers', { limit }),

  // Get top losers
  getLosers: (limit = 10) => apiClient.get('/api/v1/market/losers', { limit }),

  // Search coins
  searchCoins: (query) => apiClient.get('/api/v1/market/search', { q: query }),

  // Get coin details
  getCoinDetails: (symbol) => apiClient.get(`/api/v1/market/coins/${symbol}`),
};

// Prediction API
export const predictionApi = {
  // Get single prediction
  predict: (request) => apiClient.post('/api/v1/predict', request),

  // Get historical predictions
  getHistorical: (request) => apiClient.post('/api/v1/predict/historical', request),

  // List available models
  getModels: () => apiClient.get('/api/v1/predict/models'),

  // Get model metrics
  getMetrics: (params = {}) => apiClient.get('/api/v1/predict/metrics', params),

  // Compare models
  compareModels: (experiment = 'EXP_D_FULL') => 
    apiClient.get('/api/v1/predict/compare', { experiment }),
};

// Health API
export const healthApi = {
  check: () => apiClient.get('/api/v1/health'),
  ready: () => apiClient.get('/api/v1/health/ready'),
};

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient, ApiError };
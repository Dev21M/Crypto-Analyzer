/**
 * Storage Service for localStorage operations with type safety
 */

const STORAGE_PREFIX = 'cryptoanalyzer_';

class StorageService {
  constructor(prefix = STORAGE_PREFIX) {
    this.prefix = prefix;
  }

  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  get(key, defaultValue = null) {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(this._getKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Storage get error for ${key}:`, error);
      return defaultValue;
    }
  }

  set(key, value) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this._getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`Storage set error for ${key}:`, error);
    }
  }

  remove(key) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this._getKey(key));
    } catch (error) {
      console.error(`Storage remove error for ${key}:`, error);
    }
  }

  clear() {
    if (typeof window === 'undefined') return;
    
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  // Watchlist operations
  getWatchlist() {
    return this.get('watchlist', []);
  }

  addToWatchlist(symbol) {
    const watchlist = this.getWatchlist();
    if (!watchlist.includes(symbol)) {
      watchlist.push(symbol);
      this.set('watchlist', watchlist);
    }
    return watchlist;
  }

  removeFromWatchlist(symbol) {
    const watchlist = this.getWatchlist().filter(s => s !== symbol);
    this.set('watchlist', watchlist);
    return watchlist;
  }

  reorderWatchlist(fromIndex, toIndex) {
    const watchlist = this.getWatchlist();
    const [removed] = watchlist.splice(fromIndex, 1);
    watchlist.splice(toIndex, 0, removed);
    this.set('watchlist', watchlist);
    return watchlist;
  }

  // Portfolio operations
  getPortfolio() {
    return this.get('portfolio', []);
  }

  addToPortfolio(asset) {
    const portfolio = this.getPortfolio();
    const existingIndex = portfolio.findIndex(a => a.symbol === asset.symbol);
    
    if (existingIndex >= 0) {
      // Update existing
      const existing = portfolio[existingIndex];
      const newQuantity = existing.quantity + asset.quantity;
      const newAvgPrice = ((existing.quantity * existing.avgPrice) + (asset.quantity * asset.avgPrice)) / newQuantity;
      portfolio[existingIndex] = { ...existing, quantity: newQuantity, avgPrice: newAvgPrice };
    } else {
      // Add new
      portfolio.push({ ...asset, id: Date.now().toString() });
    }
    
    this.set('portfolio', portfolio);
    return portfolio;
  }

  updatePortfolioAsset(assetId, updates) {
    const portfolio = this.getPortfolio();
    const index = portfolio.findIndex(a => a.id === assetId);
    
    if (index >= 0) {
      portfolio[index] = { ...portfolio[index], ...updates };
      this.set('portfolio', portfolio);
    }
    
    return portfolio;
  }

  removeFromPortfolio(assetId) {
    const portfolio = this.getPortfolio().filter(a => a.id !== assetId);
    this.set('portfolio', portfolio);
    return portfolio;
  }

  // Settings operations
  getSettings() {
    return this.get('settings', {});
  }

  setSettings(settings) {
    this.set('settings', settings);
  }

  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.set('settings', settings);
    return settings;
  }

  // User preferences
  getPreferences() {
    return this.get('preferences', {});
  }

  setPreferences(preferences) {
    this.set('preferences', preferences);
  }

  // Theme
  getTheme() {
    return this.get('theme', 'system');
  }

  setTheme(theme) {
    this.set('theme', theme);
  }

  // Recently viewed coins
  getRecentCoins(limit = 10) {
    return this.get('recent_coins', []).slice(0, limit);
  }

  addRecentCoin(symbol) {
    const recent = this.getRecentCoins(50);
    const filtered = recent.filter(s => s !== symbol);
    filtered.unshift(symbol);
    this.set('recent_coins', filtered);
    return filtered;
  }

  // Dismissed alerts/notifications
  getDismissedAlerts() {
    return this.get('dismissed_alerts', []);
  }

  dismissAlert(alertId) {
    const dismissed = this.getDismissedAlerts();
    if (!dismissed.includes(alertId)) {
      dismissed.push(alertId);
      this.set('dismissed_alerts', dismissed);
    }
    return dismissed;
  }

  isAlertDismissed(alertId) {
    return this.getDismissedAlerts().includes(alertId);
  }

  // Export/Import
  exportData() {
    const data = {};
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => {
        data[key.replace(this.prefix, '')] = JSON.parse(localStorage.getItem(key));
      });
    return data;
  }

  importData(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
}

export const storage = new StorageService();

export default storage;
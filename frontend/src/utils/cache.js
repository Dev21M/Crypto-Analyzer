/**
 * API Response Cache with Request Deduplication
 * 
 * Provides:
 * - In-memory caching with TTL
 * - Request deduplication (prevents duplicate in-flight requests)
 * - Cache invalidation by key pattern
 * - Cache statistics for debugging
 */

// Default cache TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// In-memory cache store
const cache = new Map();

// In-flight request tracking for deduplication
const inflightRequests = new Map();

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  deduplicated: 0,
};

/**
 * Generate a cache key from endpoint and params
 */
function generateCacheKey(endpoint, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}

/**
 * Get cached data if valid
 */
function getCachedData(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  cacheStats.hits++;
  return entry.data;
}

/**
 * Set data in cache
 */
function setCachedData(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear cache by key pattern
 */
function invalidateCache(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
function clearAllCache() {
  cache.clear();
  inflightRequests.clear();
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.deduplicated = 0;
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return { ...cacheStats, size: cache.size };
}

/**
 * Make a cached GET request with deduplication
 */
async function cachedGet(apiClient, endpoint, params = {}, options = {}) {
  const { ttl = DEFAULT_TTL, forceRefresh = false, deduplicate = true } = options;
  const key = generateCacheKey(endpoint, params);
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = getCachedData(key);
    if (cachedData !== null) {
      return cachedData;
    }
  }
  
  // Check for in-flight request (deduplication)
  if (deduplicate && inflightRequests.has(key)) {
    cacheStats.deduplicated++;
    try {
      const data = await inflightRequests.get(key);
      return data;
    } catch (error) {
      // If the in-flight request failed, remove it and continue with new request
      inflightRequests.delete(key);
    }
  }
  
  cacheStats.misses++;
  
  // Create the request promise using the UNCACHED request method to avoid recursion
  const requestPromise = apiClient.getUncached(endpoint, params);
  
  // Store in-flight request for deduplication
  if (deduplicate) {
    inflightRequests.set(key, requestPromise);
  }
  
  try {
    const data = await requestPromise;
    
    // Cache the successful response
    setCachedData(key, data, ttl);
    
    return data;
  } catch (error) {
    // Remove from cache on error
    cache.delete(key);
    throw error;
  } finally {
    // Clean up in-flight request
    inflightRequests.delete(key);
  }
}
 
/**
 * Clear all cache
 */
async function prefetchData(apiClient, endpoint, params = {}, options = {}) {
  const { ttl = DEFAULT_TTL } = options;
  const key = generateCacheKey(endpoint, params);
  
  // Skip if already cached
  if (getCachedData(key)) {
    return getCachedData(key);
  }
  
  try {
    const data = await apiClient.getUncached(endpoint, params);
    setCachedData(key, data, ttl);
    return data;
  } catch (error) {
    console.warn(`Prefetch failed for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Invalidate cache for a specific symbol
 */
function invalidateSymbolCache(symbol) {
  const upperSymbol = symbol.toUpperCase();
  invalidateCache(`${upperSymbol}`);
  invalidateCache(`overview`);
  invalidateCache(`coins`);
}

export {
  cachedGet,
  prefetchData,
  invalidateCache,
  invalidateSymbolCache,
  getCacheStats,
  clearAllCache,
  DEFAULT_TTL
};
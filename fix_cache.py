with open(r'D:\CryptoAnalyzer\frontend\src\utils\cache.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add clearAllCache function before prefetchData
old = """}
/*
 * Clear all cache
 */
async function prefetchData"""
new = """}

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
 * Prefetch data and store in cache
 */
async function prefetchData"""

content = content.replace(old, new)

with open(r'D:\CryptoAnalyzer\frontend\src\utils\cache.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
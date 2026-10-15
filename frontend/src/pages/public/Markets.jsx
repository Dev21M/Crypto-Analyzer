import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, TrendingUp, TrendingDown, BarChart3, RefreshCw as RefreshCwIcon, AlertTriangle, Zap } from 'lucide-react';
import { Button, Card, MetricCard, Table, createColumn, Badge, Avatar, Input, Select, Skeleton } from '../../components/ui';
import { marketApi } from '../../services/api';
import { formatPrice, formatChange, formatCompactNumber, formatMarketCap } from '../../utils/formatters';

export function Markets() {
  const [overview, setOverview] = useState(null);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, gainers, losers

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, gainersData, losersData, coinsData] = await Promise.all([
        marketApi.getOverview(),
        marketApi.getGainers(20),
        marketApi.getLosers(20),
        marketApi.getCoins(),
      ]);
      setOverview(overviewData);
      setGainers(gainersData || []);
      setLosers(losersData || []);
      setCoins(coinsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoins = useMemo(() => {
    let result = [...coins];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(coin => 
        coin.symbol.toLowerCase().includes(query) ||
        coin.name.toLowerCase().includes(query)
      );
    }

    // Gainers/Losers filter - we need to merge with gainers/losers data for price info
    if (filter === 'gainers') {
      const gainerSymbols = new Set(gainers.map(g => g.symbol));
      result = result.filter(c => gainerSymbols.has(c.symbol));
    } else if (filter === 'losers') {
      const loserSymbols = new Set(losers.map(l => l.symbol));
      result = result.filter(c => loserSymbols.has(c.symbol));
    }

    return result;
  }, [coins, gainers, losers, searchQuery, filter]);

  // Create a map for quick price lookups
  const priceMap = useMemo(() => {
    const map = new Map();
    [...gainers, ...losers].forEach(c => {
      map.set(c.symbol, c);
    });
    return map;
  }, [gainers, losers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <main className="flex-1">
          <div className="container py-16">
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-8 w-1/4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary">
        <main className="flex-1">
          <div className="container py-16 text-center">
            <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
            <p className="text-danger mb-4">Failed to load markets: {error}</p>
            <Button onClick={loadMarketData}>
              <RefreshCwIcon size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isLive = overview?.isLive === true;
  const dataSource = overview?.source || 'Static data';

  return (
    <div className="min-h-screen bg-primary">
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold">All Markets</h2>
              <p className="text-muted mt-1">Track cryptocurrency prices, changes, and volumes</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <Input
                  placeholder="Search coins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  leftIcon={<Search size={18} />}
                />
              </div>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'gainers', label: 'Gainers' },
                  { value: 'losers', label: 'Losers' },
                ]}
                className="w-40"
              />
            </div>
          </div>

          {/* Market Status Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 p-4 bg-secondary/50 border border-primary/50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${isLive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                {isLive ? 'Live Data' : 'Static Data'}
              </span>
              <span className="text-sm text-muted">Source: {dataSource}</span>
              <span className="text-sm text-muted">Updated {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Market Overview Stats */}
          {overview && (
            <div className="metrics-grid mb-8">
              {overview.btc && (
                <MetricCard
                  label="Bitcoin (BTC)"
                  value={formatPrice(overview.btc.price)}
                  change={overview.btc.change24h}
                  trend={overview.btc.change24h >= 0 ? 'up' : 'down'}
                  icon={<TrendingUp size={24} />}
                />
              )}
              {overview.eth && (
                <MetricCard
                  label="Ethereum (ETH)"
                  value={formatPrice(overview.eth.price)}
                  change={overview.eth.change24h}
                  trend={overview.eth.change24h >= 0 ? 'up' : 'down'}
                  icon={<TrendingUp size={24} />}
                />
              )}
              <MetricCard
                label="Total Market Cap"
                value={formatMarketCap(overview.totalMarketCap || 0)}
                change={overview.marketCapChange24h}
                trend={overview.marketCapChange24h >= 0 ? 'up' : 'down'}
                icon={<BarChart3 size={24} />}
              />
              <MetricCard
                label="24h Volume"
                value={formatCompactNumber(overview.totalVolume || 0, { currency: true })}
                icon={<TrendingUp size={24} />}
              />
              <MetricCard
                label="BTC Dominance"
                value={overview.btcDominance ? `${overview.btcDominance.toFixed(1)}%` : '—'}
                icon={<TrendingDown size={24} />}
              />
              <MetricCard
                label="Fear & Greed"
                value={overview.fearGreedIndex || '—'}
                change={overview.fearGreedLabel}
                icon={<TrendingUp size={24} />}
              />
            </div>
          )}

          {/* Top Gainers & Losers */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Gainers */}
            <Card>
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-success" size={20} />
                  <h3 className="text-lg font-semibold">Top Gainers (24h)</h3>
                </div>
              </div>
              <div className="card-content p-0">
                <div className="overflow-x-auto">
                  <table className="market-table w-full">
                    <thead>
                      <tr className="border-b border-primary">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Coin</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">24h Change</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gainers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-muted">No gainer data available</td>
                        </tr>
                      ) : (
                        gainers.slice(0, 10).map((coin) => (
                          <tr key={coin.symbol} className="border-b border-primary/50 hover:bg-hover transition-colors">
                            <td className="px-4 py-3">
                              <Link to={`/coin/${coin.symbol}`} className="flex items-center gap-3">
                                <div className="coin-avatar" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                                  {coin.symbol.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">{coin.name}</p>
                                  <p className="text-sm text-muted">{coin.symbol}</p>
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">{formatPrice(coin.price)}</td>
                            <td className="px-4 py-3 text-right text-success font-medium">+{coin.change24h?.toFixed(2)}%</td>
                            <td className="px-4 py-3 text-right text-muted font-mono">{formatCompactNumber(coin.volume, { currency: true })}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Losers */}
            <Card>
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <TrendingDown className="text-danger" size={20} />
                  <h3 className="text-lg font-semibold">Top Losers (24h)</h3>
                </div>
              </div>
              <div className="card-content p-0">
                <div className="overflow-x-auto">
                  <table className="market-table w-full">
                    <thead>
                      <tr className="border-b border-primary">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Coin</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">24h Change</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {losers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-muted">No loser data available</td>
                        </tr>
                      ) : (
                        losers.slice(0, 10).map((coin) => (
                          <tr key={coin.symbol} className="border-b border-primary/50 hover:bg-hover transition-colors">
                            <td className="px-4 py-3">
                              <Link to={`/coin/${coin.symbol}`} className="flex items-center gap-3">
                                <div className="coin-avatar" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                                  {coin.symbol.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium">{coin.name}</p>
                                  <p className="text-sm text-muted">{coin.symbol}</p>
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">{formatPrice(coin.price)}</td>
                            <td className="px-4 py-3 text-right text-danger font-medium">{coin.change24h?.toFixed(2)}%</td>
                            <td className="px-4 py-3 text-right text-muted font-mono">{formatCompactNumber(coin.volume, { currency: true })}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* All Coins Table (with basic info only) */}
          <Card>
            <div className="card-header">
              <h3 className="text-lg font-semibold">All Trading Pairs</h3>
              <p className="text-sm text-muted mt-1">Click a coin to view detailed analysis</p>
            </div>
            <div className="card-content p-0">
              <div className="overflow-x-auto">
                <table className="market-table w-full">
                  <thead>
                    <tr className="border-b border-primary">
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Coin</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">24h Change</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoins.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted">No coins found</td>
                      </tr>
                    ) : (
                      filteredCoins.slice(0, 100).map((coin) => {
                        const priceData = priceMap.get(coin.symbol);
                        return (
                          <tr key={coin.symbol} className="border-b border-primary/50 hover:bg-hover transition-colors">
                            <td className="px-4 py-3">
                              <Link to={`/coin/${coin.symbol}`} className="flex items-center gap-3">
                                <div className="coin-avatar" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                                  {coin.symbol.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{coin.name}</p>
                                  <p className="text-sm text-muted">{coin.symbol}</p>
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {priceData ? formatPrice(priceData.price) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {priceData ? (
                                <span className={priceData.change24h >= 0 ? 'text-success' : 'text-danger'}>
                                  {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h?.toFixed(2)}%
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-muted font-mono">
                              {priceData ? formatCompactNumber(priceData.volume, { currency: true }) : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
        </div>
      </main>
    </div>
  );
}

export default Markets;
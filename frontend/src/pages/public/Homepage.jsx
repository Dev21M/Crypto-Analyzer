import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Zap, BarChart3, Target, Shield, Users, BookOpen, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { Button, Card, MetricCard, Badge, Avatar, Skeleton } from '../../components/ui';
import { marketApi } from '../../services/api';
import { formatPrice, formatChange, formatCompactNumber, formatMarketCap } from '../../utils/formatters';
import { TIMEFRAMES } from '../../utils/constants';

export function Homepage() {
  const [marketOverview, setMarketOverview] = useState(null);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overview, gainersData, losersData] = await Promise.all([
        marketApi.getOverview(),
        marketApi.getGainers(10),
        marketApi.getLosers(10),
      ]);
      setMarketOverview(overview);
      setGainers(gainersData || []);
      setLosers(losersData || []);
    } catch (err) {
      console.error('Failed to load market data:', err);
      setError(err.message || 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <main className="flex-1">
          <HeroSkeleton />
          <MarketOverviewSkeleton />
          <GainersLosersSkeleton />
        </main>
      </div>
    );
  }

  const isLive = marketOverview?.isLive === true;
  const dataSource = marketOverview?.source || 'Static data';

  return (
    <div className="min-h-screen bg-primary">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-badge">
              <Shield size={14} />
              Professional Cryptocurrency Analysis Platform
            </div>
            <h1 className="hero-title">
              Understand the Crypto Market with Data-Driven Analysis
            </h1>
            <p className="hero-subtitle">
              Explore cryptocurrency markets, technical indicators, market trends, and AI-assisted insights.
              Real-time data • AI predictions • Technical analysis
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => document.getElementById('markets-section')?.scrollIntoView()}>
                <Search size={18} className="mr-2" />
                Analyze Coin
              </Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById('markets-section')?.scrollIntoView()}>
                <BarChart3 size={18} className="mr-2" />
                Explore Markets
              </Button>
            </div>
          </div>
        </section>

        {/* Market Overview */}
        <section id="markets-section" className="section bg-secondary">
          <div className="container">
            <div className="section-header flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="section-title">Market Overview</h2>
                <p className="section-subtitle">Real-time market statistics</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${isLive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-success' : 'bg-warning'} animate-pulse`} />
                  {isLive ? 'Live' : 'Static Data'}
                </span>
                <span className="text-muted">Source: {dataSource}</span>
                <span className="text-muted">Updated {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="metrics-grid">
              {marketOverview?.btc && (
                <MetricCard
                  label="Bitcoin (BTC)"
                  value={formatPrice(marketOverview.btc.price, 'USDT')}
                  change={marketOverview.btc.change24h}
                  trend={marketOverview.btc.change24h >= 0 ? 'up' : 'down'}
                  icon={<TrendingUp size={24} />}
                />
              )}
              {marketOverview?.eth && (
                <MetricCard
                  label="Ethereum (ETH)"
                  value={formatPrice(marketOverview.eth.price, 'USDT')}
                  change={marketOverview.eth.change24h}
                  trend={marketOverview.eth.change24h >= 0 ? 'up' : 'down'}
                  icon={<TrendingUp size={24} />}
                />
              )}
              <MetricCard
                label="Total Market Cap"
                value={formatMarketCap(marketOverview?.totalMarketCap || 0)}
                change={marketOverview?.marketCapChange24h}
                trend={marketOverview?.marketCapChange24h >= 0 ? 'up' : 'down'}
                icon={<BarChart3 size={24} />}
              />
              <MetricCard
                label="24h Volume"
                value={formatCompactNumber(marketOverview?.totalVolume || 0, { currency: true })}
                icon={<Zap size={24} />}
              />
              <MetricCard
                label="BTC Dominance"
                value={marketOverview?.btcDominance ? `${marketOverview.btcDominance.toFixed(1)}%` : '—'}
                icon={<Target size={24} />}
              />
              <MetricCard
                label="Fear & Greed"
                value={marketOverview?.fearGreedIndex || '—'}
                change={marketOverview?.fearGreedLabel}
                icon={<Shield size={24} />}
              />
            </div>
          </div>
        </section>

        {/* Top Gainers & Losers */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Top Movers</h2>
              <p className="section-subtitle">Biggest gainers and losers in the last 24h</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Gainers */}
              <Card>
                <div className="card-header">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <TrendingUp className="text-success" size={20} />
                      Top Gainers
                    </h3>
                  </div>
                </div>
                <div className="card-content p-0">
                  <div className="overflow-x-auto">
                    <table className="market-table w-full">
                      <thead>
                        <tr>
                          <th className="text-left px-4 py-3">Coin</th>
                          <th className="text-right px-4 py-3">Price</th>
                          <th className="text-right px-4 py-3">24h Change</th>
                          <th className="text-right px-4 py-3">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gainers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-muted">
                              No gainer data available
                            </td>
                          </tr>
                        ) : (
                          gainers.slice(0, 10).map((coin, index) => (
                            <tr key={coin.symbol} className="border-b border-primary/50 hover:bg-hover transition-colors">
                              <td className="px-4 py-3">
                                <Link to={`/coin/${coin.symbol}`} className="coin-cell">
                                  <div className="coin-avatar" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                                    {coin.symbol.charAt(0)}
                                  </div>
                                  <div className="coin-info">
                                    <span className="coin-symbol">{coin.name}</span>
                                    <span className="coin-name">{coin.symbol}</span>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-right price-cell">{formatPrice(coin.price)}</td>
                              <td className="px-4 py-3 text-right">
                                <span className="change-cell positive">+{coin.change24h?.toFixed(2)}%</span>
                              </td>
                              <td className="px-4 py-3 text-right volume-cell text-muted">
                                {formatCompactNumber(coin.volume, { currency: true })}
                              </td>
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
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <TrendingDown className="text-danger" size={20} />
                      Top Losers
                    </h3>
                  </div>
                </div>
                <div className="card-content p-0">
                  <div className="overflow-x-auto">
                    <table className="market-table w-full">
                      <thead>
                        <tr>
                          <th className="text-left px-4 py-3">Coin</th>
                          <th className="text-right px-4 py-3">Price</th>
                          <th className="text-right px-4 py-3">24h Change</th>
                          <th className="text-right px-4 py-3">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {losers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-muted">
                              No loser data available
                            </td>
                          </tr>
                        ) : (
                          losers.slice(0, 10).map((coin) => (
                            <tr key={coin.symbol} className="border-b border-primary/50 hover:bg-hover transition-colors">
                              <td className="px-4 py-3">
                                <Link to={`/coin/${coin.symbol}`} className="coin-cell">
                                  <div className="coin-avatar" style={{ background: `hsl(${coin.symbol.charCodeAt(0) * 10} 70% 50%)` }}>
                                    {coin.symbol.charAt(0)}
                                  </div>
                                  <div className="coin-info">
                                    <span className="coin-symbol">{coin.name}</span>
                                    <span className="coin-name">{coin.symbol}</span>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-right price-cell">{formatPrice(coin.price)}</td>
                              <td className="px-4 py-3 text-right">
                                <span className="change-cell negative">{coin.change24h?.toFixed(2)}%</span>
                              </td>
                              <td className="px-4 py-3 text-right volume-cell text-muted">
                                {formatCompactNumber(coin.volume, { currency: true })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section bg-secondary">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="section-title">Why CryptoAnalyzer?</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Professional-grade tools for cryptocurrency analysis, combining real-time data, 
                technical indicators, and machine learning predictions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="feature-card">
                <div className="feature-icon bg-primary/10 text-primary">
                  <Zap size={28} />
                </div>
                <h4 className="feature-title">AI-Powered Predictions</h4>
                <p className="feature-description">
                  Machine learning models trained on historical data to predict price direction and returns across multiple timeframes.
                </p>
              </Card>
              <Card className="feature-card">
                <div className="feature-icon bg-primary/10 text-primary">
                  <BarChart3 size={28} />
                </div>
                <h4 className="feature-title">Technical Analysis</h4>
                <p className="feature-description">
                  Comprehensive suite of technical indicators including RSI, MACD, Bollinger Bands, moving averages, and more.
                </p>
              </Card>
              <Card className="feature-card">
                <div className="feature-icon bg-primary/10 text-primary">
                  <Target size={28} />
                </div>
                <h4 className="feature-title">Market Regime Detection</h4>
                <p className="feature-description">
                  Automated identification of market regimes (bullish, bearish, sideways, high volatility) with confidence scores.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section text-center">
          <div className="container">
            <Card className="bg-primary/50 border-primary/50 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Ready to Analyze?</h3>
              <p className="text-muted mb-6">Start exploring cryptocurrency markets with professional tools.</p>
              <Button size="lg" onClick={() => document.getElementById('markets-section')?.scrollIntoView()}>
                <Search size={18} className="mr-2" />
                Analyze Coin
              </Button>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="h-full text-center p-6 hover:border-primary/50 transition-colors">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-bg text-primary mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-muted">{description}</p>
    </Card>
  );
}

// Skeleton components for loading states
function HeroSkeleton() {
  return (
    <section className="hero">
      <div className="container max-w-2xl mx-auto">
        <Skeleton className="h-6 w-1/3 mx-auto mb-6" />
        <Skeleton className="h-10 w-full mb-6" />
        <Skeleton className="h-8 w-2/3 mx-auto mb-8" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-40" />
        </div>
        <div className="mt-10 max-w-2xl mx-auto">
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </section>
  );
}

function MarketOverviewSkeleton() {
  return (
    <section className="section bg-secondary">
      <div className="container">
        <Skeleton className="h-6 w-1/4 mb-8" />
        <div className="metrics-grid">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    </section>
  );
}

function GainersLosersSkeleton() {
  return (
    <section className="section">
      <div className="container">
        <Skeleton className="h-6 w-1/4 mb-8" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </section>
  );
}

export default Homepage;
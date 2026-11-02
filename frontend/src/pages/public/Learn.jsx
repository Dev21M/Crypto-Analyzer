import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Zap, Target, BarChart3, Shield, TrendingUp, ArrowRight, ChevronRight, Play, Clock, Users, GraduationCap, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';

const categories = [
  {
    id: 'basics',
    title: 'Crypto Basics',
    description: 'Fundamental concepts for beginners',
    icon: GraduationCap,
    color: 'bg-blue-500',
    articles: [
      { title: 'What is Cryptocurrency?', readTime: '5 min', level: 'Beginner' },
      { title: 'How Blockchain Works', readTime: '8 min', level: 'Beginner' },
      { title: 'Understanding Wallets & Keys', readTime: '6 min', level: 'Beginner' },
      { title: 'Exchanges: CEX vs DEX', readTime: '7 min', level: 'Beginner' },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Analysis',
    description: 'Chart reading and indicator mastery',
    icon: BarChart3,
    color: 'bg-green-500',
    articles: [
      { title: 'Candlestick Patterns Guide', readTime: '12 min', level: 'Intermediate' },
      { title: 'RSI & MACD Strategies', readTime: '10 min', level: 'Intermediate' },
      { title: 'Bollinger Bands & Volatility', readTime: '9 min', level: 'Intermediate' },
      { title: 'Volume Analysis Techniques', readTime: '8 min', level: 'Advanced' },
    ],
  },
  {
    id: 'indicators',
    title: 'Market Indicators',
    description: 'On-chain and off-chain metrics',
    icon: Target,
    color: 'bg-purple-500',
    articles: [
      { title: 'Fear & Greed Index Explained', readTime: '5 min', level: 'Beginner' },
      { title: 'Bitcoin Dominance & Alt Seasons', readTime: '7 min', level: 'Intermediate' },
      { title: 'Funding Rates & Open Interest', readTime: '10 min', level: 'Advanced' },
      { title: 'Stablecoin Flows Analysis', readTime: '8 min', level: 'Advanced' },
    ],
  },
  {
    id: 'ai',
    title: 'AI & Quantitative',
    description: 'Machine learning in crypto trading',
    icon: Zap,
    color: 'bg-orange-500',
    articles: [
      { title: 'How ML Models Predict Price', readTime: '15 min', level: 'Advanced' },
      { title: 'Backtesting Strategies', readTime: '12 min', level: 'Advanced' },
      { title: 'Risk Management with AI', readTime: '10 min', level: 'Intermediate' },
      { title: 'Model Evaluation Metrics', readTime: '8 min', level: 'Advanced' },
    ],
  },
  {
    id: 'risk',
    title: 'Risk Management',
    description: 'Protect your capital',
    icon: Shield,
    color: 'bg-red-500',
    articles: [
      { title: 'Position Sizing Rules', readTime: '6 min', level: 'Beginner' },
      { title: 'Stop Loss Strategies', readTime: '8 min', level: 'Intermediate' },
      { title: 'Portfolio Diversification', readTime: '10 min', level: 'Intermediate' },
      { title: 'Psychology of Trading', readTime: '7 min', level: 'Beginner' },
    ],
  },
];

const featuredArticles = [
  {
    title: 'Complete Guide to Crypto Technical Analysis',
    description: 'Master chart patterns, indicators, and trading strategies with this comprehensive guide.',
    readTime: '25 min',
    level: 'All Levels',
    category: 'Technical Analysis',
    featured: true,
  },
  {
    title: 'Understanding Market Regimes: Bull, Bear, and Sideways',
    description: 'Learn how to identify and adapt to different market conditions using regime detection.',
    readTime: '15 min',
    level: 'Intermediate',
    category: 'Market Analysis',
    featured: true,
  },
  {
    title: 'AI Price Predictions: What They Can and Cannot Tell You',
    description: 'A realistic look at machine learning predictions in cryptocurrency markets.',
    readTime: '12 min',
    level: 'All Levels',
    category: 'AI & Quantitative',
    featured: true,
  },
];

const externalResources = [
  {
    icon: <BookOpen size={28} />,
    title: 'Glossary',
    description: 'Comprehensive dictionary of crypto terms, acronyms, and jargon.',
    link: 'https://www.coinbase.com/learn/crypto-glossary',
    external: true,
  },
  {
    icon: <Zap size={28} />,
    title: 'API Documentation',
    description: 'Integrate CryptoAnalyzer data into your own applications.',
    link: '/api-docs',
    external: false,
    comingSoon: true,
  },
  {
    icon: <Users size={28} />,
    title: 'Community Forum',
    description: 'Discuss strategies, share insights, and learn from other analysts.',
    link: 'https://github.com/cryptoanalyzer/discussions',
    external: true,
  },
];

export function Learn() {
  return (
    <div className="min-h-screen bg-primary">
      <main className="flex-1">
        {/* Hero */}
        <section className="hero" aria-labelledby="learn-hero-title">
          <div className="container">
            <div className="hero-badge">
              <GraduationCap size={14} aria-hidden="true" />
              Free Educational Resources
            </div>
            <h1 id="learn-hero-title" className="hero-title">
              Learn Crypto Analysis
            </h1>
            <p className="hero-subtitle">
              Master cryptocurrency markets with structured guides, tutorials, and expert insights.
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}>
                <GraduationCap size={18} className="mr-2" aria-hidden="true" />
                Start Learning
              </Button>
            </div>

            {/* Featured Articles */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-6">Featured Articles</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredArticles.map((article) => (
                  <FeaturedArticleCard key={article.title} article={article} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="section bg-secondary" aria-labelledby="categories-title">
          <div className="container">
            <div className="text-center mb-12">
              <h2 id="categories-title" className="section-title">Learning Paths</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Choose a track that matches your goals. Each path builds progressively from fundamentals to advanced concepts.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Learning Resources */}
        <section className="section" aria-labelledby="resources-title">
          <div className="container">
            <div className="text-center mb-12">
              <h2 id="resources-title" className="section-title">Additional Resources</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                External tools, references, and community resources to support your learning journey.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {externalResources.map((resource) => (
                <ResourceCard key={resource.title} {...resource} />
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="section text-center" aria-labelledby="newsletter-title">
          <div className="container">
            <Card className="bg-primary/50 border-primary/50 max-w-2xl mx-auto">
              <h3 id="newsletter-title" className="text-2xl font-bold mb-4">Stay Updated</h3>
              <p className="text-muted mb-6">
                Get the latest analysis, market insights, and learning resources delivered to your inbox.
              </p>
              <NewsletterForm />
              <p className="text-xs text-muted mt-4">
                No spam. Unsubscribe anytime. <a href="/privacy" className="underline">Privacy Policy</a>
              </p>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeaturedArticleCard({ article }) {
  return (
    <article className="h-full overflow-hidden hover:border-primary/50 transition-colors">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <Play size={48} className="text-white/80" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-primary/90 to-transparent">
          <span className="text-xs font-medium text-white/80">{article.readTime} • {article.level}</span>
        </div>
      </div>
      <div className="p-5">
        <Badge variant="info" className="mb-2">{article.category}</Badge>
        <h4 className="font-semibold text-lg mb-2 line-clamp-2">{article.title}</h4>
        <p className="text-muted text-sm mb-4 line-clamp-3">{article.description}</p>
        <Button variant="ghost" size="sm" className="w-full justify-start" disabled aria-disabled="true">
          Read Article <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

function CategoryCard({ category }) {
  const Icon = category.icon;
  return (
    <article className="h-full p-6 text-center hover:border-primary/50 transition-colors">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${category.color} mb-4`} aria-hidden="true">
        <Icon size={28} className="text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
      <p className="text-muted mb-6">{category.description}</p>
      <div className="space-y-2 text-left">
        {category.articles.map((article) => (
          <div key={article.title} className="flex items-center justify-between p-3 bg-tertiary/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">{article.title}</p>
              <p className="text-xs text-muted">{article.readTime} • {article.level}</p>
            </div>
            <ChevronRight size={16} className="text-muted" aria-hidden="true" />
          </div>
        ))}
      </div>
      <Button variant="primary" className="w-full mt-6" size="lg" disabled aria-disabled="true">
        Start Learning <ArrowRight size={16} aria-hidden="true" />
      </Button>
    </article>
  );
}

function ResourceCard({ icon, title, description, link, external, comingSoon }) {
  return (
    <article className="h-full p-6 text-center hover:border-primary/50 transition-colors">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-bg text-primary mb-4" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted mb-4">{description}</p>
      {comingSoon ? (
        <Badge variant="warning" className="mb-2">Coming Soon</Badge>
      ) : null}
      <Button 
        variant={external ? "secondary" : "ghost"} 
        size="sm"
        disabled={comingSoon}
        aria-disabled={comingSoon}
      >
        {external ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            Explore <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : comingSoon ? (
          <span>Explore <ArrowRight size={14} aria-hidden="true" /></span>
        ) : (
          <Link to={link}>Explore <ArrowRight size={14} aria-hidden="true" /></Link>
        )}
      </Button>
    </article>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setStatus('submitting');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1000);
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg text-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="font-medium">Thanks for subscribing!</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStatus('idle')}>
          Subscribe with another email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" noValidate>
      <div className="relative flex-1">
        <input
          type="email"
          placeholder="Enter your email"
          className="form-input flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-describedby={error ? 'email-error' : undefined}
          aria-invalid={!!error}
          disabled={status === 'submitting'}
        />
        {error && (
          <p id="email-error" className="form-error" role="alert">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={status === 'submitting' || status === 'success'}>
        {status === 'submitting' ? (
          <>
            <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="visually-hidden">Subscribing...</span>
          </>
        ) : (
          'Subscribe'
        )}
      </Button>
    </form>
  );
}

export default Learn;
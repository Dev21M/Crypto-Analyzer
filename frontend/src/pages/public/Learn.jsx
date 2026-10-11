import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Zap, Target, BarChart3, Shield, TrendingUp, ArrowRight, ChevronRight, Play, Clock, Users, GraduationCap } from 'lucide-react';
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

export function Learn() {
  return (
    <div className="min-h-screen bg-primary">
      <main className="flex-1">
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <div className="hero-badge">
              <GraduationCap size={14} />
              Free • Self-paced • Expert-led
            </div>
            <h1 className="hero-title">
              Learn Crypto Analysis
            </h1>
            <p className="hero-subtitle">
              Master cryptocurrency markets with structured courses, tutorials, and expert insights.
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => document.getElementById('categories')?.scrollIntoView()}>
                <GraduationCap size={18} className="mr-2" />
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
        <section id="categories" className="section bg-secondary">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="section-title">Learning Paths</h2>
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
        <section className="section">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="section-title">Additional Resources</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Tools, references, and community resources to support your learning journey.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <ResourceCard
                icon={<BookOpen size={28} />}
                title="Glossary"
                description="Comprehensive dictionary of crypto terms, acronyms, and jargon."
                link="/glossary"
              />
              <ResourceCard
                icon={<Zap size={28} />}
                title="API Documentation"
                description="Integrate CryptoAnalyzer data into your own applications."
                link="/api-docs"
              />
              <ResourceCard
                icon={<Users size={28} />}
                title="Community Forum"
                description="Discuss strategies, share insights, and learn from other analysts."
                link="/community"
              />
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="section text-center">
          <div className="container">
            <Card className="bg-primary/50 border-primary/50 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
              <p className="text-muted mb-6">
                Get the latest analysis, market insights, and learning resources delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="form-input flex-1"
                  required
                />
                <Button type="submit" size="lg">
                  Subscribe
                </Button>
              </form>
              <p className="text-xs text-muted mt-4">
                No spam. Unsubscribe anytime. <Link to="/privacy" className="underline">Privacy Policy</Link>
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
    <Card className="h-full overflow-hidden hover:border-primary/50 transition-colors">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
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
        <Button variant="ghost" size="sm" className="w-full justify-start">
          Read Article <ArrowRight size={14} />
        </Button>
      </div>
    </Card>
  );
}

function CategoryCard({ category }) {
  const Icon = category.icon;
  return (
    <Link to={`/learn/${category.id}`} className="group">
      <Card className="h-full p-6 text-center hover:border-primary/50 transition-colors">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${category.color} mb-4`}>
          <Icon size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
        <p className="text-muted mb-6">{category.description}</p>
        <div className="space-y-2 text-left">
          {category.articles.map((article) => (
            <div key={article.title} className="flex items-center justify-between p-3 bg-tertiary/50 rounded-lg group-hover:bg-tertiary transition-colors">
              <div>
                <p className="font-medium text-sm">{article.title}</p>
                <p className="text-xs text-muted">{article.readTime} • {article.level}</p>
              </div>
              <ChevronRight size={16} className="text-muted group-hover:text-primary transition-colors" />
            </div>
          ))}
        </div>
        <Button variant="primary" className="w-full mt-6" size="lg">
          Start Learning <ArrowRight size={16} />
        </Button>
      </Card>
    </Link>
  );
}

function ResourceCard({ icon, title, description, link }) {
  return (
    <Link to={link} className="group">
      <Card className="h-full p-6 text-center hover:border-primary/50 transition-colors">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-bg text-primary mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted mb-4">{description}</p>
        <Button variant="ghost" size="sm">
          Explore <ArrowRight size={14} />
        </Button>
      </Card>
    </Link>
  );
}

export default Learn;
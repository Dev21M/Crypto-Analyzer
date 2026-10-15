import React, { useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Header } from './Header';
import { useTheme } from '../../hooks/useTheme';
import { LayoutDashboard, BarChart3, Search, Zap, BookOpen } from 'lucide-react';

export function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // For public layout, we don't have a persistent sidebar, just the header
  const handleMenuClick = useCallback(() => setSidebarOpen(true), []);
  const handleToggleSidebar = useCallback(() => {}, []);

  const publicNavItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard, exact: true },
    { path: '/markets', label: 'Markets', icon: BarChart3 },
    { path: '/analysis', label: 'Coin Analysis', icon: Search },
    { path: '/predictions', label: 'Predictions', icon: Zap },
    { path: '/learn', label: 'Learn', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Header
        title=""
        onMenuClick={handleMenuClick}
        sidebarCollapsed={false}
        onToggleSidebar={handleToggleSidebar}
        wsStatus="disconnected"
        onThemeToggle={toggleTheme}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="footer border-t border-primary bg-secondary/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4" aria-label="CryptoAnalyzer Home">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="url(#footer-logo-gradient)"/>
                  <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="footer-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#58a6ff"/>
                      <stop offset="100%" stopColor="#a371f7"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span className="font-semibold">CryptoAnalyzer</span>
              </Link>
              <p className="text-sm text-muted">Professional cryptocurrency analysis platform.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted">
                {publicNavItems.map(item => (
                  <li key={item.path}><Link to={item.path} className="hover:text-primary">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link to="/learn" className="hover:text-primary">Learn</Link></li>
                <li><Link to="/docs" className="hover:text-primary">Documentation</Link></li>
                <li><Link to="/api-docs" className="hover:text-primary">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-primary flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} CryptoAnalyzer. Not financial advice.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">GitHub</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Twitter</a>
              <a href="/docs" className="hover:text-primary">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
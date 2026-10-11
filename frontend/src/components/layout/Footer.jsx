import React from 'react';
import { clsx } from 'clsx';
import { Mail, ExternalLink } from 'lucide-react';

/**
 * Footer component
 */
export function Footer({
  links = {},
  social = {},
  copyright = `© ${new Date().getFullYear()} CryptoAnalyzer. All rights reserved.`,
  className = '',
  ...props
}) {
  const defaultLinks = {
    product: [
      { label: 'Markets', href: '/markets' },
      { label: 'Analysis', href: '/analysis' },
      { label: 'Screener', href: '/screener' },
      { label: 'Watchlist', href: '/watchlist' },
      { label: 'Portfolio', href: '/portfolio' },
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Contact', href: '/contact' },
    ],
    resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api-docs' },
      { label: 'Learn', href: '/learn' },
      { label: 'Community', href: '/community' },
      { label: 'Status', href: '/status' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Security', href: '/security' },
    ],
  };

  const defaultSocial = {
    github: 'https://github.com/cryptoanalyzer',
    twitter: 'https://twitter.com/cryptoanalyzer',
    linkedin: 'https://linkedin.com/company/cryptoanalyzer',
    email: 'mailto:hello@cryptoanalyzer.com',
  };

  const mergedLinks = { ...defaultLinks, ...links };
  const mergedSocial = { ...defaultSocial, ...social };

  const SocialIcon = ({ platform, href }) => {
    const icons = {
      github: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      twitter: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
        </svg>
      ),
      linkedin: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
        </svg>
      ),
      email: Mail,
    };
    const Icon = icons[platform] || ExternalLink;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="social-link text-muted hover:text-primary transition-colors"
        aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
      >
        <Icon size={20} />
      </a>
    );
  };

  return (
    <footer className={clsx('footer border-t border-primary', className)} {...props}>
      <div className="container px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="footer-logo flex items-center gap-2 mb-4" aria-label="CryptoAnalyzer Home">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="url(#footer-gradient)"/>
                <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="footer-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#58a6ff"/>
                    <stop offset="100%" stopColor="#a371f7"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-semibold text-lg">CryptoAnalyzer</span>
            </a>
            <p className="text-sm text-muted max-w-xs">
              Professional cryptocurrency analysis platform with data-driven insights and AI-assisted predictions.
            </p>
            <div className="flex gap-4 mt-6">
              {Object.entries(mergedSocial).map(([platform, href]) => (
                <SocialIcon key={platform} platform={platform} href={href} />
              ))}
            </div>
          </div>

          {Object.entries(mergedLinks).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-secondary mb-4">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-sm text-muted hover:text-primary transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-primary">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted">{copyright}</p>
            <div className="flex items-center gap-6 text-sm text-muted">
              <span>Built with React, FastAPI, and ❤️</span>
              <a href="/docs" className="hover:text-primary">Documentation</a>
              <a href="/api-docs" className="hover:text-primary">API Reference</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Simple Footer for dashboard pages
 */
export function SimpleFooter({
  version = '1.0.0',
  className = '',
  ...props
}) {
  return (
    <footer className={clsx('simple-footer border-t border-primary py-4', className)} {...props}>
      <div className="container px-6 flex items-center justify-between">
        <span className="text-sm text-muted">
          CryptoAnalyzer v{version}
        </span>
        <div className="flex items-center gap-4 text-sm text-muted">
          <a href="/docs" className="hover:text-primary">Docs</a>
          <a href="/api-docs" className="hover:text-primary">API</a>
          <a href="/privacy" className="hover:text-primary">Privacy</a>
          <a href="/terms" className="hover:text-primary">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
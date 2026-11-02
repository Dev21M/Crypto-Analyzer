import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Input, Card, Alert } from '../../components/ui';
import { Container } from '../../components/layout';

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isLogin) {
        // Mock login
        localStorage.setItem('cryptoanalyzer_user', JSON.stringify({
          name: email.split('@')[0],
          email,
          avatar: null,
        }));
        setSuccess('Welcome back! Redirecting...');
      } else {
        // Mock signup
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        localStorage.setItem('cryptoanalyzer_user', JSON.stringify({
          name: email.split('@')[0],
          email,
          avatar: null,
        }));
        setSuccess('Account created successfully! Redirecting...');
      }

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setError(`${provider} login not implemented in demo`);
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-12">
      <Container size="sm">
        <Card className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6" aria-label="CryptoAnalyzer Home">
              <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="url(#login-logo-gradient)"/>
                <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="login-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#58a6ff"/>
                    <stop offset="100%" stopColor="#a371f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-muted mt-2">
              {isLogin 
                ? 'Sign in to access your watchlist, portfolio, and personalized analysis.'
                : 'Join CryptoAnalyzer to track markets and get AI-powered insights.'}
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-6" onClose={() => setError(null)}>
              <AlertCircle size={16} className="mr-2" />
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-6">
              <CheckCircle size={16} className="mr-2" />
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              error={error?.includes('email') ? error : undefined}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              rightIcon={
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            )}

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  required
                />
                <span className="text-sm text-secondary">I agree to the <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link></span>
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button
              variant="secondary"
              onClick={() => handleSocialLogin('GitHub')}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSocialLogin('Twitter')}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
              Twitter
            </Button>
          </div>

          <p className="text-center text-sm text-muted">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Button>
          </p>
        </Card>

        <div className="text-center mt-6 text-sm text-muted">
          <p>By continuing, you agree to our <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
          <p>This is a demo. No real authentication is performed.</p>
        </div>
      </Container>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="header sticky top-0 z-40 bg-secondary/80 backdrop-blur-sm border-b border-primary">
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" aria-label="CryptoAnalyzer Home">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#login-header-logo-gradient)"/>
              <path d="M8 16L14 22L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="login-header-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#58a6ff"/>
                  <stop offset="100%" stopColor="#a371f7"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="font-semibold text-lg hidden sm:block">CryptoAnalyzer</span>
          </Link>
        </div>
      </Container>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="footer border-t border-primary bg-secondary/50">
      <Container>
        <div className="py-8 text-center">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} CryptoAnalyzer. Not financial advice.
          </p>
        </div>
      </Container>
    </footer>
  );
}

export default Login;
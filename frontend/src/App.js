import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PageSkeleton } from './components/PageSkeleton';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Market = lazy(() => import('./pages/Market'));
const Predictions = lazy(() => import('./pages/Predictions'));
const Models = lazy(() => import('./pages/Models'));
const Regimes = lazy(() => import('./pages/Regimes'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Homepage = lazy(() => import('./pages/public/Homepage'));
const Markets = lazy(() => import('./pages/public/Markets'));
const CoinAnalysis = lazy(() => import('./pages/public/CoinAnalysis'));
const Learn = lazy(() => import('./pages/public/Learn'));
const Login = lazy(() => import('./pages/public/Login'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Homepage />} />
            <Route path="markets" element={<Markets />} />
            <Route path="analysis" element={<CoinAnalysis />} />
            <Route path="coin/:symbol" element={<CoinAnalysis />} />
            <Route path="learn" element={<Learn />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Login />} />
            <Route path="predictions" element={<Predictions />} />
          </Route>

          {/* Dashboard Routes - nested under /dashboard prefix */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="market" element={<Market />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="models" element={<Models />} />
            <Route path="regimes" element={<Regimes />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
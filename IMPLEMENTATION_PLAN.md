# CryptoAnalyzer Implementation Plan

## Project Analysis Summary

### Current State
- **Backend**: FastAPI with market data (FCS API + Binance fallback), ML predictions (baseline + DL models), regime detection, WebSocket streaming
- **Frontend**: React 18 admin dashboard with Dashboard, Market, Predictions, Models, Regimes, Settings pages
- **Data**: BTC/USDT 5-minute candles only, 4 experiment configurations, 9 models
- **Styling**: Dark theme CSS with CSS variables, responsive grid

### Key Gaps vs. Requirements
1. **Public Homepage**: No marketing homepage - current app is admin-only
2. **Multi-Coin Support**: Only BTC/USDT hardcoded
3. **Coin Analysis Pages**: No `/coin/:symbol` routes
4. **Market Overview**: No top gainers/losers, fear & greed, market cap
5. **Search**: No cryptocurrency search with suggestions
6. **Watchlist/Portfolio**: Not implemented
7. **Authentication**: No user system
8. **Chart Timeframes**: Tabs exist but don't fetch different intervals
9. **Settings**: localStorage only, no backend sync

---

## Implementation Stages

### Stage 1: Project Inspection & Planning ✓ COMPLETE
- [x] Inspect project structure
- [x] Identify frontend/backend frameworks
- [x] Document existing components, routes, services
- [x] Identify market data providers
- [x] Create implementation plan (this document)

### Stage 2: Design System & Branding (Week 1)
**Objective**: Create professional, reusable UI components

#### 2.1 Design Tokens & Theme System
- [ ] Enhance CSS variables for complete design system
- [ ] Add light theme support
- [ ] Define spacing, typography, border radius scales
- [ ] Create color palette: primary, success, warning, danger, neutral
- [ ] Add chart color themes (categorical, sequential, diverging)

#### 2.2 Core UI Components
- [ ] **Button** - variants (primary, secondary, ghost, danger), sizes, loading state
- [ ] **Input/Search** - with debounce, suggestions dropdown, clear button
- [ ] **Select** - searchable, multi-select support
- [ ] **Card** - enhanced with header actions, loading skeleton
- [ ] **Table** - sortable, paginated, responsive, row selection
- [ ] **Tabs** - keyboard accessible, animated indicator
- [ ] **Modal/Dialog** - portal, focus trap, escape to close
- [ ] **Toast/Notification** - queue, auto-dismiss, actions
- [ ] **Tooltip** - accessible, positioned
- [ ] **Badge** - variants, dot indicator
- [ ] **Skeleton** - text, card, chart, table variants
- [ ] **EmptyState** - illustration, message, action
- [ ] **ErrorBoundary** - fallback UI, retry
- [ ] **Pagination** - page numbers, prev/next, page size

#### 2.3 Layout Components
- [ ] **Header** - logo, navigation, search, theme toggle, user menu
- [ ] **Sidebar** - collapsible, mobile drawer, nested navigation
- [ ] **Footer** - links, legal, version
- [ ] **Container** - max-width, responsive padding

#### 2.4 Data Display Components
- [ ] **MetricCard** - value, change, trend, sparkline
- [ ] **PriceChange** - green/red, percentage, absolute
- [ ] **CoinAvatar** - icon, symbol, name, fallback
- [ ] **ChartWrapper** - loading, error, toolbar, timeframe selector
- [ ] **IndicatorCard** - label, value, interpretation, tooltip
- [ ] **RegimeBadge** - colored, confidence

#### 2.5 Chart Components
- [ ] **CandlestickChart** - Plotly-based, crosshair, zoom, volume
- [ ] **LineChart** - multi-series, annotations
- [ ] **AreaChart** - stacked, gradient
- [ ] **BarChart** - grouped, stacked, horizontal
- [ ] **PieChart** - donut, legend
- [ ] **RadarChart** - multi-axis, normalization

---

### Stage 3: Public Homepage (Week 1-2)
**Objective**: Professional landing page for public users

#### 3.1 Routing Setup
- [ ] Add React Router v6
- [ ] Define routes: `/`, `/markets`, `/coin/:symbol`, `/predictions`, `/models`, `/regimes`, `/watchlist`, `/portfolio`, `/learn`, `/settings`, `/login`, `/signup`

#### 3.2 Header Component
- [ ] CryptoAnalyzer logo (SVG)
- [ ] Navigation: Markets, AI Analysis, Screener, Watchlist, Portfolio, Learn
- [ ] Theme toggle (dark/light/system)
- [ ] Search bar (global, with suggestions)
- [ ] Sign In / Profile menu (placeholder for auth)

#### 3.3 Hero Section
- [ ] Headline: "Understand the Crypto Market with Data-Driven Analysis"
- [ ] Supporting text
- [ ] Prominent search with coin suggestions
- [ ] "Analyze Coin" primary CTA
- [ ] "Explore Markets" secondary CTA
- [ ] Trust indicators (data sources, update frequency)

#### 3.4 Market Overview Section
- [ ] BTC Price Card (price, 24h change, sparkline)
- [ ] ETH Price Card
- [ ] Total Market Cap (if available)
- [ ] 24h Market Change
- [ ] Trading Volume
- [ ] Fear & Greed Index (if provider exists)
- [ ] Data source badges & timestamps

#### 3.5 Top Gainers/Losers Tables
- [ ] Sortable columns: Coin, Symbol, Price, 24h Change, Volume, Market Cap
- [ ] Pagination
- [ ] Search/filter
- [ ] "Analyze" action button per row
- [ ] Tab switch: Gainers / Losers / Most Active

#### 3.6 AI Opportunity Radar
- [ ] Bullish setups from model predictions
- [ ] Bearish setups from model predictions
- [ ] Columns: Coin, Direction, Confidence, Supporting Factors, Timestamp, Action
- [ ] Empty state when no signals
- [ ] Link to coin analysis page

#### 3.7 Latest Community Analyses (Placeholder)
- [ ] UI structure for future auth integration
- [ ] Filters: Coin, Direction, Timeframe, Date
- [ ] Empty state explaining feature requires login

---

### Stage 4: Coin Analysis Page (Week 2-3)
**Objective**: Deep-dive analysis for each cryptocurrency

#### 4.1 Route & Layout
- [ ] `/coin/:symbol` route with dynamic symbol
- [ ] Symbol validation against supported coins
- [ ] 404 for unsupported symbols
- [ ] Breadcrumb: Home > Markets > BTC

#### 4.2 Header Section
- [ ] Coin icon, name, symbol
- [ ] Current price (large)
- [ ] 24h change (color-coded)
- [ ] 24h high/low
- [ ] Volume & Market Cap
- [ ] Last update timestamp
- [ ] Data provider badge
- [ ] Favorite/Watchlist button

#### 4.3 Interactive Chart
- [ ] Candlestick chart with Plotly
- [ ] Volume bars (overlay or separate)
- [ ] Timeframe selector: 5m, 15m, 1h, 4h, 1d, 1w
- [ ] Crosshair with OHLCV tooltip
- [ ] Zoom/pan
- [ ] Loading skeleton
- [ ] Empty/error states
- [ ] Data freshness indicator
- [ ] Last candle timestamp

#### 4.4 Technical Indicators Panel
- [ ] Accordion sections: Trend, Momentum, Volatility, Volume
- [ ] Each indicator: current value, interpretation, period, timestamp
- [ ] N/A state with explanation when insufficient data
- [ ] Color-coded values (bullish/bearish/neutral)

#### 4.5 Support & Resistance
- [ ] Pivot points
- [ ] Fibonacci retracements
- [ ] Key levels from volume profile
- [ ] Visual markers on chart

#### 4.6 Market Regime
- [ ] Current regime badge
- [ ] Confidence meter
- [ ] Regime history timeline
- [ ] Distribution pie chart
- [ ] Transition history

#### 4.7 AI-Assisted Analysis
- [ ] Model prediction for selected coin
- [ ] Model selector
- [ ] Horizon selector
- [ ] Direction + confidence
- [ ] Probability distribution
- [ ] Key factors (top feature importance)
- [ ] Model version & latency

#### 4.8 Prediction History
- [ ] Table: Date, Model, Horizon, Prediction, Actual, Outcome
- [ ] Accuracy metrics
- [ ] Filter by model, horizon, date range

#### 4.9 Risk Disclaimer
- [ ] Prominent disclaimer
- [ ] Not financial advice
- [ ] Model limitations
- [ ] Data source disclaimers

---

### Stage 5: Market Data Integration (Week 3)
**Objective**: Fix and enhance market data pipeline

#### 5.1 Multi-Coin Support (Backend)
- [ ] Extend FCS client for multiple symbols
- [ ] Add CoinGecko/CoinMarketCap as additional providers for market cap, gainers/losers
- [ ] Create unified market data service interface
- [ ] Implement provider health checks
- [ ] Add caching layer (Redis)

#### 5.2 API Endpoints
- [ ] `GET /api/v1/market/coins` - list supported coins
- [ ] `GET /api/v1/market/coins/:symbol` - coin details
- [ ] `GET /api/v1/market/overview` - market stats (BTC, ETH, total cap, volume, fear&greed)
- [ ] `GET /api/v1/market/gainers` - top gainers
- [ ] `GET /api/v1/market/losers` - top losers
- [ ] `GET /api/v1/market/active` - most active
- [ ] `GET /api/v1/market/search?q=` - coin search suggestions
- [ ] `GET /api/v1/market/coins/:symbol/candles?interval=&limit=` - historical candles
- [ ] `GET /api/v1/market/coins/:symbol/indicators` - technical indicators
- [ ] `GET /api/v1/market/coins/:symbol/regime` - regime analysis

#### 5.3 WebSocket Enhancements
- [ ] Multi-symbol subscriptions
- [ ] Channel per symbol: `market:BTCUSDT`, `market:ETHUSDT`
- [ ] Efficient broadcasting (only to subscribers)

#### 5.4 Data Quality
- [ ] Timestamp validation (UTC)
- [ ] Duplicate candle detection
- [ ] Stale data detection
- [ ] Gap filling for missing candles
- [ ] Provider failover logic

---

### Stage 6: Predictions, Models, Regimes Enhancement (Week 4)
**Objective**: Improve existing analysis pages

#### 6.1 Predictions Page
- [ ] Coin selector (multi-coin)
- [ ] Model selector with descriptions
- [ ] Experiment selector with feature counts
- [ ] Task selector (classification/regression)
- [ ] Horizon selector with time labels
- [ ] Prediction history with actual outcomes
- [ ] Accuracy tracking per model/coin/horizon
- [ ] Export predictions (CSV)

#### 6.2 Models Page
- [ ] Model cards with status (trained/loading/error)
- [ ] Detailed metrics table with proper N/A handling
- [ ] Classification vs regression metric separation
- [ ] Experiment comparison
- [ ] Training history / versioning
- [ ] Model loading status indicators

#### 6.3 Regimes Page
- [ ] Current regime with confidence
- [ ] Regime history timeline chart
- [ ] Distribution over time (stacked area)
- [ ] Volatility metrics per regime
- [ ] Transition matrix
- [ ] Model performance by regime (when available)

---

### Stage 7: Watchlist & Portfolio (Week 4-5)
**Objective**: User personalization features

#### 7.1 Watchlist (Anonymous - localStorage)
- [ ] Add/remove coins
- [ ] Persist in localStorage
- [ ] Display: price, 24h change, sparkline
- [ ] Click to navigate to coin page
- [ ] Reorder (drag & drop)
- [ ] Max 50 coins

#### 7.2 Portfolio (Anonymous - localStorage)
- [ ] Add asset with quantity & avg price
- [ ] Current value calculation
- [ ] Unrealized P/L
- [ ] Allocation pie chart
- [ ] Edit/remove assets
- [ ] Export/import JSON

#### 7.3 Auth Integration (Future Phase)
- [ ] User registration/login
- [ ] JWT tokens
- [ ] Server-side watchlist/portfolio sync
- [ ] Multi-device support

---

### Stage 8: Settings & UX Polish (Week 5)
**Objective**: Complete user experience

#### 8.1 Settings Page
- [ ] Theme: dark/light/system
- [ ] Default market/coin
- [ ] Default timeframe
- [ ] Chart preferences (type, indicators, volume)
- [ ] Refresh interval
- [ ] Timezone/locale
- [ ] Notification preferences
- [ ] Data provider status
- [ ] API key management (user-provided, not backend secrets)

#### 8.2 Accessibility
- [ ] Semantic HTML
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast (WCAG AA)
- [ ] Screen reader support
- [ ] Reduced motion

#### 8.3 Responsive Design
- [ ] Mobile-first breakpoints
- [ ] Touch-friendly charts
- [ ] Collapsible tables on mobile
- [ ] Sheet modals on mobile
- [ ] Safe area insets

#### 8.4 Onboarding
- [ ] First-visit tour
- [ ] Tooltips for technical terms
- [ ] Progressive disclosure
- [ ] Help links to Learn section

---

### Stage 9: Testing & Quality (Week 5-6)
**Objective**: Ensure reliability

#### 9.1 Backend Tests
- [ ] Unit tests for services
- [ ] Integration tests for API endpoints
- [ ] Market data parsing tests
- [ ] Indicator calculation tests (validate against known values)
- [ ] Prediction pipeline tests
- [ ] Regime detection tests
- [ ] WebSocket connection tests

#### 9.2 Frontend Tests
- [ ] Component unit tests (React Testing Library)
- [ ] Integration tests for pages
- [ ] API client tests (MSW)
- [ ] Chart rendering tests
- [ ] Accessibility tests (axe)
- [ ] E2E tests (Playwright): homepage, coin page, predictions

#### 9.3 Quality Gates
- [ ] TypeScript migration (optional but recommended)
- [ ] ESLint + Prettier
- [ ] Pre-commit hooks
- [ ] CI/CD pipeline
- [ ] Bundle size analysis
- [ ] Performance budgets

---

### Stage 10: Deployment & Documentation (Week 6)
**Objective**: Production readiness

#### 10.1 Docker
- [ ] Multi-stage builds
- [ ] Health checks
- [ ] Resource limits
- [ ] docker-compose for local dev

#### 10.2 Environment Configuration
- [ ] `.env.example` with all variables
- [ ] Secret management
- [ ] Feature flags

#### 10.3 Documentation
- [ ] API documentation (OpenAPI)
- [ ] Component storybook
- [ ] Architecture decision records
- [ ] Deployment guide
- [ ] Contributing guide

---

## Technical Decisions

### Frontend Stack (Keep Existing)
- React 18 + react-scripts (CRA)
- Plotly.js for charts (already working well)
- Zustand for state (lightweight)
- Custom CSS with CSS variables (no CSS-in-JS needed)
- Lucide React for icons

### New Dependencies (Minimal)
| Package | Purpose | Justification |
|---------|---------|---------------|
| `react-router-dom` | Routing | Required for public routes |
| `@tanstack/react-query` | Server state | Better caching, deduping, background refetch |
| `date-fns` | Date formatting | Already in package.json |
| `clsx` | Class composition | Lightweight utility |

### Backend Stack (Keep Existing)
- FastAPI + Uvicorn
- Pydantic v2 for validation
- WebSockets for real-time
- Redis for caching (configured but not used yet)

### Data Providers Priority
1. **FCS API** - Primary (WebSocket + REST, has API key)
2. **Binance** - Fallback (REST + WebSocket, no auth needed)
3. **CoinGecko** - Market overview, gainers/losers, search (free tier)
4. **CoinMarketCap** - Alternative if needed

---

## File Structure After Implementation

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Avatar.jsx
│   │   │   └── index.js
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Container.jsx
│   │   ├── charts/
│   │   │   ├── CandlestickChart.jsx
│   │   │   ├── LineChart.jsx
│   │   │   ├── VolumeChart.jsx
│   │   │   ├── RegimeChart.jsx
│   │   │   └── index.js
│   │   ├── data-display/
│   │   │   ├── MetricCard.jsx
│   │   │   ├── PriceChange.jsx
│   │   │   ├── CoinAvatar.jsx
│   │   │   ├── IndicatorCard.jsx
│   │   │   ├── RegimeBadge.jsx
│   │   │   └── index.js
│   │   └── index.js
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Homepage.jsx
│   │   │   ├── Markets.jsx
│   │   │   ├── CoinAnalysis.jsx
│   │   │   ├── Learn.jsx
│   │   │   └── Login.jsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Predictions.jsx
│   │   │   ├── Models.jsx
│   │   │   ├── Regimes.jsx
│   │   │   ├── Watchlist.jsx
│   │   │   ├── Portfolio.jsx
│   │   │   └── Settings.jsx
│   │   └── index.js
│   ├── hooks/
│   │   ├── useApi.js
│   │   ├── useWebSocket.js
│   │   ├── useTheme.js
│   │   ├── useWatchlist.js
│   │   ├── usePortfolio.js
│   │   └── index.js
│   ├── services/
│   │   ├── api.js
│   │   ├── websocket.js
│   │   └── storage.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── styles/
│   │   ├── variables.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   ├── charts.css
│   │   └── main.css
│   ├── App.jsx
│   ├── routes.jsx
│   └── index.js
├── public/
└── package.json

backend/
├── api/
│   ├── market.py           # Enhanced with multi-coin
│   ├── prediction.py
│   ├── health.py
│   ├── websocket.py
│   └── auth.py             # New
├── services/
│   ├── fcs_market_data.py
│   ├── live_market_data.py
│   ├── coin_service.py     # New - multi-coin
│   ├── prediction.py
│   ├── cache.py            # New - Redis
│   └── websocket_manager.py
├── core/
│   ├── config.py
│   └── security.py         # New - auth
├── schemas/
│   └── models.py
├── main.py
└── requirements.txt
```

---

## Success Criteria

### Stage 2 Complete When:
- [ ] All UI components documented in Storybook
- [ ] Theme switches without flash
- [ ] Components pass accessibility audit
- [ ] Responsive breakpoints work

### Stage 3 Complete When:
- [ ] Homepage loads in <2s
- [ ] Search returns results in <300ms
- [ ] Market overview shows real data
- [ ] Gainers/losers tables sort/filter/paginate
- [ ] No hardcoded coin lists

### Stage 4 Complete When:
- [ ] `/coin/BTC` and `/coin/ETH` work
- [ ] Chart switches timeframes correctly
- [ ] Indicators calculate correctly
- [ ] Regime shows for each coin
- [ ] Predictions work per coin

### Stage 5 Complete When:
- [ ] Multi-coin API endpoints respond
- [ ] WebSocket streams multiple symbols
- [ ] Provider failover works
- [ ] No SSL errors in logs
- [ ] Cache hits >80%

### Stage 6-9 Complete When:
- [ ] All existing tests pass
- [ ] New tests cover critical paths
- [ ] E2E tests pass in CI
- [ ] No console errors in production build
- [ ] Lighthouse score >90

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| FCS API key invalid/rate limited | High | Binance fallback implemented; add CoinGecko |
| SSL cert issues on Windows | Medium | Use certifi, configurable verify_ssl |
| Model checkpoints missing | High | Graceful degradation, clear error messages |
| WebSocket instability | Medium | Exponential backoff, REST polling fallback |
| Frontend bundle size | Low | Code splitting, lazy load pages |
| No auth for watchlist | Low | localStorage MVP, auth in Phase 2 |

---

## Next Steps

1. **Immediate**: Start Stage 2 - Design System
   - Create UI component library
   - Set up React Router
   - Enhance theme system

2. **Parallel**: Backend multi-coin support
   - Extend FCS client
   - Add CoinGecko service
   - Create new API endpoints

3. **Integration**: Connect frontend to new endpoints
   - Homepage with real data
   - Coin analysis page

Let's begin with Stage 2 implementation.
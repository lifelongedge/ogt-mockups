# MarketMosaic — View Design Spec

**Owner**: quantx
**Status**: Design
**Date**: 2026-03-30
**View name**: `marketmosaic`
**Mount path**: `/views/home/marketmosaic`

---

## Purpose

MarketMosaic is a standalone market regime dashboard that replaces the TC2000 FE_Market* watchlist panels. It computes and displays the same 5 regime indicators Dr. Long publishes in the Tortoise weekend/daily reports — plus capabilities TC2000 cannot offer: regime transition history, composite scoring, MACD season overlay, and weekly analysis integration.

**Design goal**: A trader opens MarketMosaic once in the morning and knows the regime without touching TC2000.

---

## What TC2000 Shows (baseline to match)

| Panel | Indicator | Current Logic | Output |
|-------|-----------|---------------|--------|
| FE_MarketType | SPY vs 200dma | Price > 200dma = Bull; sideways band; < 200dma = Bear | Bull / Sideways / Bear |
| FE_MarketVolatility | ATR%(100) | ATR(14)/Close × 100 percentile vs 100-day lookback | Volatile / Normal / Quiet |
| FE_MarketTrendRange | ADX(14) | ADX value + NDX10d + NDX12m | Trending / Rangebound + values |
| FE_MarketRisk | VIX MA ratio | VIX MA(10) / VIX MA(30) | Risk On (ratio > 1.0) / Risk Off (ratio <= 1.0) |
| FE_MarketRiskZ | VIX Z-score | Z-score of VIX over lookback | Numeric (-2 to +2 typical) |

TC2000 also shows 6 companion charts: SPY daily, ATR, volatility, ADX, NDX10, VIX+RiskZ.

---

## What MarketMosaic Adds (beyond TC2000)

| Feature | Why it matters |
|---------|---------------|
| **Regime History Timeline** | Horizontal bar showing Bull/Sideways/Bear transitions over 6-12 months. TC2000 has no memory — you can't see when the last regime change happened. |
| **Transition Alerts** | Visual flag when any indicator is near its threshold (e.g., price within 1% of 200dma, ADX crossing 25). Early warning that TC2000 doesn't provide. |
| **Composite Regime Score** | Single 0-100 score aggregating all 5 indicators. Bull+Quiet+Trending+RiskOn+HighZ = 90+. Bear+Volatile+Rangebound+RiskOff+LowZ = 10. Quick read. |
| **MACD Season Overlay** | Current MACD season (Accumulate/Rally/Distribute/Decline) shown on the SPY chart and timeline. This is from the Tortoise reports but TC2000 doesn't display it as a regime layer. |
| **Squeeze Status** | Bollinger Band squeeze detection (BB inside Keltner Channel). Tortoise reports track this but TC2000 doesn't integrate it into the regime dashboard. |
| **Click-to-History** | Click any regime indicator badge to see a chart of its historical values with regime-change dates annotated. |
| **OR/Channeling Rules** | The opening range and channeling status from the daily reports, shown as secondary indicators. |
| **Weekly Analysis Link** | One-click access to the latest Tortoise Combined Analysis if available. |

---

## Layout

```
+------------------------------------------------------------------+
|  REGIME STRIP (always visible)                                    |
|  [Bear]  [Normal]  [Trending 41]  [Risk Off]  [Z: -1.04]  [85]  |
|   red     gray      cyan           red          red        score  |
+------------------------------------------------------------------+
|                                                                   |
|  +-----------------------------+  +-----------------------------+ |
|  |  SPY Daily                  |  |  ADX + Trend/Range          | |
|  |  Price + MAs + Z-bands      |  |  ADX(14) line               | |
|  |  MACD season background     |  |  25 threshold line          | |
|  |  200dma with regime color   |  |  Trending/Rangebound shade  | |
|  +-----------------------------+  +-----------------------------+ |
|                                                                   |
|  +-----------------------------+  +-----------------------------+ |
|  |  Volatility                 |  |  VIX + Risk Z               | |
|  |  ATR%(100) normalized       |  |  VIX price line             | |
|  |  Volatile/Normal/Quiet      |  |  MA(10)/MA(30) ratio        | |
|  |  bands with shading         |  |  Risk Z color overlay       | |
|  +-----------------------------+  +-----------------------------+ |
|                                                                   |
|  +-----------------------------+  +-----------------------------+ |
|  |  NDX10 Breadth              |  |  Squeeze + Secondary        | |
|  |  NDX10d position (0-100)    |  |  BB squeeze status          | |
|  |  50-line, overbought/sold   |  |  OR/Channeling rules        | |
|  |  12-month percentile shade  |  |  Autoframer count           | |
|  +-----------------------------+  +-----------------------------+ |
|                                                                   |
+------------------------------------------------------------------+
|  REGIME HISTORY TIMELINE (scrollable)                             |
|  ████ Bull ████████ Sideways ███ Bear █████ Sideways ████ Bear    |
|  Oct        Nov        Dec      Jan       Feb       Mar           |
|  MACD: Acc  |  Rally   | Dist  | Decline |  Acc    | Decline     |
+------------------------------------------------------------------+
```

### Regime Strip (top)

- 5 indicator badges + 1 composite score
- Each badge: colored background (green/gray/red/cyan), label, value where applicable
- Click any badge → popover showing: current value, threshold, last change date, 30-day chart
- Composite score: 0-100 circle, color gradient from red (0) to green (100)

### Chart Grid (middle, 2x3)

- All charts use LightweightCharts (already a platform dependency)
- Dark theme, consistent with Edge S2 styling
- Crosshair sync across all 6 charts (move mouse on one, all show same date)
- Default lookback: 6 months (configurable: 3m, 6m, 1y, 2y)

### Regime History Timeline (bottom)

- Horizontal stacked bar chart
- Color-coded by Market Type: green=Bull, gray=Sideways, red=Bear
- Second row: MACD season (blue=Accumulate, green=Rally, orange=Distribute, red=Decline)
- Click any segment → charts scroll to that date range
- Annotations at regime transitions: date + what triggered the change

---

## Data Requirements

### Indicators Needed (gap analysis vs edge-transform)

| Indicator | In Transform? | Action |
|-----------|--------------|--------|
| SPY OHLCV daily | Yes (parquet) | Direct read |
| SMA(200) on SPY | Computable | Use rl_n200 or compute in view JS |
| ATR(14) | Yes (internal) | Expose as explicit indicator or compute in API |
| ATR%(100) percentile | No | New: `atr_pct_100` — ATR(14)/Close percentile over 100 days |
| ADX(14) | No | New: `adx_14` — requires DI+/DI- computation |
| NDX10d | Partial (`ndxofc_10d`) | Verify mapping: ndxofc_10d = position in 10-day range (0-100) — this IS NDX10d |
| NDX12m | Partial (`ndxofc_150d`) | Closest proxy; may need exact 252-day version |
| VIX daily close | Yes (parquet) | Direct read from VIX symbol data |
| VIX MA(10), MA(30) | Computable | Simple moving averages on VIX close |
| VIX Risk Z | No | New: Z-score of VIX MA(10)/MA(30) ratio over lookback |
| MACD on SPY | Partial (`macdrl_*`) | Verify: MACD-RL may differ from standard MACD(12,26,9) |
| BB Squeeze | No | New: BB(20,2) width vs KC(20,1.5) width |

### New API Endpoints (edge-gyre)

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/v1/mosaic/regime` | GET | Current values of all 5 indicators + composite score |
| `/api/v1/mosaic/regime-history` | GET | Daily regime classification going back N days |
| `/api/v1/mosaic/charts` | GET | Chart data for all 6 panels (SPY, ATR%, ADX, NDX, VIX, Squeeze) |
| `/api/v1/mosaic/transitions` | GET | List of regime transition events with dates and triggers |

Query params: `?lookback=180` (days), `?symbol=SPY` (default SPY)

### Computation Location

Two options:

**Option A: Server-side (recommended)**
- New `mosaic.py` module in edge-gyre computes all indicators from parquet data
- Serves pre-computed regime classifications
- Advantages: fast page load, computation cached, consistent with gyre pattern
- Disadvantages: new server code to maintain

**Option B: Client-side**
- JS fetches raw OHLCV + VIX data, computes indicators in browser
- Advantages: no server changes
- Disadvantages: slow first load, duplicates logic, harder to test

**Recommendation: Option A** — server computes, client renders. This matches every other Edge S2 view.

---

## Indicator Computation Details

### Market Type (Bull / Sideways / Bear)
```
sma200 = SMA(close, 200)
if close > sma200 * 1.02:  Bull
elif close < sma200 * 0.98:  Bear
else:  Sideways
```
Confirmed: 2% band per Tortoise methodology.

### Market Volatility (Volatile / Normal / Quiet)
```
atr14 = ATR(high, low, close, 14)
atr_pct = atr14 / close * 100
percentile = percentile_rank(atr_pct, lookback=100)
if percentile > 75:  Volatile
elif percentile < 25:  Quiet
else:  Normal
```

### Market Trend/Range (ADX-based)
```
adx14 = ADX(high, low, close, 14)
if adx14 > 25:  Trending
else:  Rangebound
# Also report: NDX10d (ndxofc_10d), NDX12m (ndxofc ~252d)
```

### Market Risk (VIX MA ratio)
```
vix_ma10 = SMA(vix_close, 10)
vix_ma30 = SMA(vix_close, 30)
ratio = vix_ma10 / vix_ma30
if ratio > 1.0:  Risk Off  (short-term vol rising above long-term)
else:  Risk On
```

### Risk Z (VIX Z-score)
```
vix_returns = pct_change(vix_close, 1)
risk_z = (vix_close - SMA(vix_close, 60)) / StdDev(vix_close, 60)
```

### Composite Regime Score (0-100)
```
score = 0
score += 30 if Bull, 15 if Sideways, 0 if Bear       # 30% weight: trend
score += 20 if Quiet, 10 if Normal, 0 if Volatile     # 20% weight: vol
score += 15 if Trending, 5 if Rangebound              # 15% weight: trend strength
score += 20 if Risk_On, 0 if Risk_Off                 # 20% weight: risk
score += 15 * normalize(risk_z, -2, +2)               # 15% weight: z-score
```

### MACD Season Classification
```
macd = EMA(close, 10) - EMA(close, 30)    # Tortoise uses (10,30,5), NOT standard (12,26,9)
signal = EMA(macd, 5)
histogram = macd - signal

if macd > 0 and histogram > 0:  Rally (bullish momentum increasing)
if macd > 0 and histogram < 0:  Distribute (bullish momentum fading)
if macd < 0 and histogram < 0:  Decline (bearish momentum increasing)
if macd < 0 and histogram > 0:  Accumulate (bearish momentum fading)
```

---

## File Structure

```
edge-homeview/static/marketmosaic/
├── index.html          # Shell: regime strip + chart grid + timeline
├── app.js              # Main controller, data fetching, chart init
├── regime.js           # Regime strip rendering + click-to-history popovers
├── charts.js           # LightweightCharts setup for 6 panels + crosshair sync
├── timeline.js         # Regime history timeline (canvas-based)
├── styles.css          # Dark theme, grid layout, badge colors

edge-gyre/edgegyre/api/routes/
├── mosaic.py           # 4 API endpoints, indicator computation

edge-gyre/edgegyre/
├── mosaic_engine.py    # Pure computation: ADX, ATR%, VIX ratios, regime classify
```

---

## Contracts (to be added to edge-homeview/contracts.md)

| ID | Contract | Priority |
|----|----------|----------|
| MM-001 | Regime indicator response shape: `{market_type, volatility, trend_range, risk, risk_z, composite, as_of_date}` | High |
| MM-002 | Regime history: array of `{date, market_type, volatility, trend_range, risk, risk_z, composite, macd_season}` | High |
| MM-003 | Chart data: standard OHLCV + indicator overlay format per panel | High |
| MM-004 | Transition events: `{date, indicator, from_value, to_value, trigger}` | Medium |
| MM-005 | Crosshair sync: all 6 charts respond to mousemove on any chart | Medium |
| MM-006 | Lookback parameter: default 180 days, options 90/180/365/730 | Low |

---

## Implementation Phases

### Phase 1: Core Regime Dashboard
- `mosaic_engine.py`: compute all 5 indicators + composite from SPY + VIX parquet
- `mosaic.py`: `/regime` and `/charts` endpoints
- `index.html` + `app.js`: regime strip + 4 primary charts (SPY, ADX, VIX+RiskZ, Volatility)
- View registration in gyre TILE_ORDER

### Phase 2: History + Timeline
- `/regime-history` and `/transitions` endpoints
- `timeline.js`: regime history bar with MACD season overlay
- Click-to-history popovers on regime badges

### Phase 3: Advanced Features
- NDX10 breadth panel
- BB squeeze detection panel
- OR/Channeling secondary indicators
- Crosshair sync across all 6 charts
- Lookback period selector

### Phase 4: Integration
- Weekly analysis link (latest Tortoise Combined Analysis)
- Transition alerts (visual + optional wardenx integration)
- Autoframer status from daily report extraction

---

## Resolved Questions

1. **200dma band width**: ±2% band confirmed. Bull > 1.02×200dma, Bear < 0.98×200dma, else Sideways.
2. **ADX threshold**: Standard 25 confirmed.
3. **MACD variant**: **MACD(10,30,5)** — Tortoise uses faster parameters than standard (12,26,9).
4. **NDX10d**: Confirmed = ndxofc_10d (position in 10-day high-low range, 0-100).
5. **Autoframer**: Deferred — ignore for now.

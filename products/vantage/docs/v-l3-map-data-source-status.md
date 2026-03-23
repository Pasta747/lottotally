# V-L3-MAP Data Source Status (Verified Mar 20, 2026)

All sources confirmed live and returning real data. No API keys required.

## Live Data Points

| Source | Status | Latest Data | Notes |
|--------|--------|------------|-------|
| **CoinGecko** | ✅ Live | BTC=$70,117 (-0.74% 24h), ETH=$2,134 | No key needed, free tier |
| **FRED CPI** | ✅ Live | Jan 2026: 326.59 (MoM +0.56) | CSV endpoint, no key |
| **FRED FedFunds** | ✅ Live | Feb 2026: 3.64% | Same CSV pattern |
| **NOAA NYC** | ✅ Live | Today: 58°F, Rain Showers Likely, 59% precip | Grid: OKX/33/35 |
| **Kalshi demo** | ✅ Live | 200 markets (first page) | Demo has test markets; production has real ones |

## NOAA Grid Points for Key Cities

Pre-fetched for V-L3-MAP. Use these directly — no need to call `/points` endpoint each time.

| City | Grid Office | X | Y |
|------|------------|---|---|
| New York City | OKX | 33 | 35 |
| Los Angeles | LOX | 155 | 40 |
| Chicago | LOT | 74 | 73 |
| Miami | MFL | 110 | 37 |
| Dallas | FWD | 82 | 78 |
| Seattle | SEW | 124 | 69 |
| Denver | BOU | 57 | 63 |
| Boston | BOX | 64 | 61 |
| Phoenix | PSR | 158 | 51 |
| Atlanta | FFC | 52 | 88 |

Use: `https://api.weather.gov/gridpoints/{OFFICE}/{X},{Y}/forecast`

## FRED Series IDs for V-L2-FV

| Market type | Series ID | Update frequency |
|-------------|-----------|-----------------|
| CPI (inflation) | CPIAUCSL | Monthly |
| Fed Funds Rate | FEDFUNDS | Monthly |
| Unemployment Rate | UNRATE | Monthly |
| GDP Growth | A191RL1Q225SBEA | Quarterly |
| Core PCE | PCEPILFE | Monthly |
| 10-Year Treasury | DGS10 | Daily |
| 2-Year Treasury | DGS2 | Daily |

All at: `https://fred.stlouisfed.org/graph/fredgraph.csv?id={SERIES_ID}`

## Note on Kalshi Demo vs Production

The demo API returns test markets ("Will 1+1 = 2?") — not real prediction markets.
For scanner development, use **production Kalshi API** (`api.elections.kalshi.com`) with real API keys.
Demo is only for order execution testing (placing/canceling paper trades).

Production markets will have: CPI release markets, Fed decision markets, BTC price markets,
weather markets, election markets — the full range.

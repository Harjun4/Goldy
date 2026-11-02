# DESIGN.md — Goldy Quantitative Gold Analytics Engine

**Design Read:** Quantitative financial analytics dashboard for Indonesian & global gold investors (`XAU/USD` & `Logam Mulia Antam`), in a high-contrast *Warm Golden Daylight & Deep OLED Night* style, dial `ENERGY 2 / RHYTHM 2 / MOTION 1`.

## 1. Visual Identity & Personality
- **Domain:** Precious metals quantitative forecasting (`GC=F` CME Spot Gold & physical Antam IDR per gram).
- **Dual-Theme Philosophy:**
  - **Night Mode (`dark`, default):** Deep OLED slate (`#030712` / `#111827`) to reduce eye strain during extended market chart inspection and highlight candlestick trajectories.
  - **Daylight Mode (`light`):** Warm champagne-ivory (`#f4efe6` ground, `#fffdf9` cards, `#f3ece0` recessed boxes) instead of stark clinical white, preventing screen glare while keeping semantic financial badges crisp.

## 2. Dials (`antislop` Part 3)
- **ENERGY: 2 (Balanced)** — Clear focal hierarchy on the active price/signal callout and multi-horizon chart without decorative clutter.
- **RHYTHM: 2 (Consistent with structural breaks)** — Asymmetric 7:5 top workspace (Interactive Chart + AI Analytics Panel), followed by a 2-column Technical/Macro Matrix and a 3-column Architecture ledger.
- **MOTION: 1 (Hover & functional state transitions only)** — Smooth 180ms color/theme transitions and functional loading spinners during active sync/fetch; respects `prefers-reduced-motion: reduce`.

## 3. Color Palette & Contrast Rules (`R-01`, `R-25`, `R-29`, `R-34`)
- **Primary Brand Accent (Gold / Amber):**
  - Dark mode: `#fbbf24` / `#f59e0b` on `#030712`–`#111827`
  - Light mode: `#92400e` ink on `#fef3c7` surface (contrast >= 6.5:1)
- **Semantic Financial Status:**
  - **Bullish / Support / Buy (Emerald):** `#34d399` (dark) / `#065f46` on `#d1fae5` (light)
  - **Bearish / Resistance / Sell (Rose):** `#fb7185` (dark) / `#9f1239` on `#ffe4e6` (light)
  - **Macro / Secondary Horizon (Cyan):** `#22d3ee` (dark) / `#155e75` on `#cffafe` (light)
- **Neutral Typography Ink (WCAG AA >= 4.5:1 for normal text):**
  - Dark mode muted text uses `#94a3b8` (`text-gray-400` / overridden `text-gray-500` >= 5.5:1 on `#111827` & `#030712`).
  - Light mode muted text uses `#475569` (`>= 6.3:1` on `#fffdf9` and `#f3ece0`).

## 4. Typography (`R-06`)
- **UI & Analytical Prose:** `Plus Jakarta Sans` (400, 500, 600, 700) for clean Indonesian & English legibility at compact dashboard densities.
- **Prices, Tickers, Percentages & Timestamps:** `JetBrains Mono` with `font-variant-numeric: tabular-nums` so columns of prices (`$3,898.90`, `Rp 2.378.427`), MAPE errors, and OHLCV bars align vertically to the pixel.

## 5. One-Line Decision Log (`R-31`)
- **Color:** Gold/Amber anchors the gold commodity domain, while Emerald and Rose strictly encode directional market movement (BUY/Support vs SELL/Resistance).
- **Layout:** The 7:5 top split pairs the historical/forecast price trajectory directly beside the quantitative signal reasoning so traders see price and rationale in one viewport.
- **Typography:** `Plus Jakarta Sans` keeps dense Indonesian financial explanations readable, while `JetBrains Mono` (`tabular-nums`) prevents horizontal jitter across price tables.
- **Spacing:** Compact `16px–20px` card padding with `24px` section gaps maximizes above-the-fold data density without crowding touch targets.
- **Cards:** Bordered tonal containers group distinct analytical domains (OHLCV chart, multi-horizon targets, S/R pivots, macro radar) with 1px structural borders rather than heavy floating shadows.
- **Icons:** Financial and analytical glyphs (`Coins`, `TrendingUp`, `BarChart2`, `Database`, `Scale`, `Landmark`) reinforce metric categories and carry `aria-hidden="true"` when paired with text labels.


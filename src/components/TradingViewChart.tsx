import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  LineStyle, 
  CandlestickSeries, 
  LineSeries, 
  AreaSeries, 
  HistogramSeries,
  createSeriesMarkers
} from 'lightweight-charts';
import { CandleData, PredictionHorizon, TimeframeType, ChartStyleType, ThemeMode } from '../types';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateBollingerBands, 
  calculateRSI 
} from '../data/goldData';
import { 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  BarChart3, 
  SlidersHorizontal, 
  Calendar,
  Check,
  X
} from 'lucide-react';

interface TradingViewChartProps {
  candles: CandleData[];
  predictions: {
    h1: PredictionHorizon;
    h7: PredictionHorizon;
    h30: PredictionHorizon;
  };
  asset: string;
  currency: 'USD' | 'IDR';
  signal: string;
  timeframe: TimeframeType;
  onTimeframeChange: (tf: TimeframeType) => void;
  theme?: ThemeMode;
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Advance date by N trading business days (Monday to Friday, strictly skipping Saturday & Sunday)
// so CME financial chart does not create empty weekend gaps ("bolong")
function getNextBusinessDate(fromYMD: string, offsetBusinessDays: number = 1): string {
  const cur = parseYMD(fromYMD);
  let added = 0;
  while (added < offsetBusinessDays) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return formatYMD(cur);
}

function generateDailyForecastData(
  lastCandle: CandleData,
  predictions: {
    h1: PredictionHorizon;
    h7: PredictionHorizon;
    h30: PredictionHorizon;
  },
  isXau: boolean,
  isWeekly: boolean = false
) {
  const basePoints: { time: string; value: number }[] = [];
  const conservativePoints: { time: string; value: number }[] = [];
  const ghostCandles: CandleData[] = [];

  const anchorPrice = lastCandle.close;

  basePoints.push({ time: lastCandle.time, value: anchorPrice });
  conservativePoints.push({ time: lastCandle.time, value: anchorPrice });

  const h1Target = predictions.h1.targetPrice;
  const h7Target = predictions.h7.targetPrice;
  const h30Target = predictions.h30.targetPrice;

  const c1 = predictions.h1.conservativePrice ?? predictions.h1.lowerBound;
  const c7 = predictions.h7.conservativePrice ?? predictions.h7.lowerBound;
  const c30 = predictions.h30.conservativePrice ?? predictions.h30.lowerBound;

  let prevBase = anchorPrice;

  if (isWeekly) {
    // 4 weekly steps for continuous weekly axis in ALL timeframe
    const baseDate = parseYMD(lastCandle.time);
    for (let w = 1; w <= 4; w++) {
      const cur = new Date(baseDate);
      cur.setDate(cur.getDate() + w * 7);
      const dateStr = formatYMD(cur);

      let baseVal: number;
      let consVal: number;

      if (w === 1) {
        baseVal = h7Target;
        consVal = c7;
      } else {
        const progress = (w - 1) / (4 - 1);
        baseVal = h7Target + (h30Target - h7Target) * progress;
        consVal = c7 + (c30 - c7) * progress;
      }

      baseVal = isXau ? Math.round(baseVal * 100) / 100 : Math.round(baseVal);
      consVal = isXau ? Math.round(consVal * 100) / 100 : Math.round(consVal);

      basePoints.push({ time: dateStr, value: baseVal });
      conservativePoints.push({ time: dateStr, value: consVal });

      const open = prevBase;
      const close = baseVal;
      const spread = isXau ? 15 : 9000;
      const high = isXau
        ? Math.round((Math.max(open, close) + spread * 0.6) * 100) / 100
        : Math.round(Math.max(open, close) + spread * 0.6);
      const low = isXau
        ? Math.round((Math.min(open, close) - spread * 0.6) * 100) / 100
        : Math.round(Math.min(open, close) - spread * 0.6);

      ghostCandles.push({ time: dateStr, open, high, low, close });
      prevBase = baseVal;
    }
  } else {
    // 22 trading business days (~1 calendar month), skipping weekends for continuous x-axis
    for (let bDay = 1; bDay <= 22; bDay++) {
      const dateStr = getNextBusinessDate(lastCandle.time, bDay);

      let baseVal: number;
      let consVal: number;

      if (bDay === 1) {
        baseVal = h1Target;
        consVal = c1;
      } else if (bDay <= 5) {
        const progress = (bDay - 1) / (5 - 1);
        baseVal = h1Target + (h7Target - h1Target) * progress;
        consVal = c1 + (c7 - c1) * progress;
      } else {
        const progress = (bDay - 5) / (22 - 5);
        const eased = Math.pow(progress, 1.25);
        baseVal = h7Target + (h30Target - h7Target) * eased;
        consVal = c7 + (c30 - c7) * eased;
      }

      baseVal = isXau ? Math.round(baseVal * 100) / 100 : Math.round(baseVal);
      consVal = isXau ? Math.round(consVal * 100) / 100 : Math.round(consVal);

      basePoints.push({ time: dateStr, value: baseVal });
      conservativePoints.push({ time: dateStr, value: consVal });

      const open = prevBase;
      const close = baseVal;
      const spread = isXau ? 10 : 6000;
      const high = isXau 
        ? Math.round((Math.max(open, close) + spread * 0.6) * 100) / 100 
        : Math.round(Math.max(open, close) + spread * 0.6);
      const low = isXau 
        ? Math.round((Math.min(open, close) - spread * 0.6) * 100) / 100 
        : Math.round(Math.min(open, close) - spread * 0.6);

      ghostCandles.push({
        time: dateStr,
        open,
        high,
        low,
        close,
      });

      prevBase = baseVal;
    }
  }

  return { basePoints, conservativePoints, ghostCandles };
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  candles,
  predictions,
  asset,
  currency,
  signal,
  timeframe,
  onTimeframeChange,
  theme = 'dark',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const isLight = theme === 'light';

  // UI states for historical tool visualization
  const [chartStyle, setChartStyle] = useState<ChartStyleType>('CANDLESTICK');
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  const [showSma20, setShowSma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  
  // Forecast visualization options: side-by-side & continuous
  const [showBaseForecast, setShowBaseForecast] = useState(false);
  const [showConservativeForecast, setShowConservativeForecast] = useState(false);
  const [showGhostCandles, setShowGhostCandles] = useState(false);

  const [hoveredData, setHoveredData] = useState<{
    time: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    value?: number;
    volume?: number;
  } | null>(null);

  const isXau = currency === 'USD';
  const lastCandle = candles[candles.length - 1];

  const fmt = (v?: number) => {
    if (v === undefined || v === null) return '-';
    if (isXau) return `$${v.toFixed(2)}`;
    return `Rp ${Math.round(v).toLocaleString('id-ID')}`;
  };

  const indicatorsMenuRef = useRef<HTMLDivElement>(null);
  const indicatorsBtnRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!showIndicatorsMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        indicatorsMenuRef.current &&
        !indicatorsMenuRef.current.contains(target) &&
        indicatorsBtnRef.current &&
        !indicatorsBtnRef.current.contains(target)
      ) {
        setShowIndicatorsMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIndicatorsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showIndicatorsMenu]);

  const baseColorBadge = signal === 'BUY' 
    ? { text: 'text-emerald-400', bg: 'bg-emerald-500', hex: '#10b981' }
    : signal === 'SELL'
    ? { text: 'text-rose-400', bg: 'bg-rose-500', hex: '#f43f5e' }
    : { text: 'text-amber-400', bg: 'bg-amber-500', hex: '#f59e0b' };

  const formatOffsetDate = (days: number) => {
    if (!lastCandle?.time) return `H+${days}`;
    const d = new Date(lastCandle.time);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !lastCandle) return;

    // Reset container DOM
    container.innerHTML = '';

    const chart = createChart(container, {
      width: container.clientWidth || 700,
      height: 440,
      layout: {
        background: { type: ColorType.Solid, color: isLight ? '#faf6ee' : '#0b0f19' },
        textColor: isLight ? '#334155' : '#9ca3af',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: isLight ? '#e8dfc9' : '#161e2e' },
        horzLines: { color: isLight ? '#e8dfc9' : '#161e2e' },
      },
      crosshair: {
        vertLine: {
          color: isLight ? '#b45309' : '#4b5563',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: isLight ? '#92400e' : '#1f2937',
        },
        horzLine: {
          color: isLight ? '#b45309' : '#4b5563',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: isLight ? '#92400e' : '#1f2937',
        },
      },
      rightPriceScale: {
        borderColor: isLight ? '#d6c7ae' : '#1f2937',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.22 : 0.1,
        },
      },
      timeScale: {
        borderColor: isLight ? '#d6c7ae' : '#1f2937',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        minBarSpacing: 0.5,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const forecastDateStr = getNextBusinessDate(lastCandle.time, 1);
    const targetH1 = predictions.h1.targetPrice;
    const isBullish = targetH1 >= lastCandle.close;
    const spreadH1 = isXau ? 16 : 9500;

    const forecastCandle = {
      time: forecastDateStr,
      open: lastCandle.close,
      high: Math.round((Math.max(lastCandle.close, targetH1) + spreadH1 * 0.5) * 100) / 100,
      low: Math.round((Math.min(lastCandle.close, targetH1) - spreadH1 * 0.5) * 100) / 100,
      close: targetH1,
      color: isBullish ? '#10b981' : '#ef4444',
      borderColor: '#38bdf8',
      wickColor: isBullish ? '#10b981' : '#ef4444',
    };

    let mainSeries: any = null;
    const allCandlesData = [
      ...candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
      forecastCandle,
    ];

    if (chartStyle === 'CANDLESTICK') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: true,
        borderColor: '#10b981',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        priceFormat: {
          type: 'price',
          precision: isXau ? 2 : 0,
          minMove: isXau ? 0.01 : 100,
        },
      });
      mainSeries.setData(allCandlesData);
    } else if (chartStyle === 'AREA') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: isXau ? 'rgba(245, 158, 11, 0.45)' : 'rgba(234, 179, 8, 0.45)',
        bottomColor: 'rgba(245, 158, 11, 0.01)',
        lineColor: '#f59e0b',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: isXau ? 2 : 0,
          minMove: isXau ? 0.01 : 100,
        },
      });
      mainSeries.setData(allCandlesData.map((c) => ({ time: c.time, value: c.close })));
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: isXau ? 2 : 0,
          minMove: isXau ? 0.01 : 100,
        },
      });
      mainSeries.setData(allCandlesData.map((c) => ({ time: c.time, value: c.close })));
    }

    try {
      createSeriesMarkers(mainSeries, [
        {
          time: forecastDateStr,
          position: 'aboveBar',
          color: '#10b981',
          shape: 'arrowDown',
          text: 'H+1',
        },
      ]);
    } catch (e) {
      console.warn('Series marker fallback:', e);
    }

    // lastValueVisible & priceLineVisible disabled to avoid duplicate axis labels alongside createPriceLine
    const projectionLine = chart.addSeries(LineSeries, {
      color: '#10b981',
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: {
        type: 'price',
        precision: isXau ? 2 : 0,
        minMove: isXau ? 0.01 : 100,
      },
    });
    projectionLine.setData([
      { time: lastCandle.time, value: lastCandle.close },
      { time: forecastDateStr, value: targetH1 },
    ]);

    mainSeries.createPriceLine({
      price: targetH1,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: 'Target H+1',
    });

    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeries.setData(
        candles.map((c) => ({
          time: c.time,
          value: c.volume ?? 0,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
        }))
      );
    }

    if (showSma20) {
      const smaData = calculateSMA(candles, 20);
      if (smaData.length > 0) {
        const smaSeries = chart.addSeries(LineSeries, {
          color: '#38bdf8',
          lineWidth: 2,
          title: 'SMA 20',
          priceFormat: {
            type: 'price',
            precision: isXau ? 2 : 0,
            minMove: isXau ? 0.01 : 100,
          },
        });
        smaSeries.setData(smaData);
      }
    }

    if (showEma50) {
      const emaData = calculateEMA(candles, 50);
      if (emaData.length > 0) {
        const emaSeries = chart.addSeries(LineSeries, {
          color: '#ec4899',
          lineWidth: 2,
          title: 'EMA 50',
          priceFormat: {
            type: 'price',
            precision: isXau ? 2 : 0,
            minMove: isXau ? 0.01 : 100,
          },
        });
        emaSeries.setData(emaData);
      }
    }

    if (showBollinger) {
      const bb = calculateBollingerBands(candles, 20, 2);
      if (bb.upper.length > 0) {
        const upperSeries = chart.addSeries(LineSeries, {
          color: '#a855f7',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          title: 'BB Upper',
        });
        upperSeries.setData(bb.upper);

        const middleSeries = chart.addSeries(LineSeries, {
          color: 'rgba(168, 85, 247, 0.6)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Middle',
        });
        middleSeries.setData(bb.middle);

        const lowerSeries = chart.addSeries(LineSeries, {
          color: '#a855f7',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          title: 'BB Lower',
        });
        lowerSeries.setData(bb.lower);
      }
    }

    const isWeekly = timeframe === 'ALL';
    const forecastData = generateDailyForecastData(lastCandle, predictions, isXau, isWeekly);

    if (showGhostCandles && forecastData.ghostCandles.length > 0) {
      const ghostSeries = chart.addSeries(CandlestickSeries, {
        upColor: 'rgba(16, 185, 129, 0.45)',
        downColor: 'rgba(239, 68, 68, 0.45)',
        borderVisible: true,
        borderColor: 'rgba(245, 158, 11, 0.4)',
        wickUpColor: 'rgba(16, 185, 129, 0.5)',
        wickDownColor: 'rgba(239, 68, 68, 0.5)',
        priceFormat: {
          type: 'price',
          precision: isXau ? 2 : 0,
          minMove: isXau ? 0.01 : 100,
        },
      });
      ghostSeries.setData(forecastData.ghostCandles as any);
    }

    // Line 1: Optional Target Base Model Line
    if (showBaseForecast) {
      const baseSeries = chart.addSeries(LineSeries, {
        color: signal === 'BUY' ? '#10b981' : signal === 'SELL' ? '#f43f5e' : '#f59e0b',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        title: 'Target Base Model (30D)',
        priceFormat: {
          type: 'price',
          precision: isXau ? 2 : 0,
          minMove: isXau ? 0.01 : 100,
        },
      });
      baseSeries.setData(forecastData.basePoints);
    }

    // Line 2: Optional Skenario Konservatif Line
    if (showConservativeForecast) {
      const conservativeSeries = chart.addSeries(LineSeries, {
        color: '#06b6d4',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: 'Skenario Konservatif (30D)',
        priceFormat: {
          type: 'price',
          precision: isXau ? 2 : 0,
          minMove: isXau ? 0.01 : 100,
        },
      });
      conservativeSeries.setData(forecastData.conservativePoints);
    }

    // Crosshair movement handler
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
      ) {
        setHoveredData(null);
      } else {
        const data = param.seriesData.get(mainSeries) as any;
        if (data) {
          setHoveredData({
            time: String(param.time),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close || data.value,
            value: data.value,
          });
        }
      }
    });

    // Auto-fit content automatically: guarantees ALL bars from the start of the window
    // up to Tanggal 14 and the forecast on Tanggal 15 are immediately visible on screen!
    chart.timeScale().fitContent();
    chart.timeScale().applyOptions({ rightOffset: 5 });

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: 440,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [
    candles,
    predictions,
    chartStyle,
    showSma20,
    showEma50,
    showBollinger,
    showVolume,
    showBaseForecast,
    showConservativeForecast,
    showGhostCandles,
    currency,
    isLight,
    timeframe,
  ]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const currentSpacing = (timeScale as any).options()?.barSpacing || 9;
    const newSpacing = direction === 'in' ? currentSpacing * 1.3 : currentSpacing / 1.3;
    timeScale.applyOptions({ barSpacing: Math.max(0.5, Math.min(45, newSpacing)) });
  };

  const handleReset = () => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().fitContent();
    chartRef.current.timeScale().applyOptions({ rightOffset: 24 });
  };

  const activeOhlc = hoveredData || (lastCandle ? {
    time: lastCandle.time,
    open: lastCandle.open,
    high: lastCandle.high,
    low: lastCandle.low,
    close: lastCandle.close,
  } : null);

  const timeframes: TimeframeType[] = ['1D', '1W', '1M', '1Y', 'ALL'];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col justify-between relative">
      <div className="flex flex-col pb-3.5 mb-3 border-b border-gray-800 gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {asset}
            </h2>
            <span className="hidden sm:inline-block text-xs font-mono font-normal px-2 py-0.5 rounded bg-gray-800 text-amber-300 border border-gray-700 shrink-0">
              Multi-Horizon
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Besok: {fmt(predictions.h1.targetPrice)}</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="grid grid-cols-5 sm:flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 w-full sm:w-auto">
              {timeframes.map((tf) => {
                const tip = tf === '1D' 
                  ? 'Rentang 1 Pekan Harian (Fokus Harian Terkini)'
                  : tf === '1W'
                  ? 'Rentang 2 Pekan Perdagangan (14 Hari Bursa)'
                  : tf === '1M'
                  ? 'Rentang 1 Bulan Penuh (30 Hari Bursa)'
                  : tf === '1Y'
                  ? 'Rentang 1 Tahun (252 Hari Bursa)'
                  : 'Seluruh Riwayat Pasar (2010 - Sekarang)';
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => onTimeframeChange(tf)}
                    title={tip}
                    className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      timeframe === tf
                        ? 'bg-amber-500 text-gray-950 shadow-sm shadow-amber-500/30'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 sm:flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setChartStyle('CANDLESTICK')}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer text-center ${
                  chartStyle === 'CANDLESTICK' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Candlestick Chart"
              >
                Candles
              </button>
              <button
                type="button"
                onClick={() => setChartStyle('AREA')}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer text-center ${
                  chartStyle === 'AREA' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Mountain / Area Chart"
              >
                Area
              </button>
              <button
                type="button"
                onClick={() => setChartStyle('LINE')}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer text-center ${
                  chartStyle === 'LINE' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Line Chart"
              >
                Line
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 relative w-full sm:w-auto">
            <button
              ref={indicatorsBtnRef}
              type="button"
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className={`min-h-[44px] flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                showIndicatorsMenu 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                  : 'bg-gray-950 hover:bg-gray-800 border-gray-800 text-gray-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>Layer & Prediksi</span>
            </button>

          {showIndicatorsMenu && (
            <div 
              ref={indicatorsMenuRef}
              className="absolute top-12 right-0 z-30 w-72 bg-gray-950 border border-gray-800 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in duration-150 ring-1 ring-white/10"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-800">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                  Layer & Prediksi
                </span>
                <button
                  type="button"
                  onClick={() => setShowIndicatorsMenu(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Tutup Menu (Esc)"
                  aria-label="Tutup Menu"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block pb-1 mb-2">
                  Proyeksi Model ML (30 Hari)
                </span>
                
                <div className="space-y-2">
                  <label className="min-h-[36px] flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${baseColorBadge.bg}`}></span>
                      Target Base Model (H+1..H+30)
                    </span>
                    <input
                      type="checkbox"
                      checked={showBaseForecast}
                      onChange={(e) => setShowBaseForecast(e.target.checked)}
                      className="rounded bg-gray-900 border-gray-700 text-amber-500 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="min-h-[36px] flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      Skenario Konservatif (Berdampingan)
                    </span>
                    <input
                      type="checkbox"
                      checked={showConservativeForecast}
                      onChange={(e) => setShowConservativeForecast(e.target.checked)}
                      className="rounded bg-gray-900 border-gray-700 text-cyan-400 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="min-h-[36px] flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-3 h-3 text-amber-400" aria-hidden="true" />
                      Candle Proyeksi (simulasi model)
                    </span>
                    <input
                      type="checkbox"
                      checked={showGhostCandles}
                      onChange={(e) => setShowGhostCandles(e.target.checked)}
                      className="rounded bg-gray-900 border-gray-700 text-amber-500 cursor-pointer w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-850">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block pb-1 mb-2">
                  Indikator Teknikal
                </span>
                
                <div className="space-y-2">
                  <label className="min-h-[36px] flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                      SMA 20 (Trend Cepat)
                    </span>
                    <input
                      type="checkbox"
                      checked={showSma20}
                      onChange={(e) => setShowSma20(e.target.checked)}
                      className="rounded bg-gray-900 border-gray-700 text-amber-500 w-4 h-4"
                    />
                  </label>

                  <label className="min-h-[36px] flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                      EMA 50 (Trend Menengah)
                    </span>
                    <input
                      type="checkbox"
                      checked={showEma50}
                      onChange={(e) => setShowEma50(e.target.checked)}
                      className="rounded bg-gray-900 border-gray-700 text-amber-500 w-4 h-4"
                    />
                  </label>

                  <label className="min-h-[36px] flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                      Bollinger Bands (20, 2)
                    </span>
                    <input
                      type="checkbox"
                      checked={showBollinger}
                      onChange={(e) => setShowBollinger(e.target.checked)}
                      className="rounded bg-gray-900 border-gray-700 text-amber-500 w-4 h-4"
                    />
                  </label>

                  <label className="min-h-[36px] flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      Volume Bars (Historis)
                    </span>
                    <input
                      type="checkbox"
                      checked={showVolume}
                      onChange={(e) => setShowVolume(e.target.checked)}
                      className="rounded bg-gray-900 border-gray-700 text-amber-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowIndicatorsMenu(false)}
                  className="min-h-[44px] w-full py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Selesai / Tutup Menu</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-xl border border-gray-800 shrink-0">
            <button
              type="button"
              onClick={() => handleZoom('in')}
              aria-label="Zoom In Grafik"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom('out')}
              aria-label="Zoom Out Grafik"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset Tampilan Grafik"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              title="Reset View"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Interactive OHLCV & Prediction Horizon Status Bar */}
      <div className="bg-gray-950 px-3.5 py-2.5 rounded-xl border border-gray-850 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {activeOhlc ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-gray-400">Tanggal: <strong className="text-gray-200">{activeOhlc.time}</strong></span>
            {activeOhlc.open !== undefined && (
              <>
                <span className="text-gray-400">O: <strong className="text-gray-200">{fmt(activeOhlc.open)}</strong></span>
                <span className="text-gray-400">H: <strong className="text-emerald-400">{fmt(activeOhlc.high)}</strong></span>
                <span className="text-gray-400">L: <strong className="text-rose-400">{fmt(activeOhlc.low)}</strong></span>
                <span className="text-gray-400">C: <strong className={activeOhlc.close && activeOhlc.open && activeOhlc.close >= activeOhlc.open ? 'text-emerald-400' : 'text-rose-400'}>{fmt(activeOhlc.close)}</strong></span>
              </>
            )}
            {activeOhlc.open === undefined && activeOhlc.close && (
              <span className="text-gray-400">Harga: <strong className="text-amber-400">{fmt(activeOhlc.close)}</strong></span>
            )}
          </div>
        ) : (
          <span className="text-gray-500">Arahkan kursor ke grafik untuk inspeksi data bar</span>
        )}

        {/* Active Indicators Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          {showBaseForecast && (
            <span className={`${baseColorBadge.text} flex items-center gap-1 font-semibold`}>
              <span className={`w-2.5 h-0.5 ${baseColorBadge.bg} inline-block`}></span> Target Base ({signal})
            </span>
          )}
          {showConservativeForecast && (
            <span className="text-cyan-400 flex items-center gap-1 font-semibold">
              <span className="w-2.5 h-0.5 border-t border-cyan-400 border-dashed inline-block"></span> Konservatif
            </span>
          )}
          {showGhostCandles && (
            <span className="text-amber-400 flex items-center gap-1">
              <span>■ Candle Proyeksi (simulasi)</span>
            </span>
          )}
          {showSma20 && <span className="text-sky-400">● SMA(20)</span>}
          {showEma50 && <span className="text-pink-400">● EMA(50)</span>}
        </div>
      </div>

      {/* Main Canvas Container */}
      <div
        ref={chartContainerRef}
        className="w-full h-[440px] rounded-xl overflow-hidden relative border border-gray-850"
      />

      <div className="mt-3 pt-3 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            Milestones Proyeksi:
          </span>
          <span className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 font-mono text-[11px] text-gray-300">
            H+1 ({formatOffsetDate(1)}): <strong className={baseColorBadge.text}>{fmt(predictions.h1.targetPrice)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 font-mono text-[11px] text-gray-300">
            H+7 ({formatOffsetDate(7)}): <strong className={baseColorBadge.text}>{fmt(predictions.h7.targetPrice)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 font-mono text-[11px] text-gray-300">
            H+30 ({formatOffsetDate(30)}): <strong className={baseColorBadge.text}>{fmt(predictions.h30.targetPrice)}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2 font-mono text-[11px] text-gray-500">
          <span>Kanal Berdampingan Aktif (H+1..H+30 Penuh)</span>
        </div>
      </div>

    </div>
  );
};

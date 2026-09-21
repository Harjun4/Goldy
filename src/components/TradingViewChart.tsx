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
  HistogramSeries
} from 'lightweight-charts';
import { CandleData, PredictionHorizon, TimeframeType, ChartStyleType } from '../types';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateBollingerBands, 
  calculateRSI 
} from '../data/goldData';
import { 
  BrainCircuit, 
  Maximize2, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Activity, 
  Layers, 
  BarChart3, 
  SlidersHorizontal,
  Calendar,
  Sparkles
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
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  candles,
  predictions,
  asset,
  currency,
  signal,
  timeframe,
  onTimeframeChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  // UI states for historical tool visualization
  const [chartStyle, setChartStyle] = useState<ChartStyleType>('CANDLESTICK');
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  const [showSma20, setShowSma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showLstmForecast, setShowLstmForecast] = useState(true);
  const [showRsiSubplot, setShowRsiSubplot] = useState(false);

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

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Reset container DOM
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0f19' }, // Dark trading canvas
        textColor: '#9ca3af',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: '#161e2e' },
        horzLines: { color: '#161e2e' },
      },
      crosshair: {
        vertLine: {
          color: '#4b5563',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1f2937',
        },
        horzLine: {
          color: '#4b5563',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1f2937',
        },
      },
      rightPriceScale: {
        borderColor: '#1f2937',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.25 : 0.1,
        },
      },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // 1. Primary Price Series
    let mainSeries: any = null;

    if (chartStyle === 'CANDLESTICK') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        priceFormat: {
          type: 'price',
          precision: isXau ? 2 : 0,
          minMove: isXau ? 0.01 : 100,
        },
      });
      mainSeries.setData(
        candles.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
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
      mainSeries.setData(
        candles.map((c) => ({
          time: c.time,
          value: c.close,
        }))
      );
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
      mainSeries.setData(
        candles.map((c) => ({
          time: c.time,
          value: c.close,
        }))
      );
    }

    // 2. Volume Histogram Overlay
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
          value: c.volume || 50000,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
        }))
      );
    }

    // 3. Technical Indicator: SMA 20
    if (showSma20) {
      const smaData = calculateSMA(candles, 20);
      if (smaData.length > 0) {
        const smaSeries = chart.addSeries(LineSeries, {
          color: '#38bdf8', // Light blue
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

    // 4. Technical Indicator: EMA 50
    if (showEma50) {
      const emaData = calculateEMA(candles, 50);
      if (emaData.length > 0) {
        const emaSeries = chart.addSeries(LineSeries, {
          color: '#ec4899', // Pink
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

    // 5. Technical Indicator: Bollinger Bands (20, 2)
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

    // 6. LSTM Forecast Projection Line
    if (showLstmForecast && lastCandle) {
      const forecastSeries = chart.addSeries(LineSeries, {
        color: signal === 'BUY' ? '#10b981' : signal === 'SELL' ? '#ef4444' : '#f59e0b',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        title: 'Proyeksi LSTM',
        priceFormat: {
          type: 'price',
          precision: isXau ? 2 : 0,
          minMove: isXau ? 0.01 : 100,
        },
      });

      const getFutureDate = (daysAhead: number) => {
        const d = new Date(lastCandle.time);
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split('T')[0];
      };

      const forecastPoints = [
        { time: lastCandle.time, value: lastCandle.close },
        { time: getFutureDate(1), value: predictions.h1.targetPrice },
        { time: getFutureDate(7), value: predictions.h7.targetPrice },
        { time: getFutureDate(30), value: predictions.h30.targetPrice },
      ];
      forecastPoints.sort((a, b) => (a.time > b.time ? 1 : -1));
      forecastSeries.setData(forecastPoints);
    }

    // Crosshair subscribe
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

    chart.timeScale().fitContent();

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
    currency,
    signal,
    chartStyle,
    showSma20,
    showEma50,
    showBollinger,
    showVolume,
    showLstmForecast,
    timeframe,
  ]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const logicalRange = timeScale.getVisibleLogicalRange();
    if (!logicalRange) return;
    const delta = (logicalRange.to - logicalRange.from) * 0.2;
    if (direction === 'in') {
      timeScale.setVisibleLogicalRange({
        from: logicalRange.from + delta,
        to: logicalRange.to - delta,
      });
    } else {
      timeScale.setVisibleLogicalRange({
        from: logicalRange.from - delta,
        to: logicalRange.to + delta,
      });
    }
  };

  const handleReset = () => {
    chartRef.current?.timeScale().fitContent();
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
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative">
      
      {/* Chart Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 mb-3 border-b border-gray-800 gap-3">
        
        {/* Left: Asset Title & Timeframe Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>{asset}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-gray-800 text-amber-300 border border-gray-700">
                Interactive Chart
              </span>
            </h2>
          </div>

          {/* Timeframe selector pills */}
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-amber-500 text-gray-950 shadow-sm shadow-amber-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Style Selector */}
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setChartStyle('CANDLESTICK')}
              className={`px-2 py-1 rounded-lg font-mono transition-colors ${
                chartStyle === 'CANDLESTICK' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Candlestick Chart"
            >
              Candles
            </button>
            <button
              onClick={() => setChartStyle('AREA')}
              className={`px-2 py-1 rounded-lg font-mono transition-colors ${
                chartStyle === 'AREA' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Mountain / Area Chart"
            >
              Area
            </button>
            <button
              onClick={() => setChartStyle('LINE')}
              className={`px-2 py-1 rounded-lg font-mono transition-colors ${
                chartStyle === 'LINE' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Line Chart"
            >
              Line
            </button>
          </div>
        </div>

        {/* Right: Technical Indicator Toggle & View Controls */}
        <div className="flex items-center space-x-2 relative">
          
          {/* Indicators Dropdown Toggle */}
          <button
            onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              showIndicatorsMenu 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                : 'bg-gray-950 hover:bg-gray-800 border-gray-800 text-gray-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Indikator ({[showSma20, showEma50, showBollinger, showVolume, showLstmForecast].filter(Boolean).length})</span>
          </button>

          {/* Indicators Dropdown Menu */}
          {showIndicatorsMenu && (
            <div className="absolute top-10 right-0 z-30 w-64 bg-gray-950 border border-gray-800 rounded-2xl p-4 shadow-2xl space-y-2.5 animate-in fade-in duration-150">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block border-b border-gray-800 pb-1.5">
                Technical Indicators
              </span>
              
              <label className="flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  SMA 20 (Trend Cepat)
                </span>
                <input
                  type="checkbox"
                  checked={showSma20}
                  onChange={(e) => setShowSma20(e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                  EMA 50 (Trend Menengah)
                </span>
                <input
                  type="checkbox"
                  checked={showEma50}
                  onChange={(e) => setShowEma50(e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                  Bollinger Bands (20, 2)
                </span>
                <input
                  type="checkbox"
                  checked={showBollinger}
                  onChange={(e) => setShowBollinger(e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  Volume Bars (Historis)
                </span>
                <input
                  type="checkbox"
                  checked={showVolume}
                  onChange={(e) => setShowVolume(e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-gray-200 cursor-pointer hover:text-white">
                <span className="flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                  Proyeksi LSTM AI (H+1/7/30)
                </span>
                <input
                  type="checkbox"
                  checked={showLstmForecast}
                  onChange={(e) => setShowLstmForecast(e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-amber-500"
                />
              </label>
            </div>
          )}

          {/* Zoom & Reset Buttons */}
          <div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => handleZoom('in')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Reset View"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Interactive OHLCV & Indicators Status Bar */}
      <div className="bg-gray-950 px-3 py-2 rounded-xl border border-gray-850 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {activeOhlc ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-gray-400">Date: <strong className="text-gray-200">{activeOhlc.time}</strong></span>
            {activeOhlc.open !== undefined && (
              <>
                <span className="text-gray-400">O: <strong className="text-gray-200">{fmt(activeOhlc.open)}</strong></span>
                <span className="text-gray-400">H: <strong className="text-emerald-400">{fmt(activeOhlc.high)}</strong></span>
                <span className="text-gray-400">L: <strong className="text-rose-400">{fmt(activeOhlc.low)}</strong></span>
                <span className="text-gray-400">C: <strong className={activeOhlc.close && activeOhlc.open && activeOhlc.close >= activeOhlc.open ? 'text-emerald-400' : 'text-rose-400'}>{fmt(activeOhlc.close)}</strong></span>
              </>
            )}
            {activeOhlc.open === undefined && activeOhlc.close && (
              <span className="text-gray-400">Close: <strong className="text-amber-400">{fmt(activeOhlc.close)}</strong></span>
            )}
          </div>
        ) : (
          <span className="text-gray-500">Arahkan kursor ke grafik untuk inspeksi data bar</span>
        )}

        {/* Active Indicators Legend */}
        <div className="flex items-center space-x-3 text-[11px]">
          {showSma20 && <span className="text-sky-400">● SMA(20)</span>}
          {showEma50 && <span className="text-pink-400">● EMA(50)</span>}
          {showBollinger && <span className="text-purple-400">● BB(20,2)</span>}
          {showLstmForecast && <span className="text-amber-400">⋯ LSTM AI</span>}
        </div>
      </div>

      {/* Main Canvas Container */}
      <div
        ref={chartContainerRef}
        className="w-full h-[440px] rounded-xl overflow-hidden relative border border-gray-850"
      />

      {/* Bottom Chart Footer / Sliding Window Information */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400 gap-2">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-4 h-4 text-amber-400" />
          <span className="text-gray-300 font-medium">
            Sliding Window: <span className="text-amber-400 font-mono font-bold">60 Hari</span>
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">
            Timeframe Terpilih: <strong className="text-white font-mono">{timeframe}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2 font-mono text-[11px] text-gray-500">
          <span>Engine: Lightweight Charts v5.2</span>
          <span>•</span>
          <span>Proyeksi H+1: {fmt(predictions.h1.targetPrice)}</span>
        </div>
      </div>

    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PredictionComparisonRecord, 
  ComparisonSummaryMetrics, 
  AssetType, 
  ThemeMode 
} from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Filter, 
  Database,
  ArrowUpDown,
  Search,
  AlertCircle
} from 'lucide-react';

interface PredictionComparisonTableProps {
  currentAsset: AssetType;
  theme: ThemeMode;
  onRefreshTrigger?: () => void;
}

type HorizonFilter = 'ALL' | 'H1' | 'H7' | 'H30';
type StatusFilter = 'ALL' | 'EVALUATED' | 'PENDING';
type SortField = 'target_date' | 'base_date' | 'error_pct' | 'predicted_price';
type SortDirection = 'asc' | 'desc';

export const PredictionComparisonTable: React.FC<PredictionComparisonTableProps> = ({
  currentAsset,
  theme,
}) => {
  const isLight = theme === 'light';

  const [records, setRecords] = useState<PredictionComparisonRecord[]>([]);
  const [summary, setSummary] = useState<ComparisonSummaryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedAsset, setSelectedAsset] = useState<AssetType>(currentAsset);
  const [selectedHorizon, setSelectedHorizon] = useState<HorizonFilter>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [sortField, setSortField] = useState<SortField>('target_date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  useEffect(() => {
    setSelectedAsset(currentAsset);
  }, [currentAsset]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        asset: selectedAsset,
        horizon: selectedHorizon,
        status: selectedStatus,
        limit: '150',
      });

      const res = await fetch(`/api/goldy/comparisons?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: Gagal memuat data komparasi.`);
      }
      const data = await res.json();
      if (data.status === 'success') {
        setRecords(data.records || []);
        setSummary(data.summary || null);
      } else {
        throw new Error(data.message || 'Respons server tidak valid.');
      }
    } catch (err: any) {
      console.error('[PredictionComparisonTable fetch error]:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat menghubungi database.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAsset, selectedHorizon, selectedStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const getAriaSort = (field: SortField): 'ascending' | 'descending' | 'none' => {
    if (sortField !== field) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.target_date.includes(q) ||
          r.base_date.includes(q) ||
          r.signal.toLowerCase().includes(q) ||
          r.horizon.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'error_pct') {
        valA = a.error_pct !== null ? a.error_pct : -1;
        valB = b.error_pct !== null ? b.error_pct : -1;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, searchQuery, sortField, sortDir]);

  const formatCurrency = (val: number | null | undefined, asset: 'XAU/USD' | 'ANTAM') => {
    if (val === null || val === undefined) return '-';
    if (asset === 'XAU/USD') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6">
      <div className={`p-5 rounded-2xl border transition-colors ${
        isLight
          ? 'bg-white border-stone-200 shadow-xs'
          : 'bg-gray-950/80 border-gray-850 shadow-xl'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-800/60">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              isLight 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Database className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Tabel Evaluasi & Komparasi Model ({selectedAsset})
              </h2>
              <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
                Audit rekonsiliasi proyeksi Random Forest vs realita penutupan pasar CME/Antam secara transparan
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-2 transition-all cursor-pointer ${
                isLight
                  ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
                  : 'bg-gray-900 hover:bg-gray-800 border-gray-750 text-gray-200'
              } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
              title="Perbarui data komparasi"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isLoading ? 'Memuat...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className={`p-4 rounded-xl border ${
            isLight
              ? 'bg-stone-50 border-stone-200'
              : 'bg-gray-900/60 border-gray-800/80'
          }`}>
            <span className={`block text-xs font-medium ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
              Directional Accuracy (Hit Rate)
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-mono font-bold ${
                (summary?.directionalAccuracyPct || 0) >= 60 
                  ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                  : (isLight ? 'text-amber-700' : 'text-amber-400')
              }`}>
                {summary ? `${summary.directionalAccuracyPct}%` : '0.0%'}
              </span>
              <span className={`text-[11px] font-mono ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
                ({summary?.evaluatedCount || 0} run dievaluasi)
              </span>
            </div>
            <p className={`text-[11px] mt-1.5 leading-relaxed ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
              Persentase tebakan arah tren (naik, turun, atau konsolidasi) yang terbukti tepat saat penutupan pasar.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            isLight
              ? 'bg-stone-50 border-stone-200'
              : 'bg-gray-900/60 border-gray-800/80'
          }`}>
            <span className={`block text-xs font-medium ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
              Mean Absolute Error (MAPE)
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-mono font-bold ${
                isLight ? 'text-amber-800' : 'text-amber-400'
              }`}>
                {summary ? `${summary.averageMapePct}%` : '0.00%'}
              </span>
              <span className={`text-[11px] font-mono ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
                {selectedAsset === 'XAU/USD' 
                  ? `(±$${summary?.averageMaeUsd || 0}/oz)`
                  : `(±Rp ${(summary?.averageMaeAntam || 0).toLocaleString('id-ID')}/gr)`
                }
              </span>
            </div>
            <p className={`text-[11px] mt-1.5 leading-relaxed ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
              Rata-rata deviasi selisih harga model terhadap harga penutupan aktual pasar.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            isLight
              ? 'bg-stone-50 border-stone-200'
              : 'bg-gray-900/60 border-gray-800/80'
          }`}>
            <span className={`block text-xs font-medium ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
              Status Total Proyeksi
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-mono font-bold ${isLight ? 'text-slate-800' : 'text-gray-100'}`}>
                {summary?.totalRuns || 0}
              </span>
              <span className={`text-xs font-mono ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
                Total Record
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] font-mono">
              <span className={`inline-flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                {summary?.evaluatedCount || 0} Selesai
              </span>
              <span className="text-gray-400">|</span>
              <span className={`inline-flex items-center gap-1 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                <Clock className="w-3 h-3" aria-hidden="true" />
                {summary?.pendingCount || 0} Menunggu Hari H
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${
        isLight
          ? 'bg-white border-stone-200'
          : 'bg-gray-950/80 border-gray-850'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
          <span className={`text-xs font-semibold flex items-center gap-1 shrink-0 ${
            isLight ? 'text-stone-600' : 'text-gray-400'
          }`}>
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            Horizon:
          </span>
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
            {(['ALL', 'H1', 'H7', 'H30'] as HorizonFilter[]).map((hz) => {
              const label = hz === 'ALL' ? 'Semua' : hz === 'H1' ? 'H+1 (Besok)' : hz === 'H7' ? 'H+7 (1 Minggu)' : 'H+30 (1 Bulan)';
              const active = selectedHorizon === hz;
              return (
                <button
                  key={hz}
                  type="button"
                  onClick={() => setSelectedHorizon(hz)}
                  className={`min-h-[44px] px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer text-center ${
                    active
                      ? isLight
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : isLight
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      : 'bg-gray-900 hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
          <div className={`grid grid-cols-2 sm:inline-flex p-1 rounded-xl border w-full sm:w-auto ${
            isLight ? 'bg-stone-100 border-stone-300' : 'bg-gray-900 border-gray-800'
          }`}>
            <button
              type="button"
              onClick={() => setSelectedAsset('XAU/USD')}
              className={`min-h-[44px] px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer text-center ${
                selectedAsset === 'XAU/USD'
                  ? isLight
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'bg-gray-800 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-stone-600 hover:text-stone-900'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Spot (XAU)
            </button>
            <button
              type="button"
              onClick={() => setSelectedAsset('ANTAM')}
              className={`min-h-[44px] px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer text-center ${
                selectedAsset === 'ANTAM'
                  ? isLight
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'bg-gray-800 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-stone-600 hover:text-stone-900'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Antam Fisik
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
            <label htmlFor="select-comparison-status" className="sr-only">
              Filter Status Evaluasi
            </label>
            <select
              id="select-comparison-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
              className={`min-h-[44px] w-full px-3.5 py-2 text-xs rounded-xl border font-medium cursor-pointer transition-colors ${
                isLight
                  ? 'bg-stone-100 border-stone-300 text-stone-800'
                  : 'bg-gray-900 border-gray-800 text-gray-300'
              }`}
            >
              <option value="ALL">Semua Status</option>
              <option value="EVALUATED">Hanya Selesai (Evaluated)</option>
              <option value="PENDING">Menunggu Hari H (Pending)</option>
            </select>

            <div className="relative w-full">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-stone-600' : 'text-gray-400'
              }`} aria-hidden="true" />
              <label htmlFor="input-comparison-search" className="sr-only">
                Cari Tanggal atau Sinyal
              </label>
              <input
                id="input-comparison-search"
                type="text"
                placeholder="Cari tanggal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`min-h-[44px] w-full pl-8 pr-3 py-2 text-xs rounded-xl border font-mono transition-colors ${
                  isLight
                    ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-500'
                    : 'bg-gray-900 border-gray-800 text-gray-200 placeholder:text-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden transition-colors ${
        isLight
          ? 'bg-white border-stone-200 shadow-xs'
          : 'bg-gray-950/90 border-gray-850 shadow-xl'
      }`}>
        {errorMessage && (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" aria-hidden="true" />
            <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
              Gagal Memuat Data Komparasi
            </p>
            <p className="text-xs text-rose-400 font-mono max-w-md mx-auto">{errorMessage}</p>
            <button
              type="button"
              onClick={fetchData}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors cursor-pointer"
            >
              Coba Ulangi
            </button>
          </div>
        )}

        {isLoading && !errorMessage && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <span className={`text-xs font-mono animate-pulse ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
                Memuat data komparasi...
              </span>
            </div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`h-11 rounded-lg animate-pulse ${
                isLight ? 'bg-stone-100' : 'bg-gray-900/60'
              }`} />
            ))}
          </div>
        )}

        {!isLoading && !errorMessage && filteredAndSortedRecords.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <Database className={`w-8 h-8 mx-auto ${isLight ? 'text-stone-500' : 'text-gray-400'}`} aria-hidden="true" />
            <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
              Tidak Ada Data Proyeksi Sesuai Filter
            </p>
            <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
              Belum ada baris log untuk kombinasi aset dan filter yang dipilih. Klik tombol Synchronize di header untuk memicu inferensi model terbaru.
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredAndSortedRecords.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-semibold tracking-wider uppercase ${
                  isLight
                    ? 'bg-stone-50/80 border-stone-200 text-stone-600'
                    : 'bg-gray-900/80 border-gray-800 text-gray-400'
                }`}>
                  <th aria-sort={getAriaSort('base_date')} className="p-0 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('base_date')}
                      className="min-h-[44px] w-full py-2.5 px-4 flex items-center space-x-1 uppercase font-semibold tracking-wider hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <span>Tgl Run (T)</span>
                      <ArrowUpDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
                  </th>

                  <th aria-sort={getAriaSort('target_date')} className="p-0 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('target_date')}
                      className="min-h-[44px] w-full py-2.5 px-4 flex items-center space-x-1 uppercase font-semibold tracking-wider hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <span>Tgl Target (Hari H)</span>
                      <ArrowUpDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
                  </th>

                  <th className="py-3 px-3 whitespace-nowrap">Horizon</th>

                  <th className="py-3 px-4 text-right whitespace-nowrap">Harga Acuan (T)</th>

                  <th aria-sort={getAriaSort('predicted_price')} className="p-0 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('predicted_price')}
                      className="min-h-[44px] w-full py-2.5 px-4 flex items-center justify-end space-x-1 uppercase font-semibold tracking-wider hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <span>Harga Prediksi</span>
                      <ArrowUpDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
                  </th>

                  <th className="py-3 px-4 text-right whitespace-nowrap">Harga Aktual (Realita)</th>

                  <th aria-sort={getAriaSort('error_pct')} className="p-0 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('error_pct')}
                      className="min-h-[44px] w-full py-2.5 px-4 flex items-center justify-end space-x-1 uppercase font-semibold tracking-wider hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <span>Deviasi Error (MAPE)</span>
                      <ArrowUpDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
                  </th>

                  <th className="py-3 px-3 text-center whitespace-nowrap">Sinyal Model</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Akurasi / Status</th>
                </tr>
              </thead>

              <tbody className={`divide-y text-xs ${
                isLight ? 'divide-stone-100 text-slate-800' : 'divide-gray-850 text-gray-200'
              }`}>
                {filteredAndSortedRecords.map((row) => {
                  const isPending = row.status === 'PENDING';
                  const isHit = row.direction_hit === true;
                  const isMiss = row.direction_hit === false;

                  return (
                    <tr 
                      key={row.id}
                      className={`transition-colors ${
                        isLight
                          ? 'hover:bg-stone-50/70'
                          : 'hover:bg-gray-900/40'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <span className={isLight ? 'text-stone-600' : 'text-gray-400'}>
                          {row.base_date}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                        <span className={isPending ? (isLight ? 'text-amber-700 font-bold' : 'text-amber-400 font-bold') : (isLight ? 'text-slate-900' : 'text-white')}>
                          {row.target_date}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                          row.horizon === 'H1'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : row.horizon === 'H7'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {row.horizon}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className={isLight ? 'text-stone-600' : 'text-gray-400'}>
                          {formatCurrency(row.base_price, row.asset)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span className={isLight ? 'text-slate-900' : 'text-gray-100'}>
                          {formatCurrency(row.predicted_price, row.asset)}
                        </span>
                        <span className={`block text-[10px] font-normal ${
                          row.predicted_return_pct >= 0
                            ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                            : (isLight ? 'text-rose-700' : 'text-rose-400')
                        }`}>
                          {row.predicted_return_pct >= 0 ? '+' : ''}{row.predicted_return_pct.toFixed(2)}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        {isPending ? (
                          <span className={`inline-flex items-center gap-1 text-[11px] ${
                            isLight ? 'text-stone-600' : 'text-gray-400'
                          }`}>
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Menunggu Pasar</span>
                          </span>
                        ) : (
                          <>
                            <span className={isLight ? 'text-slate-900' : 'text-white'}>
                              {formatCurrency(row.actual_price, row.asset)}
                            </span>
                            {row.actual_return_pct !== null && (
                              <span className={`block text-[10px] font-normal ${
                                row.actual_return_pct >= 0
                                  ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                                  : (isLight ? 'text-rose-700' : 'text-rose-400')
                              }`}>
                                {row.actual_return_pct >= 0 ? '+' : ''}{row.actual_return_pct.toFixed(2)}%
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        {isPending ? (
                          <span className={isLight ? 'text-stone-600' : 'text-gray-400'}>-</span>
                        ) : (
                          <div>
                            <span className={`font-bold ${
                              (row.error_pct || 0) <= 0.5 
                                ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                                : (isLight ? 'text-amber-700' : 'text-amber-400')
                            }`}>
                              {row.error_pct !== null ? `${row.error_pct.toFixed(2)}%` : '-'}
                            </span>
                            <span className={`block text-[10px] ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
                              {row.asset === 'XAU/USD' 
                                ? `±$${row.error_abs?.toFixed(2)}`
                                : `±Rp ${Math.round(row.error_abs || 0).toLocaleString('id-ID')}`
                              }
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          row.signal === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : row.signal === 'SELL'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {row.signal === 'BUY' && <TrendingUp className="w-2.5 h-2.5" aria-hidden="true" />}
                          {row.signal === 'SELL' && <TrendingDown className="w-2.5 h-2.5" aria-hidden="true" />}
                          {row.signal === 'HOLD' && <Minus className="w-2.5 h-2.5" aria-hidden="true" />}
                          <span>{row.signal}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3 animate-pulse" aria-hidden="true" />
                            <span>Pending</span>
                          </span>
                        ) : isHit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                            <span>Hit (Akurat)</span>
                          </span>
                        ) : isMiss ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3 text-rose-400" aria-hidden="true" />
                            <span>Divergensi</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={`px-4 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] gap-2 ${
          isLight
            ? 'bg-stone-50 border-stone-200 text-stone-600'
            : 'bg-gray-950 border-gray-850 text-gray-400'
        }`}>
          <span>
            Menampilkan {filteredAndSortedRecords.length} dari {records.length} total rekaman proyeksi
          </span>
          <span className="font-mono">
            Sumber Data: Rekonsiliasi Riwayat Prediksi & Harga Penutupan Pasar
          </span>
        </div>
      </div>
    </div>
  );
};

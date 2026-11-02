import React, { useState, useEffect, useCallback } from 'react';
import { AssetType } from '../types';
import { 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Code2, 
  FileJson, 
  CheckCircle2, 
  AlertTriangle,
  Clock, 
  Server, 
  Sliders
} from 'lucide-react';

interface ModeBExplorerProps {
  currentAsset: AssetType;
  lastPrice: number;
}

export const ModeBExplorer: React.FC<ModeBExplorerProps> = ({ currentAsset, lastPrice }) => {
  const [selectedAsset, setSelectedAsset] = useState<AssetType>(currentAsset);
  const [endpointType, setEndpointType] = useState<'predict' | 'payload'>('predict');
  const [includeDetails, setIncludeDetails] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [responsePayload, setResponsePayload] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'python'>('curl');

  const executeApiCall = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    const startTime = performance.now();
    try {
      const url = new URL(
        endpointType === 'payload' ? '/api/goldy/payload' : '/api/goldy/predict',
        window.location.origin
      );
      if (endpointType === 'predict') {
        url.searchParams.set('asset', selectedAsset);
        if (includeDetails) url.searchParams.set('include_details', 'true');
        if (customPrice && !isNaN(Number(customPrice))) {
          url.searchParams.set('price', customPrice);
        }
      }

      const res = await fetch(url.toString());
      const endTime = performance.now();
      setLatency(Math.max(1, Math.round(endTime - startTime)));
      setResponseStatus(res.status);
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data?.message || `HTTP ${res.status}: Permintaan ke endpoint gagal.`);
      }
      setResponsePayload(data);
    } catch (err: any) {
      const endTime = performance.now();
      setLatency(Math.max(1, Math.round(endTime - startTime)));
      setResponseStatus(503);
      setResponsePayload(null);
      setErrorMessage(err?.message || 'Tidak dapat menghubungi server API lokal.');
    } finally {
      setLoading(false);
    }
  }, [endpointType, selectedAsset, includeDetails, customPrice]);

  useEffect(() => {
    executeApiCall();
  }, [selectedAsset, includeDetails, endpointType]);

  const handleCopy = () => {
    if (!responsePayload) return;
    navigator.clipboard.writeText(JSON.stringify(responsePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurlSnippet = () => {
    if (endpointType === 'payload') {
      return `curl -X GET "${window.location.origin}/api/goldy/payload" \\
  -H "Accept: application/json"`;
    }
    return `curl -X GET "${window.location.origin}/api/goldy/predict?asset=${encodeURIComponent(selectedAsset)}${
      includeDetails ? '&include_details=true' : ''
    }" \\
  -H "Accept: application/json"`;
  };

  const getJsSnippet = () => {
    if (endpointType === 'payload') {
      return `const response = await fetch('/api/goldy/payload');
const masterData = await response.json();

console.log("XAU Price:", masterData.current_data.xau_usd.price);
console.log("AI Recommendation:", masterData.ai_recommendation.signal);
console.log("Projections:", masterData.projections);`;
    }
    return `const response = await fetch('/api/goldy/predict?asset=${encodeURIComponent(selectedAsset)}${
      includeDetails ? '&include_details=true' : ''
    }');
const data = await response.json();

console.log("Sinyal:", data.signal);
console.log("Target H+1:", data.predicted_h1);
console.log("Akurasi Model:", data.accuracy_rate);`;
  };

  const getPythonSnippet = () => {
    if (endpointType === 'payload') {
      return `import requests

url = "${window.location.origin}/api/goldy/payload"
response = requests.get(url)
master_data = response.json()

print(f"Active Asset: {master_data['active_asset']}")
print(f"Recommendation: {master_data['ai_recommendation']['signal']}")`;
    }
    return `import requests

url = "${window.location.origin}/api/goldy/predict"
params = {
    "asset": "${selectedAsset}",
    ${includeDetails ? '"include_details": "true"' : ''}
}

response = requests.get(url, params=params)
payload = response.json()

print(f"Asset: {payload['asset']} | Signal: {payload['signal']}")
print(f"Target H+1: {payload['predicted_h1']} ({payload['change_percentage']})")`;
  };

  const isSuccess = responseStatus !== null && responseStatus >= 200 && responseStatus < 300 && !errorMessage;

  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Mode B: Developer API & JSON Output Generator
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  REST Endpoints
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Payload generator terstandarisasi untuk integrasi dashboard JavaScript & model pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>{endpointType === 'predict' ? 'GET /api/goldy/predict' : 'GET /api/goldy/payload'}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              Endpoint & Query Parameters
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="block text-gray-300 font-medium mb-1.5">
                  Pilih Endpoint API
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEndpointType('predict')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl font-mono text-xs border transition-all cursor-pointer ${
                      endpointType === 'predict'
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    /predict (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndpointType('payload')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl font-mono text-xs border transition-all cursor-pointer ${
                      endpointType === 'payload'
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    /payload (Master)
                  </button>
                </div>
              </div>

              {endpointType === 'predict' && (
                <>
                  <div>
                    <span className="block text-gray-300 font-medium mb-1.5">
                      asset <span className="text-rose-400">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAsset('XAU/USD')}
                        className={`min-h-[44px] px-3 py-2 rounded-xl font-mono text-xs border transition-all cursor-pointer ${
                          selectedAsset === 'XAU/USD'
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        XAU/USD
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAsset('ANTAM')}
                        className={`min-h-[44px] px-3 py-2 rounded-xl font-mono text-xs border transition-all cursor-pointer ${
                          selectedAsset === 'ANTAM'
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        ANTAM (LM)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input-custom-price" className="block text-gray-300 font-medium mb-1.5">
                      price (optional simulation)
                    </label>
                    <input
                      id="input-custom-price"
                      type="number"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder={selectedAsset === 'XAU/USD' ? String(lastPrice) : '2378427'}
                      className="min-h-[44px] w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 font-mono text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Kosongkan untuk menggunakan harga dari payload master
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-800">
                    <label className="min-h-[44px] flex items-center justify-between cursor-pointer">
                      <span className="text-gray-300 font-medium">include_details</span>
                      <input
                        type="checkbox"
                        checked={includeDetails}
                        onChange={(e) => setIncludeDetails(e.target.checked)}
                        className="rounded bg-gray-950 border-gray-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-5 h-5 cursor-pointer"
                      />
                    </label>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      Sertakan data lengkap: target H+30, skenario konservatif, RMSE, dan teknikal
                    </span>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={executeApiCall}
                disabled={loading}
                className="min-h-[44px] w-full mt-2 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-gray-950" aria-hidden="true" />
                <span>{loading ? 'Mengirim Request...' : 'Kirim Request (Fetch)'}</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-xs text-gray-300 space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-amber-400" aria-hidden="true" />
              Logika Sinyal Perdagangan (Rules):
            </h4>
            <ul className="space-y-1.5 font-mono text-[11px]">
              <li className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <strong className="text-emerald-400">BUY:</strong> Target H+1 &gt; (Harga + 0.20%)
              </li>
              <li className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <strong className="text-rose-400">SELL:</strong> Target H+1 &lt; (Harga - 0.20%)
              </li>
              <li className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <strong className="text-amber-400">HOLD:</strong> Rentang toleransi -0.20% s/d +0.20%
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-gray-800 bg-gray-950 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                {isSuccess ? (
                  <span className="flex items-center text-xs font-mono font-bold text-emerald-400 gap-1.5">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Status: {responseStatus} OK
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-mono font-bold text-rose-400 gap-1.5">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    Status: {responseStatus ?? 'ERR'}
                  </span>
                )}
                <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  {latency !== null ? `${latency} ms` : '...'}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  Content-Type: application/json
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!responsePayload}
                className="min-h-[44px] flex items-center space-x-1.5 text-xs font-mono px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 transition-colors cursor-pointer"
                title="Salin JSON Payload"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-400 font-bold">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage ? (
              <div className="p-6 bg-gray-950/90 text-xs space-y-3">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-bold text-rose-400">Gagal Mengambil Payload API</p>
                    <p className="font-mono text-[11px]">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={executeApiCall}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold shrink-0 cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 font-mono text-xs overflow-x-auto bg-gray-950/90 max-h-[380px]">
                <pre className="text-emerald-400 leading-relaxed">
                  {responsePayload ? JSON.stringify(responsePayload, null, 2) : '// Memuat payload...'}
                </pre>
              </div>
            )}

            <div className="px-5 py-2.5 bg-gray-950 border-t border-gray-850 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>Schema Output: {endpointType === 'predict' ? 'Mode B Standard Schema' : 'Master Multi-Horizon Payload'}</span>
              <span className={isSuccess ? 'text-cyan-400' : 'text-rose-400'}>
                {isSuccess ? 'JSON Validated' : 'Request Failed'}
              </span>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-gray-800 bg-gray-950 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                Contoh Integrasi Kode
              </h4>

              <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('curl')}
                  className={`min-h-[44px] px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    activeCodeTab === 'curl'
                      ? 'bg-cyan-500 text-gray-950 font-bold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('js')}
                  className={`min-h-[44px] px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    activeCodeTab === 'js'
                      ? 'bg-cyan-500 text-gray-950 font-bold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  JavaScript
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('python')}
                  className={`min-h-[44px] px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    activeCodeTab === 'python'
                      ? 'bg-cyan-500 text-gray-950 font-bold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            <div className="p-5 font-mono text-xs overflow-x-auto bg-gray-950 text-gray-300">
              <pre>
                {activeCodeTab === 'curl' && getCurlSnippet()}
                {activeCodeTab === 'js' && getJsSnippet()}
                {activeCodeTab === 'python' && getPythonSnippet()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

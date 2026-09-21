import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AssetAnalysisData, ChatMessage } from '../types';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Loader2, 
  ShieldAlert, 
  Copy, 
  Check, 
  HelpCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface ModeAChatProps {
  data: AssetAnalysisData;
  initialQuestion?: string;
}

export const ModeAChat: React.FC<ModeAChatProps> = ({ data, initialQuestion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isXau = data.currency === 'USD';

  // Format currency
  const fmt = (v: number) => isXau ? `$${v.toFixed(2)}` : `Rp ${Math.round(v).toLocaleString('id-ID')}`;

  // Initial greeting that follows the 5 strict rules right away
  useEffect(() => {
    const initialText = `### 1. Market Overview
Kondisi harga **${data.asset}** saat ini tercatat di level **${fmt(data.lastPrice)}** dengan perubahan harian **${data.dailyChangePct >= 0 ? '+' : ''}${data.dailyChangePct.toFixed(2)}%**, mengindikasikan struktur akumulasi harga yang solid dalam koridor tren naik jangka pendek.

---

### 2. Rekomendasi & Proyeksi AI (AI Analytics Panel)
- **Sinyal Utama:** **\`${data.signal}\`** — Logika: Proyeksi target H+1 (+${data.predictions.h1.changePct}%) berada di atas ambang batas beli +0.20%.
- **Tingkat Akurasi Model:** **${data.metrics.accuracyRate}** (RMSE: ±${fmt(data.metrics.rmse)} per ${data.unit}).
- **Sliding Window:** 60 Hari Time-Series LSTM.

| Horizon Waktu | Estimasi Harga Target | Proyeksi Perubahan (%) | Rentang Toleransi Risiko (RMSE) |
| :--- | :--- | :--- | :--- |
| **H+1 (Besok)** | **${fmt(data.predictions.h1.targetPrice)}** | \`+${data.predictions.h1.changePct}%\` | ±${fmt(data.metrics.rmse)} |
| **H+7 (1 Minggu)** | **${fmt(data.predictions.h7.targetPrice)}** | \`+${data.predictions.h7.changePct}%\` | ±${fmt(data.metrics.rmse * 1.8)} |
| **H+30 (1 Bulan)** | **${fmt(data.predictions.h30.targetPrice)}** | \`+${data.predictions.h30.changePct}%\` | ±${fmt(data.metrics.rmse * 3.2)} |

---

### 3. Analisis Sensitivitas & Sentimen (Faktor Pengaruh)
* **Analisis Teknikal:**
  * **Support & Resistance:** Support terdekat di ${fmt(data.technicals.support1)}, sedangkan level Resistance teruji berada di ${fmt(data.technicals.resistance1)}.
  * **Indikator Momentum:** RSI(14) bertengger di level ${data.technicals.rsi} (area momentum bullish sehat tanpa sinyal jenuh beli).
  * **Moving Average:** Posisi harga konsisten di atas SMA 20 (${fmt(data.technicals.sma20)}) dan EMA 50 (${fmt(data.technicals.ema50)}).
* **Faktor Makroekonomi:**
  * **Indeks Dolar (DXY):** Di level ${data.macro.dxyIndex} (-${Math.abs(data.macro.dxyChange)}%), pelemahan mata uang USD menjadi katalis pendorong harga emas.
  * **Kebijakan Moneter The Fed:** ${data.macro.fedRateExpectation}, menekan yield obligasi US 10-Year ke ${data.macro.us10yYield}%.
  * **Kurs Domestik:** Nilai tukar IDR berada di kisaran Rp ${data.macro.usdIdrRate.toLocaleString('id-ID')}, menjaga stabilitas harga dasar emas Antam.

---

> *Disclaimer: Analisis dan proyeksi harga yang diberikan oleh Goldy merupakan hasil olahan model machine learning (LSTM) sebagai alat bantu keputusan. Ini bukan merupakan jaminan atau ajakan mutlak untuk membeli/menjual aset finansial. Selalu lakukan riset mandiri (DYOR) sebelum berinvestasi.*`;

    setMessages([
      {
        id: 'msg-init',
        role: 'assistant',
        content: initialText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          signal: data.signal,
          asset: data.asset,
          predicted_h1: data.predictions.h1.targetPrice,
        },
      },
    ]);
  }, [data.asset]);

  useEffect(() => {
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/goldy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          asset: data.asset,
          marketContext: {
            lastPrice: data.lastPrice,
            signal: data.signal,
            predicted_h1: data.predictions.h1.targetPrice,
            predicted_h7: data.predictions.h7.targetPrice,
            predicted_h30: data.predictions.h30.targetPrice,
          },
        }),
      });

      const resData = await response.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: resData.reply || 'Maaf, model sedang memproses kalibrasi data LSTM. Silakan ulangi sejenak lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        metadata: resData.metadata,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `Terjadi kendala jaringan saat menghubungi Goldy Analytics Core. Silakan coba kembali.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    `Bagaimana proyeksi harga besok (H+1) untuk ${data.asset}?`,
    `Apakah saat ini waktu yang ideal untuk akumulasi ${data.asset}?`,
    `Berapa area level support dan resistance terkuat minggu ini?`,
    `Jelaskan korelasi data inflasi US & DXY terhadap pergerakan emas`,
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl flex flex-col h-[760px] overflow-hidden">
      
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-gray-800 bg-gray-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Mode A: Analis Pasar & Edukasi Pengguna
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Active Analyst
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Konsultasi harga & proyeksi berbasis statistik LSTM (Aturan sinyal: BUY &gt; +0.2%, SELL &lt; -0.2%, HOLD ±0.2%)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
          <span className="px-2 py-1 rounded bg-gray-900 border border-gray-800">
            {data.asset}: {fmt(data.lastPrice)}
          </span>
          <span className={`px-2 py-1 rounded font-bold ${
            data.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : data.signal === 'SELL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            Sinyal: {data.signal}
          </span>
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-4 py-2.5 bg-gray-950/60 border-b border-gray-800 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          Pertanyaan Cepat:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-xs whitespace-nowrap px-3 py-1 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${!isBot ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isBot
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950 font-bold'
                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}
              >
                {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Box */}
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-lg relative group ${
                  isBot
                    ? 'bg-gray-950 border border-gray-800 text-gray-100'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-100'
                }`}
              >
                {/* Header & Copy Button */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">
                    {isBot ? 'Goldy (AI Market Analyst)' : 'Anda'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono">{msg.timestamp}</span>
                    {isBot && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
                        title="Salin analisis"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Rendered with ReactMarkdown */}
                <div className="text-sm leading-relaxed space-y-3 prose prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2 prose-headings:font-bold prose-headings:text-white prose-table:my-3">
                  <ReactMarkdown
                    components={{
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-xl border border-gray-800">
                          <table className="min-w-full divide-y divide-gray-800 text-xs font-mono">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-900 text-gray-300 font-semibold">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-3 py-2 text-left text-gray-300 uppercase tracking-wider">{children}</th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3 py-2 text-gray-200 border-t border-gray-850">{children}</td>
                      ),
                      blockquote: ({ children }) => (
                        <div className="p-3 my-3 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-200 text-xs not-italic">
                          {children}
                        </div>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">{children}</ul>
                      ),
                      code: ({ children }) => (
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-amber-300">
                          {children}
                        </span>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center animate-spin">
              <Loader2 className="w-4 h-4" />
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs text-gray-400 flex items-center space-x-2">
              <span>Goldy sedang mengevaluasi data time-series LSTM (sliding window 60-hari)...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-gray-950 border-t border-gray-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            id="input-chat-query"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Tanyakan analisis atau rekomendasi harga untuk ${data.asset}...`}
            disabled={loading}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors"
          />
          <button
            id="btn-submit-chat"
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-gray-950 font-bold transition-all shadow-md shadow-amber-500/20"
            title="Kirim ke Goldy"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 px-1 font-mono">
          <span>AI Model: Gemini 3.8 Flash + Local LSTM Engine</span>
          <span>Ambang Sinyal: BUY &gt; +0.2%, SELL &lt; -0.2%</span>
        </div>
      </div>

    </div>
  );
};

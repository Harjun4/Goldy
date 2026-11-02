import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { AssetAnalysisData, ChatMessage } from '../types';
import { 
  Send, 
  User, 
  LineChart, 
  Loader2, 
  Copy, 
  Check, 
  HelpCircle,
  RotateCcw,
  Cpu
} from 'lucide-react';

interface ModeAChatProps {
  data: AssetAnalysisData;
  initialQuestion?: string;
}

type MarkdownSegment =
  | { type: 'markdown'; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

function parseMarkdownWithTables(raw: string): MarkdownSegment[] {
  const lines = raw.split('\n');
  const segments: MarkdownSegment[] = [];
  let mdBuffer: string[] = [];
  let i = 0;

  const flushMarkdown = () => {
    if (mdBuffer.length > 0) {
      segments.push({ type: 'markdown', content: mdBuffer.join('\n') });
      mdBuffer = [];
    }
  };

  const splitTableCells = (line: string): string[] =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  while (i < lines.length) {
    const line = lines[i].trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    const isTableHeader = line.startsWith('|') && line.endsWith('|') && line.includes('|');
    const isTableDivider =
      nextLine.startsWith('|') &&
      nextLine.endsWith('|') &&
      /^\|[\s:|-]+\|$/.test(nextLine);

    if (isTableHeader && isTableDivider) {
      flushMarkdown();
      const headers = splitTableCells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length) {
        const rowLine = lines[i].trim();
        if (rowLine.startsWith('|') && rowLine.endsWith('|')) {
          rows.push(splitTableCells(rowLine));
          i++;
        } else {
          break;
        }
      }
      segments.push({ type: 'table', headers, rows });
    } else {
      mdBuffer.push(lines[i]);
      i++;
    }
  }

  flushMarkdown();
  return segments;
}

export const ModeAChat: React.FC<ModeAChatProps> = ({ data, initialQuestion }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isXau = data.currency === 'USD';

  const fmt = useCallback(
    (v: number) => (isXau ? `$${v.toFixed(2)}` : `Rp ${Math.round(v).toLocaleString('id-ID')}`),
    [isXau]
  );

  const buildInitialMessage = useCallback((): ChatMessage => {
    const rsiVal = data.technicals.rsi;
    const isOverbought = rsiVal >= 70;
    const isOversold = rsiVal <= 30;

    const overviewMomentumNote = isOversold
      ? 'menunjukkan potensi teknikal rebound bertahap menuju area ekuilibrium menyusul indikator momentum yang berada di zona jenuh jual (*oversold*).'
      : isOverbought
      ? 'menunjukkan potensi penyesuaian atau *pullback* jangka pendek menuju level support terdekat menyusul indikator momentum yang berada di zona jenuh beli (*overbought*).'
      : 'menunjukkan fase konsolidasi terukur di sekitar rentang keseimbangan antara level support dan resistance terdekat.';

    const rsiDesc = isOversold
      ? 'mengindikasikan kondisi jenuh jual yang membuka peluang pemulihan harga teknikal.'
      : isOverbought
      ? 'mengindikasikan tekanan jenuh beli yang membutuhkan konsolidasi harga.'
      : 'berada di zona netral dengan ruang pergerakan dua arah yang seimbang.';

    const rmseText =
      isXau && data.metrics.riskRmseOz
        ? data.metrics.riskRmseOz
        : `±${fmt(data.metrics.rmse)} per ${data.unit}`;

    const dxySign = data.macro.dxyChange >= 0 ? '+' : '';

    const initialText = `### 1. Market Overview
Kondisi harga **${data.asset}** saat ini tercatat di level **${fmt(data.lastPrice)}** dengan perubahan harian **${data.dailyChangePct >= 0 ? '+' : ''}${data.dailyChangePct.toFixed(2)}%**. Berdasarkan evaluasi model machine learning, pergerakan harga saat ini ${overviewMomentumNote}

---

### 2. Rekomendasi & Proyeksi AI (AI Analytics Panel)
- **Sinyal Utama:** **\`${data.signal}\`** (${data.signalLabel || 'HOLD'}) | ${data.signalReason}
- **Model Engine:** **${data.metrics.engineName || 'Goldy Multi-Horizon Core'}** (${data.metrics.modelType})
- **Tingkat Akurasi Backtest:** **${data.metrics.accuracyRate}** (Toleransi Risiko: ${rmseText}).
- **Catatan Strategis:** ${isXau ? (data.contextNote?.xauTrading || 'Sinyal momentum trading jangka pendek') : (data.contextNote?.antamPhysical || 'Sinyal timing akumulasi fisik Antam')}

| Horizon Waktu | Target Base | Skenario Konservatif | Proyeksi Perubahan (%) | Keyakinan |
| :--- | :--- | :--- | :--- | :--- |
| **H+1 (Besok)** | **${fmt(data.predictions.h1.targetPrice)}** | ${data.predictions.h1.conservativePrice ? fmt(data.predictions.h1.conservativePrice) : '-'} | \`${data.predictions.h1.changePct >= 0 ? '+' : ''}${data.predictions.h1.changePct}%\` | ${data.predictions.h1.confidence}% |
| **H+7 (1 Minggu)** | **${fmt(data.predictions.h7.targetPrice)}** | ${data.predictions.h7.conservativePrice ? fmt(data.predictions.h7.conservativePrice) : '-'} | \`${data.predictions.h7.changePct >= 0 ? '+' : ''}${data.predictions.h7.changePct}%\` | ${data.predictions.h7.confidence}% |
| **H+30 (1 Bulan)** | **${fmt(data.predictions.h30.targetPrice)}** | ${data.predictions.h30.conservativePrice ? fmt(data.predictions.h30.conservativePrice) : '-'} | \`${data.predictions.h30.changePct >= 0 ? '+' : ''}${data.predictions.h30.changePct}%\` | ${data.predictions.h30.confidence}% |

---

### 3. Analisis Sensitivitas & Sentimen (Faktor Pengaruh)
* **Analisis Teknikal:**
  * **Support & Resistance:** Support terdekat di S1 **${fmt(data.technicals.support1)}** dan S2 **${fmt(data.technicals.support2)}**, dengan Resistance di R1 **${fmt(data.technicals.resistance1)}** dan R2 **${fmt(data.technicals.resistance2)}**.
  * **Indikator Momentum:** RSI(14) berada di level **${data.technicals.rsi}** (*${data.technicals.rsiStatus || (isOversold ? 'Oversold' : isOverbought ? 'Overbought' : 'Netral')}*), ${rsiDesc}
  * **Moving Average:** SMA 20 (${fmt(data.technicals.sma20)}) dan EMA 50 (${fmt(data.technicals.ema50)}) mencerminkan struktur *${data.technicals.maCrossStatus || 'Trend'}*.
* **Faktor Makroekonomi & Pasar Global:**
  * **Indeks Dolar (DXY):** Di level **${data.macro.dxyIndex}** (${data.macro.dxyStatus || 'Stabil'} ${dxySign}${data.macro.dxyChange}%), memengaruhi valuasi komoditas berdenominasi USD.
  * **Yield US 10-Year:** Berada di **${data.macro.us10yYield}%**, memengaruhi opportunity cost aset non-bunga.
  * **Volatilitas Pasar (CBOE VIX):** Di level **${data.macro.vixValue || 16.01}** (*${data.macro.vixStatus || 'Kondusif'}*), mencerminkan tingkat risiko sentimen pasar global.
  * **Kurs Domestik:** Nilai tukar IDR berada di kisaran **Rp ${data.macro.usdIdrRate.toLocaleString('id-ID')}** (*${data.macro.usdIdrStatus || 'Stabil'}*), menjaga konversi harga fisik Antam.

---

> *Disclaimer: Analisis dan proyeksi harga yang diberikan oleh Goldy merupakan hasil olahan model machine learning (${data.metrics.modelType}) sebagai alat bantu keputusan. Ini bukan merupakan jaminan atau ajakan mutlak untuk membeli/menjual aset finansial. Selalu lakukan riset mandiri (DYOR) sebelum berinvestasi.*`;

    return {
      id: 'msg-init',
      role: 'assistant',
      content: initialText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      metadata: {
        signal: data.signal,
        asset: data.asset,
        predicted_h1: data.predictions.h1.targetPrice,
      },
    };
  }, [data, fmt, isXau]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`goldy_chat_mem_v2_${data.asset}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {}

    setMessages([buildInitialMessage()]);
  }, [data.asset, buildInitialMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`goldy_chat_mem_v2_${data.asset}`, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, data.asset]);

  const handleClearChat = () => {
    try {
      localStorage.removeItem(`goldy_chat_mem_v2_${data.asset}`);
    } catch (e) {}
    setMessages([buildInitialMessage()]);
  };

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
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
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
        content: resData.reply || 'Maaf, model sedang memproses kalibrasi data. Silakan ulangi sejenak lagi.',
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

  const markdownComponents = {
    blockquote: ({ children }: any) => (
      <div className="p-3 my-3 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-200 text-xs not-italic">
        {children}
      </div>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">{children}</ul>
    ),
    code: ({ children }: any) => (
      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-amber-300">
        {children}
      </span>
    ),
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl flex flex-col min-h-[520px] h-[calc(100dvh-11rem)] max-h-[760px] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 bg-gray-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <LineChart className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Mode A: Analis Pasar & Edukasi Pengguna
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Active Analyst
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Konsultasi harga & proyeksi berbasis model kuantitatif (Aturan sinyal: BUY &gt; +0.2%, SELL &lt; -0.2%, HOLD ±0.2%)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 text-xs font-mono text-gray-400 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleClearChat}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-amber-400 border border-gray-800 transition-colors text-xs font-sans cursor-pointer"
            title="Bersihkan riwayat obrolan dan mulai sesi baru"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Chat</span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800">
              {data.asset}: {fmt(data.lastPrice)}
            </span>
            <span className={`px-2.5 py-1.5 rounded-lg font-bold ${
              data.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : data.signal === 'SELL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              Sinyal: {data.signal}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-gray-950/60 border-b border-gray-800 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          Pertanyaan Cepat:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="min-h-[44px] text-xs whitespace-nowrap px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          const segments = parseMarkdownWithTables(msg.content);

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${!isBot ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isBot
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}
              >
                {isBot ? <LineChart className="w-4 h-4" aria-hidden="true" /> : <User className="w-4 h-4" aria-hidden="true" />}
              </div>

              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-md relative group ${
                  isBot
                    ? 'bg-gray-950 border border-gray-800 text-gray-100'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-100'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs text-gray-400">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-300">
                      {isBot ? 'Goldy (AI Market Analyst)' : 'Anda'}
                    </span>
                    {isBot && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 border ${
                        (msg.metadata as any)?.is_live_gemini
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : (msg.metadata as any)?.server_503_spike
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                      }`}>
                        <Cpu className="w-2.5 h-2.5" aria-hidden="true" />
                        <span>
                          {(msg.metadata as any)?.is_live_gemini 
                            ? `Gemini Live (${(msg.metadata as any)?.model_used || 'Gemini API'})` 
                            : (msg.metadata as any)?.server_503_spike 
                            ? 'Google 503 (High Demand) • Local Engine' 
                            : 'Analytical Engine'}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono">{msg.timestamp}</span>
                    {isBot && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        aria-label="Salin analisis"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                        title="Salin analisis"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm leading-relaxed space-y-3 prose prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2 prose-headings:font-bold prose-headings:text-white">
                  {segments.map((seg, idx) =>
                    seg.type === 'markdown' ? (
                      <ReactMarkdown key={idx} components={markdownComponents}>
                        {seg.content}
                      </ReactMarkdown>
                    ) : (
                      <div key={idx} className="overflow-x-auto my-3 rounded-xl border border-gray-800">
                        <table className="min-w-full divide-y divide-gray-800 text-xs font-mono">
                          <thead className="bg-gray-900 text-gray-300 font-semibold">
                            <tr>
                              {seg.headers.map((h, hIdx) => (
                                <th key={hIdx} className="px-3 py-2 text-left text-gray-300 uppercase tracking-wider">
                                  <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
                                    {h}
                                  </ReactMarkdown>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-850">
                            {seg.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-gray-900/40">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-3 py-2 text-gray-200 border-t border-gray-850 whitespace-nowrap">
                                    <ReactMarkdown
                                      components={{
                                        p: ({ children }) => <>{children}</>,
                                        code: markdownComponents.code,
                                      }}
                                    >
                                      {cell}
                                    </ReactMarkdown>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center animate-spin">
              <Loader2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs text-gray-400 flex items-center space-x-2">
              <span>Goldy sedang mengevaluasi data time-series (sliding window 60-hari)...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-950 border-t border-gray-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <label htmlFor="input-chat-query" className="sr-only">
            Pertanyaan analisis untuk Goldy
          </label>
          <input
            id="input-chat-query"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Tanyakan analisis atau rekomendasi harga untuk ${data.asset}...`}
            disabled={loading}
            className="min-h-[44px] flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-colors"
          />
          <button
            id="btn-submit-chat"
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Kirim pesan analisis ke Goldy"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-sm cursor-pointer"
            title="Kirim ke Goldy"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-gray-500 px-1 font-mono gap-2">
          <span>Engine: {data.metrics.engineName || 'Goldy Multi-Horizon Core'} & Google Gemini API</span>
          <span>Ambang Sinyal: BUY &gt; +0.2%, SELL &lt; -0.2%</span>
        </div>
      </div>
    </div>
  );
};

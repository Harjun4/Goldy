# Goldy - Gold Analytics & Multi-Horizon Price Prediction Engine

Aplikasi analitik kuantitatif dan prediksi harga emas multi-horizon (**H+1, H+7, H+30**) untuk **Spot Gold (`XAU/USD`)** dan **Emas Fisik Logam Mulia (`ANTAM`)**.

## Arsitektur Sistem

- **Frontend (`src/`)**: React 19 + TypeScript + Tailwind CSS v4 + Lightweight Charts (`lightweight-charts` v5).
  - **Dashboard & Chart**: Grafik candlestick/area/line interaktif dengan indikator teknikal (`SMA 20`, `EMA 50`, `Bollinger Bands`, `Volume`) dan proyeksi berdampingan (`H+1`, `H+7`, `H+30`).
  - **Tabel Komparasi Prediksi**: Audit rekonsiliasi historis antara prediksi model vs harga penutupan aktual pasar (`Hit Rate`, `MAPE`, `MAE`).
  - **Sistem Price Alert**: Peringatan harga real-time (`ABOVE`, `BELOW`, `PCT_GAIN`, `PCT_DROP`) dengan audio chime Web Audio API.
  - **Mode A (AI Market Analyst)**: Konsultasi interaktif berbasis konteks kuantitatif payload + Google Gemini API (`@google/genai`).
  - **Mode B (Developer API Explorer)**: Generator dan inspektor payload JSON standar (`/api/goldy/predict` dan `/api/goldy/payload`).
- **Backend (`server.ts` & `server/`)**: Express + Vite middleware + Supabase Postgres sync + integrasi pipeline Python eksternal.
  - `server/config.ts`: Konfigurasi environment, path workspace, dan klien Supabase.
  - `server/services/payloadStore.ts`: Cache dan pembacaan `payload_goldy.json` serta `src/data/realGoldCandles.json`.
  - `server/services/supabaseSync.ts`: Sinkronisasi riwayat pasar dan evaluasi otomatis prediksi `PENDING` -> `EVALUATED`.
  - `server/services/gemini.ts`: Penemuan model resmi Google Gemini API dan normalisasi riwayat percakapan.
  - `server/routes/api.ts`: Definisi seluruh endpoint REST API (`/api/health`, `/api/goldy/payload`, `/api/goldy/candles`, `/api/goldy/sync`, `/api/goldy/comparisons`, `/api/goldy/predict`, `/api/goldy/chat`).

## Struktur Direktori

```text
new goldy/
├── anti-slop/                 # Laporan audit kualitas UI, aksesibilitas, dan struktur
├── docs/                      # Dokumentasi teknis, rencana implementasi, dan laporan
│   ├── dokumentasi.md
│   ├── laporan/
│   └── rencana/
├── server/                    # Modul backend Express
│   ├── config.ts
│   ├── routes/
│   │   └── api.ts
│   └── services/
│       ├── gemini.ts
│       ├── payloadStore.ts
│       └── supabaseSync.ts
├── src/                       # Kode sumber frontend React + TypeScript
│   ├── components/
│   ├── data/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── DESIGN.md                  # Spesifikasi desain, palet warna, tipografi, dan keputusan UI
├── payload_goldy.json         # Snapshot payload prediksi multi-horizon terkini
├── server.ts                  # Entry point server Express + Vite
└── package.json
```

## Konfigurasi Environment (`.env`)

Salin `.env.example` menjadi `.env` dan isi variabel berikut:

```env
PORT=3000
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"

SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
SUPABASE_PROJECT_REF="your-project-ref"

# Opsional: Path ke skrip pipeline Machine Learning Python
ML_PIPELINE_SCRIPT="../CP - MACHINE LEARNING/run_goldy_pipeline.py"
```

## Menjalankan Aplikasi

1. Instal dependensi:
   ```bash
   npm install
   ```
2. Jalankan server pengembangan (`http://localhost:3000`):
   ```bash
   npm run dev
   ```
3. Cek tipe TypeScript dan bangun bundel produksi:
   ```bash
   npm run lint
   npm run build
   ```


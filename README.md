# Waiter Customer Lookup App

Aplikasi waiter untuk lookup data pelanggan berdasarkan nomor HP + AI drink recommendation.

## Stack

- **Frontend & API:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenRouter (Gemini 2.0 Flash)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (free tier)

## Project Structure

```
waiter-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main waiter UI
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Tailwind styles
│   │   └── api/
│   │       ├── customer/[phone]/
│   │       │   └── route.ts            # GET customer by phone + AI rec
│   │       └── customers/
│   │           └── route.ts            # POST new customer / transaction
│   └── lib/
│       ├── supabase.ts                 # Supabase client
│       ├── ai.ts                       # AI recommendation logic
│       └── types.ts                    # TypeScript types
├── supabase/
│   └── schema.sql                      # Database schema
├── .env.local.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Setup Steps

### 1. Buat Supabase project
- Daftar di https://supabase.com (gratis)
- Bikin project baru, catat URL + anon key
- Buka SQL Editor → paste isi `supabase/schema.sql` → run

### 2. Dapatkan OpenRouter API key
- Daftar di https://openrouter.ai
- Buat API key baru (lo sudah familiar dari Meridian)

### 3. Setup environment variables
```bash
cp .env.local.example .env.local
# Isi nilai-nilai di .env.local
```

### 4. Install & run
```bash
npm install
npm run dev
```

Buka http://localhost:3000

### 5. Deploy ke Vercel
```bash
npm i -g vercel
vercel
# Set env vars di Vercel dashboard
```

## Cara Import Data Existing

Kalau data lo di Excel/CSV, ada 2 cara:

**Cara A: Supabase Table Editor**
- Buka Supabase dashboard → Table Editor → customers table → Import data via CSV

**Cara B: Script bulk import** (recommended)
- Lihat `supabase/import-template.sql` untuk template SQL INSERT
- Atau pakai endpoint `POST /api/customers/bulk-import` (perlu lo tambahin)

## Cost Estimate

- Supabase: **Free** (sampai 500MB DB, cukup untuk ratusan ribu customer)
- Vercel: **Free** (sampai 100GB bandwidth)
- OpenRouter (Gemini Flash): **~$0.0001 per request**, jadi ~Rp 1.6 per lookup
- Total ~Rp 50-100rb/bulan untuk 5000-10000 lookup

## Production Notes

- Phone number harus di-normalize (e.g. semua jadi format `08xxx` atau `+62xxx`)
- AI response di-cache di kolom `ai_recommendation_cache` supaya tidak repeat call
- Cache invalidated setiap pelanggan order minuman baru

# Deployment Guide

Panduan step-by-step deploy aplikasi waiter dari nol sampai online.

## Prerequisites

- Node.js 18+ (`node --version`)
- Git installed
- Akun Supabase (gratis)
- Akun OpenRouter (lo udah punya dari Meridian)
- Akun Vercel (gratis, bisa login pakai GitHub)

## Step 1: Setup Supabase

### 1.1 Buat project baru

- Login ke https://supabase.com
- Klik **New project**
- Project name: `waiter-app` (atau bebas)
- Database password: simpan baik-baik, nanti tidak dipakai langsung
- Region: **Southeast Asia (Singapore)** — terdekat dengan Bandung
- Plan: **Free**

Tunggu ~2 menit sampai project ready.

### 1.2 Jalankan schema SQL

- Buka **SQL Editor** di sidebar kiri
- Klik **New query**
- Copy seluruh isi file `supabase/schema.sql`
- Paste lalu klik **Run**

Cek di **Table Editor** harus muncul 3 tabel: `customers`, `menu_items`, `transactions`.

### 1.3 Ambil credentials

- Buka **Settings → API**
- Catat:
  - **Project URL** → ini `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → ini `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role secret** key → ini `SUPABASE_SERVICE_ROLE_KEY` (RAHASIA, jangan expose ke client)

## Step 2: Setup OpenRouter

- Login ke https://openrouter.ai
- Buka **Keys** → **Create Key**
- Beri nama: `waiter-app`
- Copy API key, simpan untuk `OPENROUTER_API_KEY`
- Top up credit (~$1-5 sudah cukup untuk testing)

## Step 3: Setup Local Project

### 3.1 Copy file project

Asumsi lo udah copy semua file dari folder `waiter-app/` ke lokal lo.

### 3.2 Install dependencies

```bash
cd waiter-app
npm install
```

### 3.3 Setup env variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`, isi dengan credentials dari Supabase + OpenRouter:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

### 3.4 Jalankan dev server

```bash
npm run dev
```

Buka http://localhost:3000

Test dengan nomor: `08123456789` (Budi) atau `08987654321` (Sarah).

Untuk nomor Budi belum ada transaksi (cuma master data), jadi favorit kosong. Tambah transaksi manual via Supabase Table Editor untuk test full flow.

## Step 4: Import Data Existing

Kalau lo punya data customer + transaksi di Excel/CSV:

### Cara A: Supabase CSV Import (paling cepat)

- Buka Supabase **Table Editor**
- Pilih tabel `customers`
- Klik tombol **Insert** → **Import data from CSV**
- Upload CSV dengan kolom: `phone, name, first_visit`
- Map kolom, lalu Import

Ulangi untuk `transactions` dengan kolom: `customer_id, item_name, price, transaction_date`.

⚠️ Catatan: `customer_id` di tabel transactions harus UUID, jadi lo perlu lookup dulu setelah import customers. Cara paling gampang: tambah kolom `phone` sementara di transactions, lalu update via SQL:

```sql
update transactions t
set customer_id = c.id
from customers c
where t.phone_temp = c.phone;
```

### Cara B: SQL bulk insert

Lihat contoh di `supabase/import-template.sql` (perlu lo bikin sendiri sesuai data lo).

## Step 5: Deploy ke Vercel

### 5.1 Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/waiter-app.git
git push -u origin main
```

### 5.2 Import di Vercel

- Login ke https://vercel.com
- Klik **Add New → Project**
- Import repo `waiter-app`
- Framework akan auto-detect Next.js
- Sebelum klik Deploy, set Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL`
- Klik **Deploy**

Tunggu ~2 menit, aplikasi sudah live di `https://waiter-app-xxx.vercel.app`.

### 5.3 Custom domain (opsional)

- Vercel → Project → Settings → Domains
- Tambah `customer.your-bar.com` atau apapun
- Update DNS sesuai instruksi Vercel

## Step 6: Production Hardening

Sebelum dipakai waiter beneran, ini PR list yang gue saranin:

### Authentication
Saat ini API endpoint terbuka untuk umum. Tambahkan auth biar cuma waiter yang bisa akses:
- Pakai Supabase Auth dengan email/password
- Atau pakai simple password gate di middleware

### Rate Limiting
Tambah rate limit di API route biar gak di-abuse:
- Pakai `@upstash/ratelimit` (free tier)
- Atau cek IP + count di tabel

### Phone Normalization
Pastikan semua nomor format konsisten. Ada beberapa edge case:
- `+628123456789` → `08123456789`
- `628123456789` → `08123456789`
- `08123-456-789` → `08123456789`

Logika dasar sudah ada di `src/lib/supabase.ts > normalizePhone()`.

### Monitoring
- Pakai Vercel Analytics (built-in, free)
- Log AI failure rate di Supabase tabel `ai_logs` (perlu lo bikin)

## Cost Breakdown

Estimasi bulanan untuk bar dengan ~100 customer/hari:

| Service | Usage | Cost |
|---------|-------|------|
| Vercel | <100GB bandwidth | Rp 0 |
| Supabase | <500MB DB, <2GB storage | Rp 0 |
| OpenRouter (Gemini Flash) | ~3000 calls (cached 24h) | ~Rp 50.000 |
| **Total** | | **~Rp 50.000/bulan** |

Cache TTL 24 jam berarti AI cuma di-call sekali per customer per hari maks. Bisa dinaikkan ke 7 hari kalau lo mau lebih hemat.

## Troubleshooting

**Error: "Failed to lookup customer"**
- Cek `SUPABASE_SERVICE_ROLE_KEY` di env vars
- Cek schema sudah ke-create dengan benar

**AI selalu pakai fallback**
- Cek `OPENROUTER_API_KEY` valid dan ada credit
- Cek logs di Vercel → Project → Logs

**Phone tidak ditemukan padahal ada di database**
- Cek format phone di DB vs yang diinput
- Jalankan: `select phone from customers where phone like '%123%';` di SQL editor

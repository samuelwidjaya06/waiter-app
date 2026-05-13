'use client';

import { useState } from 'react';
import type { CustomerLookupResponse } from '@/lib/types';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CustomerLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/customer/${encodeURIComponent(phone.trim())}`);
      if (!res.ok) throw new Error('Lookup failed');
      const data: CustomerLookupResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium">Customer Lookup</h1>
            <p className="text-sm text-gray-500">Waiter view</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">● Online</span>
        </div>

        {/* Search Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <label className="text-sm text-gray-600 block mb-2">Nomor HP pelanggan</label>
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="08123456789"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Cari...' : 'Cari'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-500">Mencari data & generate rekomendasi AI...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Not found */}
        {result && !result.found && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                +
              </div>
              <div>
                <p className="font-medium">Pelanggan baru</p>
                <p className="text-sm text-gray-500">Nomor {result.phone} belum terdaftar</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Tawarkan signature menu. Daftarkan setelah transaksi pertama.
            </p>
            <button className="w-full py-2 bg-gray-900 text-white rounded-lg">
              Daftarkan pelanggan baru
            </button>
          </div>
        )}

        {/* Found */}
        {result && result.found && (
          <>
            {/* Customer card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                  {initials(result.customer.name)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-base">{result.customer.name}</p>
                  <p className="text-xs text-gray-500">
                    Customer sejak {formatDate(result.customer.first_visit)}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  {tierLabel(result.customer.total_transactions)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <Stat label="Terakhir datang" value={result.customer.last_visit ? formatDate(result.customer.last_visit) : '-'} sub={result.daysSinceLastVisit !== null ? `${result.daysSinceLastVisit} hari lalu` : ''} />
                <Stat label="Total transaksi" value={`${result.customer.total_transactions}×`} />
                <Stat label="Rata-rata spend" value={`Rp ${result.avgSpend.toLocaleString('id-ID')}`} />
              </div>

              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Pesanan favorit
              </p>
              {result.favorites.length === 0 ? (
                <p className="text-sm text-gray-400">Belum ada riwayat</p>
              ) : (
                <table className="w-full">
                  <tbody>
                    {result.favorites.slice(0, 3).map((f) => (
                      <tr key={f.item_name} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 text-sm">{f.item_name}</td>
                        <td className="py-2 text-sm text-right font-medium">{f.order_count}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* AI Recommendation */}
            <div className="bg-blue-50 rounded-xl p-5">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">
                ✨ Rekomendasi AI
              </p>
              <p className="text-xl font-medium text-blue-900 mb-1">
                {result.recommendation.primary}
              </p>
              <p className="text-sm text-blue-800 mb-3 leading-relaxed">
                {result.recommendation.reasoning}
              </p>
              {result.recommendation.alternatives.length > 0 && (
                <>
                  <p className="text-xs text-blue-700 mb-1">Alternatif lain:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendation.alternatives.map((alt) => (
                      <span
                        key={alt}
                        className="text-xs px-3 py-1 rounded bg-white text-blue-700 border border-blue-200"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function tierLabel(txCount: number): string {
  if (txCount >= 50) return 'VIP';
  if (txCount >= 10) return 'Regular';
  if (txCount >= 3) return 'Active';
  return 'New';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

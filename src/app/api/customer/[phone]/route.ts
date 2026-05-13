import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, normalizePhone } from '@/lib/supabase';
import { generateRecommendation } from '@/lib/ai';
import type { FavoriteItem, MenuItem, CustomerLookupResponse } from '@/lib/types';

const CACHE_TTL_HOURS = 24;

export async function GET(
  req: NextRequest,
  { params }: { params: { phone: string } }
) {
  const phone = normalizePhone(params.phone);

  // 1. Cari customer
  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (custErr || !customer) {
    return NextResponse.json<CustomerLookupResponse>({
      found: false,
      phone,
    });
  }

  // 2. Ambil favorit (top 5)
  const { data: favRows } = await supabaseAdmin
    .from('customer_favorites')
    .select('*')
    .eq('customer_id', customer.id)
    .order('order_count', { ascending: false })
    .limit(5);

  const favorites: FavoriteItem[] = (favRows || []).map((r: any) => ({
    item_name: r.item_name,
    order_count: r.order_count,
  }));

  // 3. Hitung days since last visit & avg spend
  const daysSinceLastVisit = customer.last_visit
    ? Math.floor((Date.now() - new Date(customer.last_visit).getTime()) / 86400000)
    : null;

  const avgSpend = customer.total_transactions > 0
    ? Math.round(customer.total_spend / customer.total_transactions)
    : 0;

  // 4. Cek AI cache, kalau masih fresh pakai cache
  let recommendation = customer.ai_recommendation_cache;
  const cacheAge = customer.ai_cache_updated_at
    ? (Date.now() - new Date(customer.ai_cache_updated_at).getTime()) / 3600000
    : Infinity;

  if (!recommendation || cacheAge > CACHE_TTL_HOURS) {
    // Generate AI recommendation
    const { data: menu } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('is_active', true);

    recommendation = await generateRecommendation(
      customer.name,
      favorites,
      (menu || []) as MenuItem[]
    );

    // Cache hasilnya
    await supabaseAdmin
      .from('customers')
      .update({
        ai_recommendation_cache: recommendation,
        ai_cache_updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id);
  }

  return NextResponse.json<CustomerLookupResponse>({
    found: true,
    customer,
    favorites,
    daysSinceLastVisit,
    avgSpend,
    recommendation: recommendation!,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, normalizePhone } from '@/lib/supabase';

// POST /api/customers - daftarkan pelanggan baru atau tambah transaksi
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, name, item_name, price, menu_item_id } = body;

  if (!phone || !name) {
    return NextResponse.json({ error: 'phone & name required' }, { status: 400 });
  }

  const normalized = normalizePhone(phone);

  // Upsert customer
  const { data: customer, error: custErr } = await supabaseAdmin
    .from('customers')
    .upsert(
      { phone: normalized, name },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (custErr || !customer) {
    return NextResponse.json({ error: custErr?.message || 'Failed' }, { status: 500 });
  }

  // Kalau ada transaksi sekalian, insert
  if (item_name && price) {
    await supabaseAdmin.from('transactions').insert({
      customer_id: customer.id,
      menu_item_id: menu_item_id || null,
      item_name,
      price,
    });
  }

  return NextResponse.json({ customer });
}

-- ============================================
-- Waiter Customer Lookup - Database Schema
-- ============================================

-- Customers table
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text not null,
  first_visit date not null default current_date,
  last_visit date,
  total_transactions int default 0,
  total_spend bigint default 0,
  ai_recommendation_cache jsonb,
  ai_cache_updated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_customers_phone on customers(phone);

-- Menu items table
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  subcategory text,
  flavor_profile text,
  price bigint not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_menu_active on menu_items(is_active);

-- Transactions table
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  item_name text not null,
  quantity int default 1,
  price bigint not null,
  transaction_date timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_transactions_customer on transactions(customer_id);
create index if not exists idx_transactions_date on transactions(transaction_date desc);

-- View: customer with favorite drinks
create or replace view customer_favorites as
select
  t.customer_id,
  t.item_name,
  count(*) as order_count,
  max(t.transaction_date) as last_ordered
from transactions t
group by t.customer_id, t.item_name
order by order_count desc;

-- Function: auto-update customer stats when transaction added
create or replace function update_customer_stats()
returns trigger as $$
begin
  update customers
  set
    last_visit = new.transaction_date::date,
    total_transactions = total_transactions + 1,
    total_spend = total_spend + new.price,
    ai_recommendation_cache = null,
    updated_at = now()
  where id = new.customer_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_customer_stats on transactions;
create trigger trg_update_customer_stats
after insert on transactions
for each row execute function update_customer_stats();

-- ============================================
-- Sample data (optional - hapus kalau mau)
-- ============================================

insert into menu_items (name, category, subcategory, flavor_profile, price) values
  ('Singleton 12', 'Whisky', 'Single Malt Scotch', 'smooth, sweet, mellow, vanilla', 950000),
  ('Glenfiddich 12', 'Whisky', 'Single Malt Scotch', 'fruity, pear, fresh, light', 900000),
  ('Maker''s Mark', 'Whisky', 'Bourbon', 'sweet, vanilla, caramel, smooth', 850000),
  ('Yamazaki 12', 'Whisky', 'Japanese Single Malt', 'delicate, honey, oak, balanced', 1800000),
  ('Heineken', 'Beer', 'Lager', 'crisp, hoppy, light', 65000),
  ('Aperol Spritz', 'Cocktail', 'Aperitif', 'bitter, citrus, sparkling, light', 95000),
  ('Hugo Spritz', 'Cocktail', 'Aperitif', 'floral, elderflower, mint, fresh', 95000),
  ('Prosecco Glass', 'Wine', 'Sparkling', 'crisp, fruity, dry', 120000)
on conflict do nothing;

insert into customers (phone, name, first_visit) values
  ('08123456789', 'Budi Santoso', '2020-03-02'),
  ('08987654321', 'Sarah Wijaya', '2023-08-15')
on conflict (phone) do nothing;

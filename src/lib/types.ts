export type Customer = {
  id: string;
  phone: string;
  name: string;
  first_visit: string;
  last_visit: string | null;
  total_transactions: number;
  total_spend: number;
  ai_recommendation_cache: AIRecommendation | null;
  ai_cache_updated_at: string | null;
};

export type FavoriteItem = {
  item_name: string;
  order_count: number;
  category?: string;
};

export type AIRecommendation = {
  primary: string;
  reasoning: string;
  alternatives: string[];
};

export type CustomerLookupResponse = {
  found: true;
  customer: Customer;
  favorites: FavoriteItem[];
  daysSinceLastVisit: number | null;
  avgSpend: number;
  recommendation: AIRecommendation;
} | {
  found: false;
  phone: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  flavor_profile: string | null;
  price: number;
  is_active: boolean;
};

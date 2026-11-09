export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  is_active?: number;
  email_verified?: number;
  created_at?: string;
}

export interface UserProfile {
  avatar_url?: string;
  bio?: string;
  country?: string;
  company?: string;
  preferred_language?: string;
}

export interface SubscriptionPlan {
  id: string;
  slug: 'free' | 'pro' | 'business';
  name: string;
  price_monthly: number;
  price_yearly: number;
  daily_limit: number;
  max_words: number;
  features: string[];
  is_active: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_slug: 'free' | 'pro' | 'business';
  plan_name: string;
  billing_cycle: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  start_date: string;
  end_date: string;
  auto_renew: number;
  daily_limit: number;
  max_words: number;
  features: string[];
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  plan_id: string;
  plan_name?: string;
  plan_slug?: string;
  billing_cycle: 'monthly' | 'yearly';
  amount_usdt: number;
  currency: string;
  receiving_address: string;
  tx_hash?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  admin_note?: string;
  verified_at?: string;
  created_at: string;
}

export interface ToolInputConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string;
  required?: boolean;
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  category: 'Writing' | 'Marketing' | 'SEO' | 'Productivity' | 'Social & Video' | 'Creative';
  isPremium: boolean;
  icon: string;
  badge?: string;
  inputs: ToolInputConfig[];
}

export interface GenerationRecord {
  id: string;
  user_id: string;
  tool_id: string;
  tool_name: string;
  inputs: Record<string, string>;
  output_text: string;
  word_count: number;
  is_favorite: number;
  created_at: string;
}

export type Plan = "free" | "monthly" | "lifetime";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  plan_status: string;
  is_admin: boolean;
  banned: boolean;
  stripe_account_id: string | null;
  stripe_connect_ready: boolean;
  convertkit_api_key: string | null;
  convertkit_form_id: string | null;
  mailerlite_api_key: string | null;
  mailerlite_group_id: string | null;
  custom_domain: string | null;
  created_at: string;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SalesPageContent {
  hero_headline?: string;
  hero_subheadline?: string;
  cta_text?: string;
  whats_inside_title?: string;
  benefits?: string[];
  author_name?: string;
  author_bio?: string;
  author_photo_url?: string;
  testimonials?: Testimonial[];
  faq?: FaqItem[];
  guarantee?: string;
}

export type SalesTemplateId = "classic" | "bold" | "minimal";

export interface Product {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  brand_colors: BrandColors;
  font: string;
  cover_url: string | null;
  cover_prompt: string | null;
  cover_overlay: boolean;
  status: "draft" | "published";
  sales_page_template: SalesTemplateId;
  sales_page: SalesPageContent;
  views: number;
  sales_count: number;
  revenue_cents: number;
  price_cents: number;
  currency: string;
  idea: string | null;
  audience: string | null;
  tone: string | null;
  title_options: string[];
  brand_names: string[];
  brand_name: string | null;
  color_suggestions: BrandColors[];
  pdf_path: string | null;
  pdf_generated_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  product_id: string;
  chapter_number: number;
  title: string;
  summary: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: string;
  product_id: string;
  email: string;
  name: string | null;
  purchased_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  buyer_email: string;
  buyer_name: string | null;
  amount: number;
  platform_fee: number;
  currency: string;
  stripe_payment_id: string | null;
  stripe_checkout_session_id: string | null;
  payout_mode: "connect" | "platform";
  payout_status: "pending" | "paid" | "not_applicable";
  status: "paid" | "refunded";
  created_at: string;
}

export const TONES = ["Professional", "Friendly", "Bold", "Spiritual", "Funny"] as const;
export type Tone = (typeof TONES)[number];

import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export const PLANS = {
  monthly: { name: "Pro Monthly", amount: 2000, interval: "month" as const },
  lifetime: { name: "Lifetime Access", amount: 19000 },
};

export function platformFeePercent() {
  const n = Number(process.env.PLATFORM_FEE_PERCENT ?? 10);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 10;
}

export function platformFee(amount: number) {
  return Math.round((amount * platformFeePercent()) / 100);
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  "Unlimited AI ebooks, 8 chapters each",
  "Cover designs, palettes and font pairings",
  "3 high converting sales page templates",
  "Stripe checkout with automatic PDF delivery",
  "Buyer list with CSV export",
  "Kit (ConvertKit) and MailerLite sync",
  "Custom domain for your sales pages",
];

export function Pricing({ ctaBase = "/signup" }: { ctaBase?: string }) {
  const [plan, setPlan] = useState<"monthly" | "lifetime">("monthly");

  return (
    <div className="mx-auto max-w-md">
      <div className="mx-auto mb-8 flex w-fit items-center rounded-full border bg-white p-1 text-sm shadow-sm">
        {(["monthly", "lifetime"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={cn(
              "rounded-full px-5 py-2 font-medium transition-colors",
              plan === p ? "bg-neutral-950 text-white" : "text-neutral-600 hover:text-neutral-950"
            )}
          >
            {p === "monthly" ? "Monthly" : "Lifetime"}
            {p === "lifetime" && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] text-brand-700">Save big</span>}
          </button>
        ))}
      </div>

      <div className="relative rounded-3xl border bg-white p-8 shadow-xl shadow-brand-600/5">
        <div className="absolute -top-3 left-8 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white">
          {plan === "monthly" ? "Cancel any time" : "Pay once, keep it forever"}
        </div>
        <p className="text-sm font-medium text-neutral-500">{plan === "monthly" ? "Pro Monthly" : "Lifetime Access"}</p>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-5xl font-semibold tracking-tight">{plan === "monthly" ? "$20" : "$190"}</span>
          <span className="mb-1.5 text-neutral-500">{plan === "monthly" ? "/month" : "one time"}</span>
        </div>
        <ul className="mt-8 space-y-3 text-sm">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Check className="h-3.5 w-3.5" />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <Button asChild size="lg" className="mt-8 w-full">
          <Link href={`${ctaBase}?plan=${plan}`}>{plan === "monthly" ? "Start for $20" : "Get lifetime access"}</Link>
        </Button>
        <p className="mt-3 text-center text-xs text-neutral-500">
          You keep 90% of every sale. We take 10% to run checkout and delivery.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  { id: "monthly" as const, name: "Pro Monthly", price: "$20", unit: "/month", note: "Cancel any time" },
  { id: "lifetime" as const, name: "Lifetime Access", price: "$190", unit: "one time", note: "Pay once, every future update included" },
];

export function PlanPicker({ initial }: { initial: "monthly" | "lifetime" }) {
  const [plan, setPlan] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="grid gap-4 text-left sm:grid-cols-2">
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlan(p.id)}
            className={cn(
              "rounded-2xl border-2 bg-white p-6 transition-all",
              plan === p.id ? "border-brand-600 shadow-lg shadow-brand-600/10" : "border-transparent shadow-sm hover:border-neutral-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{p.name}</span>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", plan === p.id && "border-brand-600 bg-brand-600 text-white")}>
                {plan === p.id && <Check className="h-3 w-3" />}
              </span>
            </div>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
              <span className="mb-1 text-sm text-muted-foreground">{p.unit}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
          </button>
        ))}
      </div>
      <Button size="lg" className="mt-8 w-full sm:w-auto sm:px-12" onClick={checkout} disabled={loading}>
        {loading && <Loader2 className="animate-spin" />} Continue to secure checkout
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">Payments processed by Stripe.</p>
    </div>
  );
}

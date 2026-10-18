"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";

/** Sends a monthly subscriber straight to lifetime checkout. The monthly plan is canceled once it is paid. */
export default function UpgradePage() {
  useEffect(() => {
    api<{ url: string }>("/api/stripe/checkout", { method: "POST", json: { plan: "lifetime" } })
      .then(({ url }) => (window.location.href = url))
      .catch((e) => {
        toast.error(e.message);
        window.location.href = "/dashboard/settings?tab=billing";
      });
  }, []);
  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Opening secure checkout...
    </div>
  );
}

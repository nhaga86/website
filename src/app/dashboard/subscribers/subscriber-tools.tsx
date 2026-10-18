"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/client-api";

export function SyncButtons({ convertkit, mailerlite }: { convertkit: boolean; mailerlite: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function sync(provider: "convertkit" | "mailerlite") {
    setBusy(provider);
    try {
      const res = await api<{ synced: number; failed: number; error?: string }>("/api/subscribers/sync", { method: "POST", json: { provider } });
      if (res.failed) toast.warning(`Synced ${res.synced}, ${res.failed} failed. ${res.error ?? ""}`);
      else toast.success(`Synced ${res.synced} subscribers`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email integrations</CardTitle>
        <CardDescription>New buyers sync automatically. Push your full list any time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {[
          { id: "convertkit" as const, name: "Kit (ConvertKit)", on: convertkit },
          { id: "mailerlite" as const, name: "MailerLite", on: mailerlite },
        ].map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.on ? "Connected" : "Not connected"}</p>
            </div>
            {p.on ? (
              <Button size="sm" variant="outline" onClick={() => sync(p.id)} disabled={!!busy}>
                {busy === p.id ? <Loader2 className="animate-spin" /> : <RefreshCw />} Sync all
              </Button>
            ) : (
              <Button size="sm" variant="ghost" asChild>
                <Link href="/dashboard/settings?tab=email">Connect</Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SubscriberFilters({ products, product, q }: { products: { id: string; title: string }[]; product?: string; q?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(q || "");
  const go = (next: { product?: string; q?: string }) => {
    const params = new URLSearchParams();
    const merged = { product, q: search, ...next };
    if (merged.product) params.set("product", merged.product);
    if (merged.q) params.set("q", merged.q);
    router.push(`/dashboard/subscribers?${params}`);
  };
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        go({ q: search });
      }}
    >
      <Input placeholder="Search by email" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
      <div className="sm:w-64">
        <Select value={product || ""} onChange={(e) => go({ product: e.target.value })}>
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </Select>
      </div>
    </form>
  );
}

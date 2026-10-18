"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, CreditCard, Download, ExternalLink, FileText, Globe, Loader2, Mail, PartyPopper, Rocket, Users } from "lucide-react";
import { toast } from "sonner";
import { BuilderHeader } from "@/components/builder/stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
import { cn, formatMoney } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  chapterCount: number;
  writtenCount: number;
  connectReady: boolean;
  customDomain: string | null;
  appUrl: string;
  feePercent: number;
}

export function PublishClient({ product: initial, chapterCount, writtenCount, connectReady, customDomain, appUrl, feePercent }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState(initial);
  const [price, setPrice] = useState((initial.price_cents / 100).toFixed(2));
  const [busy, setBusy] = useState<string | null>(null);
  const live = product.status === "published";
  const pageUrl = `${appUrl}/p/${product.slug}`;
  const domainUrl = customDomain ? `https://${customDomain}/${product.slug}` : null;
  const buyUrl = `${appUrl}/api/checkout/${product.slug}`;
  const priceCents = Math.round(Number(price) * 100);
  const embed = `<a href="${buyUrl}" style="display:inline-block;background:${product.brand_colors.primary};color:#fff;padding:14px 24px;border-radius:10px;font-weight:600;font-family:sans-serif;text-decoration:none">Buy ${product.title.replace(/"/g, "&quot;")} for ${formatMoney(priceCents || product.price_cents)}</a>`;

  async function savePrice() {
    if (!Number.isFinite(priceCents) || priceCents < 100) return toast.error("Minimum price is $1");
    setBusy("price");
    try {
      const res = await api<{ product: Product }>(`/api/products/${product.id}`, { method: "PATCH", json: { product: { price_cents: priceCents } } });
      setProduct(res.product);
      toast.success("Price saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function buildPdf() {
    setBusy("pdf");
    try {
      const res = await api<{ pdf_generated_at: string; pdf_path: string; size: number }>(`/api/products/${product.id}/pdf`, { method: "POST" });
      setProduct((p) => ({ ...p, pdf_path: res.pdf_path, pdf_generated_at: res.pdf_generated_at }));
      toast.success(`PDF ready (${Math.round(res.size / 1024)} KB)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setBusy(null);
    }
  }

  async function setPublished(publish: boolean) {
    if (publish && priceCents !== product.price_cents) await savePrice();
    setBusy("publish");
    try {
      await api(`/api/products/${product.id}/publish`, { method: "POST", json: { publish } });
      const fresh = await api<{ product: Product }>(`/api/products/${product.id}`);
      setProduct(fresh.product);
      toast.success(publish ? "Your product is live" : "Unpublished");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function connectStripe() {
    setBusy("connect");
    try {
      const { url } = await api<{ url: string }>("/api/stripe/connect", { method: "POST" });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setBusy(null);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  const checks = [
    { ok: writtenCount > 0 && writtenCount === chapterCount, label: `${writtenCount} of ${chapterCount} chapters written`, href: "edit" },
    { ok: !!product.cover_url, label: product.cover_url ? "Cover image added" : "No cover image (a branded cover is used)", optional: true, href: "edit" },
    { ok: !!product.sales_page?.hero_headline, label: "Sales page copy ready", href: "sales-page" },
    { ok: !!product.pdf_path, label: product.pdf_path ? "PDF generated" : "PDF builds when you publish" },
  ];

  return (
    <div>
      <BuilderHeader
        step={5}
        productId={product.id}
        title={product.title}
        actions={
          live ? (
            <Button variant="outline" onClick={() => setPublished(false)} disabled={!!busy}>Unpublish</Button>
          ) : (
            <Button onClick={() => setPublished(true)} disabled={!!busy || writtenCount === 0}>
              {busy === "publish" ? <Loader2 className="animate-spin" /> : <Rocket />} Publish
            </Button>
          )
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_400px] lg:px-8">
        <div className="space-y-6">
          {live && (
            <Card className="border-emerald-200 bg-emerald-50/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-900"><PartyPopper className="h-5 w-5" /> {product.title} is live</CardTitle>
                <CardDescription className="text-emerald-800">Share the link. Buyers pay with Stripe and get the PDF by email straight away.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[pageUrl, domainUrl].filter(Boolean).map((url) => (
                  <div key={url} className="flex gap-2">
                    <Input readOnly value={url!} className="bg-white" />
                    <Button variant="outline" size="icon" onClick={() => copy(url!)} aria-label="Copy"><Copy /></Button>
                    <Button variant="outline" size="icon" asChild aria-label="Open">
                      <a href={url!} target="_blank"><ExternalLink /></a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Launch checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", c.ok ? "bg-emerald-100 text-emerald-700" : c.optional ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-700")}>
                      {c.ok ? <Check className="h-3.5 w-3.5" /> : "!"}
                    </span>
                    <span className="flex-1">{c.label}</span>
                    {c.href && !c.ok && (
                      <Link href={`/dashboard/products/${product.id}/${c.href}`} className="text-xs font-medium text-brand-700 hover:underline">Fix</Link>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Ebook PDF</CardTitle>
              <CardDescription>
                Built from your chapters with your cover, colors and fonts, then stored privately. Buyers only reach it through their signed download link.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button onClick={buildPdf} disabled={!!busy || writtenCount === 0}>
                {busy === "pdf" ? <Loader2 className="animate-spin" /> : <FileText />} {product.pdf_path ? "Rebuild PDF" : "Generate PDF"}
              </Button>
              {product.pdf_path && (
                <Button variant="outline" asChild>
                  <a href={`/api/products/${product.id}/pdf`} target="_blank"><Download /> Download preview</a>
                </Button>
              )}
              {product.pdf_generated_at && (
                <span className="text-xs text-muted-foreground">Last built {new Date(product.pdf_generated_at).toLocaleString()}</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Stripe buy button</CardTitle>
              <CardDescription>Paste this on any website, link in bio or email. It opens Stripe Checkout for this product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input readOnly value={buyUrl} />
                <Button variant="outline" size="icon" onClick={() => copy(buyUrl)} aria-label="Copy link"><Copy /></Button>
              </div>
              <div className="relative">
                <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-neutral-950 p-4 text-xs text-neutral-200">{embed}</pre>
                <Button size="sm" variant="secondary" className="absolute right-2 top-2" onClick={() => copy(embed)}><Copy /> Copy HTML</Button>
              </div>
              {!live && <p className="text-xs text-amber-700">The button starts working once you publish.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-7" />
                </div>
                <Button variant="outline" onClick={savePrice} disabled={busy === "price" || priceCents === product.price_cents}>Save</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You receive {formatMoney(Math.round((priceCents || 0) * (1 - feePercent / 100)))} per sale after the {feePercent}% platform fee. Stripe processing fees apply.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Payouts {connectReady ? <Badge variant="success">Stripe connected</Badge> : <Badge variant="secondary">Platform Stripe</Badge>}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {connectReady ? (
                <p>Payments land in your own Stripe account. {100 - feePercent}% is yours, {feePercent}% goes to the platform automatically.</p>
              ) : (
                <>
                  <p>Sales go through the platform Stripe account. We hold {100 - feePercent}% for you and pay it out. Connect Stripe to get paid directly.</p>
                  <Button variant="outline" className="w-full" onClick={connectStripe} disabled={busy === "connect"}>
                    {busy === "connect" ? <Loader2 className="animate-spin" /> : <CreditCard />} Connect Stripe
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-brand-600" /> Buyer gets an email with a permanent download link the moment payment clears.</p>
              <p className="flex gap-3"><Download className="h-4 w-4 shrink-0 text-brand-600" /> Thank you page with a download button.</p>
              <p className="flex gap-3"><Users className="h-4 w-4 shrink-0 text-brand-600" /> Email saved to your <Link href="/dashboard/subscribers" className="font-medium underline">subscriber list</Link> and synced to Kit or MailerLite.</p>
              {!customDomain && (
                <p className="flex gap-3 text-muted-foreground"><Globe className="h-4 w-4 shrink-0" /> <span>Want your own domain? <Link href="/dashboard/settings?tab=domain" className="underline">Add one in settings</Link>.</span></p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

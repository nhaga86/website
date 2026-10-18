"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, ExternalLink, Eye, MoreHorizontal, Pencil, ShoppingBag, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { EbookCover } from "@/components/product/ebook-cover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatMoney, formatNumber } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function duplicate() {
    const res = await fetch(`/api/products/${product.id}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    toast.success("Product duplicated");
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return toast.error((await res.json()).error);
    setConfirm(false);
    toast.success("Product deleted");
    router.refresh();
  }

  const editHref = `/dashboard/products/${product.id}/edit`;

  return (
    <div className="group relative flex flex-col rounded-2xl border bg-white p-4 transition-shadow hover:shadow-lg">
      <Link href={editHref} className="flex justify-center rounded-xl py-6" style={{ background: product.brand_colors.accent }}>
        <EbookCover
          title={product.title}
          subtitle={product.subtitle}
          coverUrl={product.cover_url}
          overlay={product.cover_overlay}
          colors={product.brand_colors}
          size="sm"
          className="w-28"
        />
      </Link>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={editHref} className="line-clamp-2 font-semibold leading-snug hover:underline">
            {product.title}
          </Link>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant={product.status === "published" ? "success" : "secondary"}>
              {product.status === "published" ? "Live" : "Draft"}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatMoney(product.price_cents, product.currency)}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0" aria-label="Actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => router.push(editHref)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => window.open(`/p/${product.slug}`, "_blank")}>
              <ExternalLink /> View page
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={duplicate}>
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:bg-red-50" onSelect={() => setConfirm(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
        <Stat icon={<Eye className="h-3.5 w-3.5" />} label="Views" value={formatNumber(product.views)} />
        <Stat icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Sales" value={formatNumber(product.sales_count)} />
        <Stat icon={<DollarSign className="h-3.5 w-3.5" />} label="Revenue" value={formatMoney(product.revenue_cents, product.currency)} />
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              {product.title} and its sales page go offline for good. Past buyers lose their download link.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={remove} disabled={busy}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

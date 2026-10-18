"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/client-api";

export function UserActions({ userId, banned, isAdmin, plan }: { userId: string; banned: boolean; isAdmin: boolean; plan: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    try {
      await api(`/api/admin/users/${userId}`, { method: "POST", json: { action } });
      toast.success("Done");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" disabled={busy} aria-label="User actions">
          {busy ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {plan !== "lifetime" && <DropdownMenuItem onSelect={() => run("grant_lifetime")}>Grant lifetime access</DropdownMenuItem>}
        {plan !== "free" && <DropdownMenuItem onSelect={() => run("revoke_plan", "Remove this user's plan access?")}>Revoke plan</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => run(isAdmin ? "remove_admin" : "make_admin")}>{isAdmin ? "Remove admin" : "Make admin"}</DropdownMenuItem>
        <DropdownMenuSeparator />
        {banned ? (
          <DropdownMenuItem onSelect={() => run("unban")}>Unban user</DropdownMenuItem>
        ) : (
          <DropdownMenuItem className="text-red-600 focus:bg-red-50" onSelect={() => run("ban", "Ban this user? They lose access and their sales pages go offline.")}>
            Ban user
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RefundButton({ type, id, label }: { type: "sale" | "payment"; id: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function refund() {
    if (!confirm(`Refund ${label} in full? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api("/api/admin/refund", { method: "POST", json: { type, id } });
      toast.success("Refunded");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button size="sm" variant="outline" onClick={refund} disabled={busy}>
      {busy && <Loader2 className="animate-spin" />} Refund
    </Button>
  );
}

export function PayoutButton({ saleIds, label, small }: { saleIds: string[]; label: string; small?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function mark() {
    if (!confirm("Mark as paid out? Do this after you send the creator their money.")) return;
    setBusy(true);
    try {
      await api("/api/admin/payout", { method: "POST", json: { saleIds } });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button size={small ? "sm" : "default"} variant={small ? "ghost" : "outline"} onClick={mark} disabled={busy}>
      {busy && <Loader2 className="animate-spin" />} {label}
    </Button>
  );
}

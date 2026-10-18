"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else setSent(true);
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold">Reset your password</h1>
      {sent ? (
        <p className="mt-2 text-sm text-muted-foreground">If an account exists for {email}, a reset link is on its way.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="w-full" disabled={loading}>Send reset link</Button>
        </form>
      )}
      <Link href="/login" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
        Back to log in
      </Link>
    </div>
  );
}

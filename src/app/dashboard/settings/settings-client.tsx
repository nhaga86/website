"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, ExternalLink, Globe, Loader2, Mail, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/client-api";

interface SettingsProfile {
  email: string;
  full_name: string | null;
  plan: string;
  plan_status: string;
  has_billing: boolean;
  stripe_account_id: string | null;
  stripe_connect_ready: boolean;
  convertkit_connected: boolean;
  convertkit_form_id: string | null;
  mailerlite_connected: boolean;
  mailerlite_group_id: string | null;
  custom_domain: string | null;
}

export function SettingsClient({ tab, profile, justConnected, appHost, feePercent }: { tab: string; profile: SettingsProfile; justConnected: boolean; appHost: string; feePercent: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState(profile.full_name || "");
  const [ckKey, setCkKey] = useState("");
  const [ckForm, setCkForm] = useState(profile.convertkit_form_id || "");
  const [mlKey, setMlKey] = useState("");
  const [mlGroup, setMlGroup] = useState(profile.mailerlite_group_id || "");
  const [domain, setDomain] = useState(profile.custom_domain || "");

  async function save(key: string, body: Record<string, string | null>, msg = "Saved") {
    setBusy(key);
    try {
      await api("/api/settings", { method: "PATCH", json: body });
      toast.success(msg);
      router.refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function redirectTo(key: string, url: string, method = "POST") {
    setBusy(key);
    try {
      const res = await api<{ url: string }>(url, { method });
      window.location.href = res.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setBusy(null);
    }
  }

  async function disconnectStripe() {
    if (!confirm("Disconnect Stripe? New sales go through the platform account until you reconnect.")) return;
    setBusy("disconnect");
    await api("/api/stripe/connect", { method: "DELETE" }).catch(() => null);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <Tabs defaultValue={tab} className="max-w-3xl">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="payments"><Wallet className="h-3.5 w-3.5" /> Stripe Connect</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-3.5 w-3.5" /> Email</TabsTrigger>
          <TabsTrigger value="domain"><Globe className="h-3.5 w-3.5" /> Domain</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="h-3.5 w-3.5" /> Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your name is the default author on new products.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button onClick={() => save("profile", { full_name: name })} disabled={busy === "profile"}>
                {busy === "profile" && <Loader2 className="animate-spin" />} Save profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Stripe Connect
                {profile.stripe_connect_ready ? <Badge variant="success">Active</Badge> : profile.stripe_account_id ? <Badge variant="warning">Setup incomplete</Badge> : <Badge variant="secondary">Not connected</Badge>}
              </CardTitle>
              <CardDescription>
                Connect your Stripe account and buyers pay you directly. The platform keeps {feePercent}% per sale. Without Connect, sales run through the platform account and {100 - feePercent}% is paid out to you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {justConnected && profile.stripe_connect_ready && (
                <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> Stripe connected. New sales pay out to you.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {!profile.stripe_connect_ready && (
                  <Button onClick={() => redirectTo("connect", "/api/stripe/connect")} disabled={!!busy}>
                    {busy === "connect" ? <Loader2 className="animate-spin" /> : <Wallet />} {profile.stripe_account_id ? "Finish Stripe setup" : "Connect Stripe"}
                  </Button>
                )}
                {profile.stripe_account_id && (
                  <>
                    <Button variant="outline" onClick={() => redirectTo("express", "/api/stripe/connect/dashboard")} disabled={!!busy}>
                      <ExternalLink /> Open Stripe dashboard
                    </Button>
                    <Button variant="ghost" className="text-red-600" onClick={disconnectStripe} disabled={!!busy}>Disconnect</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Kit (ConvertKit) {profile.convertkit_connected && <Badge variant="success">Connected</Badge>}</CardTitle>
              <CardDescription>Every buyer gets added to your Kit account, and to a form if you set one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API key (v4)</Label>
                <Input type="password" value={ckKey} onChange={(e) => setCkKey(e.target.value)} placeholder={profile.convertkit_connected ? "Saved. Paste a new key to replace it." : "kit_..."} />
              </div>
              <div className="space-y-2">
                <Label>Form ID (optional)</Label>
                <Input value={ckForm} onChange={(e) => setCkForm(e.target.value)} placeholder="1234567" />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => (await save("ck", { ...(ckKey ? { convertkit_api_key: ckKey } : {}), convertkit_form_id: ckForm }, "Kit saved")) && setCkKey("")}
                  disabled={busy === "ck" || (!ckKey && !profile.convertkit_connected)}
                >
                  {busy === "ck" && <Loader2 className="animate-spin" />} Save
                </Button>
                {profile.convertkit_connected && (
                  <Button variant="ghost" className="text-red-600" onClick={() => save("ck", { convertkit_api_key: null, convertkit_form_id: null }, "Kit disconnected")}>Disconnect</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">MailerLite {profile.mailerlite_connected && <Badge variant="success">Connected</Badge>}</CardTitle>
              <CardDescription>Buyers are added as subscribers, and to a group if you set one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API key</Label>
                <Input type="password" value={mlKey} onChange={(e) => setMlKey(e.target.value)} placeholder={profile.mailerlite_connected ? "Saved. Paste a new key to replace it." : "eyJ0eXAi..."} />
              </div>
              <div className="space-y-2">
                <Label>Group ID (optional)</Label>
                <Input value={mlGroup} onChange={(e) => setMlGroup(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => (await save("ml", { ...(mlKey ? { mailerlite_api_key: mlKey } : {}), mailerlite_group_id: mlGroup }, "MailerLite saved")) && setMlKey("")}
                  disabled={busy === "ml" || (!mlKey && !profile.mailerlite_connected)}
                >
                  {busy === "ml" && <Loader2 className="animate-spin" />} Save
                </Button>
                {profile.mailerlite_connected && (
                  <Button variant="ghost" className="text-red-600" onClick={() => save("ml", { mailerlite_api_key: null, mailerlite_group_id: null }, "MailerLite disconnected")}>Disconnect</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain">
          <Card>
            <CardHeader>
              <CardTitle>Custom domain</CardTitle>
              <CardDescription>Serve your sales pages from your own domain, for example books.yoursite.com/your-product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="books.yoursite.com" />
                <Button onClick={() => save("domain", { custom_domain: domain || null }, domain ? "Domain saved" : "Domain removed")} disabled={busy === "domain"}>
                  {busy === "domain" && <Loader2 className="animate-spin" />} Save
                </Button>
              </div>
              {profile.custom_domain && (
                <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
                  <p className="font-medium">Finish setup at your DNS provider</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-muted-foreground">
                        <tr><th className="py-1 pr-4">Type</th><th className="py-1 pr-4">Name</th><th className="py-1">Value</th></tr>
                      </thead>
                      <tbody className="font-mono">
                        <tr>
                          <td className="py-1 pr-4">CNAME</td>
                          <td className="py-1 pr-4">{profile.custom_domain.split(".").length > 2 ? profile.custom_domain.split(".")[0] : "@"}</td>
                          <td className="py-1">{appHost}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-muted-foreground">
                    For a root domain (yoursite.com), use the A record your host lists instead of a CNAME. DNS changes can take up to an hour. Your pages will then load at https://{profile.custom_domain}/your-product-link.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Your plan
                <Badge>{profile.plan === "lifetime" ? "Lifetime" : profile.plan === "monthly" ? "Pro Monthly" : "Free"}</Badge>
              </CardTitle>
              <CardDescription>
                {profile.plan === "lifetime"
                  ? "Paid once. You have access for life."
                  : profile.plan === "monthly"
                    ? `$20 per month. Status: ${profile.plan_status}.`
                    : "No active plan."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profile.has_billing && (
                <Button variant="outline" onClick={() => redirectTo("portal", "/api/stripe/portal")} disabled={!!busy}>
                  {busy === "portal" ? <Loader2 className="animate-spin" /> : <CreditCard />} Manage billing and invoices
                </Button>
              )}
              {profile.plan === "monthly" && (
                <Button onClick={() => (window.location.href = "/dashboard/settings/upgrade")}>Switch to lifetime for $190</Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

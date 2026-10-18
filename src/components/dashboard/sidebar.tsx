"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid, LogOut, Plus, Settings, Shield, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "My products", icon: LayoutGrid, exact: true },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/subscribers", label: "Subscribers", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ email, name, isAdmin }: { email: string; name: string | null; isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV, { href: "/admin", label: "Admin", icon: Shield }] : NAV;
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-neutral-50/50 p-4 lg:flex">
        <Logo href="/dashboard" className="px-2 py-2" />
        <Button asChild className="mt-6 w-full justify-start">
          <Link href="/dashboard/new">
            <Plus /> New product
          </Link>
        </Button>
        <nav className="mt-6 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active(item.href, "exact" in item ? item.exact : false)
                  ? "bg-white text-neutral-950 shadow-sm ring-1 ring-black/5"
                  : "text-neutral-600 hover:bg-white hover:text-neutral-950"
              )}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border bg-white p-3">
          <p className="truncate text-sm font-medium">{name || email.split("@")[0]}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <form action="/auth/signout" method="post" className="mt-2">
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile */}
      <div className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo href="/dashboard" />
          <Button asChild size="sm">
            <Link href="/dashboard/new">
              <Plus /> New
            </Link>
          </Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                active(item.href, "exact" in item ? item.exact : false) ? "bg-neutral-950 text-white" : "text-neutral-600"
              )}
            >
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

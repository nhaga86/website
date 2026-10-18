import Link from "next/link";
import { Logo } from "@/components/logo";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="rounded-md bg-neutral-950 px-2 py-0.5 text-xs font-medium text-white">Admin</span>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Back to dashboard</Link>
        </div>
      </header>
      {children}
    </div>
  );
}

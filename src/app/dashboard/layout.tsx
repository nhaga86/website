import { Sidebar } from "@/components/dashboard/sidebar";
import { requirePaidUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = await requirePaidUser();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar email={profile.email} name={profile.full_name} isAdmin={isAdmin} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

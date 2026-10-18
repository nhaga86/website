import { Logo } from "@/components/logo";

export default function BannedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 text-center">
      <Logo />
      <h1 className="text-2xl font-semibold">This account is suspended</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Contact support if you think this is a mistake.</p>
      <form action="/auth/signout" method="post">
        <button className="text-sm font-medium underline">Sign out</button>
      </form>
    </div>
  );
}

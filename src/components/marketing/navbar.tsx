import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function Navbar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-white/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex">
          <a href="#how" className="hover:text-neutral-950">How it works</a>
          <a href="#features" className="hover:text-neutral-950">Features</a>
          <a href="#templates" className="hover:text-neutral-950">Templates</a>
          <a href="#pricing" className="hover:text-neutral-950">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild variant="dark" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="dark" size="sm">
                <Link href="/signup">Start building</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

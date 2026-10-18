import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn, APP_NAME } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-[15px]">{APP_NAME}</span>
    </Link>
  );
}

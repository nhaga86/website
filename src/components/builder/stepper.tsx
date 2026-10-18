import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Idea", path: "" },
  { n: 2, label: "AI product", path: "review" },
  { n: 3, label: "Branding & editor", path: "edit" },
  { n: 4, label: "Sales page", path: "sales-page" },
  { n: 5, label: "Publish", path: "publish" },
];

export function Stepper({ current, productId }: { current: number; productId?: string }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto text-sm sm:gap-2">
      {STEPS.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        const href = productId && s.n > 1 ? `/dashboard/products/${productId}/${s.path}` : undefined;
        const content = (
          <span
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 transition-colors",
              active && "bg-neutral-950 text-white",
              !active && done && "text-neutral-900 hover:bg-muted",
              !active && !done && "text-muted-foreground",
              href && !active && "hover:bg-muted"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                active ? "bg-white text-neutral-950" : done ? "bg-brand-600 text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : s.n}
            </span>
            <span className={cn(!active && "hidden md:inline")}>{s.label}</span>
          </span>
        );
        return (
          <li key={s.n} className="flex items-center gap-1 sm:gap-2">
            {href ? <Link href={href}>{content}</Link> : content}
            {i < STEPS.length - 1 && <span className="h-px w-3 shrink-0 bg-border sm:w-6" />}
          </li>
        );
      })}
    </ol>
  );
}

export function BuilderHeader({ step, productId, title, actions }: { step: number; productId?: string; title?: string; actions?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur lg:top-0">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Stepper current={step} productId={productId} />
          {title && <span className="hidden truncate text-sm text-muted-foreground 2xl:inline">{title}</span>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

import { BookOpen, CreditCard, Mail, Sparkles } from "lucide-react";

/** Static illustration of the builder used in the hero. */
export function HeroMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[48px] bg-gradient-to-b from-brand-100 via-brand-50 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-3xl border bg-white shadow-2xl shadow-brand-900/10">
        <div className="flex items-center gap-1.5 border-b bg-neutral-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-neutral-200" />
          <span className="h-3 w-3 rounded-full bg-neutral-200" />
          <span className="h-3 w-3 rounded-full bg-neutral-200" />
          <span className="ml-4 rounded-md bg-white px-3 py-1 text-xs text-neutral-400">yourapp.com/p/the-side-hustle-starter-kit</span>
        </div>
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="flex items-center justify-center bg-gradient-to-br from-[#2E1065] to-[#7C3AED] p-10">
            <div className="aspect-[2/3] w-48 rounded-lg bg-gradient-to-b from-[#FDE68A] via-[#F472B6] to-[#7C3AED] p-5 shadow-2xl ring-1 ring-white/20 md:w-56">
              <p className="font-serif text-2xl font-bold leading-tight text-white drop-shadow">The Side Hustle Starter Kit</p>
              <p className="mt-2 text-xs text-white/90">Launch in 30 days</p>
            </div>
          </div>
          <div className="space-y-4 p-8">
            <div className="flex items-center gap-2 text-xs font-medium text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> AI wrote this in 94 seconds
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">Your first $1,000 online, one step at a time.</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              {["8 chapters, 3,200 words", "Cover, palette and fonts picked for you", "Sales page with FAQ and reviews"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-600" /> {t}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3 pt-2">
              <span className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-medium text-white">Get the ebook, $27</span>
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <CreditCard className="h-3.5 w-3.5" /> Stripe
              </span>
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <Mail className="h-3.5 w-3.5" /> Instant PDF
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

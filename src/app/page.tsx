import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  Globe,
  ImageIcon,
  LayoutTemplate,
  Mail,
  Palette,
  PenLine,
  Rocket,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { Pricing } from "@/components/marketing/pricing";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/utils";

const STEPS = [
  { icon: PenLine, title: "Describe the idea", body: "One sentence about the topic, who it helps and the tone you want." },
  { icon: Wand2, title: "AI writes the product", body: "Three titles, a subtitle, sales copy, an 8 chapter outline and every chapter written out." },
  { icon: Palette, title: "Brand it", body: "Pick colors, fonts and a cover. Edit any chapter in a live preview." },
  { icon: LayoutTemplate, title: "Build the sales page", body: "Choose a template. Headline, chapters, FAQ and reviews fill in by themselves." },
  { icon: Rocket, title: "Publish and sell", body: "PDF generated, checkout live, buyers get their download by email." },
];

const FEATURES = [
  { icon: BookOpen, title: "Full ebook, written", body: "Eight chapters of around 400 words each, with headings, lists and action steps. Not an outline. The whole thing." },
  { icon: ImageIcon, title: "Cover design", body: "A branded cover built from your title and colors, plus a ready cover prompt. Upload your own design any time." },
  { icon: Palette, title: "Brand kit in one click", body: "Five brand name ideas, a three color palette and a font pairing that fits your tone." },
  { icon: LayoutTemplate, title: "Sales pages that convert", body: "Three proven layouts. Desktop and mobile preview. Your own link at /p/your-product." },
  { icon: Download, title: "Automatic delivery", body: "Stripe takes the payment. Resend emails the PDF. A thank you page hands over the download." },
  { icon: Users, title: "Your buyer list", body: "Every buyer saved with their email. Export to CSV or sync to Kit and MailerLite." },
  { icon: Globe, title: "Custom domain", body: "Point your own domain at your sales pages so buyers never see ours." },
  { icon: Mail, title: "Analytics that count", body: "Views, sales and revenue per product, plus daily charts for the last 30 days." },
];

const FAQ = [
  { q: "Do I need to write anything?", a: "No. Type your idea and the AI drafts every piece. You can edit anything it writes, line by line." },
  { q: "Who owns the ebooks?", a: "You do. Sell them, give them away, print them. The content is yours." },
  { q: "How do I get paid?", a: "Connect your Stripe account and money goes straight to you, minus a 10% platform fee. Skip Stripe Connect and we collect for you and pay out 90%." },
  { q: "What do buyers receive?", a: "A thank you page with a download button and an email with a permanent download link to the PDF." },
  { q: "Can I cancel?", a: "Monthly plans cancel from settings in two clicks. Lifetime is a single payment with no renewal." },
];

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="bg-white">
      <Navbar signedIn={!!user} />

      <section className="relative overflow-hidden pb-24 pt-20 md:pt-28">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="container text-center">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Ebook, sales page, checkout and delivery
          </div>
          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-semibold tracking-tight text-neutral-950 md:text-7xl">
            Type an idea. <span className="text-brand-600">Sell the ebook</span> tonight.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-neutral-600">
            {APP_NAME} writes the book, designs the cover, builds the sales page and emails every buyer their PDF.
            You hit publish.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">
                Build my first product <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section id="how" className="border-t bg-neutral-50/60 py-24">
        <div className="container">
          <p className="text-center text-sm font-medium text-brand-600">How it works</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center text-4xl font-semibold tracking-tight">Five steps. One afternoon. A product for sale.</h2>
          <div className="mt-14 grid gap-4 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-neutral-300">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="container">
          <p className="text-center text-sm font-medium text-brand-600">Features</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center text-4xl font-semibold tracking-tight">Everything a digital product needs. Nothing you have to stitch together.</h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-7">
                <f.icon className="h-5 w-5 text-brand-600" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="templates" className="border-t bg-neutral-950 py-24 text-white">
        <div className="container">
          <p className="text-center text-sm font-medium text-brand-300">Templates</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center text-4xl font-semibold tracking-tight">Three sales pages, tested on buyers</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { name: "Classic", desc: "Centered hero, cover front and center, long form copy below.", bg: "bg-white", fg: "text-neutral-900", bar: "bg-brand-600" },
              { name: "Bold", desc: "Dark split hero with oversized type for confident offers.", bg: "bg-[#1F1B2E]", fg: "text-white", bar: "bg-amber-400" },
              { name: "Minimal", desc: "Editorial layout, lots of air, made for thoughtful topics.", bg: "bg-[#FAF7F2]", fg: "text-neutral-900", bar: "bg-neutral-900" },
            ].map((t) => (
              <div key={t.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className={`aspect-[4/3] rounded-2xl ${t.bg} p-6`}>
                  <div className={`h-3 w-1/2 rounded ${t.bar}`} />
                  <div className={`mt-4 space-y-2 ${t.fg}`}>
                    <div className="h-4 w-4/5 rounded bg-current opacity-80" />
                    <div className="h-4 w-3/5 rounded bg-current opacity-80" />
                    <div className="mt-4 h-2 w-full rounded bg-current opacity-20" />
                    <div className="h-2 w-5/6 rounded bg-current opacity-20" />
                  </div>
                  <div className={`mt-6 h-8 w-28 rounded-lg ${t.bar}`} />
                </div>
                <h3 className="mt-5 px-2 font-semibold">{t.name}</h3>
                <p className="mt-1 px-2 pb-2 text-sm text-neutral-400">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24">
        <div className="container">
          <p className="text-center text-sm font-medium text-brand-600">Pricing</p>
          <h2 className="mx-auto mb-12 mt-2 max-w-2xl text-center text-4xl font-semibold tracking-tight">One plan. Every feature.</h2>
          <Pricing />
        </div>
      </section>

      <section className="border-t bg-neutral-50/60 py-24">
        <div className="container max-w-3xl">
          <h2 className="text-center text-4xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-12 divide-y rounded-2xl border bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {f.q}
                  <span className="text-neutral-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container">
          <div className="rounded-3xl bg-brand-600 px-8 py-16 text-center text-white">
            <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight">Your first product is ten minutes away.</h2>
            <Button asChild size="lg" variant="secondary" className="mt-8 bg-white text-brand-700 hover:bg-brand-50">
              <Link href="/signup">
                Start building <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-neutral-500 md:flex-row">
          <Logo />
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

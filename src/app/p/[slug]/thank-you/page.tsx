import { notFound } from "next/navigation";
import { CheckCircle2, Download, Mail } from "lucide-react";
import { EbookCover } from "@/components/product/ebook-cover";
import { FontLoader } from "@/components/product/font-loader";
import { getPublicProduct } from "@/lib/public";
import { downloadUrl, fulfillProductCheckout } from "@/lib/fulfillment";
import { getFontPairing } from "@/lib/fonts";
import { stripe } from "@/lib/stripe";
import { readableOn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thank you", robots: { index: false } };

export default async function ThankYouPage({ params, searchParams }: { params: { slug: string }; searchParams: { session_id?: string } }) {
  const data = await getPublicProduct(params.slug);
  if (!data || !searchParams.session_id) notFound();
  const { product } = data;

  const session = await stripe().checkout.sessions.retrieve(searchParams.session_id).catch(() => null);
  if (!session || session.metadata?.product_id !== product.id) notFound();
  const paid = session.payment_status === "paid";
  if (paid) await fulfillProductCheckout(session);

  const fonts = getFontPairing(product.font);
  const color = product.brand_colors.primary;
  const email = session.customer_details?.email;

  return (
    <div className="min-h-screen px-4 py-16" style={{ background: product.brand_colors.accent }}>
      <FontLoader fontId={product.font} />
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl sm:p-12">
        <CheckCircle2 className="mx-auto h-12 w-12" style={{ color }} />
        <h1 className="mt-4 text-3xl font-bold" style={{ fontFamily: `'${fonts.heading}', serif`, color: product.brand_colors.secondary }}>
          {paid ? "You're in. Thank you!" : "Payment processing"}
        </h1>
        <p className="mt-3 text-neutral-600">
          {paid
            ? `Your copy of ${product.title} is ready to download.`
            : "Your payment is still being confirmed. You will get an email with your download as soon as it clears."}
        </p>
        <EbookCover
          title={product.title}
          subtitle={product.subtitle}
          coverUrl={product.cover_url}
          overlay={product.cover_overlay}
          colors={product.brand_colors}
          headingFont={fonts.heading}
          bodyFont={fonts.body}
          className="mx-auto mt-8 w-40"
        />
        {paid && (
          <a
            href={downloadUrl(session.id)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-4 font-semibold shadow-lg"
            style={{ background: color, color: readableOn(color) }}
          >
            <Download className="h-5 w-5" /> Download the PDF
          </a>
        )}
        {email && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
            <Mail className="h-4 w-4" /> A copy of the link went to {email}
          </p>
        )}
      </div>
    </div>
  );
}

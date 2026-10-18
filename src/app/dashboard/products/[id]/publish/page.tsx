import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProductWithChapters } from "@/lib/products";
import { platformFeePercent } from "@/lib/stripe";
import { PublishClient } from "./publish-client";

export const metadata = { title: "Publish" };

export default async function PublishPage({ params }: { params: { id: string } }) {
  const [data, current] = await Promise.all([getOwnedProductWithChapters(params.id), getCurrentUser()]);
  if (!data || !current) notFound();
  return (
    <PublishClient
      product={data.product}
      chapterCount={data.chapters.length}
      writtenCount={data.chapters.filter((c) => c.content.trim()).length}
      connectReady={current.profile.stripe_connect_ready && !!current.profile.stripe_account_id}
      customDomain={current.profile.custom_domain}
      appUrl={(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}
      feePercent={platformFeePercent()}
    />
  );
}

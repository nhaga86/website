import { notFound } from "next/navigation";
import { getOwnedProductWithChapters } from "@/lib/products";
import { ReviewClient } from "./review-client";

export const metadata = { title: "Review your product" };

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const data = await getOwnedProductWithChapters(params.id);
  if (!data) notFound();
  return <ReviewClient product={data.product} chapters={data.chapters} />;
}

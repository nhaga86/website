import { notFound } from "next/navigation";
import { getOwnedProductWithChapters } from "@/lib/products";
import { SalesPageBuilder } from "./builder-client";

export const metadata = { title: "Sales page" };

export default async function SalesPageStep({ params }: { params: { id: string } }) {
  const data = await getOwnedProductWithChapters(params.id);
  if (!data) notFound();
  return <SalesPageBuilder product={data.product} chapters={data.chapters} appUrl={process.env.NEXT_PUBLIC_APP_URL || ""} />;
}

import { notFound } from "next/navigation";
import { getOwnedProductWithChapters } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { EditorClient } from "./editor-client";

export const metadata = { title: "Branding & editor" };

export default async function EditPage({ params }: { params: { id: string } }) {
  const [data, current] = await Promise.all([getOwnedProductWithChapters(params.id), getCurrentUser()]);
  if (!data) notFound();
  return <EditorClient product={data.product} chapters={data.chapters} defaultAuthor={current?.profile.full_name || ""} />;
}

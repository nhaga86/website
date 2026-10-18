import { redirect } from "next/navigation";

export default function ProductIndex({ params }: { params: { id: string } }) {
  redirect(`/dashboard/products/${params.id}/edit`);
}

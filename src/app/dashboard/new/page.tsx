import { BuilderHeader } from "@/components/builder/stepper";
import { IdeaForm } from "./idea-form";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div>
      <BuilderHeader step={1} />
      <IdeaForm />
    </div>
  );
}

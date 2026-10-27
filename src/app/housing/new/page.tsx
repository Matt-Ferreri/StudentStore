import { HousingForm } from "@/components/housing-form";

export const metadata = {
  title: "Post a lease",
};

export default function NewHousingPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Post a lease
        </h1>
        <p className="mt-2 text-ink">
          People needed, address, rent, notes, and photos are all optional.
          Add at least one. Your Marist email is the contact on the post.
        </p>
      </div>
      <div className="rounded-2xl border border-sage bg-cream p-5">
        <HousingForm />
      </div>
    </div>
  );
}

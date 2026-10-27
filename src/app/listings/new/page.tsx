import { ListingForm } from "@/components/listing-form";

export const metadata = {
  title: "Post a listing",
};

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Post a listing
        </h1>
        <p className="mt-2 text-ink">
          Title, description, and category are required. Price, photos, and
          trades can be left blank. Your Marist email is the contact on the
          post.
        </p>
      </div>
      <div className="rounded-2xl border border-sage bg-cream p-5">
        <ListingForm />
      </div>
    </div>
  );
}

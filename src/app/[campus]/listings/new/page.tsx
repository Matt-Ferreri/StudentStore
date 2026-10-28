import { notFound } from "next/navigation";

import { ListingForm } from "@/components/listing-form";
import { SetupNotice } from "@/components/setup-notice";
import { getCampus } from "@/lib/campuses";

export const instant = false;

export const metadata = {
  title: "Post a listing",
};

export default async function NewListingPage({
  params,
}: PageProps<"/[campus]/listings/new">) {
  const { campus: slug } = await params;
  const result = await getCampus(slug);
  if ("configError" in result) {
    return <SetupNotice />;
  }

  if (!result.campus) {
    notFound();
  }

  const campus = result.campus;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Post a listing
        </h1>
        <p className="mt-2 text-ink">
          Title, description, and category are required. You can add sections
          of items, like Dorm needs with a TV and chairs. Price, photos, and
          trades can be left blank.{" "}
          {campus.slug === "marist"
            ? "Your Marist email is the contact on the post."
            : "Your email is the contact on the post."}
        </p>
      </div>
      <div className="rounded-2xl border border-sage bg-cream p-5">
        <ListingForm campusSlug={campus.slug} />
      </div>
    </div>
  );
}

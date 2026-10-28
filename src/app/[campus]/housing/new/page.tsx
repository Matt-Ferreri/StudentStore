import { notFound } from "next/navigation";

import { HousingForm } from "@/components/housing-form";
import { SetupNotice } from "@/components/setup-notice";
import { getCampus } from "@/lib/campuses";

export const instant = false;

export const metadata = {
  title: "Post a lease",
};

export default async function NewHousingPage({
  params,
}: PageProps<"/[campus]/housing/new">) {
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
          Post a lease
        </h1>
        <p className="mt-2 text-ink">
          People needed, address, rent, notes, and photos are all optional.
          Add at least one.{" "}
          {campus.slug === "marist"
            ? "Your Marist email is the contact on the post."
            : "Your email is the contact on the post."}
        </p>
      </div>
      <div className="rounded-2xl border border-sage bg-cream p-5">
        <HousingForm campusSlug={campus.slug} />
      </div>
    </div>
  );
}

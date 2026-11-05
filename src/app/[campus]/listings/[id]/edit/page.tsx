import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { HousingForm } from "@/components/housing-form";
import { ListingForm } from "@/components/listing-form";
import { SetupNotice } from "@/components/setup-notice";
import { campusPath } from "@/lib/format";
import { getListing, viewerCanEditListing } from "@/lib/listings";
import { createSessionClient } from "@/lib/supabase-server";

export const instant = false;

type EditListingPageProps = {
  params: Promise<{ campus: string; id: string }>;
};

export async function generateMetadata({
  params,
}: Pick<EditListingPageProps, "params">) {
  const { campus, id } = await params;
  const result = await getListing(id, campus);
  if ("configError" in result || !result.listing) {
    return { title: "Edit listing" };
  }

  return { title: `Edit · ${result.listing.title}` };
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { campus, id } = await params;
  const result = await getListing(id, campus);

  if ("configError" in result) {
    return <SetupNotice />;
  }

  if (!result.listing) {
    notFound();
  }

  const listing = result.listing;
  const supabase = await createSessionClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user || !viewerCanEditListing(listing, user.id)) {
    redirect(campusPath(campus, `/listings/${id}`));
  }

  const housing = listing.kind === "housing";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <p>
        <Link
          href={campusPath(campus, `/listings/${id}`)}
          className="text-sm font-medium text-burgundy underline"
        >
          Back to listing
        </Link>
      </p>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {housing ? "Edit lease" : "Edit listing"}
        </h1>
        <p className="mt-2 text-ink">
          {housing
            ? "Update people needed, address, rent, notes, or photos."
            : "Update the title, description, categories, price, sections, trades, or photos."}
        </p>
      </div>

      <div className="rounded-2xl border border-sage bg-cream p-5">
        {housing ? (
          <HousingForm campusSlug={campus} listing={listing} />
        ) : (
          <ListingForm campusSlug={campus} listing={listing} />
        )}
      </div>
    </div>
  );
}

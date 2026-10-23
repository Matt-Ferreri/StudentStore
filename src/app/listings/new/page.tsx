import { Suspense } from "react";

import { ListingForm } from "@/components/listing-form";
import type { ListingKind } from "@/lib/types";

export const metadata = {
  title: "Post a listing",
};

export default function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink">Loading the form…</p>}>
      <NewListing searchParams={searchParams} />
    </Suspense>
  );
}

async function NewListing({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const initialKind: ListingKind =
    requested === "wishlist" ? "wishlist" : "for_sale";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Post a listing
        </h1>
        <p className="mt-2 text-ink">
          Choose For sale or Wishlist. Price and photos can be left blank.
        </p>
      </div>
      <div className="rounded-2xl border border-sage bg-cream p-5">
        <ListingForm initialKind={initialKind} />
      </div>
    </div>
  );
}

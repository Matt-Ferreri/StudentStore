import Link from "next/link";

import { formatPrice, kindLabel } from "@/lib/format";
import { listListings } from "@/lib/listings";
import type { ListingKind } from "@/lib/types";
import { SetupNotice } from "@/components/setup-notice";

const copy: Record<ListingKind, { heading: string; lede: string; empty: string }> =
  {
    for_sale: {
      heading: "For sale",
      lede: "Textbooks, furniture, tickets, and anything else Marist students are selling.",
      empty: "Nothing is for sale yet. Be the first to post.",
    },
    wishlist: {
      heading: "Wishlist",
      lede: "Post what you are looking for so another student can offer it.",
      empty: "No one has posted a wish yet.",
    },
  };

export async function ListingBoard({ kind }: { kind: ListingKind }) {
  const result = await listListings(kind);
  const text = copy[kind];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {text.heading}
          </h1>
          <p className="mt-2 text-ink">{text.lede}</p>
        </div>
        <Link
          href={`/listings/new?kind=${kind}`}
          className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream hover:bg-ink"
        >
          Post {kind === "for_sale" ? "an item" : "a wish"}
        </Link>
      </div>

      {"configError" in result ? (
        <SetupNotice />
      ) : result.listings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sage bg-cream px-5 py-10 text-center text-ink">
          {text.empty}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {result.listings.map((listing) => {
            const price = formatPrice(listing.priceCents);
            const photo = listing.images[0];

            return (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-sage bg-cream hover:border-burgundy"
                >
                  {photo ? (
                    // User uploads are served from Supabase storage, not the Next image optimizer.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.url}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-sage text-sm text-ink">
                      No photo
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-burgundy">
                      {kindLabel(listing.kind)}
                      {listing.status === "sold" ? " · Sold" : ""}
                    </p>
                    <h2 className="text-lg font-semibold text-ink">
                      {listing.title}
                    </h2>
                    {price ? (
                      <p className="text-ink">{price}</p>
                    ) : (
                      <p className="text-sm text-ink">Price not listed</p>
                    )}
                    <p className="mt-auto text-sm text-ink">
                      {listing.posterName}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-sm text-ink">
        Browse the other board on{" "}
        <Link
          href={kind === "for_sale" ? "/wishlist" : "/for-sale"}
          className="font-medium text-burgundy underline"
        >
          {kind === "for_sale" ? "Wishlist" : "For sale"}
        </Link>
        .
      </p>
    </section>
  );
}

export function BoardFallback({ title }: { title: string }) {
  return (
    <section className="space-y-6" aria-busy="true">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-72 rounded-2xl bg-sage" />
        <div className="h-72 rounded-2xl bg-sage" />
      </div>
    </section>
  );
}

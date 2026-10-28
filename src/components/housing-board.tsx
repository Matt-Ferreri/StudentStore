import Link from "next/link";

import { BoardFallback } from "@/components/listing-board";
import { SetupNotice } from "@/components/setup-notice";
import { campusPath, formatPrice } from "@/lib/format";
import { listListings } from "@/lib/listings";

export async function HousingBoard({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus } = await params;
  const result = await listListings(campus, "housing");

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Housing
          </h1>
          <p className="mt-2 text-ink">
            Find roommates or a lease. Say how many people you need, the
            address, and the rent. Every field is optional, and you can add
            photos of the house.
          </p>
        </div>
        <Link
          href={campusPath(campus, "/housing/new")}
          className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream hover:bg-ink"
        >
          Post a lease
        </Link>
      </div>

      {"configError" in result ? (
        <SetupNotice />
      ) : result.listings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sage bg-cream px-5 py-10 text-center text-ink">
          No leases posted yet. Be the first to post.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {result.listings.map((listing) => {
            const rent = formatPrice(listing.priceCents);
            const photo = listing.images[0];

            return (
              <li key={listing.id}>
                <Link
                  href={campusPath(campus, `/listings/${listing.id}`)}
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
                      Housing
                    </p>
                    <h2 className="text-lg font-semibold text-ink">
                      {listing.title}
                    </h2>
                    {listing.peopleNeeded !== null ? (
                      <p className="text-sm text-ink">
                        {listing.peopleNeeded === 1
                          ? "1 person needed"
                          : `${listing.peopleNeeded} people needed`}
                      </p>
                    ) : null}
                    {listing.address ? (
                      <p className="text-sm text-ink">{listing.address}</p>
                    ) : null}
                    {rent ? (
                      <p className="text-ink">{rent} a month</p>
                    ) : null}
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
    </section>
  );
}

export function HousingBoardFallback() {
  return <BoardFallback title="Housing" />;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ListingChat } from "@/components/listing-chat";
import { ListingClosure } from "@/components/listing-closure";
import { ListingModeration } from "@/components/listing-moderation";
import { SetupNotice } from "@/components/setup-notice";
import { parseChatId } from "@/lib/chat";
import {
  boardPath,
  campusPath,
  categoryLabels,
  formatPostedAt,
  formatPrice,
  kindLabel,
  listingPriceLabel,
} from "@/lib/format";
import { getListing, viewerCanEditListing } from "@/lib/listings";
import { createSessionClient } from "@/lib/supabase-server";

export const instant = false;

type ListingPageProps = PageProps<"/[campus]/listings/[id]">;

export async function generateMetadata({ params }: Pick<ListingPageProps, "params">) {
  const { campus, id } = await params;
  const result = await getListing(id, campus);
  if ("configError" in result || !result.listing) {
    return { title: "Listing" };
  }

  return { title: result.listing.title };
}

export default function ListingPage({ params, searchParams }: ListingPageProps) {
  return (
    <Suspense fallback={<p className="text-ink">Loading listing…</p>}>
      <ListingDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ListingDetail({ params, searchParams }: ListingPageProps) {
  const { campus, id } = await params;
  const { chat } = await searchParams;
  const result = await getListing(id, campus);

  if ("configError" in result) {
    return <SetupNotice />;
  }

  if (!result.listing) {
    notFound();
  }

  const listing = result.listing;
  const housing = listing.kind === "housing";
  const price = housing
    ? formatPrice(listing.priceCents)
    : listingPriceLabel(listing);
  const wholePostPrice =
    !housing && listing.priceCents !== null && listing.sections.length > 0;
  const backHref =
    listing.kind === "for_sale" && listing.categories.length === 1
      ? `${campusPath(campus, "/for-sale")}?category=${listing.categories[0]}`
      : boardPath(campus, listing.kind);
  const supabase = await createSessionClient();
  const viewer = supabase ? (await supabase.auth.getUser()).data.user : null;
  const canEdit =
    viewer != null && viewerCanEditListing(listing, viewer.id);

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          <Link
            href={backHref}
            className="text-sm font-medium text-burgundy underline"
          >
            Back to {kindLabel(listing.kind)}
          </Link>
        </p>
        {canEdit ? (
          <p>
            <Link
              href={campusPath(campus, `/listings/${listing.id}/edit`)}
              className="rounded-full border border-sage px-3 py-1.5 text-sm font-medium text-ink hover:border-burgundy"
            >
              Edit {housing ? "lease" : "listing"}
            </Link>
          </p>
        ) : null}
      </div>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-burgundy">
          {kindLabel(listing.kind)}
          {listing.kind === "for_sale" && listing.status === "sold" ? " · Sold" : ""}
        </p>
        {listing.categories.length > 0 ? (
          <p className="text-sm font-medium text-ink">
            {categoryLabels(listing.categories)}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {listing.title}
        </h1>
        {price ? (
          <p className="text-xl text-ink">
            {housing ? `${price} a month` : price}
            {wholePostPrice ? (
              <span className="ml-2 text-base">for the whole post</span>
            ) : null}
          </p>
        ) : (
          <p className="text-ink">{housing ? "Rent not listed" : "Price not listed"}</p>
        )}
        {listing.tradeItems.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-ink">Would trade for</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-ink">
              {listing.tradeItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      {listing.images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {listing.images.map((image, index) => (
            // User uploads are served from Supabase storage, not the Next image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.id}
              src={image.url}
              alt={`${listing.title} photo ${index + 1}`}
              className="w-full rounded-2xl border border-sage object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-sage bg-cream px-5 py-8 text-center text-ink">
          No photos
        </p>
      )}

      {listing.description ? (
        <p className="whitespace-pre-wrap text-base leading-7 text-ink">
          {listing.description}
        </p>
      ) : null}

      {listing.sections.length > 0 ? (
        <div className="space-y-4">
          {listing.sections.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-sage bg-cream p-5"
            >
              <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
              <ul className="mt-3 divide-y divide-sage">
                {section.items.map((item) => {
                  const itemPrice = formatPrice(item.priceCents);
                  return (
                    <li
                      key={item.id}
                      className="flex items-baseline justify-between gap-4 py-2 text-ink"
                    >
                      <span>{item.label}</span>
                      {itemPrice ? <span>{itemPrice}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      <dl className="grid gap-4 rounded-2xl border border-sage bg-cream p-5 sm:grid-cols-2">
        {housing ? (
          <>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-burgundy">
                People needed
              </dt>
              <dd className="mt-1 text-ink">
                {listing.peopleNeeded ?? "Not listed"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-burgundy">
                Address
              </dt>
              <dd className="mt-1 text-ink">{listing.address ?? "Not listed"}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-burgundy">
            Posted by
          </dt>
          <dd className="mt-1 text-ink">{listing.posterName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-burgundy">
            Contact
          </dt>
          <dd className="mt-1">
            <a
              href={`mailto:${encodeURIComponent(listing.contact)}`}
              className="text-ink underline"
            >
              {listing.contact}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-burgundy">
            Posted
          </dt>
          <dd className="mt-1 text-ink">{formatPostedAt(listing.createdAt)}</dd>
        </div>
      </dl>

      <ListingModeration listing={listing} />

      <ListingClosure listing={listing} />

      <ListingChat listing={listing} chatId={parseChatId(chat)} campus={campus} />
    </article>
  );
}

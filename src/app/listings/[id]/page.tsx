import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ListingChat } from "@/components/listing-chat";
import { SetupNotice } from "@/components/setup-notice";
import { parseChatId } from "@/lib/chat";
import { boardPath, formatPostedAt, formatPrice, kindLabel } from "@/lib/format";
import { getListing } from "@/lib/listings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getListing(id);
  if ("configError" in result || !result.listing) {
    return { title: "Listing" };
  }

  return { title: result.listing.title };
}

export default function ListingPage({
  params,
  searchParams,
}: PageProps<"/listings/[id]">) {
  return (
    <Suspense fallback={<p className="text-ink">Loading listing…</p>}>
      <ListingDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ListingDetail({
  params,
  searchParams,
}: Pick<PageProps<"/listings/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  const { chat } = await searchParams;
  const result = await getListing(id);

  if ("configError" in result) {
    return <SetupNotice />;
  }

  if (!result.listing) {
    notFound();
  }

  const listing = result.listing;
  const price = formatPrice(listing.priceCents);

  return (
    <article className="space-y-6">
      <p>
        <Link
          href={boardPath(listing.kind)}
          className="text-sm font-medium text-burgundy underline"
        >
          Back to {kindLabel(listing.kind)}
        </Link>
      </p>

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-burgundy">
          {kindLabel(listing.kind)}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {listing.title}
        </h1>
        {price ? (
          <p className="text-xl text-ink">{price}</p>
        ) : (
          <p className="text-ink">Price not listed</p>
        )}
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

      <p className="whitespace-pre-wrap text-base leading-7 text-ink">
        {listing.description}
      </p>

      <dl className="grid gap-4 rounded-2xl border border-sage bg-cream p-5 sm:grid-cols-2">
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

      <ListingChat listing={listing} chatId={parseChatId(chat)} />
    </article>
  );
}

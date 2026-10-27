import Link from "next/link";

import { SetupNotice } from "@/components/setup-notice";
import { categoryLabel, formatPrice } from "@/lib/format";
import { listListings } from "@/lib/listings";
import {
  isProductCategory,
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "@/lib/types";

const copy = {
  heading: "For sale",
  lede: "Textbooks, furniture, tickets, and anything else Marist students are selling.",
  empty: "Nothing is for sale yet. Be the first to post.",
};

export async function ListingBoard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category: rawCategory } = await searchParams;
  const requested = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const category: ProductCategory | null =
    requested && isProductCategory(requested) ? requested : null;
  const result = await listListings("for_sale", category ?? undefined);
  const text = copy;

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
          href="/listings/new"
          className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream hover:bg-ink"
        >
          Post an item
        </Link>
      </div>

      <nav aria-label="Categories" className="flex flex-wrap gap-2">
        <Link
          href="/for-sale"
          aria-current={category === null ? "page" : undefined}
          className={chipClass(category === null)}
        >
          All
        </Link>
        {PRODUCT_CATEGORIES.map((item) => (
          <Link
            key={item.slug}
            href={`/for-sale?category=${item.slug}`}
            aria-current={category === item.slug ? "page" : undefined}
            className={chipClass(category === item.slug)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {"configError" in result ? (
        <SetupNotice />
      ) : result.listings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sage bg-cream px-5 py-10 text-center text-ink">
          {category ? "Nothing in this category yet." : text.empty}
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
                      {listing.category
                        ? categoryLabel(listing.category)
                        : "For sale"}
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
        Looking for something that is not here yet? Add it on your{" "}
        <Link href="/wishlist" className="font-medium text-burgundy underline">
          wishlist
        </Link>{" "}
        and we will email you when a similar listing is posted.
      </p>
    </section>
  );
}

function chipClass(active: boolean): string {
  return active
    ? "rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream"
    : "rounded-full border border-sage bg-cream px-4 py-2 text-sm font-medium text-ink hover:border-burgundy";
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

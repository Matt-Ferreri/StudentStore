import {
  PRODUCT_CATEGORIES,
  type ListingKind,
  type ListingSection,
  type ProductCategory,
} from "@/lib/types";

export function formatPrice(cents: number | null): string | null {
  if (cents === null) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatPriceSpan(amounts: number[]): string | null {
  if (amounts.length === 0) {
    return null;
  }

  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const lowLabel = formatPrice(low);
  if (low === high) {
    return lowLabel;
  }

  const highLabel = formatPrice(high);
  if (!lowLabel || !highLabel) {
    return lowLabel;
  }

  return `${lowLabel}–${highLabel}`;
}

export function listingPriceLabel(listing: {
  priceCents: number | null;
  sections: ListingSection[];
}): string | null {
  const overall = formatPrice(listing.priceCents);
  if (overall) {
    return overall;
  }

  return formatPriceSpan(
    listing.sections.flatMap((section) =>
      section.items.flatMap((item) =>
        item.priceCents === null ? [] : [item.priceCents],
      ),
    ),
  );
}

export function formatPostedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function kindLabel(kind: ListingKind): string {
  if (kind === "for_sale") {
    return "For sale";
  }

  if (kind === "housing") {
    return "Housing";
  }

  return "Wishlist";
}

export function categoryLabel(category: ProductCategory): string {
  const match = PRODUCT_CATEGORIES.find((item) => item.slug === category);
  return match ? match.label : category;
}

export function campusPath(slug: string, path = ""): string {
  if (!path || path === "/") {
    return `/${slug}`;
  }

  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `/${slug}${suffix}`;
}

export function boardPath(slug: string, kind: ListingKind): string {
  if (kind === "for_sale") {
    return campusPath(slug, "/for-sale");
  }

  if (kind === "housing") {
    return campusPath(slug, "/housing");
  }

  return campusPath(slug, "/wishlist");
}

export function housingTitle(input: {
  peopleNeeded: number | null;
  address: string | null;
}): string {
  if (input.peopleNeeded !== null) {
    return input.peopleNeeded === 1
      ? "Need 1 person"
      : `Need ${input.peopleNeeded} people`;
  }

  if (input.address) {
    return input.address;
  }

  return "Housing";
}

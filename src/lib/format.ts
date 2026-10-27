import { PRODUCT_CATEGORIES, type ListingKind, type ProductCategory } from "@/lib/types";

export function formatPrice(cents: number | null): string | null {
  if (cents === null) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
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

export function boardPath(kind: ListingKind): string {
  if (kind === "for_sale") {
    return "/for-sale";
  }

  if (kind === "housing") {
    return "/housing";
  }

  return "/wishlist";
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

import type { ListingKind } from "@/lib/types";

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
  return kind === "for_sale" ? "For sale" : "Wishlist";
}

export function boardPath(kind: ListingKind): string {
  return kind === "for_sale" ? "/for-sale" : "/wishlist";
}

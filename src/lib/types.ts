export const CAMPUS_SLUG = "marist";

export const LISTING_KINDS = ["for_sale", "wishlist"] as const;

export type ListingKind = (typeof LISTING_KINDS)[number];

export type ListingImage = {
  id: string;
  storagePath: string;
  sortOrder: number;
  url: string;
};

export type Listing = {
  id: string;
  kind: ListingKind;
  title: string;
  description: string;
  priceCents: number | null;
  posterName: string;
  contact: string;
  createdAt: string;
  images: ListingImage[];
};

export type FieldName =
  | "kind"
  | "title"
  | "description"
  | "price"
  | "posterName"
  | "contact"
  | "photos";

export type FieldErrors = Partial<Record<FieldName, string>>;

export type CreateListingState = {
  error?: string;
  fieldErrors?: FieldErrors;
};

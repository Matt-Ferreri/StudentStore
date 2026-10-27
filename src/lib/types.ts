export const CAMPUS_SLUG = "marist";

export const LISTING_KINDS = ["for_sale", "wishlist", "housing"] as const;

export type ListingKind = (typeof LISTING_KINDS)[number];

export const LISTING_STATUSES = ["open", "sold"] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const PRODUCT_CATEGORIES = [
  { slug: "textbooks", label: "Textbooks" },
  { slug: "clothes", label: "Clothes" },
  { slug: "school_supplies", label: "School supplies" },
  { slug: "dorm", label: "Dorm" },
  { slug: "athletic", label: "Athletic gear" },
  { slug: "electronics", label: "Electronics" },
  { slug: "furniture", label: "Furniture" },
  { slug: "tickets", label: "Tickets" },
  { slug: "transportation", label: "Bikes and rides" },
  { slug: "kitchen", label: "Kitchen" },
  { slug: "beauty", label: "Beauty" },
  { slug: "entertainment", label: "Games and media" },
  { slug: "other", label: "Other" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["slug"];

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.some((category) => category.slug === value);
}

export type ListingImage = {
  id: string;
  storagePath: string;
  sortOrder: number;
  url: string;
};

export type Listing = {
  id: string;
  userId: string;
  kind: ListingKind;
  status: ListingStatus;
  soldToId: string | null;
  title: string;
  description: string;
  peopleNeeded: number | null;
  address: string | null;
  priceCents: number | null;
  category: ProductCategory | null;
  tradeItems: string[];
  posterName: string;
  contact: string;
  createdAt: string;
  images: ListingImage[];
};

export const MAX_MESSAGE_LENGTH = 2000;

export const MAX_REPORT_REASON = 500;

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type ListingConversation = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  updatedAt: string;
};

export type ListingChatView = {
  viewerIsOwner: boolean;
  conversations: ListingConversation[];
  activeId: string | null;
  messages: ChatMessage[];
};

export type InboxThread = {
  id: string;
  listingId: string;
  listingTitle: string;
  otherName: string;
  otherEmail: string;
  preview: string;
  updatedAt: string;
};

export type SendMessageState = {
  error?: string;
};

export type FieldName =
  | "title"
  | "description"
  | "price"
  | "category"
  | "trades"
  | "photos"
  | "people"
  | "address"
  | "rent"
  | "notes";

export type FieldErrors = Partial<Record<FieldName, string>>;

export type CreateListingState = {
  error?: string;
  fieldErrors?: FieldErrors;
};

export type ListingActionState = {
  error?: string;
};

export type ReportListingState = {
  error?: string;
  reported?: boolean;
};

import {
  LISTING_KINDS,
  type FieldErrors,
  type ListingKind,
} from "@/lib/types";

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MAX_PRICE_CENTS = 10_000_000;

const PHOTO_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ValidListing = {
  kind: ListingKind;
  title: string;
  description: string;
  priceCents: number | null;
  photos: File[];
};

export function extensionForPhoto(type: string): string | null {
  return PHOTO_TYPES.get(type) ?? null;
}

export function validateListing(formData: FormData): {
  fieldErrors: FieldErrors;
  value: ValidListing | null;
} {
  const fieldErrors: FieldErrors = {};
  const kindRaw = stringField(formData, "kind");
  const title = stringField(formData, "title");
  const description = stringField(formData, "description");
  const priceRaw = stringField(formData, "price");

  const kind = LISTING_KINDS.find((value) => value === kindRaw);
  if (!kind) {
    fieldErrors.kind = "Choose For sale or Wishlist.";
  }

  if (!title) {
    fieldErrors.title = "Add a title.";
  } else if (title.length > MAX_TITLE_LENGTH) {
    fieldErrors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
  }

  if (!description) {
    fieldErrors.description = "Add a description.";
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  const priceCents = parsePrice(priceRaw);
  if (priceCents === "invalid") {
    fieldErrors.price = "Enter a price like 25 or 12.50, or leave it blank.";
  } else if (priceCents !== null && priceCents > MAX_PRICE_CENTS) {
    fieldErrors.price = "Enter a price of $100,000 or less.";
  }

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (photos.length > MAX_PHOTOS) {
    fieldErrors.photos = `You can attach up to ${MAX_PHOTOS} photos.`;
  } else if (photos.some((photo) => !PHOTO_TYPES.has(photo.type))) {
    fieldErrors.photos = "Photos must be JPEG, PNG, or WebP.";
  } else if (photos.some((photo) => photo.size > MAX_PHOTO_BYTES)) {
    fieldErrors.photos = "Each photo must be 5 MB or smaller.";
  }

  if (
    !kind ||
    Object.keys(fieldErrors).length > 0 ||
    priceCents === "invalid"
  ) {
    return { fieldErrors, value: null };
  }

  return {
    fieldErrors,
    value: {
      kind,
      title,
      description,
      priceCents,
      photos,
    },
  };
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parsePrice(raw: string): number | null | "invalid" {
  if (!raw) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    return "invalid";
  }

  const [dollars, fraction = ""] = raw.split(".");
  const cents =
    Number(dollars) * 100 + Number(`${fraction}00`.slice(0, 2));

  if (!Number.isSafeInteger(cents)) {
    return "invalid";
  }

  return cents;
}

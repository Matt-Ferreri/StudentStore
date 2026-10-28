import { housingTitle } from "@/lib/format";
import {
  isProductCategory,
  type FieldErrors,
  type ListingKind,
  type ProductCategory,
} from "@/lib/types";

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MAX_PRICE_CENTS = 10_000_000;
export const MAX_TRADES = 8;
export const MAX_TRADE_LENGTH = 80;
export const MAX_SECTIONS = 6;
export const MAX_ITEMS_PER_SECTION = 12;
export const MAX_SECTION_TITLE_LENGTH = 80;
export const MAX_ITEM_LABEL_LENGTH = 80;
export const MAX_PEOPLE_NEEDED = 99;
export const MAX_ADDRESS_LENGTH = 200;

const PHOTO_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ValidListingItem = {
  label: string;
  priceCents: number | null;
};

export type ValidListingSection = {
  title: string;
  items: ValidListingItem[];
};

export type ValidListing = {
  kind: ListingKind;
  title: string;
  description: string;
  priceCents: number | null;
  category: ProductCategory;
  sections: ValidListingSection[];
  tradeItems: string[];
  photos: File[];
};

export type ValidHousing = {
  title: string;
  description: string;
  peopleNeeded: number | null;
  address: string | null;
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
  const title = stringField(formData, "title");
  const description = stringField(formData, "description");
  const priceRaw = stringField(formData, "price");
  const categoryRaw = stringField(formData, "category");

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

  if (!isProductCategory(categoryRaw)) {
    fieldErrors.category = "Choose a category.";
  }

  const sections = readSections(formData, fieldErrors);
  const tradeItems = readTrades(formData, fieldErrors);
  const photos = readPhotos(formData, fieldErrors);

  if (
    Object.keys(fieldErrors).length > 0 ||
    priceCents === "invalid" ||
    !isProductCategory(categoryRaw)
  ) {
    return { fieldErrors, value: null };
  }

  return {
    fieldErrors,
    value: {
      kind: "for_sale" satisfies ListingKind,
      title,
      description,
      priceCents,
      category: categoryRaw,
      sections,
      tradeItems,
      photos,
    },
  };
}

export function validateHousing(formData: FormData): {
  fieldErrors: FieldErrors;
  formError?: string;
  value: ValidHousing | null;
} {
  const fieldErrors: FieldErrors = {};
  const peopleRaw = stringField(formData, "people");
  const address = stringField(formData, "address");
  const rentRaw = stringField(formData, "rent");
  const notes = stringField(formData, "notes");

  const peopleNeeded = parsePeople(peopleRaw);
  if (peopleNeeded === "invalid") {
    fieldErrors.people = "Enter a whole number of people, or leave it blank.";
  } else if (peopleNeeded !== null && peopleNeeded > MAX_PEOPLE_NEEDED) {
    fieldErrors.people = `Enter ${MAX_PEOPLE_NEEDED} people or fewer.`;
  }

  if (address.length > MAX_ADDRESS_LENGTH) {
    fieldErrors.address = `Keep the address under ${MAX_ADDRESS_LENGTH} characters.`;
  }

  const priceCents = parsePrice(rentRaw);
  if (priceCents === "invalid") {
    fieldErrors.rent = "Enter rent like 800 or 750.50, or leave it blank.";
  } else if (priceCents !== null && priceCents > MAX_PRICE_CENTS) {
    fieldErrors.rent = "Enter rent of $100,000 or less.";
  }

  if (notes.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.notes = `Keep the notes under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  const photos = readPhotos(formData, fieldErrors);
  if (
    Object.keys(fieldErrors).length > 0 ||
    peopleNeeded === "invalid" ||
    priceCents === "invalid"
  ) {
    return { fieldErrors, value: null };
  }

  const savedAddress = address || null;
  if (
    peopleNeeded === null &&
    savedAddress === null &&
    priceCents === null &&
    !notes &&
    photos.length === 0
  ) {
    return {
      fieldErrors,
      formError: "Add people needed, an address, rent, notes, or a photo.",
      value: null,
    };
  }

  return {
    fieldErrors,
    value: {
      title: housingTitle({
        peopleNeeded,
        address: savedAddress,
      }),
      description: notes,
      peopleNeeded,
      address: savedAddress,
      priceCents,
      photos,
    },
  };
}

function readSections(
  formData: FormData,
  fieldErrors: FieldErrors,
): ValidListingSection[] {
  const sections: ValidListingSection[] = [];

  for (let index = 0; index < MAX_SECTIONS; index += 1) {
    const present =
      formData.has(`section-${index}-title`) ||
      formData.getAll(`section-${index}-item`).length > 0;
    if (!present) {
      break;
    }

    const title = stringField(formData, `section-${index}-title`);
    const labels = formData.getAll(`section-${index}-item`);
    const prices = formData.getAll(`section-${index}-price`);
    if (labels.length !== prices.length) {
      setItemError(fieldErrors, "Each item needs a name and a price field.");
      return [];
    }

    const items: ValidListingItem[] = [];
    let rowError = false;

    for (let itemIndex = 0; itemIndex < labels.length; itemIndex += 1) {
      const labelEntry = labels[itemIndex];
      const priceEntry = prices[itemIndex];
      const label = typeof labelEntry === "string" ? labelEntry.trim() : "";
      const priceRaw = typeof priceEntry === "string" ? priceEntry.trim() : "";
      if (!label && !priceRaw) {
        continue;
      }

      if (!label) {
        setItemError(fieldErrors, "Name each item, or clear its price.");
        rowError = true;
        continue;
      }

      if (label.length > MAX_ITEM_LABEL_LENGTH) {
        setItemError(
          fieldErrors,
          `Keep each item name under ${MAX_ITEM_LABEL_LENGTH} characters.`,
        );
        rowError = true;
      }

      const priceCents = parsePrice(priceRaw);
      if (priceCents === "invalid") {
        setItemError(
          fieldErrors,
          "Enter item prices like 25 or 12.50, or leave them blank.",
        );
        rowError = true;
        continue;
      }

      if (priceCents !== null && priceCents > MAX_PRICE_CENTS) {
        setItemError(fieldErrors, "Enter item prices of $100,000 or less.");
        rowError = true;
        continue;
      }

      items.push({ label, priceCents });
    }

    if (!title && items.length === 0 && !rowError) {
      continue;
    }

    if (!title) {
      setItemError(fieldErrors, "Name each section, like Dorm needs.");
      rowError = true;
    } else if (title.length > MAX_SECTION_TITLE_LENGTH) {
      setItemError(
        fieldErrors,
        `Keep each section name under ${MAX_SECTION_TITLE_LENGTH} characters.`,
      );
      rowError = true;
    }

    if (items.length === 0) {
      setItemError(fieldErrors, "Add at least one item in each section.");
      rowError = true;
    } else if (items.length > MAX_ITEMS_PER_SECTION) {
      setItemError(
        fieldErrors,
        `You can list up to ${MAX_ITEMS_PER_SECTION} items in a section.`,
      );
      rowError = true;
    }

    if (!rowError) {
      sections.push({ title, items });
    }
  }

  if (
    formData.has(`section-${MAX_SECTIONS}-title`) ||
    formData.getAll(`section-${MAX_SECTIONS}-item`).length > 0
  ) {
    setItemError(fieldErrors, `You can add up to ${MAX_SECTIONS} sections.`);
  }

  return sections;
}

function setItemError(fieldErrors: FieldErrors, message: string) {
  if (!fieldErrors.items) {
    fieldErrors.items = message;
  }
}

function readTrades(formData: FormData, fieldErrors: FieldErrors): string[] {
  if (formData.get("acceptTrades") !== "on") {
    return [];
  }

  const seen = new Set<string>();
  const trades: string[] = [];

  for (const entry of formData.getAll("trade")) {
    if (typeof entry !== "string") {
      continue;
    }

    const label = entry.trim();
    if (!label) {
      continue;
    }

    const key = label.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    trades.push(label);
  }

  if (trades.length === 0) {
    fieldErrors.trades = "Add at least one thing you would take in exchange.";
  } else if (trades.length > MAX_TRADES) {
    fieldErrors.trades = `You can list up to ${MAX_TRADES} things.`;
  } else if (trades.some((label) => label.length > MAX_TRADE_LENGTH)) {
    fieldErrors.trades = `Keep each item under ${MAX_TRADE_LENGTH} characters.`;
  }

  return trades;
}

function readPhotos(formData: FormData, fieldErrors: FieldErrors): File[] {
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

  return photos;
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parsePeople(raw: string): number | null | "invalid" {
  if (!raw) {
    return null;
  }

  if (!/^\d+$/.test(raw)) {
    return "invalid";
  }

  const people = Number(raw);
  if (!Number.isSafeInteger(people) || people < 1) {
    return "invalid";
  }

  return people;
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

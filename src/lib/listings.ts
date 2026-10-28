import { listingImageUrl, createReadClient } from "@/lib/supabase";
import {
  isProductCategory,
  type Listing,
  type ListingKind,
  type ListingStatus,
  type ProductCategory,
} from "@/lib/types";

type ImageRow = {
  id: string;
  storage_path: string;
  sort_order: number;
};

type TradeRow = {
  id: string;
  label: string;
  sort_order: number;
};

type ItemRow = {
  id: string;
  label: string;
  price_cents: number | null;
  sort_order: number;
};

type SectionRow = {
  id: string;
  title: string;
  sort_order: number;
  listing_items: ItemRow[] | ItemRow | null;
};

type ListingRow = {
  id: string;
  user_id: string;
  kind: ListingKind;
  status: ListingStatus;
  sold_to_id: string | null;
  title: string;
  description: string;
  people_needed: number | null;
  address: string | null;
  price_cents: number | null;
  category: string | null;
  listing_sections: SectionRow[] | SectionRow | null;
  listing_trades: TradeRow[] | null;
  poster_name: string;
  contact: string;
  created_at: string;
  listing_images: ImageRow[] | null;
};

const listingSelect = `
  id,
  user_id,
  kind,
  status,
  sold_to_id,
  title,
  description,
  people_needed,
  address,
  price_cents,
  category,
  listing_sections (
    id,
    title,
    sort_order,
    listing_items (id, label, price_cents, sort_order)
  ),
  listing_trades (id, label, sort_order),
  poster_name,
  contact,
  created_at,
  listing_images (id, storage_path, sort_order)
`;

export async function listListings(
  campusSlug: string,
  kind: ListingKind,
  category?: ProductCategory,
): Promise<{ listings: Listing[] } | { configError: true }> {
  const supabase = createReadClient();
  if (!supabase) {
    return { configError: true };
  }

  const campusId = await campusIdBySlug(supabase, campusSlug);
  if (!campusId) {
    return { configError: true };
  }

  let query = supabase
    .from("listings")
    .select(listingSelect)
    .eq("campus_id", campusId)
    .eq("kind", kind);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    listings: ((data ?? []) as ListingRow[]).map(toListing),
  };
}

export async function getListing(
  id: string,
  campusSlug: string,
): Promise<{ listing: Listing | null } | { configError: true }> {
  const supabase = createReadClient();
  if (!supabase) {
    return { configError: true };
  }

  const campusId = await campusIdBySlug(supabase, campusSlug);
  if (!campusId) {
    return { listing: null };
  }

  const { data, error } = await supabase
    .from("listings")
    .select(listingSelect)
    .eq("id", id)
    .eq("campus_id", campusId)
    .maybeSingle();

  if (error) {
    return { listing: null };
  }

  if (!data) {
    return { listing: null };
  }

  return { listing: toListing(data as ListingRow) };
}

async function campusIdBySlug(
  supabase: NonNullable<ReturnType<typeof createReadClient>>,
  slug: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("campuses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id as string;
}

export function viewerCanRemoveListing(
  listing: Pick<Listing, "userId" | "kind" | "status" | "soldToId">,
  viewerId: string,
): boolean {
  if (listing.userId === viewerId) {
    return true;
  }

  return (
    listing.kind === "for_sale" &&
    listing.status === "sold" &&
    listing.soldToId === viewerId
  );
}

function rowsOf<T>(value: T[] | T | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function toListing(row: ListingRow): Listing {
  const images = [...(row.listing_images ?? [])].sort(
    (left, right) => left.sort_order - right.sort_order,
  );

  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    status: row.status,
    soldToId: row.sold_to_id,
    title: row.title,
    description: row.description,
    peopleNeeded: row.people_needed,
    address: row.address,
    priceCents: row.price_cents,
    category:
      row.category && isProductCategory(row.category) ? row.category : null,
    sections: rowsOf(row.listing_sections)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((section) => ({
        id: section.id,
        title: section.title,
        items: rowsOf(section.listing_items)
          .sort((left, right) => left.sort_order - right.sort_order)
          .map((item) => ({
            id: item.id,
            label: item.label,
            priceCents: item.price_cents,
          })),
      })),
    tradeItems: [...(row.listing_trades ?? [])]
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((trade) => trade.label),
    posterName: row.poster_name,
    contact: row.contact,
    createdAt: row.created_at,
    images: images.map((image) => ({
      id: image.id,
      storagePath: image.storage_path,
      sortOrder: image.sort_order,
      url: listingImageUrl(image.storage_path),
    })),
  };
}

import { listingImageUrl, createReadClient } from "@/lib/supabase";
import { CAMPUS_SLUG, type Listing, type ListingKind } from "@/lib/types";

type ImageRow = {
  id: string;
  storage_path: string;
  sort_order: number;
};

type ListingRow = {
  id: string;
  user_id: string;
  kind: ListingKind;
  title: string;
  description: string;
  price_cents: number | null;
  poster_name: string;
  contact: string;
  created_at: string;
  listing_images: ImageRow[] | null;
};

const listingSelect = `
  id,
  user_id,
  kind,
  title,
  description,
  price_cents,
  poster_name,
  contact,
  created_at,
  listing_images (id, storage_path, sort_order)
`;

export async function listListings(
  kind: ListingKind,
): Promise<{ listings: Listing[] } | { configError: true }> {
  const supabase = createReadClient();
  if (!supabase) {
    return { configError: true };
  }

  const campusId = await maristCampusId(supabase);
  if (!campusId) {
    return { configError: true };
  }

  const { data, error } = await supabase
    .from("listings")
    .select(listingSelect)
    .eq("campus_id", campusId)
    .eq("kind", kind)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    listings: ((data ?? []) as ListingRow[]).map(toListing),
  };
}

export async function getListing(
  id: string,
): Promise<{ listing: Listing | null } | { configError: true }> {
  const supabase = createReadClient();
  if (!supabase) {
    return { configError: true };
  }

  const { data, error } = await supabase
    .from("listings")
    .select(listingSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { listing: null };
  }

  if (!data) {
    return { listing: null };
  }

  return { listing: toListing(data as ListingRow) };
}

async function maristCampusId(
  supabase: NonNullable<ReturnType<typeof createReadClient>>,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("campuses")
    .select("id")
    .eq("slug", CAMPUS_SLUG)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id as string;
}

function toListing(row: ListingRow): Listing {
  const images = [...(row.listing_images ?? [])].sort(
    (left, right) => left.sort_order - right.sort_order,
  );

  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
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

import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createReadClient } from "@/lib/supabase";

export const DEFAULT_BRAND_NAME = "StudentStore";

export const LEGACY_CAMPUS_SLUG = "marist";

export type Campus = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
};

type CampusRow = {
  id: string;
  slug: string;
  name: string;
  brand_name: string | null;
};

const campusSelect = "id, slug, name, brand_name";

export function isCampusSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export async function listCampuses(): Promise<
  { campuses: Campus[] } | { configError: true }
> {
  "use cache";

  const supabase = createReadClient();
  if (!supabase) {
    return { configError: true };
  }

  const { data, error } = await supabase
    .from("campuses")
    .select(campusSelect)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return { campuses: ((data ?? []) as CampusRow[]).map(toCampus) };
}

export async function getCampus(
  slug: string,
): Promise<{ campus: Campus | null } | { configError: true }> {
  "use cache";

  const supabase = createReadClient();
  if (!supabase) {
    return { configError: true };
  }

  const { data, error } = await supabase
    .from("campuses")
    .select(campusSelect)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { campus: null };
  }

  return { campus: toCampus(data as CampusRow) };
}

export async function findCampusId(
  supabase: SupabaseClient,
  slug: string,
): Promise<string | null> {
  if (!isCampusSlug(slug)) {
    return null;
  }

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

export function slugFromCampusJoin(
  campuses: { slug: string } | { slug: string }[] | null | undefined,
): string | null {
  if (!campuses) {
    return null;
  }

  const row = Array.isArray(campuses) ? campuses[0] : campuses;
  return row?.slug && isCampusSlug(row.slug) ? row.slug : null;
}

export async function campusSlugForListing(
  supabase: SupabaseClient,
  listingId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("campuses (slug)")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return slugFromCampusJoin(
    (data as { campuses: { slug: string } | { slug: string }[] | null }).campuses,
  );
}

export async function absoluteUrl(path: string): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return `${origin.replace(/\/$/, "")}${path}`;
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) {
    return path;
  }

  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path}`;
}

function toCampus(row: CampusRow): Campus {
  const brandName = row.brand_name?.trim() || DEFAULT_BRAND_NAME;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandName,
  };
}

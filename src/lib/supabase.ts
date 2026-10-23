import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const LISTING_IMAGES_BUCKET = "listing-images";

function createSupabaseClient(key: string | undefined): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createReadClient(): SupabaseClient | null {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createWriteClient(): SupabaseClient | null {
  return createSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function listingImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/${encoded}`;
}

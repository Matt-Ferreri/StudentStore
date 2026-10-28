import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const LISTING_IMAGES_BUCKET = "listing-images";

export function supabaseProjectUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^['"]|['"]$/g, "");
  if (!raw) {
    return null;
  }

  const dashboard = raw.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dashboard) {
    return `https://${dashboard[1]}.supabase.co`;
  }

  try {
    const url = new URL(raw);
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function createSupabaseClient(key: string | undefined): SupabaseClient | null {
  const url = supabaseProjectUrl();
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
  const base = supabaseProjectUrl();
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/${encoded}`;
}

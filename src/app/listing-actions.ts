"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admins";
import { isUuid } from "@/lib/chat";
import { boardPath } from "@/lib/format";
import { viewerCanRemoveListing } from "@/lib/listings";
import { LISTING_IMAGES_BUCKET } from "@/lib/supabase";
import { createServiceClient, createSessionClient } from "@/lib/supabase-server";
import type { ListingActionState, ListingKind, ListingStatus } from "@/lib/types";

export async function markListingSold(
  _previous: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const listingId = stringField(formData, "listingId");
  const buyerId = stringField(formData, "buyerId");
  if (!isUuid(listingId) || !isUuid(buyerId)) {
    return { error: "Choose the student who bought this listing." };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return { error: "This action is unavailable until Supabase is configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in with a Marist email before marking a listing sold." };
  }

  const { error } = await supabase.rpc("mark_listing_sold", {
    target_listing: listingId,
    target_buyer: buyerId,
  });

  if (error) {
    return {
      error: "Could not mark this listing sold. Choose a student who messaged you about it.",
    };
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/for-sale");
  return {};
}

export async function removeListing(
  _previous: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const listingId = stringField(formData, "listingId");
  if (!isUuid(listingId)) {
    return { error: "This listing could not be found." };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return { error: "This action is unavailable until Supabase is configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in with a Marist email before removing a listing." };
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, user_id, kind, status, sold_to_id, listing_images (storage_path)")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data) {
    return { error: "This listing could not be found." };
  }

  const listing = data as {
    id: string;
    user_id: string;
    kind: ListingKind;
    status: ListingStatus;
    sold_to_id: string | null;
    listing_images: { storage_path: string }[] | { storage_path: string } | null;
  };

  if (
    !viewerCanRemoveListing(
      {
        userId: listing.user_id,
        kind: listing.kind,
        status: listing.status,
        soldToId: listing.sold_to_id,
      },
      user.id,
    )
  ) {
    return { error: "You cannot remove this listing." };
  }

  const images = Array.isArray(listing.listing_images)
    ? listing.listing_images
    : listing.listing_images
      ? [listing.listing_images]
      : [];
  const paths = images.map((image) => image.storage_path).filter(Boolean);

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .remove(paths);
    if (storageError) {
      return { error: "Could not remove the photos. Try again." };
    }
  }

  const { data: removed, error: deleteError } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .select("id");

  if (deleteError || !removed || removed.length === 0) {
    return { error: "Could not remove this listing. Try again." };
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath(boardPath(listing.kind));
  revalidatePath("/messages");
  redirect(boardPath(listing.kind));
}

export async function takeDownListing(
  _previous: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const listingId = stringField(formData, "listingId");
  if (!isUuid(listingId)) {
    return { error: "This post could not be found." };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return { error: "This action is unavailable until Supabase is configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    return { error: "You cannot take down this listing." };
  }

  const service = createServiceClient();
  if (!service) {
    return { error: "This action is unavailable until Supabase is configured." };
  }

  const { data, error } = await service
    .from("listings")
    .select("id, kind, listing_images (storage_path)")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data) {
    return { error: "This post could not be found." };
  }

  const listing = data as {
    id: string;
    kind: ListingKind;
    listing_images: { storage_path: string }[] | { storage_path: string } | null;
  };
  const images = Array.isArray(listing.listing_images)
    ? listing.listing_images
    : listing.listing_images
      ? [listing.listing_images]
      : [];
  const paths = images.map((image) => image.storage_path).filter(Boolean);

  if (paths.length > 0) {
    const { error: storageError } = await service.storage
      .from(LISTING_IMAGES_BUCKET)
      .remove(paths);
    if (storageError) {
      return { error: "Could not remove the photos. Try again." };
    }
  }

  const { data: removed, error: deleteError } = await service
    .from("listings")
    .delete()
    .eq("id", listingId)
    .select("id");

  if (deleteError || !removed || removed.length === 0) {
    return { error: "Could not take down this listing. Try again." };
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath(boardPath(listing.kind));
  revalidatePath("/messages");
  redirect(boardPath(listing.kind));
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

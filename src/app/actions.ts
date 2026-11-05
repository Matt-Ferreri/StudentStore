"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { findCampusId } from "@/lib/campuses";
import { boardPath } from "@/lib/format";
import { isUuid } from "@/lib/chat";
import { displayNameFromEmail, normalizeMaristEmail } from "@/lib/marist-email";
import type { CreateListingState, ListingKind } from "@/lib/types";
import { LISTING_IMAGES_BUCKET } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-server";
import {
  extensionForPhoto,
  validateHousing,
  validateListing,
  type ValidListingSection,
} from "@/lib/validation";
import { notifyMatchingWishes } from "@/lib/wish-alerts";

export async function createListing(
  _previous: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const { fieldErrors, value } = validateListing(formData);
  if (!value) {
    return { fieldErrors };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return {
      error:
        "Posting is unavailable until Supabase is configured. See the README for the required environment variables.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ? normalizeMaristEmail(user.email) : null;
  if (!user || !email) {
    return { error: "Sign in with a Marist email before posting." };
  }

  const campus = await campusForPost(supabase, formData);
  if ("error" in campus) {
    return { error: campus.error };
  }

  const campusSlug = campus.slug;
  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      campus_id: campus.id,
      kind: value.kind,
      title: value.title,
      description: value.description,
      price_cents: value.priceCents,
      categories: value.categories,
      poster_name: displayNameFromEmail(email),
      contact: email,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (insertError || !listing) {
    return { error: "Could not save this listing. Try again." };
  }

  if (value.tradeItems.length > 0) {
    const { error: tradeError } = await supabase.from("listing_trades").insert(
      value.tradeItems.map((label, index) => ({
        listing_id: listing.id,
        label,
        sort_order: index,
      })),
    );

    if (tradeError) {
      await supabase.from("listings").delete().eq("id", listing.id);
      return {
        error: "Could not save the trade items, so the listing was not posted.",
      };
    }
  }

  if (value.sections.length > 0) {
    const sectionError = await saveListingSections(
      supabase,
      listing.id,
      value.sections,
    );
    if (sectionError) {
      await supabase.from("listings").delete().eq("id", listing.id);
      return { error: sectionError };
    }
  }

  const photoError = await saveListingPhotos(supabase, listing.id, value.photos);
  if (photoError) {
    return { error: photoError };
  }

  if (value.kind === "for_sale") {
    await notifyMatchingWishes({
      id: listing.id,
      campusSlug,
      title: value.title,
      description: [
        value.description,
        ...value.sections.flatMap((section) => [
          section.title,
          ...section.items.map((item) => item.label),
        ]),
      ].join("\n"),
      posterId: user.id,
    });
  }

  redirect(`/${campusSlug}/listings/${listing.id}`);
}

export async function createHousing(
  _previous: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const { fieldErrors, formError, value } = validateHousing(formData);
  if (!value) {
    return { fieldErrors, error: formError };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return {
      error:
        "Posting is unavailable until Supabase is configured. See the README for the required environment variables.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ? normalizeMaristEmail(user.email) : null;
  if (!user || !email) {
    return { error: "Sign in with a Marist email before posting." };
  }

  const campus = await campusForPost(supabase, formData);
  if ("error" in campus) {
    return { error: campus.error };
  }

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      campus_id: campus.id,
      kind: "housing",
      title: value.title,
      description: value.description,
      people_needed: value.peopleNeeded,
      address: value.address,
      price_cents: value.priceCents,
      poster_name: displayNameFromEmail(email),
      contact: email,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (insertError || !listing) {
    return { error: "Could not save this post. Try again." };
  }

  const photoError = await saveListingPhotos(supabase, listing.id, value.photos);
  if (photoError) {
    return { error: photoError };
  }

  redirect(`/${campus.slug}/listings/${listing.id}`);
}

export async function updateListing(
  _previous: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const listingId = stringField(formData, "listingId");
  if (!isUuid(listingId)) {
    return { error: "This listing could not be found." };
  }

  const { fieldErrors, value } = validateListing(formData);
  if (!value) {
    return { fieldErrors };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return {
      error:
        "Editing is unavailable until Supabase is configured. See the README for the required environment variables.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in with a Marist email before editing." };
  }

  const owned = await loadOwnedListing(supabase, listingId, user.id);
  if (!owned) {
    return { error: "You can only edit your own listings." };
  }

  if (owned.kind !== "for_sale") {
    return { error: "This listing cannot be edited here." };
  }

  const clearPhotos = formData.get("clearPhotos") === "on";
  const replacePhotos = value.photos.length > 0 || clearPhotos;

  const { error: updateError } = await supabase
    .from("listings")
    .update({
      title: value.title,
      description: value.description,
      price_cents: value.priceCents,
      categories: value.categories,
    })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: "Could not save your changes. Try again." };
  }

  const { error: tradeDeleteError } = await supabase
    .from("listing_trades")
    .delete()
    .eq("listing_id", listingId);

  if (tradeDeleteError) {
    return { error: "Could not update the trade items. Try again." };
  }

  if (value.tradeItems.length > 0) {
    const { error: tradeError } = await supabase.from("listing_trades").insert(
      value.tradeItems.map((label, index) => ({
        listing_id: listingId,
        label,
        sort_order: index,
      })),
    );

    if (tradeError) {
      return { error: "Could not update the trade items. Try again." };
    }
  }

  const { error: sectionDeleteError } = await supabase
    .from("listing_sections")
    .delete()
    .eq("listing_id", listingId);

  if (sectionDeleteError) {
    return { error: "Could not update the sections. Try again." };
  }

  if (value.sections.length > 0) {
    const sectionError = await saveListingSections(
      supabase,
      listingId,
      value.sections,
    );
    if (sectionError) {
      return { error: "Could not update the sections. Try again." };
    }
  }

  if (replacePhotos) {
    const photoError = await replaceListingPhotos(
      supabase,
      listingId,
      value.photos,
    );
    if (photoError) {
      return { error: photoError };
    }
  }

  revalidatePath(`/${owned.campusSlug}/listings/${listingId}`);
  revalidatePath(boardPath(owned.campusSlug, owned.kind));
  redirect(`/${owned.campusSlug}/listings/${listingId}`);
}

export async function updateHousing(
  _previous: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const listingId = stringField(formData, "listingId");
  if (!isUuid(listingId)) {
    return { error: "This post could not be found." };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return {
      error:
        "Editing is unavailable until Supabase is configured. See the README for the required environment variables.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in with a Marist email before editing." };
  }

  const owned = await loadOwnedListing(supabase, listingId, user.id);
  if (!owned) {
    return { error: "You can only edit your own posts." };
  }

  if (owned.kind !== "housing") {
    return { error: "This post cannot be edited here." };
  }

  const { fieldErrors, formError, value } = validateHousing(formData, {
    existingPhotoCount: owned.imageCount,
  });
  if (!value) {
    return { fieldErrors, error: formError };
  }

  const clearPhotos = formData.get("clearPhotos") === "on";
  const replacePhotos = value.photos.length > 0 || clearPhotos;

  const { error: updateError } = await supabase
    .from("listings")
    .update({
      title: value.title,
      description: value.description,
      people_needed: value.peopleNeeded,
      address: value.address,
      price_cents: value.priceCents,
    })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: "Could not save your changes. Try again." };
  }

  if (replacePhotos) {
    const photoError = await replaceListingPhotos(
      supabase,
      listingId,
      value.photos,
    );
    if (photoError) {
      return { error: photoError };
    }
  }

  revalidatePath(`/${owned.campusSlug}/listings/${listingId}`);
  revalidatePath(boardPath(owned.campusSlug, owned.kind));
  redirect(`/${owned.campusSlug}/listings/${listingId}`);
}

async function loadOwnedListing(
  supabase: NonNullable<Awaited<ReturnType<typeof createSessionClient>>>,
  listingId: string,
  userId: string,
): Promise<{ campusSlug: string; kind: ListingKind; imageCount: number } | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("kind, listing_images (id), campuses (slug)")
    .eq("id", listingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    kind: ListingKind;
    listing_images: { id: string }[] | { id: string } | null;
    campuses: { slug: string } | { slug: string }[] | null;
  };

  const campus = Array.isArray(row.campuses) ? row.campuses[0] : row.campuses;
  if (!campus?.slug) {
    return null;
  }

  const images = Array.isArray(row.listing_images)
    ? row.listing_images
    : row.listing_images
      ? [row.listing_images]
      : [];

  return {
    campusSlug: campus.slug,
    kind: row.kind,
    imageCount: images.length,
  };
}

async function campusForPost(
  supabase: NonNullable<Awaited<ReturnType<typeof createSessionClient>>>,
  formData: FormData,
): Promise<{ slug: string; id: string } | { error: string }> {
  const slug = stringField(formData, "campus");
  const id = await findCampusId(supabase, slug);
  if (!id) {
    return {
      error:
        "That college is not in the database yet. Run the SQL migration from the README, then try again.",
    };
  }

  return { slug, id };
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function saveListingSections(
  supabase: NonNullable<Awaited<ReturnType<typeof createSessionClient>>>,
  listingId: string,
  sections: ValidListingSection[],
): Promise<string | null> {
  const { data: sectionRows, error: sectionError } = await supabase
    .from("listing_sections")
    .insert(
      sections.map((section, index) => ({
        listing_id: listingId,
        title: section.title,
        sort_order: index,
      })),
    )
    .select("id, sort_order");

  if (sectionError || !sectionRows) {
    return "Could not save the sections, so the listing was not posted.";
  }

  const sectionIds = new Map(
    sectionRows.map((row) => [row.sort_order as number, row.id as string]),
  );
  const items = sections.flatMap((section, sectionIndex) => {
    const sectionId = sectionIds.get(sectionIndex);
    if (!sectionId) {
      return [];
    }

    return section.items.map((item, itemIndex) => ({
      section_id: sectionId,
      label: item.label,
      price_cents: item.priceCents,
      sort_order: itemIndex,
    }));
  });

  const expected = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  if (items.length !== expected) {
    return "Could not save the items, so the listing was not posted.";
  }

  const { error: itemError } = await supabase.from("listing_items").insert(items);
  if (itemError) {
    return "Could not save the items, so the listing was not posted.";
  }

  return null;
}

async function saveListingPhotos(
  supabase: NonNullable<Awaited<ReturnType<typeof createSessionClient>>>,
  listingId: string,
  photos: File[],
): Promise<string | null> {
  const result = await uploadListingPhotos(supabase, listingId, photos);
  if (result) {
    await supabase.from("listings").delete().eq("id", listingId);
    return "Could not save the photos, so the listing was not posted.";
  }

  return null;
}

async function replaceListingPhotos(
  supabase: NonNullable<Awaited<ReturnType<typeof createSessionClient>>>,
  listingId: string,
  photos: File[],
): Promise<string | null> {
  const { data: existing, error: existingError } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("listing_id", listingId);

  if (existingError) {
    return "Could not update the photos. Try again.";
  }

  const oldPaths = (existing ?? [])
    .map((row) => row.storage_path as string)
    .filter(Boolean);

  if (oldPaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .remove(oldPaths);
    if (storageError) {
      return "Could not update the photos. Try again.";
    }
  }

  const { error: deleteError } = await supabase
    .from("listing_images")
    .delete()
    .eq("listing_id", listingId);

  if (deleteError) {
    return "Could not update the photos. Try again.";
  }

  if (photos.length === 0) {
    return null;
  }

  const result = await uploadListingPhotos(supabase, listingId, photos);
  if (result) {
    return "Could not update the photos. Try again.";
  }

  return null;
}

async function uploadListingPhotos(
  supabase: NonNullable<Awaited<ReturnType<typeof createSessionClient>>>,
  listingId: string,
  photos: File[],
): Promise<string | null> {
  const uploadedPaths: string[] = [];

  try {
    for (const [index, photo] of photos.entries()) {
      const extension = extensionForPhoto(photo.type);
      if (!extension) {
        throw new Error("Unsupported photo type.");
      }

      const storagePath = `${listingId}/${Date.now()}-${index}.${extension}`;
      const bytes = Buffer.from(await photo.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from(LISTING_IMAGES_BUCKET)
        .upload(storagePath, bytes, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedPaths.push(storagePath);

      const { error: imageError } = await supabase.from("listing_images").insert({
        listing_id: listingId,
        storage_path: storagePath,
        sort_order: index,
      });

      if (imageError) {
        throw new Error(imageError.message);
      }
    }
  } catch {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(uploadedPaths);
    }
    return "upload failed";
  }

  return null;
}

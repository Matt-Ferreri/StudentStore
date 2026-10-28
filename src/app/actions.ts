"use server";

import { redirect } from "next/navigation";

import { displayNameFromEmail, normalizeMaristEmail } from "@/lib/marist-email";
import { CAMPUS_SLUG, type CreateListingState } from "@/lib/types";
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

  const { data: campus, error: campusError } = await supabase
    .from("campuses")
    .select("id")
    .eq("slug", CAMPUS_SLUG)
    .maybeSingle();

  if (campusError || !campus) {
    return {
      error:
        "Marist is not in the database yet. Run the SQL migration from the README, then try again.",
    };
  }

  const { data: listing, error: insertError } = await supabase
    .from("listings")
    .insert({
      campus_id: campus.id,
      kind: value.kind,
      title: value.title,
      description: value.description,
      price_cents: value.priceCents,
      category: value.category,
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

  redirect(`/listings/${listing.id}`);
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

  const { data: campus, error: campusError } = await supabase
    .from("campuses")
    .select("id")
    .eq("slug", CAMPUS_SLUG)
    .maybeSingle();

  if (campusError || !campus) {
    return {
      error:
        "Marist is not in the database yet. Run the SQL migration from the README, then try again.",
    };
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

  redirect(`/listings/${listing.id}`);
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
  const uploadedPaths: string[] = [];

  try {
    for (const [index, photo] of photos.entries()) {
      const extension = extensionForPhoto(photo.type);
      if (!extension) {
        throw new Error("Unsupported photo type.");
      }

      const storagePath = `${listingId}/${index}.${extension}`;
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
    await supabase.from("listings").delete().eq("id", listingId);
    return "Could not save the photos, so the listing was not posted.";
  }

  return null;
}

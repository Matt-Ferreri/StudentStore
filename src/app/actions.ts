"use server";

import { redirect } from "next/navigation";

import { displayNameFromEmail, normalizeMaristEmail } from "@/lib/marist-email";
import { CAMPUS_SLUG, type CreateListingState } from "@/lib/types";
import { LISTING_IMAGES_BUCKET } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-server";
import { extensionForPhoto, validateListing } from "@/lib/validation";
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
      poster_name: displayNameFromEmail(email),
      contact: email,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (insertError || !listing) {
    return { error: "Could not save this listing. Try again." };
  }

  const uploadedPaths: string[] = [];

  try {
    for (const [index, photo] of value.photos.entries()) {
      const extension = extensionForPhoto(photo.type);
      if (!extension) {
        throw new Error("Unsupported photo type.");
      }

      const storagePath = `${listing.id}/${index}.${extension}`;
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
        listing_id: listing.id,
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
    await supabase.from("listings").delete().eq("id", listing.id);
    return {
      error: "Could not save the photos, so the listing was not posted.",
    };
  }

  if (value.kind === "for_sale") {
    await notifyMatchingWishes({
      id: listing.id,
      title: value.title,
      description: value.description,
      posterId: user.id,
    });
  }

  redirect(`/listings/${listing.id}`);
}

"use server";

import { revalidatePath } from "next/cache";

import { normalizeMaristEmail } from "@/lib/marist-email";
import { createSessionClient } from "@/lib/supabase-server";
import { MAX_WISH_NOTES_LENGTH, MAX_WISH_PHRASE_LENGTH } from "@/lib/wish-limits";

export type WishFormState = {
  error?: string;
  fieldErrors?: {
    phrase?: string;
    notes?: string;
  };
  ok?: boolean;
};

export async function addWish(
  _previous: WishFormState,
  formData: FormData,
): Promise<WishFormState> {
  const phrase = stringField(formData, "phrase");
  const notesRaw = stringField(formData, "notes");
  const fieldErrors: WishFormState["fieldErrors"] = {};

  if (!phrase) {
    fieldErrors.phrase = "Add what you are looking for.";
  } else if (phrase.length > MAX_WISH_PHRASE_LENGTH) {
    fieldErrors.phrase = `Keep it under ${MAX_WISH_PHRASE_LENGTH} characters.`;
  }

  if (notesRaw.length > MAX_WISH_NOTES_LENGTH) {
    fieldErrors.notes = `Keep notes under ${MAX_WISH_NOTES_LENGTH} characters.`;
  }

  if (fieldErrors.phrase || fieldErrors.notes) {
    return { fieldErrors };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return {
      error:
        "Wishlist is unavailable until Supabase is configured. See the README for the required environment variables.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ? normalizeMaristEmail(user.email) : null;
  if (!user || !email) {
    return { error: "Sign in with a Marist email before adding a wish." };
  }

  const { error } = await supabase.from("wish_items").insert({
    user_id: user.id,
    contact: email,
    phrase,
    notes: notesRaw || null,
  });

  if (error) {
    return { error: "Could not save this wish. Try again." };
  }

  revalidatePath("/wishlist");
  return { ok: true };
}

export async function removeWish(formData: FormData): Promise<void> {
  const id = stringField(formData, "id");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return;
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  await supabase.from("wish_items").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/wishlist");
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

"use server";

import { revalidatePath } from "next/cache";

import { isUuid } from "@/lib/chat";
import { displayNameFromEmail, normalizeMaristEmail } from "@/lib/marist-email";
import { createSessionClient } from "@/lib/supabase-server";
import { MAX_MESSAGE_LENGTH, type SendMessageState } from "@/lib/types";

export async function sendMessage(
  _previous: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const listingId = stringField(formData, "listingId");
  const requestedConversationId = stringField(formData, "conversationId");
  const body = stringField(formData, "body");

  if (!isUuid(listingId)) {
    return { error: "This listing could not be found." };
  }

  if (!body) {
    return { error: "Write a message before sending." };
  }

  if (body.length > MAX_MESSAGE_LENGTH) {
    return { error: "Keep the message under 2,000 characters." };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return {
      error: "Chat is unavailable until Supabase is configured. See the README.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ? normalizeMaristEmail(user.email) : null;
  if (!user || !email) {
    return { error: "Sign in with a Marist email to send a message." };
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return { error: "This listing could not be found." };
  }

  const viewerIsOwner = listing.user_id === user.id;
  let conversationId: string | null = null;

  if (viewerIsOwner) {
    if (!isUuid(requestedConversationId)) {
      return { error: "Choose a conversation before replying." };
    }

    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", requestedConversationId)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (existingError || !existing) {
      return { error: "That conversation is not on this listing." };
    }

    conversationId = existing.id;
  } else {
    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existingError) {
      return { error: "Could not open this chat. Try again." };
    }

    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: created, error: createError } = await supabase
        .from("conversations")
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          buyer_name: displayNameFromEmail(email),
          buyer_email: email,
        })
        .select("id")
        .single();

      if (created) {
        conversationId = created.id;
      } else if (createError?.code === "23505") {
        const { data: again } = await supabase
          .from("conversations")
          .select("id")
          .eq("listing_id", listingId)
          .eq("buyer_id", user.id)
          .maybeSingle();
        conversationId = again?.id ?? null;
      }

      if (!conversationId) {
        return { error: "Could not start this chat. Try again." };
      }
    }
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (messageError) {
    return { error: "Could not send that message. Try again." };
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return {};
}

export async function markConversationRead(conversationId: string): Promise<void> {
  if (!isUuid(conversationId)) {
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

  const { error } = await supabase.rpc("mark_conversation_read", {
    target_id: conversationId,
  });
  if (error) {
    return;
  }

  revalidatePath("/messages");
  revalidatePath("/", "layout");
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

import { createSessionClient } from "@/lib/supabase-server";
import type {
  ChatMessage,
  InboxThread,
  Listing,
  ListingChatView,
  ListingConversation,
} from "@/lib/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ConversationRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  last_message: string | null;
  updated_at: string;
  listings:
    | {
        title: string;
        user_id: string;
        poster_name: string;
        contact: string;
      }
    | Array<{
        title: string;
        user_id: string;
        poster_name: string;
        contact: string;
      }>
    | null;
};

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function parseChatId(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !UUID_PATTERN.test(raw)) {
    return null;
  }
  return raw;
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export async function loadListingChat(
  listing: Pick<Listing, "id" | "userId">,
  viewerId: string,
  requestedChatId: string | null,
): Promise<ListingChatView | { unavailable: true }> {
  const supabase = await createSessionClient();
  if (!supabase) {
    return { unavailable: true };
  }

  const viewerIsOwner = listing.userId === viewerId;
  let query = supabase
    .from("conversations")
    .select("id, buyer_name, buyer_email, updated_at")
    .eq("listing_id", listing.id)
    .order("updated_at", { ascending: false });

  if (!viewerIsOwner) {
    query = query.eq("buyer_id", viewerId);
  }

  const { data, error } = await query;
  if (error) {
    return { unavailable: true };
  }

  const conversations: ListingConversation[] = (
    (data ?? []) as Pick<
      ConversationRow,
      "id" | "buyer_name" | "buyer_email" | "updated_at"
    >[]
  ).map((row) => ({
    id: row.id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    updatedAt: row.updated_at,
  }));

  const active =
    conversations.find((conversation) => conversation.id === requestedChatId) ??
    conversations[0] ??
    null;

  if (!active) {
    return {
      viewerIsOwner,
      conversations,
      activeId: null,
      messages: [],
    };
  }

  const { data: messageData, error: messageError } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", active.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (messageError) {
    return { unavailable: true };
  }

  const messages: ChatMessage[] = ((messageData ?? []) as MessageRow[])
    .slice()
    .reverse()
    .map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      mine: row.sender_id === viewerId,
    }));

  return {
    viewerIsOwner,
    conversations,
    activeId: active.id,
    messages,
  };
}

export async function loadInbox(
  viewerId: string,
): Promise<{ threads: InboxThread[] } | { unavailable: true }> {
  const supabase = await createSessionClient();
  if (!supabase) {
    return { unavailable: true };
  }

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      listing_id,
      buyer_id,
      buyer_name,
      buyer_email,
      last_message,
      updated_at,
      listings!inner (title, user_id, poster_name, contact)
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return { unavailable: true };
  }

  const threads: InboxThread[] = [];
  for (const row of (data ?? []) as ConversationRow[]) {
    const listing = Array.isArray(row.listings) ? row.listings[0] : row.listings;
    if (!listing) {
      continue;
    }

    const viewerIsBuyer = row.buyer_id === viewerId;
    threads.push({
      id: row.id,
      listingId: row.listing_id,
      listingTitle: listing.title,
      otherName: viewerIsBuyer ? listing.poster_name : row.buyer_name,
      otherEmail: viewerIsBuyer ? listing.contact : row.buyer_email,
      preview: row.last_message?.trim() || "No messages yet",
      updatedAt: row.updated_at,
    });
  }

  return { threads };
}

import Link from "next/link";

import { ChatPanel } from "@/components/chat-panel";
import { UnreadCount } from "@/components/unread-count";
import { loadListingChat } from "@/lib/chat";
import { createSessionClient } from "@/lib/supabase-server";
import type { Listing } from "@/lib/types";

export async function ListingChat({
  listing,
  chatId,
}: {
  listing: Listing;
  chatId: string | null;
}) {
  const supabase = await createSessionClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    return null;
  }

  const chat = await loadListingChat(listing, user.id, chatId);
  if ("unavailable" in chat) {
    return (
      <section id="chat" className="rounded-2xl border border-sage bg-cream p-5">
        <h2 className="text-lg font-semibold text-ink">Chat</h2>
        <p className="mt-2 text-sm leading-6 text-ink">
          In-app chat is unavailable until the latest database migration is
          applied. You can still email {listing.contact}.
        </p>
      </section>
    );
  }

  const active =
    chat.conversations.find((conversation) => conversation.id === chat.activeId) ??
    null;

  return (
    <section id="chat" className="space-y-4 rounded-2xl border border-sage bg-cream p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-ink">Chat</h2>
          <p className="mt-1 text-sm leading-6 text-ink">
            {chat.viewerIsOwner
              ? "Reply to students who message you about this listing. Your email stays on the post."
              : `Message ${listing.posterName} about this listing, or email ${listing.contact}.`}
          </p>
        </div>
        <Link href="/messages" className="text-sm font-medium text-burgundy underline">
          All messages
        </Link>
      </div>

      {chat.viewerIsOwner && chat.conversations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sage px-4 py-6 text-sm text-ink">
          No one has messaged you about this listing yet.
        </p>
      ) : (
        <>
          {chat.viewerIsOwner && chat.conversations.length > 1 ? (
            <ul className="flex flex-wrap gap-2">
              {chat.conversations.map((conversation) => {
                const selected = conversation.id === chat.activeId;
                return (
                  <li key={conversation.id}>
                    <Link
                      href={`/listings/${listing.id}?chat=${conversation.id}`}
                      aria-current={selected ? "true" : undefined}
                      className={
                        selected
                          ? "inline-flex items-center gap-1.5 rounded-full bg-burgundy px-3 py-1.5 text-sm font-medium text-cream"
                          : "inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-sm font-medium text-ink hover:bg-burgundy hover:text-cream"
                      }
                    >
                      {conversation.buyerName}
                      <UnreadCount
                        count={conversation.unreadCount}
                        tone={selected ? "inverse" : "solid"}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {chat.viewerIsOwner && active ? (
            <p className="text-sm text-ink">
              {active.buyerName} · {active.buyerEmail}
            </p>
          ) : null}

          <ChatPanel
            key={chat.activeId ?? "new"}
            listingId={listing.id}
            conversationId={chat.activeId}
            messages={chat.messages}
          />
        </>
      )}
    </section>
  );
}

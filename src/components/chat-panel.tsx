"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { markConversationRead, sendMessage } from "@/app/chat-actions";
import { formatPostedAt } from "@/lib/format";
import { MAX_MESSAGE_LENGTH, type ChatMessage, type SendMessageState } from "@/lib/types";

const initialState: SendMessageState = {};

export function ChatPanel({
  listingId,
  conversationId,
  messages,
}: {
  listingId: string;
  conversationId: string | null;
  messages: ChatMessage[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(sendMessage, initialState);
  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    list.scrollTop = list.scrollHeight;
  }, [lastMessageId]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }
    void markConversationRead(conversationId);
  }, [conversationId, lastMessageId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }
      router.refresh();
    }, 5000);

    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="space-y-3">
      <div
        ref={listRef}
        className="flex h-80 flex-col gap-3 overflow-y-auto rounded-xl border border-sage bg-sage/20 p-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-ink">Send a message to start the chat.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={message.mine ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}
            >
              <p
                className={
                  message.mine
                    ? "whitespace-pre-wrap break-words rounded-2xl bg-burgundy px-3 py-2 text-sm text-cream"
                    : "whitespace-pre-wrap break-words rounded-2xl border border-sage bg-cream px-3 py-2 text-sm text-ink"
                }
              >
                {message.body}
              </p>
              <p
                className={`mt-1 text-xs text-ink ${message.mine ? "text-right" : ""}`}
              >
                {formatPostedAt(message.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>

      <form action={action} className="space-y-2">
        <input type="hidden" name="listingId" value={listingId} />
        {conversationId ? (
          <input type="hidden" name="conversationId" value={conversationId} />
        ) : null}
        <label className="block space-y-1">
          <span className="text-sm font-medium text-ink">Message</span>
          <textarea
            name="body"
            required
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Ask about pickup, price, or details."
            className="w-full rounded-xl border border-sage bg-cream px-3 py-2 text-sm text-ink outline-none placeholder:text-sage focus:border-burgundy"
          />
        </label>
        {state.error ? (
          <p className="text-sm text-burgundy" role="alert">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}

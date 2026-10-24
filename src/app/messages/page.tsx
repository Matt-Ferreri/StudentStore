import Link from "next/link";
import { Suspense } from "react";

import { SetupNotice } from "@/components/setup-notice";
import { loadInbox } from "@/lib/chat";
import { formatPostedAt } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase-server";

export const metadata = {
  title: "Messages",
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="text-ink">Loading messages…</p>}>
      <Inbox />
    </Suspense>
  );
}

async function Inbox() {
  const supabase = await createSessionClient();
  if (!supabase) {
    return <SetupNotice />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const result = await loadInbox(user.id);

  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Messages</h1>
        <p className="mt-2 text-ink">
          Chats you have started, and replies on listings you posted. The
          email on each listing is still there too.
        </p>
      </div>

      {"unavailable" in result ? (
        <p className="rounded-2xl border border-sage bg-cream px-5 py-4 text-sm leading-6 text-ink">
          In-app chat is unavailable until the latest database migration is
          applied. The README lists the SQL files to run.
        </p>
      ) : result.threads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sage bg-cream px-5 py-10 text-center text-ink">
          No chats yet. Open a listing and send a message about it.
        </p>
      ) : (
        <ul className="space-y-3">
          {result.threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/listings/${thread.listingId}?chat=${thread.id}`}
                className="block rounded-2xl border border-sage bg-cream p-4 hover:border-burgundy"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-burgundy">
                  {thread.listingTitle}
                </p>
                <p className="mt-1 font-semibold text-ink">{thread.otherName}</p>
                <p className="text-sm text-ink">{thread.otherEmail}</p>
                <p className="mt-2 line-clamp-2 text-sm text-ink">{thread.preview}</p>
                <p className="mt-2 text-xs text-ink">
                  {formatPostedAt(thread.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

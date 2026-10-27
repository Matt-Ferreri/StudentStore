import {
  ReportListingForm,
  TakeDownForm,
} from "@/components/listing-moderation-forms";
import { isAdminEmail } from "@/lib/admins";
import { createSessionClient } from "@/lib/supabase-server";
import type { Listing } from "@/lib/types";

export async function ListingModeration({ listing }: { listing: Listing }) {
  const supabase = await createSessionClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    return null;
  }

  const canReport = user.id !== listing.userId;
  const admin = isAdminEmail(user.email);
  if (!canReport && !admin) {
    return null;
  }

  return (
    <>
      {canReport ? (
        <section className="space-y-4 rounded-2xl border border-sage bg-cream p-5">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-lg font-semibold text-ink">Report this post</h2>
            <p className="text-sm leading-6 text-ink">
              If this post is inappropriate, tell us why. We email the admins.
            </p>
          </div>
          <ReportListingForm listingId={listing.id} />
        </section>
      ) : null}
      {admin ? (
        <section className="space-y-4 rounded-2xl border border-sage bg-cream p-5">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-lg font-semibold text-ink">Take this post down</h2>
            <p className="text-sm leading-6 text-ink">
              Remove this post from StudentStore. This deletes it for everyone,
              including photos and chats.
            </p>
          </div>
          <TakeDownForm listingId={listing.id} />
        </section>
      ) : null}
    </>
  );
}

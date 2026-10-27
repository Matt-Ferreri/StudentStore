import { MarkSoldForm, RemoveListingForm } from "@/components/listing-closure-forms";
import { viewerCanRemoveListing } from "@/lib/listings";
import { createSessionClient } from "@/lib/supabase-server";
import type { Listing } from "@/lib/types";

export async function ListingClosure({ listing }: { listing: Listing }) {
  const supabase = await createSessionClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!supabase || !user) {
    return null;
  }

  const isOwner = listing.userId === user.id;
  const isBuyer = listing.status === "sold" && listing.soldToId === user.id;
  if (!isOwner && !isBuyer) {
    return null;
  }

  const buyers =
    isOwner && listing.kind === "for_sale"
      ? await loadBuyers(supabase, listing.id)
      : [];
  const soldTo = buyers.find((buyer) => buyer.id === listing.soldToId) ?? null;

  return (
    <section className="space-y-4 rounded-2xl border border-sage bg-cream p-5">
      <div className="max-w-2xl space-y-1">
        <h2 className="text-lg font-semibold text-ink">
          {listing.kind === "housing"
            ? "Lease filled?"
            : listing.kind === "wishlist"
              ? "Bought this?"
              : isBuyer
                ? "You bought this"
                : "Sold this?"}
        </h2>
        <p className="text-sm leading-6 text-ink">
          {closureCopy(listing, isBuyer, soldTo, buyers.length)}
        </p>
      </div>

      {isOwner && listing.kind === "for_sale" && buyers.length > 0 ? (
        <MarkSoldForm
          listingId={listing.id}
          buyers={buyers}
          soldToId={listing.soldToId}
        />
      ) : null}

      {viewerCanRemoveListing(listing, user.id) ? (
        <RemoveListingForm
          listingId={listing.id}
          label={
            listing.kind === "wishlist"
              ? "Remove wish"
              : listing.kind === "housing"
                ? "Remove post"
                : "Remove listing"
          }
          confirmMessage={
            listing.kind === "wishlist"
              ? "Remove this wish from StudentStore? This deletes it for everyone, including the database."
              : listing.kind === "housing"
                ? "Remove this lease from StudentStore? This deletes it for everyone, including the database."
                : "Remove this listing from StudentStore? This deletes it for everyone, including the database."
          }
        />
      ) : null}
    </section>
  );
}

function closureCopy(
  listing: Listing,
  isBuyer: boolean,
  soldTo: { name: string; email: string } | null,
  buyerCount: number,
): string {
  if (listing.kind === "housing") {
    return "If the lease is filled or you no longer need roommates, remove this post. It disappears from the site and is deleted from the database, including photos and chats.";
  }

  if (listing.kind === "wishlist") {
    return "If you bought what you were looking for, remove this wish. It disappears from the site and is deleted from the database, including photos and chats.";
  }

  if (isBuyer) {
    return "The seller marked this sold to you. Remove it when you are done. It disappears from the site and is deleted from the database, including photos and chats.";
  }

  if (listing.status === "sold" && soldTo) {
    return `Marked sold to ${soldTo.name}. They can remove it, and you can too. Removing deletes the listing, photos, and chats from the database.`;
  }

  if (buyerCount === 0) {
    return "No one has messaged you yet, so you cannot name a buyer. You can still remove the listing if it sold another way or you no longer want it posted. Removing deletes it from the site and the database.";
  }

  return "When it sells, choose the student who messaged you and bought it. They can take the listing down, and you can too. Removing deletes it from the site and the database.";
}

async function loadBuyers(
  supabase: NonNullable<Awaited<ReturnType<typeof createSessionClient>>>,
  listingId: string,
): Promise<{ id: string; name: string; email: string }[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("buyer_id, buyer_name, buyer_email")
    .eq("listing_id", listingId)
    .order("buyer_name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.buyer_id as string,
    name: row.buyer_name as string,
    email: row.buyer_email as string,
  }));
}

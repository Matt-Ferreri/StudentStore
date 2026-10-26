import { Suspense } from "react";

import { Wishlist } from "@/components/wishlist-panel";

export const metadata = {
  title: "Wishlist",
};

export default function WishlistPage() {
  return (
    <section className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Your wishlist
        </h1>
        <p className="mt-2 text-ink">
          This list is only yours. When another student posts something for
          sale that uses the same words, we email you a link to that listing.
        </p>
      </div>
      <Suspense fallback={<p className="text-ink">Loading your wishlist…</p>}>
        <Wishlist />
      </Suspense>
    </section>
  );
}

import { Suspense } from "react";

import { BoardFallback, ListingBoard } from "@/components/listing-board";

export const metadata = {
  title: "Wishlist",
};

export default function WishlistPage() {
  return (
    <Suspense fallback={<BoardFallback title="Wishlist" />}>
      <ListingBoard kind="wishlist" />
    </Suspense>
  );
}

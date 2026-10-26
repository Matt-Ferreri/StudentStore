import { Suspense } from "react";

import { BoardFallback, ListingBoard } from "@/components/listing-board";

export const metadata = {
  title: "For sale",
};

export default function ForSalePage() {
  return (
    <Suspense fallback={<BoardFallback title="For sale" />}>
      <ListingBoard />
    </Suspense>
  );
}

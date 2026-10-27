import { Suspense } from "react";

import { BoardFallback, ListingBoard } from "@/components/listing-board";

export const metadata = {
  title: "For sale",
};

export default function ForSalePage({
  searchParams,
}: PageProps<"/for-sale">) {
  return (
    <Suspense fallback={<BoardFallback title="For sale" />}>
      <ListingBoard searchParams={searchParams} />
    </Suspense>
  );
}

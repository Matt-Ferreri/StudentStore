import { Suspense } from "react";

import { BoardFallback, ListingBoard } from "@/components/listing-board";

export const instant = false;

export const metadata = {
  title: "For sale",
};

export default function ForSalePage({
  params,
  searchParams,
}: PageProps<"/[campus]/for-sale">) {
  return (
    <Suspense fallback={<BoardFallback title="For sale" />}>
      <ListingBoard params={params} searchParams={searchParams} />
    </Suspense>
  );
}

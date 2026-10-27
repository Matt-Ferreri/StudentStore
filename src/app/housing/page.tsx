import { Suspense } from "react";

import { HousingBoard, HousingBoardFallback } from "@/components/housing-board";

export const metadata = {
  title: "Housing",
};

export default function HousingPage() {
  return (
    <Suspense fallback={<HousingBoardFallback />}>
      <HousingBoard />
    </Suspense>
  );
}

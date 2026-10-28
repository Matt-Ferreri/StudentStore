import { Suspense } from "react";

import { HousingBoard, HousingBoardFallback } from "@/components/housing-board";

export const instant = false;

export const metadata = {
  title: "Housing",
};

export default function HousingPage({
  params,
}: PageProps<"/[campus]/housing">) {
  return (
    <Suspense fallback={<HousingBoardFallback />}>
      <HousingBoard params={params} />
    </Suspense>
  );
}

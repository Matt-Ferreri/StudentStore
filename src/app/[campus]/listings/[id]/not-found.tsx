"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ListingNotFound() {
  const pathname = usePathname();
  const campus = pathname.split("/").filter(Boolean)[0];
  const href = campus ? `/${campus}/for-sale` : "/";

  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Listing not found
      </h1>
      <p className="text-ink">That post is gone, or the link is wrong.</p>
      <p>
        <Link href={href} className="font-medium text-burgundy underline">
          Back to For sale
        </Link>
      </p>
    </div>
  );
}

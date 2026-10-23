import Link from "next/link";

export default function ListingNotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Listing not found</h1>
      <p className="text-ink">That post is gone, or the link is wrong.</p>
      <p>
        <Link href="/for-sale" className="font-medium text-burgundy underline">
          Back to For sale
        </Link>
      </p>
    </div>
  );
}

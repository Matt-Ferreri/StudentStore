import Link from "next/link";

import { DirectoryHeader } from "@/components/brand-header";

export default function NotFound() {
  return (
    <>
      <DirectoryHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Page not found
          </h1>
          <p className="text-ink">That page is gone, or the link is wrong.</p>
          <p>
            <Link href="/" className="font-medium text-burgundy underline">
              Back to StudentStore
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

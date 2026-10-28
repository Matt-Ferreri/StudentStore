import Link from "next/link";
import { notFound } from "next/navigation";

import { SetupNotice } from "@/components/setup-notice";
import { getCampus } from "@/lib/campuses";
import { campusPath } from "@/lib/format";

export const instant = false;

export default async function CampusHome({
  params,
}: PageProps<"/[campus]">) {
  const { campus: slug } = await params;
  const result = await getCampus(slug);
  if ("configError" in result) {
    return <SetupNotice />;
  }

  if (!result.campus) {
    notFound();
  }

  const campus = result.campus;

  return (
    <div className="space-y-8">
      <section className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-burgundy">
          {campus.name}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Buy and sell with students on your campus.
        </h1>
        <p className="text-lg leading-8 text-ink">
          {campus.brandName} is a campus board. List something you are selling,
          post a lease if you need roommates, and keep a private wishlist. When
          a new for-sale listing uses the same words, we email you a link. Price
          and photos are optional. On each post you can email the student or
          chat with them in the app.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={campusPath(campus.slug, "/for-sale")}
          className="rounded-2xl border border-sage bg-cream p-6 hover:border-burgundy"
        >
          <h2 className="text-2xl font-semibold text-ink">For sale</h2>
          <p className="mt-2 text-ink">
            See what other students at {campus.name} are offering, or post an
            item of your own.
          </p>
        </Link>
        <Link
          href={campusPath(campus.slug, "/housing")}
          className="rounded-2xl border border-sage bg-cream p-6 hover:border-burgundy"
        >
          <h2 className="text-2xl font-semibold text-ink">Housing</h2>
          <p className="mt-2 text-ink">
            Find roommates or a lease. Share how many people you need, the
            address, the rent, and photos of the house.
          </p>
        </Link>
        <Link
          href={campusPath(campus.slug, "/wishlist")}
          className="rounded-2xl border border-sage bg-cream p-6 hover:border-burgundy"
        >
          <h2 className="text-2xl font-semibold text-ink">Wishlist</h2>
          <p className="mt-2 text-ink">
            Keep a private list of what you are looking for. We email you when
            a student posts something with the same words.
          </p>
        </Link>
      </div>
    </div>
  );
}

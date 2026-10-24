import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-burgundy">
          Marist University
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Buy and sell with students on your campus.
        </h1>
        <p className="text-lg leading-8 text-ink">
          StudentStore is a campus board. List something you are selling, or
          post what you are hoping to find. Price and photos are optional. On
          each listing you can email the student or chat with them in the app.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/for-sale"
          className="rounded-2xl border border-sage bg-cream p-6 hover:border-burgundy"
        >
          <h2 className="text-2xl font-semibold text-ink">For sale</h2>
          <p className="mt-2 text-ink">
            See what other Marist students are offering, or post an item of
            your own.
          </p>
        </Link>
        <Link
          href="/wishlist"
          className="rounded-2xl border border-sage bg-cream p-6 hover:border-burgundy"
        >
          <h2 className="text-2xl font-semibold text-ink">Wishlist</h2>
          <p className="mt-2 text-ink">
            Tell campus what you are looking for, from textbooks to furniture.
          </p>
        </Link>
      </div>
    </div>
  );
}

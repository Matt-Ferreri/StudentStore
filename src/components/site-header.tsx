import Link from "next/link";

const links = [
  { href: "/for-sale", label: "For sale" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/listings/new", label: "Post" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-sage bg-burgundy text-cream">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="group">
          <span className="block text-lg font-semibold tracking-tight">
            StudentStore
          </span>
          <span className="block text-sm text-cream">Marist University</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-cream hover:bg-sage hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

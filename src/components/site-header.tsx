import Link from "next/link";

import { signOut } from "@/app/auth-actions";
import { displayNameFromEmail } from "@/lib/marist-email";
import { createSessionClient } from "@/lib/supabase-server";

const links = [
  { href: "/for-sale", label: "For sale" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/messages", label: "Messages" },
  { href: "/listings/new", label: "Post" },
];

export async function SiteHeader() {
  const supabase = await createSessionClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const name = user?.email ? displayNameFromEmail(user.email) : null;

  return (
    <header className="border-b border-sage bg-burgundy text-cream">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="group">
          <span className="block text-lg font-semibold tracking-tight">
            StudentStore
          </span>
          <span className="block text-sm text-cream">Marist University</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {name ? (
            <nav className="flex items-center gap-2">
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
          ) : null}
          {name ? (
            <div className="flex items-center gap-2">
              <span className="px-2 text-cream">{name}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-cream hover:bg-sage hover:text-ink"
                >
                  Log out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function HeaderFallback() {
  return (
    <header className="border-b border-sage bg-burgundy text-cream">
      <div className="mx-auto flex w-full max-w-5xl px-4 py-4">
        <span className="text-lg font-semibold tracking-tight">StudentStore</span>
      </div>
    </header>
  );
}

import Link from "next/link";

import { signOut } from "@/app/auth-actions";
import { UnreadCount } from "@/components/unread-count";
import type { Campus } from "@/lib/campuses";
import { loadUnreadTotal } from "@/lib/chat";
import { campusPath } from "@/lib/format";
import { displayNameFromEmail } from "@/lib/marist-email";
import { createSessionClient } from "@/lib/supabase-server";

export async function SiteHeader({ campus }: { campus: Campus }) {
  const links = [
    { href: campusPath(campus.slug, "/for-sale"), label: "For sale" },
    { href: campusPath(campus.slug, "/housing"), label: "Housing" },
    { href: campusPath(campus.slug, "/wishlist"), label: "Wishlist" },
    { href: campusPath(campus.slug, "/messages"), label: "Messages" },
    { href: campusPath(campus.slug, "/listings/new"), label: "Post" },
  ];
  const supabase = await createSessionClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const name = user?.email ? displayNameFromEmail(user.email) : null;
  const unreadTotal = user ? await loadUnreadTotal() : 0;

  return (
    <header className="border-b border-sage bg-burgundy text-cream">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href={campusPath(campus.slug, "/")} className="group">
          <span className="block text-lg font-semibold tracking-tight">
            {campus.brandName}
          </span>
          <span className="block text-sm text-cream">{campus.name}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {name ? (
            <nav className="flex items-center gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-cream hover:bg-sage hover:text-ink"
                >
                  {link.label}
                  {link.label === "Messages" ? (
                    <UnreadCount count={unreadTotal} tone="inverse" />
                  ) : null}
                </Link>
              ))}
            </nav>
          ) : null}
          {name ? (
            <div className="flex items-center gap-2">
              <span className="px-2 text-cream">{name}</span>
              <form action={signOut}>
                <input type="hidden" name="campus" value={campus.slug} />
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

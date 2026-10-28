import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sessionEmailAllowed } from "@/lib/admins";

const LEGACY_CAMPUS = "marist";

const LEGACY_ROOTS = ["/for-sale", "/housing", "/wishlist", "/messages", "/listings"];

export async function proxy(request: NextRequest) {
  const legacy = legacyCampusPath(request.nextUrl.pathname);
  if (legacy) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = legacy;
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isHome = pathname === "/";
  const campusSlug = campusFromPath(pathname);
  const isLogin = campusSlug !== null && pathname === `/${campusSlug}/login`;

  if (user && !sessionEmailAllowed(user.email)) {
    await supabase.auth.signOut();
    if (isLogin || isHome) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = campusSlug ? `/${campusSlug}/login` : "/";
    redirectUrl.search = "";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (!user && !isLogin && !isHome) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = campusSlug ? `/${campusSlug}/login` : "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isLogin && campusSlug) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${campusSlug}`;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isHome) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${LEGACY_CAMPUS}`;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

function legacyCampusPath(pathname: string): string | null {
  if (pathname === "/login") {
    return `/${LEGACY_CAMPUS}/login`;
  }

  for (const root of LEGACY_ROOTS) {
    if (pathname === root || pathname.startsWith(`${root}/`)) {
      return `/${LEGACY_CAMPUS}${pathname}`;
    }
  }

  return null;
}

function campusFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)(?:\/|$)/);
  return match?.[1] ?? null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

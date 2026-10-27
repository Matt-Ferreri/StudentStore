import { normalizeMaristEmail } from "@/lib/marist-email";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const emails = new Set<string>();

  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase();
    if (EMAIL.test(email)) {
      emails.add(email);
    }
  }

  return [...emails];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return adminEmails().includes(email.trim().toLowerCase());
}

export function signInEmail(raw: string): string | null {
  const marist = normalizeMaristEmail(raw);
  if (marist) {
    return marist;
  }

  const email = raw.trim().toLowerCase();
  return isAdminEmail(email) ? email : null;
}

export function sessionEmailAllowed(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return normalizeMaristEmail(email) !== null || isAdminEmail(email);
}

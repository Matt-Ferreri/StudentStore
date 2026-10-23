const MARIST_EMAIL =
  /^[a-z]+(?:-[a-z]+)*[0-9]*\.[a-z]+(?:-[a-z]+)*[0-9]*@marist\.edu$/;

export function normalizeMaristEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return MARIST_EMAIL.test(email) ? email : null;
}

export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local
    .split(/[.-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

import Link from "next/link";

export function DirectoryHeader() {
  return (
    <header className="border-b border-sage bg-burgundy text-cream">
      <div className="mx-auto flex w-full max-w-5xl px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          StudentStore
        </Link>
      </div>
    </header>
  );
}

export function HeaderFallback({
  title = "StudentStore",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <header className="border-b border-sage bg-burgundy text-cream">
      <div className="mx-auto flex w-full max-w-5xl px-4 py-4">
        <span>
          <span className="block text-lg font-semibold tracking-tight">{title}</span>
          {subtitle ? <span className="block text-sm text-cream">{subtitle}</span> : null}
        </span>
      </div>
    </header>
  );
}

export function UnreadCount({
  count,
  tone = "solid",
}: {
  count: number;
  tone?: "solid" | "inverse";
}) {
  if (count <= 0) {
    return null;
  }

  const label = count === 1 ? "1 unread message" : `${count} unread messages`;
  const text = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-label={label}
      className={
        tone === "inverse"
          ? "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cream px-1.5 text-xs font-semibold leading-none text-burgundy"
          : "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-burgundy px-1.5 text-xs font-semibold leading-none text-cream"
      }
    >
      {text}
    </span>
  );
}

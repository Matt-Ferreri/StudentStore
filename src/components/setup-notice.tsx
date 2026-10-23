export function SetupNotice() {
  return (
    <div className="rounded-2xl border border-burgundy bg-cream px-5 py-4 text-ink">
      <h2 className="text-base font-semibold">Supabase is not connected</h2>
      <p className="mt-1 text-sm leading-6">
        Copy <code className="font-mono">.env.example</code> to{" "}
        <code className="font-mono">.env.local</code>, add your project URL and
        keys, and run the SQL migration in{" "}
        <code className="font-mono">
          supabase/migrations/20261023143000_studentstore.sql
        </code>
        . The README has the steps.
      </p>
    </div>
  );
}

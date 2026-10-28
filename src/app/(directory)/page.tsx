import { CollegePicker } from "@/components/college-picker";
import { SetupNotice } from "@/components/setup-notice";
import { listCampuses } from "@/lib/campuses";

export default async function Home() {
  const result = await listCampuses();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Choose your college
        </h1>
        <p className="text-lg leading-8 text-ink">
          StudentStore is where students buy and sell on campus. Pick your
          college to sign in.
        </p>
      </section>

      {"configError" in result ? (
        <SetupNotice />
      ) : result.campuses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sage bg-cream px-5 py-10 text-center text-ink">
          No colleges are available yet.
        </p>
      ) : (
        <CollegePicker
          colleges={result.campuses.map((campus) => ({
            slug: campus.slug,
            name: campus.name,
          }))}
        />
      )}
    </div>
  );
}

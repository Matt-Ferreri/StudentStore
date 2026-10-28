import { notFound } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { SetupNotice } from "@/components/setup-notice";
import { getCampus } from "@/lib/campuses";

export const instant = false;

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  params,
}: PageProps<"/[campus]/login">) {
  const { campus: slug } = await params;
  const result = await getCampus(slug);
  if ("configError" in result) {
    return <SetupNotice />;
  }

  if (!result.campus) {
    notFound();
  }

  const campus = result.campus;
  const marist = campus.slug === "marist";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-burgundy">
          {campus.name}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-ink">
          {marist
            ? "Use your Marist email, like first.last@marist.edu. A number at the end of your name is fine. We will send a one-time code."
            : `Use your ${campus.name} email. We will send a one-time code.`}
        </p>
      </div>
      <div className="rounded-2xl border border-sage bg-cream p-5">
        <LoginForm
          campusSlug={campus.slug}
          emailLabel={marist ? "Marist email" : `${campus.name} email`}
          placeholder={marist ? "first.last@marist.edu" : "you@college.edu"}
        />
      </div>
    </div>
  );
}

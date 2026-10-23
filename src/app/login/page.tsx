import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-burgundy">
          Marist University
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-ink">
          Use your Marist email, like first.last@marist.edu. A number at the end
          of your name is fine. We will send a one-time code.
        </p>
      </div>
      <div className="rounded-2xl border border-sage bg-cream p-5">
        <LoginForm />
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/auth-actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-5">
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">Marist email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          readOnly={state.codeSent}
          placeholder="first.last@marist.edu"
          className="w-full rounded-xl border border-sage bg-cream px-3 py-2 text-sm text-ink outline-none placeholder:text-sage focus:border-burgundy read-only:text-ink"
        />
      </label>

      {state.codeSent ? (
        <>
          <input type="hidden" name="step" value="verify" />
          <label className="block space-y-1">
            <span className="text-sm font-medium text-ink">Code</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="6-digit code"
              className="w-full rounded-xl border border-sage bg-cream px-3 py-2 text-sm tracking-widest text-ink outline-none placeholder:text-sage placeholder:tracking-normal focus:border-burgundy"
            />
            <p className="text-xs text-ink">
              We sent a 6-digit code to that email. Check your inbox and your
              spam folder.
            </p>
          </label>
        </>
      ) : null}

      {state.error ? (
        <p className="text-sm text-burgundy" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : state.codeSent
            ? "Sign in"
            : "Send code"}
      </button>

      {state.codeSent ? (
        <p>
          <a href="/login" className="text-sm font-medium text-burgundy underline">
            Use a different email
          </a>
        </p>
      ) : null}
    </form>
  );
}

"use server";

import { redirect } from "next/navigation";

import { signInEmail } from "@/lib/admins";
import { normalizeMaristEmail } from "@/lib/marist-email";
import { syncAdminEmails } from "@/lib/sync-admin-emails";
import { createSessionClient } from "@/lib/supabase-server";

export type LoginState = {
  error?: string;
  email?: string;
  codeSent?: boolean;
};

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = signInEmail(stringField(formData, "email"));
  const synced = await syncAdminEmails();
  if (!email) {
    return {
      error: "Use a Marist email like first.last@marist.edu.",
    };
  }

  if (!normalizeMaristEmail(email) && !synced) {
    return {
      error:
        "Sign-in is unavailable until Supabase is configured. See the README.",
      email,
    };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return {
      error:
        "Sign-in is unavailable until Supabase is configured. See the README.",
      email,
    };
  }

  if (stringField(formData, "step") === "verify") {
    const code = stringField(formData, "code");
    if (!/^\d{6}$/.test(code)) {
      return {
        error: "Enter the 6-digit code from your email.",
        email,
        codeSent: true,
      };
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      return {
        error: "That code is not valid. Request a new one if it expired.",
        email,
        codeSent: true,
      };
    }

    redirect("/");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return {
      error: "Could not send a code. Wait a moment and try again.",
      email,
    };
  }

  return { email, codeSent: true };
}

export async function signOut() {
  const supabase = await createSessionClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

import { adminEmails } from "@/lib/admins";
import { createServiceClient } from "@/lib/supabase-server";

export async function syncAdminEmails(): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) {
    return false;
  }

  const emails = adminEmails();
  const { data, error } = await supabase.from("admin_emails").select("email");
  if (error) {
    console.error("Could not read admin emails", error.message);
    return false;
  }

  const existing = (data ?? []).map((row) => row.email as string);
  const stale = existing.filter((email) => !emails.includes(email));

  if (stale.length > 0) {
    const { error: deleteError } = await supabase
      .from("admin_emails")
      .delete()
      .in("email", stale);
    if (deleteError) {
      console.error("Could not remove admin emails", deleteError.message);
      return false;
    }
  }

  if (emails.length === 0) {
    return true;
  }

  const { error: upsertError } = await supabase
    .from("admin_emails")
    .upsert(emails.map((email) => ({ email })));
  if (upsertError) {
    console.error("Could not save admin emails", upsertError.message);
    return false;
  }

  return true;
}

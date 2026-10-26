import { createSessionClient } from "@/lib/supabase-server";

export type WishItem = {
  id: string;
  phrase: string;
  notes: string | null;
  createdAt: string;
};

type WishRow = {
  id: string;
  phrase: string;
  notes: string | null;
  created_at: string;
};

export async function listMyWishes(): Promise<
  { wishes: WishItem[] } | { configError: true }
> {
  const supabase = await createSessionClient();
  if (!supabase) {
    return { configError: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { wishes: [] };
  }

  const { data, error } = await supabase
    .from("wish_items")
    .select("id, phrase, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    wishes: ((data ?? []) as WishRow[]).map((row) => ({
      id: row.id,
      phrase: row.phrase,
      notes: row.notes,
      createdAt: row.created_at,
    })),
  };
}

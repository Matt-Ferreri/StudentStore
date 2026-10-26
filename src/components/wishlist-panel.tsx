import { WishForm } from "@/components/wish-form";
import { removeWish } from "@/app/wish-actions";
import { SetupNotice } from "@/components/setup-notice";
import { formatPostedAt } from "@/lib/format";
import { listMyWishes, type WishItem } from "@/lib/wishes";

export function WishlistPanel({ wishes }: { wishes: WishItem[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="rounded-2xl border border-sage bg-cream p-5">
        <WishForm />
      </div>

      {wishes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sage bg-cream px-5 py-10 text-center text-ink">
          Nothing on your wishlist yet. Add a textbook, a mini fridge, or
          anything else you hope another student posts.
        </p>
      ) : (
        <ul className="space-y-3">
          {wishes.map((wish) => (
            <li
              key={wish.id}
              className="rounded-2xl border border-sage bg-cream p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-ink">{wish.phrase}</h2>
                  {wish.notes ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
                      {wish.notes}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-ink">
                    Added {formatPostedAt(wish.createdAt)}
                  </p>
                </div>
                <form action={removeWish}>
                  <input type="hidden" name="id" value={wish.id} />
                  <button
                    type="submit"
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-burgundy hover:bg-sage hover:text-ink"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function Wishlist() {
  const result = await listMyWishes();
  if ("configError" in result) {
    return <SetupNotice />;
  }

  return <WishlistPanel wishes={result.wishes} />;
}

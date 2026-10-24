"use client";

import { useActionState } from "react";

import { markListingSold, removeListing } from "@/app/listing-actions";
import type { ListingActionState } from "@/lib/types";

const initialState: ListingActionState = {};

export function MarkSoldForm({
  listingId,
  buyers,
  soldToId,
}: {
  listingId: string;
  buyers: { id: string; name: string; email: string }[];
  soldToId: string | null;
}) {
  const [state, action, pending] = useActionState(markListingSold, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">Student who bought it</span>
        <select
          name="buyerId"
          required
          defaultValue={soldToId ?? ""}
          className="w-full rounded-xl border border-sage bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-burgundy"
        >
          <option value="" disabled>
            Choose a student
          </option>
          {buyers.map((buyer) => (
            <option key={buyer.id} value={buyer.id}>
              {buyer.name} · {buyer.email}
            </option>
          ))}
        </select>
      </label>
      {state.error ? (
        <p className="text-sm text-burgundy" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-burgundy px-4 py-2 text-sm font-medium text-cream hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Saving…" : soldToId ? "Update buyer" : "Mark as sold"}
      </button>
    </form>
  );
}

export function RemoveListingForm({
  listingId,
  label,
  confirmMessage,
}: {
  listingId: string;
  label: string;
  confirmMessage: string;
}) {
  const [state, action, pending] = useActionState(removeListing, initialState);

  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="listingId" value={listingId} />
      {state.error ? (
        <p className="text-sm text-burgundy" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-burgundy px-4 py-2 text-sm font-medium text-burgundy hover:bg-burgundy hover:text-cream disabled:opacity-60"
      >
        {pending ? "Removing…" : label}
      </button>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";

import { addWish, type WishFormState } from "@/app/wish-actions";
import { MAX_WISH_NOTES_LENGTH, MAX_WISH_PHRASE_LENGTH } from "@/lib/wish-limits";

const initialState: WishFormState = {};

const inputClass =
  "w-full rounded-xl border border-sage bg-cream px-3 py-2 text-sm text-ink outline-none placeholder:text-sage focus:border-burgundy";

export function WishForm({ campusSlug }: { campusSlug: string }) {
  const [state, action, pending] = useActionState(addWish, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.ok) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="campus" value={campusSlug} />
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">What you are looking for</span>
        <input
          name="phrase"
          required
          maxLength={MAX_WISH_PHRASE_LENGTH}
          placeholder="Mini fridge"
          className={inputClass}
        />
        <FieldError message={state.fieldErrors?.phrase} />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">
          Notes <span className="font-normal text-ink">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={3}
          maxLength={MAX_WISH_NOTES_LENGTH}
          placeholder="Size, condition, or anything else that would help"
          className={inputClass}
        />
        <FieldError message={state.fieldErrors?.notes} />
      </label>

      {state.error ? (
        <p
          className="rounded-xl border border-burgundy bg-cream px-3 py-2 text-sm text-burgundy"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to wishlist"}
      </button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-sm text-burgundy" role="alert">
      {message}
    </p>
  );
}

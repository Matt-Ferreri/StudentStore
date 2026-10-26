"use client";

import { useActionState, type InputHTMLAttributes } from "react";

import { createListing } from "@/app/actions";
import type { CreateListingState } from "@/lib/types";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PHOTOS,
  MAX_TITLE_LENGTH,
} from "@/lib/validation";

const initialState: CreateListingState = {};

export function ListingForm() {
  const [state, action, pending] = useActionState(createListing, initialState);

  return (
    <form action={action} className="space-y-5">
      <Field
        label="Title"
        name="title"
        required
        maxLength={MAX_TITLE_LENGTH}
        error={state.fieldErrors?.title}
      />

      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">Description</span>
        <textarea
          name="description"
          required
          rows={5}
          maxLength={MAX_DESCRIPTION_LENGTH}
          className={inputClass}
        />
        <FieldError message={state.fieldErrors?.description} />
      </label>

      <Field
        label="Price"
        name="price"
        optional
        inputMode="decimal"
        placeholder="25.00"
        hint="Optional. Use dollars, like 25 or 12.50."
        error={state.fieldErrors?.price}
      />

      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">
          Photos <span className="font-normal text-ink">(optional)</span>
        </span>
        <input
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-sage file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
        />
        <p className="text-xs text-ink">
          Up to {MAX_PHOTOS} photos. JPEG, PNG, or WebP. 5 MB each.
        </p>
        <FieldError message={state.fieldErrors?.photos} />
      </label>

      {state.error ? (
        <p className="rounded-xl border border-burgundy bg-cream px-3 py-2 text-sm text-burgundy" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post listing"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  optional,
  ...inputProps
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  optional?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-ink">
        {label}{" "}
        {optional ? (
          <span className="font-normal text-ink">(optional)</span>
        ) : null}
      </span>
      <input name={name} className={inputClass} {...inputProps} />
      {hint ? <p className="text-xs text-ink">{hint}</p> : null}
      <FieldError message={error} />
    </label>
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

const inputClass =
  "w-full rounded-xl border border-sage bg-cream px-3 py-2 text-sm text-ink outline-none placeholder:text-sage focus:border-burgundy";

"use client";

import { useActionState, useState, type InputHTMLAttributes } from "react";

import { createListing } from "@/app/actions";
import { PRODUCT_CATEGORIES, type CreateListingState } from "@/lib/types";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PHOTOS,
  MAX_TITLE_LENGTH,
  MAX_TRADES,
  MAX_TRADE_LENGTH,
} from "@/lib/validation";

const initialState: CreateListingState = {};

export function ListingForm() {
  const [state, action, pending] = useActionState(createListing, initialState);
  const [acceptTrades, setAcceptTrades] = useState(false);
  const [trades, setTrades] = useState([""]);

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

      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">Category</span>
        <select
          name="category"
          required
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Choose a category
          </option>
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.category} />
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

      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="acceptTrades"
            checked={acceptTrades}
            onChange={(event) => setAcceptTrades(event.target.checked)}
            className="mt-1 size-4 accent-burgundy"
          />
          <span>
            <span className="block text-sm font-medium text-ink">
              I would take things in exchange
            </span>
            <span className="block text-xs text-ink">
              Turn this on to list items you would accept instead of money.
            </span>
          </span>
        </label>

        {acceptTrades ? (
          <div className="space-y-2 pl-7">
            {trades.map((trade, index) => (
              <div key={index} className="flex gap-2">
                <input
                  name="trade"
                  value={trade}
                  maxLength={MAX_TRADE_LENGTH}
                  placeholder="Mini fridge, textbooks, concert tickets"
                  onChange={(event) => {
                    const next = [...trades];
                    next[index] = event.target.value;
                    setTrades(next);
                  }}
                  className={inputClass}
                  aria-label={`Trade item ${index + 1}`}
                />
                {trades.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setTrades(trades.filter((_, itemIndex) => itemIndex !== index))
                    }
                    className="rounded-full px-3 py-2 text-sm font-medium text-burgundy hover:bg-sage hover:text-ink"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            {trades.length < MAX_TRADES ? (
              <button
                type="button"
                onClick={() => setTrades([...trades, ""])}
                className="rounded-full border border-sage px-3 py-1.5 text-sm font-medium text-ink hover:border-burgundy"
              >
                Add another
              </button>
            ) : null}
            <FieldError message={state.fieldErrors?.trades} />
          </div>
        ) : null}
      </div>

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

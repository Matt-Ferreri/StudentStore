"use client";

import { useActionState, type InputHTMLAttributes } from "react";

import { createHousing, updateHousing } from "@/app/actions";
import { submitWithCompressedPhotos } from "@/lib/compress-photos";
import { formatPriceInput } from "@/lib/format";
import type { CreateListingState, Listing } from "@/lib/types";
import {
  MAX_ADDRESS_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_PEOPLE_NEEDED,
  MAX_PHOTOS,
} from "@/lib/validation";

const initialState: CreateListingState = {};

export function HousingForm({
  campusSlug,
  listing,
}: {
  campusSlug: string;
  listing?: Listing;
}) {
  const editing = Boolean(listing);
  const serverAction = editing ? updateHousing : createHousing;
  const [state, action, pending] = useActionState(
    (previous: CreateListingState, formData: FormData) =>
      submitWithCompressedPhotos(serverAction, previous, formData),
    initialState,
  );

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="campus" value={campusSlug} />
      {listing ? (
        <input type="hidden" name="listingId" value={listing.id} />
      ) : null}
      <Field
        label="People needed"
        name="people"
        optional
        inputMode="numeric"
        placeholder="2"
        defaultValue={
          listing?.peopleNeeded != null ? String(listing.peopleNeeded) : undefined
        }
        hint={`Optional. A whole number up to ${MAX_PEOPLE_NEEDED}.`}
        error={state.fieldErrors?.people}
      />

      <Field
        label="Address"
        name="address"
        optional
        maxLength={MAX_ADDRESS_LENGTH}
        placeholder="123 Main Street"
        defaultValue={listing?.address ?? undefined}
        hint="Optional. Where the lease is."
        error={state.fieldErrors?.address}
      />

      <Field
        label="Monthly rent"
        name="rent"
        optional
        inputMode="decimal"
        placeholder="800.00"
        defaultValue={
          listing ? formatPriceInput(listing.priceCents) : undefined
        }
        hint="Optional. Use dollars, like 800 or 750.50."
        error={state.fieldErrors?.rent}
      />

      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">
          Notes <span className="font-normal text-ink">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={5}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="Lease dates, bedrooms, or who you are looking for."
          defaultValue={listing?.description}
          className={inputClass}
        />
        <FieldError message={state.fieldErrors?.notes} />
      </label>

      <div className="space-y-3">
        {listing && listing.images.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Current photos</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {listing.images.map((image, index) => (
                // User uploads are served from Supabase storage, not the Next image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.id}
                  src={image.url}
                  alt={`Current photo ${index + 1}`}
                  className="aspect-square w-full rounded-xl border border-sage object-cover"
                />
              ))}
            </div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="clearPhotos"
                className="mt-1 size-4 accent-burgundy"
              />
              <span className="text-sm text-ink">
                Remove current photos
                <span className="block text-xs text-ink">
                  Check this to clear them, or upload new ones below to replace
                  them.
                </span>
              </span>
            </label>
          </div>
        ) : null}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-ink">
            {listing && listing.images.length > 0
              ? "Replace photos"
              : "Photos"}{" "}
            <span className="font-normal text-ink">(optional)</span>
          </span>
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-sage file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
          />
          <p className="text-xs text-ink">
            Up to {MAX_PHOTOS} photos of the house. JPEG, PNG, or WebP. Photos
            are resized automatically for upload.
            {listing && listing.images.length > 0
              ? " Leave blank to keep the current photos."
              : ""}
          </p>
          <FieldError message={state.fieldErrors?.photos} />
        </label>
      </div>

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
        {pending
          ? editing
            ? "Saving…"
            : "Posting…"
          : editing
            ? "Save changes"
            : "Post lease"}
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

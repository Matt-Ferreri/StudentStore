"use client";

import { useActionState, useState, type InputHTMLAttributes } from "react";

import { createListing } from "@/app/actions";
import { PRODUCT_CATEGORIES, type CreateListingState } from "@/lib/types";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_ITEM_LABEL_LENGTH,
  MAX_ITEMS_PER_SECTION,
  MAX_PHOTOS,
  MAX_SECTIONS,
  MAX_SECTION_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_TRADES,
  MAX_TRADE_LENGTH,
} from "@/lib/validation";

const initialState: CreateListingState = {};

type ItemDraft = {
  label: string;
  price: string;
};

type SectionDraft = {
  title: string;
  items: ItemDraft[];
};

function emptyItem(): ItemDraft {
  return { label: "", price: "" };
}

function emptySection(): SectionDraft {
  return { title: "", items: [emptyItem()] };
}

export function ListingForm({ campusSlug }: { campusSlug: string }) {
  const [state, action, pending] = useActionState(createListing, initialState);
  const [acceptTrades, setAcceptTrades] = useState(false);
  const [trades, setTrades] = useState([""]);
  const [sections, setSections] = useState<SectionDraft[]>([emptySection()]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="campus" value={campusSlug} />
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
        hint="Optional price for the whole post. You can also price each item below."
        error={state.fieldErrors?.price}
      />

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-ink">
            Items in this post{" "}
            <span className="font-normal text-ink">(optional)</span>
          </p>
          <p className="text-xs text-ink">
            Group what you are selling. A section could be Dorm needs, with a
            TV, chairs, and a lamp. Leave this blank to post only the title
            above.
          </p>
        </div>

        {sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className="space-y-3 rounded-xl border border-sage p-3"
          >
            <div className="flex gap-2">
              <input
                name={`section-${sectionIndex}-title`}
                value={section.title}
                maxLength={MAX_SECTION_TITLE_LENGTH}
                placeholder="Dorm needs"
                onChange={(event) => {
                  const title = event.target.value;
                  setSections((current) =>
                    current.map((entry, index) =>
                      index === sectionIndex ? { ...entry, title } : entry,
                    ),
                  );
                }}
                className={inputClass}
                aria-label={`Section ${sectionIndex + 1} name`}
              />
              {sections.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setSections((current) =>
                      current.filter((_, index) => index !== sectionIndex),
                    )
                  }
                  className="rounded-full px-3 py-2 text-sm font-medium text-burgundy hover:bg-sage hover:text-ink"
                >
                  Remove
                </button>
              ) : null}
            </div>

            {section.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex flex-col gap-2 sm:flex-row">
                <input
                  name={`section-${sectionIndex}-item`}
                  value={item.label}
                  maxLength={MAX_ITEM_LABEL_LENGTH}
                  placeholder="TV"
                  onChange={(event) => {
                    const label = event.target.value;
                    setSections((current) =>
                      current.map((entry, index) =>
                        index === sectionIndex
                          ? {
                              ...entry,
                              items: entry.items.map((entryItem, entryIndex) =>
                                entryIndex === itemIndex
                                  ? { ...entryItem, label }
                                  : entryItem,
                              ),
                            }
                          : entry,
                      ),
                    );
                  }}
                  className={inputClass}
                  aria-label={`Section ${sectionIndex + 1} item ${itemIndex + 1}`}
                />
                <input
                  name={`section-${sectionIndex}-price`}
                  value={item.price}
                  inputMode="decimal"
                  maxLength={10}
                  placeholder="25.00"
                  onChange={(event) => {
                    const price = event.target.value;
                    setSections((current) =>
                      current.map((entry, index) =>
                        index === sectionIndex
                          ? {
                              ...entry,
                              items: entry.items.map((entryItem, entryIndex) =>
                                entryIndex === itemIndex
                                  ? { ...entryItem, price }
                                  : entryItem,
                              ),
                            }
                          : entry,
                      ),
                    );
                  }}
                  className={`${inputClass} sm:max-w-28`}
                  aria-label={`Section ${sectionIndex + 1} item ${itemIndex + 1} price`}
                />
                {section.items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSections((current) =>
                        current.map((entry, index) =>
                          index === sectionIndex
                            ? {
                                ...entry,
                                items: entry.items.filter(
                                  (_, entryIndex) => entryIndex !== itemIndex,
                                ),
                              }
                            : entry,
                        ),
                      )
                    }
                    className="rounded-full px-3 py-2 text-sm font-medium text-burgundy hover:bg-sage hover:text-ink"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}

            {section.items.length < MAX_ITEMS_PER_SECTION ? (
              <button
                type="button"
                onClick={() =>
                  setSections((current) =>
                    current.map((entry, index) =>
                      index === sectionIndex
                        ? { ...entry, items: [...entry.items, emptyItem()] }
                        : entry,
                    ),
                  )
                }
                className="rounded-full border border-sage px-3 py-1.5 text-sm font-medium text-ink hover:border-burgundy"
              >
                Add item
              </button>
            ) : null}
          </div>
        ))}

        {sections.length < MAX_SECTIONS ? (
          <button
            type="button"
            onClick={() =>
              setSections((current) => [...current, emptySection()])
            }
            className="rounded-full border border-sage px-3 py-1.5 text-sm font-medium text-ink hover:border-burgundy"
          >
            Add section
          </button>
        ) : null}
        <FieldError message={state.fieldErrors?.items} />
      </div>

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

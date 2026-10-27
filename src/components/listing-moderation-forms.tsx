"use client";

import { useActionState } from "react";

import { takeDownListing } from "@/app/listing-actions";
import { reportListing } from "@/app/report-actions";
import {
  MAX_REPORT_REASON,
  type ListingActionState,
  type ReportListingState,
} from "@/lib/types";

const reportState: ReportListingState = {};
const takedownState: ListingActionState = {};

export function ReportListingForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(reportListing, reportState);

  if (state.reported) {
    return (
      <p className="text-sm text-ink" role="status">
        Thanks. The admins have been emailed about this post.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink">What is wrong with this post?</span>
        <textarea
          name="reason"
          required
          maxLength={MAX_REPORT_REASON}
          rows={4}
          className="w-full rounded-xl border border-sage bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-burgundy"
        />
      </label>
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
        {pending ? "Sending…" : "Report"}
      </button>
    </form>
  );
}

export function TakeDownForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(takeDownListing, takedownState);

  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Take this post down? This deletes it for everyone, including the database.",
          )
        ) {
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
        {pending ? "Removing…" : "Take down"}
      </button>
    </form>
  );
}

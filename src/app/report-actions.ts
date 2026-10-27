"use server";

import { headers } from "next/headers";

import { adminEmails } from "@/lib/admins";
import { isUuid } from "@/lib/chat";
import { sendMail } from "@/lib/mail";
import { createServiceClient, createSessionClient } from "@/lib/supabase-server";
import { MAX_REPORT_REASON, type ReportListingState } from "@/lib/types";

export async function reportListing(
  _previous: ReportListingState,
  formData: FormData,
): Promise<ReportListingState> {
  const listingId = stringField(formData, "listingId");
  const reason = stringField(formData, "reason");
  if (!isUuid(listingId)) {
    return { error: "This post could not be found." };
  }

  if (reason.length < 1 || reason.length > MAX_REPORT_REASON) {
    return { error: "Tell us what is wrong with this post." };
  }

  const supabase = await createSessionClient();
  if (!supabase) {
    return { error: "This report could not be sent right now. Try again later." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Sign in before reporting a post." };
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, user_id, title, poster_name, contact")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data) {
    return { error: "This post could not be found." };
  }

  const listing = data as {
    id: string;
    user_id: string;
    title: string;
    poster_name: string;
    contact: string;
  };

  if (listing.user_id === user.id) {
    return { error: "You cannot report your own post." };
  }

  const recipients = adminEmails();
  if (
    recipients.length === 0 ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_APP_PASSWORD
  ) {
    return { error: "This report could not be sent right now. Try again later." };
  }

  const { error: insertError } = await supabase.from("listing_reports").insert({
    listing_id: listingId,
    reporter_id: user.id,
    reason,
  });

  if (insertError?.code === "23505") {
    return { error: "You already reported this post." };
  }

  if (insertError) {
    return { error: "This report could not be sent right now. Try again later." };
  }

  const url = await listingUrl(listingId);
  const subjectTitle = listing.title.replace(/\s+/g, " ").slice(0, 80);
  const text = reportEmail({
    title: listing.title,
    posterName: listing.poster_name,
    contact: listing.contact,
    reporter: user.email,
    reason,
    url,
  });

  const sent = await Promise.all(
    recipients.map(async (to) => {
      try {
        return await sendMail({
          to,
          subject: `StudentStore report: ${subjectTitle}`,
          text,
        });
      } catch (mailError) {
        console.error("Report email failed", mailError);
        return false;
      }
    }),
  );

  if (!sent.some(Boolean)) {
    const service = createServiceClient();
    if (service) {
      const { error: deleteError } = await service
        .from("listing_reports")
        .delete()
        .eq("listing_id", listingId)
        .eq("reporter_id", user.id);
      if (deleteError) {
        console.error("Could not clear an unsent report", deleteError.message);
      }
    }

    return { error: "This report could not be sent right now. Try again later." };
  }

  return { reported: true };
}

function reportEmail(input: {
  title: string;
  posterName: string;
  contact: string;
  reporter: string;
  reason: string;
  url: string;
}): string {
  return [
    "A student reported a StudentStore post.",
    "",
    `Title: ${input.title}`,
    `Posted by: ${input.posterName} <${input.contact}>`,
    `Reported by: ${input.reporter}`,
    "",
    "Reason:",
    input.reason,
    "",
    `View the listing: ${input.url}`,
  ].join("\n");
}

async function listingUrl(id: string): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return `${origin.replace(/\/$/, "")}/listings/${id}`;
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) {
    return `/listings/${id}`;
  }

  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}/listings/${id}`;
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

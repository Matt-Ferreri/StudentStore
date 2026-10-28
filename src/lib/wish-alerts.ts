import { absoluteUrl } from "@/lib/campuses";
import { sendMail } from "@/lib/mail";
import { createServiceClient } from "@/lib/supabase-server";
import { wishMatchesListing } from "@/lib/wish-match";

type WishRow = {
  user_id: string;
  contact: string;
  phrase: string;
};

export async function notifyMatchingWishes(listing: {
  id: string;
  campusSlug: string;
  title: string;
  description: string;
  posterId: string;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("wish_items")
      .select("user_id, contact, phrase");

    if (error || !data) {
      console.error("Could not load wishes for alerts", error?.message);
      return;
    }

    const listingText = `${listing.title}\n${listing.description}`;
    const matches = new Map<string, { contact: string; phrases: string[] }>();

    for (const wish of data as WishRow[]) {
      if (wish.user_id === listing.posterId || !wish.contact) {
        continue;
      }

      if (!wishMatchesListing(wish.phrase, listingText)) {
        continue;
      }

      const current = matches.get(wish.user_id) ?? {
        contact: wish.contact,
        phrases: [],
      };
      current.phrases.push(wish.phrase);
      matches.set(wish.user_id, current);
    }

    if (matches.size === 0) {
      return;
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
      console.error("Wishlist email skipped because SMTP is not configured");
      return;
    }

    const url = await absoluteUrl(`/${listing.campusSlug}/listings/${listing.id}`);
    const subjectTitle = listing.title.replace(/\s+/g, " ").slice(0, 80);

    await Promise.all(
      [...matches.values()].map(async (match) => {
        try {
          await sendMail({
            to: match.contact,
            subject: `A listing matches your wishlist: ${subjectTitle}`,
            text: emailBody(listing.title, match.phrases, url),
          });
        } catch (mailError) {
          console.error("Wishlist email failed", mailError);
        }
      }),
    );
  } catch (error) {
    console.error("Wishlist alert failed", error);
  }
}

function emailBody(title: string, phrases: string[], url: string): string {
  const wishLines =
    phrases.length === 1
      ? `It matches your wish "${phrases[0]}".`
      : `It matches these wishes:\n${phrases.map((phrase) => `- ${phrase}`).join("\n")}`;

  return [
    `Someone posted "${title}" on StudentStore.`,
    "",
    wishLines,
    "",
    `View the listing: ${url}`,
  ].join("\n");
}

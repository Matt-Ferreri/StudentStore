# StudentStore

StudentStore is a campus board where students buy and sell with each other. This first version is for Marist University. Students post items for sale, and each student keeps a private wishlist. When a new listing uses the same words as a wish, StudentStore emails that student a link to the listing.

A listing needs a title and description. Price and photos are optional. Sign-in uses a Marist email (`first.last@marist.edu`) and a one-time code. The signed-in email is the name and contact on each post, and students can also chat on the listing. A student can report a post. Addresses in `ADMIN_EMAILS` receive that email, can sign in even when the address is not a Marist email, and can take the post down. MyMarist single sign-on is not part of this version.

## Run locally

Install dependencies, then use either local Supabase (Docker) or a hosted project.

### Local Supabase

[Docker Desktop](https://www.docker.com/products/docker-desktop/) has to be running.

```bash
npm install
npx supabase start
npx supabase status
```

`supabase start` applies [`supabase/migrations/20261023143000_studentstore.sql`](supabase/migrations/20261023143000_studentstore.sql), which creates the tables, seeds Marist, and adds a public `listing-images` bucket.

Copy `API_URL`, `ANON_KEY`, and `SERVICE_ROLE_KEY` from `supabase status` into `.env.local`, and add the Gmail account that sends login codes:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=the-anon-key
SUPABASE_SERVICE_ROLE_KEY=the-service-role-key
SMTP_USER=studentstore.marist@gmail.com
SMTP_APP_PASSWORD=the-gmail-app-password
ADMIN_EMAILS=dean@marist.edu,moderator@gmail.com
```

`SMTP_APP_PASSWORD` is a Google App Password for that account, not the normal Gmail password. Turn on 2-Step Verification, then create the app password under Google Account → Security → App passwords. Restart Supabase after changing these values (`npx supabase stop`, then `npx supabase start`) so Auth picks them up.

Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first screen is sign-in. With SMTP configured, the 6-digit code is sent to the Marist inbox. Check spam if it does not arrive. Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324) only receives codes when `[auth.email.smtp]` in `supabase/config.toml` is turned off.

`supabase start` also applies [`supabase/migrations/20261023190000_marist_login.sql`](supabase/migrations/20261023190000_marist_login.sql), [`supabase/migrations/20261024130000_listing_chat.sql`](supabase/migrations/20261024130000_listing_chat.sql), [`supabase/migrations/20261024160000_listing_removal.sql`](supabase/migrations/20261024160000_listing_removal.sql), [`supabase/migrations/20261026100000_personal_wishlists.sql`](supabase/migrations/20261026100000_personal_wishlists.sql), [`supabase/migrations/20261027120000_reports_and_admin_emails.sql`](supabase/migrations/20261027120000_reports_and_admin_emails.sql), and [`supabase/migrations/20261027140000_housing.sql`](supabase/migrations/20261027140000_housing.sql). The login migration attaches each listing to a signed-in user and rejects emails that are not `first.last@marist.edu`. The chat migration adds private conversations on each listing. The removal migration lets a seller mark a for-sale post sold to the student who bought it, and lets that buyer or the seller delete the listing from the site and the database. The wishlist migration turns the public wish board into a private list for each student and emails them when a new for-sale post shares those words. The Next.js server sends that mail with the same `SMTP_USER` and `SMTP_APP_PASSWORD`. The reports migration lets a student report a post, emails every address in `ADMIN_EMAILS`, and lets those addresses sign in and take the post down. The housing migration adds a lease board where every field is optional: people needed, address, monthly rent, notes, and photos. Each sign-in copies `ADMIN_EMAILS` into `admin_emails` so the auth hook can allow those addresses. If Supabase is already running, apply the new file with `npx supabase migration up`.

### Hosted Supabase

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a [Supabase](https://supabase.com) project.

3. In the Supabase SQL editor, run [`supabase/migrations/20261023143000_studentstore.sql`](supabase/migrations/20261023143000_studentstore.sql), then [`supabase/migrations/20261023190000_marist_login.sql`](supabase/migrations/20261023190000_marist_login.sql), then [`supabase/migrations/20261023220000_allow_digits_in_marist_email.sql`](supabase/migrations/20261023220000_allow_digits_in_marist_email.sql), then [`supabase/migrations/20261024130000_listing_chat.sql`](supabase/migrations/20261024130000_listing_chat.sql), then [`supabase/migrations/20261024160000_listing_removal.sql`](supabase/migrations/20261024160000_listing_removal.sql), then [`supabase/migrations/20261026100000_personal_wishlists.sql`](supabase/migrations/20261026100000_personal_wishlists.sql), then [`supabase/migrations/20261027120000_reports_and_admin_emails.sql`](supabase/migrations/20261027120000_reports_and_admin_emails.sql), then [`supabase/migrations/20261027140000_housing.sql`](supabase/migrations/20261027140000_housing.sql). In Authentication hooks, enable the before-user-created hook `public.enforce_marist_email`.

4. In Authentication → Emails → SMTP Settings, send through the same Gmail account: host `smtp.gmail.com`, port `465`, username and sender email `studentstore.marist@gmail.com`, password the Gmail App Password, sender name `StudentStore`. Under Authentication → Rate Limits, set emails sent per hour to `30`. Paste the subject `Your StudentStore code` and the HTML from [`supabase/templates/magic_link.html`](supabase/templates/magic_link.html) into the Magic Link template. `config.toml` does not apply to the hosted project on its own.

5. Copy the environment template and fill in the values from **Project Settings → API**:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where it is used |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server-side reads. Row level security only allows public `select`. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Kept for server administration. Posting uses the signed-in session. Do not commit this or expose it in the browser. |
   | `SMTP_USER` | Gmail address that sends login codes, wishlist match emails, and post reports. Local Auth reads this at startup. The Next.js server reads it when a listing is posted or reported. |
   | `SMTP_APP_PASSWORD` | Gmail App Password. Never commit this or expose it in the browser. |
   | `ADMIN_EMAILS` | Comma-separated emails that receive reports and can take a post down. These addresses can sign in even when they are not `@marist.edu`. Students still have to use a Marist email. |

6. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

`.env.local` is gitignored. `.env.example` lists the variable names only.

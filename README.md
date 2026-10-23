# StudentStore

StudentStore is a campus board where students buy and sell with each other. This first version is for Marist University. It has two boards:

- **For sale** for items students are offering
- **Wishlist** for things students are looking for

A listing needs a title and description. Price and photos are optional. Sign-in uses a Marist email (`first.last@marist.edu`) and a one-time code. The signed-in email is the name and contact on each post. Direct messages and MyMarist single sign-on are not part of this version.

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
```

`SMTP_APP_PASSWORD` is a Google App Password for that account, not the normal Gmail password. Turn on 2-Step Verification, then create the app password under Google Account → Security → App passwords. Restart Supabase after changing these values (`npx supabase stop`, then `npx supabase start`) so Auth picks them up.

Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first screen is sign-in. With SMTP configured, the 6-digit code is sent to the Marist inbox. Check spam if it does not arrive. Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324) only receives codes when `[auth.email.smtp]` in `supabase/config.toml` is turned off.

`supabase start` also applies [`supabase/migrations/20261023190000_marist_login.sql`](supabase/migrations/20261023190000_marist_login.sql). That migration attaches each listing to a signed-in user and rejects emails that are not `first.last@marist.edu`.

### Hosted Supabase

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a [Supabase](https://supabase.com) project.

3. In the Supabase SQL editor, run [`supabase/migrations/20261023143000_studentstore.sql`](supabase/migrations/20261023143000_studentstore.sql), then [`supabase/migrations/20261023190000_marist_login.sql`](supabase/migrations/20261023190000_marist_login.sql). In Authentication hooks, enable the before-user-created hook `public.enforce_marist_email`.

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
   | `SMTP_USER` | Gmail address Supabase uses as the sender. Local Auth reads this at startup. |
   | `SMTP_APP_PASSWORD` | Gmail App Password. Never commit this or expose it in the browser. |

6. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

`.env.local` is gitignored. `.env.example` lists the variable names only.

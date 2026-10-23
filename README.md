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

Copy `API_URL`, `ANON_KEY`, and `SERVICE_ROLE_KEY` from `supabase status` into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=the-anon-key
SUPABASE_SERVICE_ROLE_KEY=the-service-role-key
```

Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first screen is sign-in. Local Supabase does not deliver mail to a real inbox. After you request a code, open [Mailpit](http://127.0.0.1:54324) and copy the 6-digit code.

`supabase start` also applies [`supabase/migrations/20261023190000_marist_login.sql`](supabase/migrations/20261023190000_marist_login.sql). That migration attaches each listing to a signed-in user and rejects emails that are not `first.last@marist.edu`.

### Hosted Supabase

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a [Supabase](https://supabase.com) project.

3. In the Supabase SQL editor, run [`supabase/migrations/20261023143000_studentstore.sql`](supabase/migrations/20261023143000_studentstore.sql), then [`supabase/migrations/20261023190000_marist_login.sql`](supabase/migrations/20261023190000_marist_login.sql). In Authentication hooks, enable the before-user-created hook `public.enforce_marist_email`. Hosted projects also need SMTP before codes reach a real inbox. The login page stays the same.

4. Copy the environment template and fill in the values from **Project Settings → API**:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where it is used |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server-side reads. Row level security only allows public `select`. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Kept for server administration. Posting uses the signed-in session. Do not commit this or expose it in the browser. |

5. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

`.env.local` is gitignored. `.env.example` lists the variable names only.

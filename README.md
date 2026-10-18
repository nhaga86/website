# Business Creationality

AI digital product builder. A creator types an idea, and the app writes the ebook, designs the brand and cover, builds a sales page, takes payment through Stripe and emails every buyer their PDF.

**Stack:** Next.js 14 (App Router), Tailwind CSS, shadcn style components, Supabase (Auth, Postgres, Storage), Google Gemini (free tier) for writing, Stripe (Checkout, Billing, Connect), Resend, jsPDF. Hosted on Render's free plan.

**Running cost: $0.** Every service runs on its free tier. Stripe only takes its fee out of each sale. OpenAI is optional: add a key to turn on AI cover images.

## What's inside

| Area | Where |
| --- | --- |
| Landing page with hero, features, templates, pricing toggle ($20/mo or $190 lifetime) | `src/app/page.tsx` |
| Email/password and Google sign in | `src/app/(auth)`, `src/app/auth/callback` |
| Plan checkout and paywall | `src/app/billing`, `src/app/api/stripe/checkout`, `src/lib/auth.ts` |
| Step 1: idea, audience, tone | `src/app/dashboard/new` |
| Step 2: AI titles (3), subtitle, 150 word description, 8 chapter outline, 8 chapters of about 400 words, 5 brand names, palette, font pairing, cover prompt | `src/app/api/products/generate`, `src/app/api/products/[id]/chapters/[number]/generate`, `src/app/dashboard/products/[id]/review` |
| Step 3: live ebook preview, title and copy editors, color pickers with AI palettes, font picker, AI or uploaded cover, rich text chapter editor | `src/app/dashboard/products/[id]/edit` |
| Step 4: three sales page templates, editable hero, benefits, chapter list, author, testimonials, FAQ, guarantee, desktop and mobile preview, custom slug | `src/app/dashboard/products/[id]/sales-page`, `src/components/sales-templates` |
| Step 5: price, PDF build and storage, publish, buy button link and embed code | `src/app/dashboard/products/[id]/publish`, `src/lib/pdf.ts` |
| Public sales page `/p/[slug]`, checkout, thank you page, download links | `src/app/p`, `src/app/api/checkout/[slug]`, `src/app/api/download` |
| Delivery email, subscriber list, Kit and MailerLite sync | `src/lib/fulfillment.ts`, `src/lib/email.ts`, `src/lib/integrations.ts` |
| Dashboard: products grid with views, sales, revenue, duplicate and delete | `src/app/dashboard/page.tsx` |
| Analytics charts, subscriber table and CSV export | `src/app/dashboard/analytics`, `src/app/dashboard/subscribers` |
| Settings: profile, Stripe Connect, email tools, custom domain, billing portal | `src/app/dashboard/settings` |
| Admin: users, revenue, products, refunds, bans, payouts | `src/app/admin` |
| Database schema, RLS, storage buckets, stats functions | `supabase/migrations/0001_init.sql` |

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste `supabase/migrations/0001_init.sql` and run it. This creates the tables, row level security, triggers, the `covers` (public) and `ebooks` (private) storage buckets, and the analytics functions.
3. **Authentication > Providers > Google:** enable it and paste your Google OAuth client ID and secret. In Google Cloud, the authorized redirect URI is `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
4. **Authentication > URL Configuration:** set Site URL to your app URL and add `https://your-app.com/auth/callback` (plus `http://localhost:3000/auth/callback` for local work) to Redirect URLs.
5. Copy the project URL, anon key and service role key into `.env.local`.

### 3. Google Gemini (free)

Go to aistudio.google.com, sign in, click **Get API key > Create API key**, and set `GEMINI_API_KEY`. No card needed. The model defaults to `gemini-flash-latest`; change it with `GEMINI_MODEL`.

Free tier facts to know:
- Limits are a few requests per minute and a daily cap. Check your live numbers in AI Studio. One product uses about 10 requests. The app waits and retries when it hits the per minute limit.
- Google may use free tier prompts to improve its products. Tell your creators, and move to a paid Gemini tier when that becomes a concern.

**Optional, paid:** set `OPENAI_API_KEY` to turn on AI cover images (`gpt-image-1`). Set `AI_PROVIDER=openai` as well to move chapter writing to OpenAI (`gpt-4o-mini` by default). Without a key, creators get a branded cover built from their title and colors, plus a cover prompt they can paste into any free image tool and upload.

### 4. Stripe

1. Set `STRIPE_SECRET_KEY`. Plans use inline prices ($20/month, $190 one time). To use your own Price IDs, set `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_LIFETIME`.
2. **Connect:** turn on Connect in the Stripe dashboard (Express accounts). Creators who connect get paid directly through destination charges, and the platform keeps `PLATFORM_FEE_PERCENT` (default 10). Creators who skip Connect sell through the platform account, and the admin panel tracks what they are owed.
3. **Webhook:** add an endpoint at `https://your-app.com/api/stripe/webhook` with these events:
   - `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `invoice.paid`, `charge.refunded`
   - `account.updated` (tick "Listen to events on Connected accounts", or create a second Connect endpoint at the same URL and put its secret in `STRIPE_CONNECT_WEBHOOK_SECRET`)

   Put the signing secret in `STRIPE_WEBHOOK_SECRET`. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. **Customer portal:** enable it under Settings > Billing > Customer portal so creators can cancel or update cards.

### 5. Resend

Verify a sending domain at resend.com, then set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (for example `Business Creationality <delivery@yourdomain.com>`).

### 6. Admin access

Add your email to `ADMIN_EMAILS` (comma separated). Admins skip the paywall and see `/admin`. You can also promote users from the admin panel.

### 7. Run

```bash
npm run dev
```

## Custom domains

A creator saves a domain in Settings and points a CNAME at your app host. The middleware sees the unknown host and serves `/p/[slug]` for that creator's products only. On Render, add each creator domain under the service's **Settings > Custom Domains**. On Vercel, set `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` (and `VERCEL_TEAM_ID` for team projects) and domains get registered on your project automatically. Without those, add each domain under Project > Settings > Domains yourself.

## How a sale flows

1. Buyer clicks the button on `/p/[slug]`, which hits `/api/checkout/[slug]` and lands on Stripe Checkout.
2. Stripe redirects to `/p/[slug]/thank-you`. That page and the webhook both call `fulfillProductCheckout`, which is idempotent on the checkout session ID.
3. Fulfillment records the sale, bumps product counters, saves the buyer to `subscribers`, emails the download link through Resend and syncs the buyer to Kit or MailerLite.
4. The download link `/api/download?session_id=...` never expires. Each click signs a fresh 10 minute URL to the private PDF.

## Deploy (free, on Render)

1. Sign up at render.com with GitHub.
2. Click **New > Blueprint** and pick this repository. Render reads `render.yaml` and creates a free web service.
3. Fill in each secret value when prompted. Leave `NEXT_PUBLIC_APP_URL` as a placeholder for now.
4. After the first deploy, copy the service address (`https://business-creationality.onrender.com` or similar), set it as `NEXT_PUBLIC_APP_URL`, and click **Manual Deploy > Deploy latest commit**. Values starting with `NEXT_PUBLIC_` are baked in at build time, so they need a rebuild.

The free service sleeps after about 15 minutes without traffic. The first visit after that takes close to a minute. Upgrade the Render instance (or move to Vercel Pro) once buyers arrive.

Vercel works too, but its free Hobby plan forbids commercial use and cuts off long requests.

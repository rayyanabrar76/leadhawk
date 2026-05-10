# LeadHawk

AI sales agent that monitors **Hacker News** for fresh posts needing your skill, drafts personalized pitches with Gemini, and sends them via your Gmail.

> **v1 ships HN-only.** Reddit is planned for a future version pending API approval — Reddit's late-2025 Responsible Builder Policy blocks self-serve API access for SaaS products without a paid commercial contract.

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in every value (see table below). v1 needs credentials for **3 services**: Supabase, Gemini, and Google OAuth. HN needs no key.

### 3. Run Supabase migration

Using the Supabase CLI:
```bash
npx supabase db push
```

Or paste `supabase/migrations/0001_initial_schema.sql` into the **Supabase dashboard → SQL Editor** and run it.

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase dashboard](https://app.supabase.com) → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key (or new `sb_publishable_…` key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key (server-only secret) |
| `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) → Create API key — used for Gemini |
| `GEMINI_API_KEY` | Same as `GOOGLE_API_KEY` (alias accepted) |
| `GOOGLE_CLIENT_ID` | See Google OAuth setup below |
| `GOOGLE_CLIENT_SECRET` | See Google OAuth setup below |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/google/callback` (dev) |

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable these APIs:
   - **Gmail API** (APIs & Services → Library → search "Gmail API")
   - **Google Calendar API** (same, search "Calendar API") — used in session 2 for booking
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URI**: `http://localhost:3000/api/google/callback`
7. Copy the **Client ID** and **Client Secret** to `.env.local`
8. Go to **OAuth consent screen** → add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
9. Add your Gmail address as a **Test user** (while app is in testing mode)

---

## Supabase Setup

1. Create a project at [app.supabase.com](https://app.supabase.com)
2. Go to **Authentication → Providers → Email** — ensure email auth is enabled
3. **Enable Google as a provider** (one-time, required for Google sign-in):
   - **Authentication → Providers → Google → Enable**
   - Paste your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (the ones already in `.env.local`)
   - Copy the Supabase callback URL shown there (looks like `https://<project>.supabase.co/auth/v1/callback`)
   - Add that URL to **Google Cloud Console → Credentials → OAuth Client → Authorized redirect URIs** (alongside the existing `http://localhost:3000/api/google/callback`)
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (for dev) or your production URL
   - Redirect URLs: add `http://localhost:3000/auth/callback`
5. Run the migration SQL (see step 3 above)
6. The migration:
   - Creates tables: `profiles`, `google_tokens`, `leads`, `pitches`
   - Enables Row Level Security on all tables
   - The `leads.source` CHECK constraint accepts `'reddit'` and `'hackernews'` so Reddit can be added later without a migration

---

## How HN Lead Discovery Works

For each refresh, LeadHawk:

1. Asks Gemini for **4-6 keyword variations** of your skill
2. Hits the [Algolia HN Search API](https://hn.algolia.com/api) in parallel for:
   - Stories + comments matching each keyword in the last 24h
   - Ask HN posts matching each keyword in the last 24h
3. Pulls the latest **"Ask HN: Who is hiring?"** thread, scans top-level comments, and matches them against your keywords (last 24h)
4. Pulls the latest **"Ask HN: Freelancer? Seeking freelancer?"** thread, filters to comments starting with `SEEKING FREELANCER` (or containing "looking to hire", "need a", "hiring") so we only catch hirers — not other freelancers
5. Dedupes by HN item ID and caps at 50 leads per refresh

For each lead, LeadHawk fetches the author's HN profile and tries to extract an email from the `about` field. It handles plain emails (`name@domain.com`) and obvious obfuscations (`name [at] domain [dot] com`, `name (at) domain dot com`, etc.). If no email is found, the lead's "Send" button becomes "View on HN ↗" so you can reply on the thread.

---

## Architecture

```
src/
├── app/
│   ├── (auth)/            # signup, login pages
│   ├── onboarding/        # skill entry
│   ├── dashboard/         # main UI
│   └── api/
│       ├── google/        # OAuth connect + callback
│       └── leads/         # refresh, draft, send, skip
├── lib/
│   ├── supabase/          # client + server + service helpers
│   ├── google.ts          # token refresh helper
│   ├── google/
│   │   └── gmail.ts       # send via Gmail API
│   ├── sources/
│   │   ├── types.ts       # shared Lead type
│   │   └── hackernews.ts  # 4-source HN lead fetching
│   └── ai/
│       └── draft-pitch.ts # Gemini pitch generation + keyword expansion
└── components/
    ├── lead-card.tsx
    ├── lead-drawer.tsx
    └── ui/                # shadcn components
```

## Roadmap
- **Session 2:** reply handling, calendar booking via Google Calendar API, billing
- **Future:** Reddit integration (pending Reddit API approval)

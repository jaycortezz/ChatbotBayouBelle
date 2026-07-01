# Restaurant AI Chatbot Widget — Template

A production-ready, embeddable AI chat widget for restaurants, powered by the
Anthropic API (Claude). This repo is configured for the demo client
**Bayou Belle's** (Cajun seafood, Portland OR), but the whole thing is a
template: **duplicate the folder per client, edit one JSON file per client.**

## What it does

- **Answers questions** about hours, menu (with prices), dietary options,
  catering, reservations, parking, and FAQs — all sourced from
  `business-config.json`.
- **Captures leads**: when a visitor asks about catering or a large party, the
  bot conversationally collects name, phone, party size, and event date, saves
  the lead, and notifies the owner by email (Resend) and/or webhook.
- **Admin dashboard** at `/admin` (password-protected) listing all captured
  leads and recent conversations.
- **Embeds anywhere** with a single `<script>` tag — a floating, mobile-friendly
  chat bubble in the bottom-right corner, branded with the restaurant's name
  and accent color from the same JSON file.
- **Guardrails**: stays on-topic, never discusses its own prompt, never invents
  answers (offers the restaurant's phone number instead), and enforces a max
  message length and history cap server-side.

The Anthropic API key lives only in a server-side environment variable and is
only used inside the `/api/chat` route. Nothing secret ever reaches the
browser.

## Stack

- Next.js 14 (App Router, TypeScript) — deploys to Vercel with zero config
- `@anthropic-ai/sdk` calling `claude-sonnet-4-6` (configurable in the JSON)
- Storage: Upstash Redis (recommended on Vercel) or a local JSON file fallback
- Notifications: Resend (email) and/or any webhook URL — both via plain
  `fetch`, no extra dependencies

## Project layout

```
business-config.json      ← THE per-client file. Everything lives here.
app/api/chat/route.ts     ← Server-side Claude call + lead-capture tool loop
app/api/widget-config/    ← Public branding config for the embed script
app/widget/               ← The chat UI (loaded in the widget iframe)
app/admin/page.tsx        ← Leads + conversations dashboard
app/page.tsx              ← Demo page with the widget embedded
public/widget.js          ← The one-line embeddable loader script
lib/prompt.ts             ← Builds the system prompt FROM the JSON (generic)
lib/store.ts              ← Lead/conversation store (Redis or file)
lib/notify.ts             ← Resend email + webhook notifications
middleware.ts             ← Basic Auth for /admin
```

## Run locally

```bash
npm install
cp .env.example .env.local     # fill in ANTHROPIC_API_KEY and ADMIN_PASSWORD
npm run dev
```

Open http://localhost:3000 — the demo page has the widget embedded. Try:

- "What time do you close on Sunday?"
- "Anything gluten free?"
- "I need catering for 40 people" → walk through it, then check
  http://localhost:3000/admin (any username, password = `ADMIN_PASSWORD`).

Locally, leads and conversations are stored in `.data/` as JSON files — no
database needed.

## Deploy to Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In [Vercel](https://vercel.com/new), **Import** the repo. Framework preset
   auto-detects as Next.js — no build settings needed.
3. Under **Environment Variables**, add:

   | Variable | Required | Notes |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | ✅ | From https://console.anthropic.com |
   | `ADMIN_PASSWORD` | ✅ | Protects `/admin` |
   | `RESEND_API_KEY` | for email | Free tier at https://resend.com |
   | `LEAD_EMAIL_TO` | for email | Owner's inbox |
   | `LEAD_EMAIL_FROM` | optional | Defaults to `onboarding@resend.dev` (works without domain setup) |
   | `LEAD_WEBHOOK_URL` | alternative | POSTs lead JSON anywhere (Zapier, Slack, etc.) |
   | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | recommended | See storage note below |

4. **Deploy.** Your widget is now live at `https://YOUR-APP.vercel.app`.
5. Visit the deployment URL to test, and `/admin` to see leads.

### Storage note (important on Vercel)

Vercel's filesystem is ephemeral. Without Redis configured, leads still
**trigger the email/webhook notification** (so you never lose the contact),
but the `/admin` list resets on redeploys. For a persistent admin list, create
a free Redis database at [upstash.com](https://upstash.com) (or via the Vercel
Marketplace → Upstash), copy the two REST values into the env vars, and
redeploy. No code changes — the store auto-detects Redis.

## Embed on the restaurant's website

Add one line before `</body>` on any site (WordPress, Squarespace, Wix custom
code, plain HTML — anything that allows a script tag):

```html
<script src="https://YOUR-APP.vercel.app/widget.js" async></script>
```

That's it. The bubble, branding, and chat UI all come from your deployment.
On screens narrower than 480px the chat opens full-screen.

## Cloning for a new client (under 30 minutes)

1. **Duplicate** (5 min) — Copy this folder (or click "Use this template" on
   GitHub) into a new repo, e.g. `chatbot-marios-pizzeria`.
2. **Edit `business-config.json`** (15 min) — this is the only file you touch:
   - `business`: name, tagline, phone, email, address
   - `branding`: `accentColor` (hex), greeting text, bot name, bubble label
   - `hours`, `menu`, `catering`, `reservations`, `parking`, `faqs`: replace
     with the client's real info. Menu sections/items are free-form — add or
     remove as needed. Anything you put here, the bot knows; anything you
     leave out, the bot will decline and give the phone number.
   - `bot`: model and limits (defaults are fine).
3. **Deploy** (5 min) — Import the new repo into Vercel, set the env vars
   (new client = their own `LEAD_EMAIL_TO`, fresh `ADMIN_PASSWORD`, and ideally
   their own Upstash database), deploy.
4. **Verify** (5 min) — Open the deployment: ask about hours, ask an
   off-topic question (it should deflect), run a fake catering inquiry, and
   confirm the lead lands in `/admin` and in the notification email. Then
   hand the client the one-line `<script>` tag.

No code changes. The system prompt, widget branding, and demo page are all
generated from the JSON at build/request time.

## How lead capture works

The chat route gives Claude a single `capture_lead` tool. The system prompt
(built in `lib/prompt.ts`) instructs it to collect name, phone, party size,
and event date before calling the tool. When Claude calls it, the server:

1. Saves the lead to the store (Redis or file) — always.
2. Fires the Resend email and/or webhook — failures are logged, never break
   the chat.
3. Returns a tool result so Claude confirms to the visitor in-character.

## Guardrails

- **Server-enforced max message length** (`bot.maxUserMessageLength`, default
  500 chars) and **history cap** (`bot.maxHistoryMessages`, default 20) — a
  tampered client can't inflate the prompt.
- **On-topic only**: the system prompt restricts the bot to the restaurant's
  domain and tells it to deflect everything else in one friendly sentence.
- **No hallucinated facts**: the prompt is the single source of truth; for
  anything not covered it says so and offers the phone number.
- **Prompt confidentiality**: instructed never to reveal or discuss its
  instructions, even under "ignore your rules" attempts.
- **Bounded output**: `max_tokens` capped (`bot.maxResponseTokens`), tool loop
  capped at 3 iterations.

## Costs

The system prompt (~2–3K tokens including the full menu) is sent with
`cache_control`, so repeat requests within the cache window read it at ~10% of
the normal input price. With Claude Sonnet and typical short chat exchanges,
expect a fraction of a cent per visitor conversation. Resend and Upstash free
tiers comfortably cover a single restaurant's volume.

## Troubleshooting

- **Bot replies "having a little trouble"** → check the Vercel function logs;
  it's almost always a missing/invalid `ANTHROPIC_API_KEY`.
- **`/admin` returns 503** → `ADMIN_PASSWORD` isn't set.
- **No lead emails** → `RESEND_API_KEY` or `LEAD_EMAIL_TO` missing, or your
  `LEAD_EMAIL_FROM` domain isn't verified in Resend (use the default
  `onboarding@resend.dev` sender until it is).
- **Widget doesn't appear on the client site** → confirm the script `src`
  points at the deployment URL (not localhost) and check the browser console.

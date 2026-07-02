# Cortez Chatbots

A self-hosted, multi-tenant platform for building and managing embeddable AI
chat widgets for any client business — cleaning companies, law firms, dental
practices, contractors, SaaS products, whatever. One deployment serves
unlimited bots: create a bot per client in the dashboard, walk through a
brand-voice wizard, optionally train it on the client's website, test it live
in the dashboard, and hand the client a one-line `<script>` embed.

## What it does

- **Dashboard** at `/dashboard` (password-protected) to create, edit, test,
  and delete bots; view each bot's captured leads and conversation
  transcripts; copy its embed snippet.
- **Guided bot creation wizard**: brand voice (business basics, target
  audience, pain points, brand promise, tone) → optional website training →
  bot branding & lead-capture rules.
- **Train from a website**: paste a URL and the AI reads the page and drafts
  the bot's knowledge sections, FAQs, hours, and contact info for you to
  review and edit — no manual data entry required to get started.
- **Live test chat** right in the editor, so you can talk to the bot and
  check its answers before it ever goes live on a client's site.
- **Industry-agnostic knowledge base**: free-form knowledge sections (not
  fixed fields like "menu" or "reservations") plus FAQs and hours, so the
  same platform fits any business type.
- **Configurable lead capture**: define what to collect (name, phone, email,
  case type, project details — anything) and when the bot should try to
  collect it, in plain English. No hardcoded fields.
- **Answers strictly from the bot's knowledge base** — if something isn't in
  there, the bot says so and offers the business's phone/email/website
  instead of guessing.
- **Embeds anywhere** with one line — a floating, mobile-friendly chat
  bubble:

  ```html
  <script src="https://YOUR-APP.vercel.app/widget.js" data-bot="BOT_ID" async></script>
  ```

- **Guardrails**: on-topic only, never discusses its own prompt, max message
  length and history caps enforced server-side, bounded tool iterations.

The Anthropic API key lives only in a server-side environment variable.
Nothing secret ever reaches the browser or the embedding website.

## Stack

- Next.js 14 (App Router, TypeScript) — deploys to Vercel with zero config
- `@anthropic-ai/sdk` calling `claude-sonnet-4-6` for chat, per-bot configurable
- Storage: Upstash Redis (required in production) or local JSON files (dev)
- Notifications: Resend (email) + any webhook URL — plain `fetch`, no SDKs
- Auth: HTTP Basic Auth on the dashboard (single operator)

## Project layout

```
app/dashboard/                 ← Bot list, creation wizard, editor, per-bot leads
app/api/bots/                  ← Bot CRUD API (Basic Auth protected)
app/api/train/route.ts         ← Website → draft knowledge base (Basic Auth protected)
app/api/chat/route.ts          ← Public chat endpoint (per bot, key server-side)
app/api/widget-config/         ← Public branding config for the embed script
app/widget/                    ← The chat UI (loaded in the widget iframe)
app/demo/[botId]/              ← Public per-bot demo/preview page
public/widget.js               ← The one-line embeddable loader (data-bot)
components/                    ← Shared form pieces (business, brand voice,
                                  hours, knowledge sections, FAQs, lead
                                  capture, test chat) used by both the wizard
                                  and the editor
lib/config.ts                  ← BotConfig type + blank-config seed
lib/prompt.ts                  ← Builds each bot's system prompt + lead tool
lib/store.ts                   ← Bots + leads + conversations (Redis or file)
lib/validate.ts                ← Server-side config validation on save
lib/notify.ts                  ← Resend email + webhook notifications
middleware.ts                  ← Basic Auth for /dashboard, /api/bots, /api/train
```

## Run locally

```bash
npm install
cp .env.example .env.local     # set ANTHROPIC_API_KEY and ADMIN_PASSWORD
npm run dev
```

1. Open http://localhost:3000/dashboard (any username, password =
   `ADMIN_PASSWORD`).
2. Click **New chatbot** and walk through the three-step wizard:
   - **Brand voice** — business name/industry/contact info, target audience,
     pain points, differentiators, tone.
   - **Train from a website** (optional) — paste any URL (an About or
     Services page works best) and click **Train from this page**. Review
     the drafted knowledge sections and FAQs, edit anything, or skip this
     step and fill it in manually.
   - **Bot & leads** — hours, more knowledge sections/FAQs, chat bubble
     branding, and what the bot should collect as a lead and when.
3. On the editor page, use the **Test your bot** panel on the right to chat
   with it immediately — no deploy needed.
4. Trigger the lead-capture condition you configured and watch the lead show
   up under **Leads**.

Locally, everything is stored in `.data/` as JSON files — no database needed.

## Deploy to Vercel

**One-click import:**
[Import this repo into Vercel](https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2Fjaycortezz%2FChatbotBayouBelle)
(log in with GitHub; the framework is auto-detected as Next.js, no build
settings needed).

1. Or manually: **Import** the repo at [vercel.com/new](https://vercel.com/new).
2. Add environment variables:

   | Variable | Required | Notes |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | ✅ | One key for the whole platform |
   | `ADMIN_PASSWORD` | ✅ | Protects `/dashboard`, the bot API, and website training. Username is ignored — type anything for it. |
   | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | ✅ in practice | See storage warning below |
   | `RESEND_API_KEY` | for email | Free tier at https://resend.com; destination email is per bot |
   | `LEAD_EMAIL_FROM` | optional | Defaults to `onboarding@resend.dev` |
   | `LEAD_EMAIL_TO` / `LEAD_WEBHOOK_URL` | optional | Fallbacks for bots without their own settings |

3. **Deploy**, then open `https://YOUR-APP.vercel.app/dashboard` and create
   your first bot.

### ⚠️ Storage warning

Bots themselves live in the store. On Vercel **without Redis, bots (and leads
and transcripts) are written to `/tmp` and disappear on every redeploy or
idle period.** Set up the free Upstash Redis database before creating real
client bots — either directly at [upstash.com](https://upstash.com) or via the
Vercel Marketplace, then paste the two REST values into the env vars and
redeploy. No code changes; the store auto-detects Redis.

## Onboarding a new client (typically under 15 minutes)

1. **Create** — Dashboard → New chatbot → fill in brand voice. (3-5 min)
2. **Train from their website** — paste their homepage or About page URL and
   let the AI draft the knowledge base, or skip and write it by hand. (2 min
   if training works well, longer if writing manually)
3. **Review & refine** — check the drafted knowledge sections and FAQs for
   accuracy (the AI only pulls from what's actually on the page, but always
   verify pricing/policy details), fill in hours, and configure lead capture
   for their business (a law firm might collect case type; a cleaning
   company might collect square footage). (5 min)
4. **Test** — use the **Test your bot** panel to run through a few real
   questions and a lead-capture scenario before going live. (3 min)
5. **Hand off** — copy the embed snippet from the editor and send it to the
   client (or paste it into their site yourself). The demo page URL
   (`/demo/BOT_ID`) doubles as a client-facing preview link.

Editing a live bot later is the same editor — changes take effect on the
next chat message, no redeploy.

## How it works

- **Config model** — every bot is an independent `BotConfig`: business info,
  brand voice, branding, hours, an array of free-form knowledge sections, an
  array of FAQs, a lead-capture rule (trigger description + field list), and
  bot settings (model, limits). Nothing is restaurant- or industry-specific;
  everything the bot "knows" is either a knowledge section or an FAQ.
- **System prompt** — built per request from the bot's config
  (`lib/prompt.ts`), including every non-empty section; blank fields are
  simply omitted rather than sent as empty placeholders. Deterministic per
  bot config, so Anthropic's prompt caching keeps repeat requests cheap.
- **Website training** (`app/api/train/route.ts`) — fetches the given URL
  server-side (with basic SSRF guarding and a byte cap), strips it to plain
  text, and asks Claude to extract a structured draft (business info, brand
  voice basics, hours, knowledge sections, FAQs) as JSON. The dashboard
  merges that draft into the form without overwriting anything you've
  already typed.
- **Lead capture** — the model gets one dynamically-built `capture_lead` tool
  whose fields come straight from the bot's `leadCapture.fields` config. On a
  tool call the server saves the lead (always), then fires the bot's
  email/webhook (failures logged, never break the chat).
- **Test chat** — the dashboard editor's test panel talks to the same
  `/api/chat` endpoint the public widget uses, against an ephemeral session,
  so what you see while testing is exactly what a visitor would get.
- **Embed** — `widget.js` reads its own `data-bot` attribute, fetches the
  bot's public branding, and opens the chat UI in an iframe served from this
  deployment, so the embedding site never sees any credentials.

## Guardrails

- Server-enforced max message length (`bot.maxUserMessageLength`, default 500)
  and history cap (`bot.maxHistoryMessages`, default 20) per bot.
- On-topic only; polite one-sentence deflection for everything else.
- Knowledge base is the single source of truth — unknown topics get the
  business's phone/email/website, not a guess.
- Never reveals or discusses its instructions, even under "ignore your rules"
  prompts.
- Bounded output tokens and tool-loop iterations.
- Website training has a basic SSRF guard (blocks loopback/private-network
  URLs) and is behind the same dashboard auth as everything else.

## Costs

Each bot's system prompt (~1-3K tokens depending on how much knowledge is
configured) is sent with `cache_control`, so repeat messages within the cache
window read it at ~10% of input price. With Claude Sonnet and short chat
exchanges, expect a fraction of a cent per visitor conversation. Website
training is a one-off call per URL trained (a few thousand tokens). Upstash
and Resend free tiers cover typical multi-client volume.

## Troubleshooting

- **Bot replies "having a little trouble"** → check Vercel function logs;
  almost always a missing/invalid `ANTHROPIC_API_KEY`.
- **Bots disappeared after a deploy** → you're on the file store; configure
  Upstash Redis (see storage warning).
- **`/dashboard` or website training returns 503** → `ADMIN_PASSWORD` isn't set.
- **Website training fails** → the target page may block server-side
  fetches, redirect to a login wall, or just not have much text (try a
  different page, or an About/Services page specifically).
- **No lead emails** → `RESEND_API_KEY` missing, the bot has no notification
  email set (and no `LEAD_EMAIL_TO` fallback), or your `LEAD_EMAIL_FROM`
  domain isn't verified in Resend (use the default `onboarding@resend.dev`).
- **Widget doesn't appear on a client site** → check the browser console; the
  script tag needs both the full deployment URL and a valid `data-bot` id.

## Ideas for later

- Real user accounts (e.g. NextAuth) if clients should log in themselves
- Rate limiting on `/api/chat` (per-IP) before heavy public traffic
- Streaming responses for a snappier feel
- Multi-page website crawling (follow internal links) instead of one page
- Per-bot usage/analytics (message counts, top questions)

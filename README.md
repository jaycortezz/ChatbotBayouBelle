# Restaurant Chatbot Platform

A self-hosted, multi-tenant platform (think chatbot.com, scoped to restaurant
bots) for creating and managing embeddable AI chat widgets — powered by the
Anthropic API (Claude). One deployment serves unlimited bots: create a bot per
client in the dashboard, edit its branding and knowledge base, and hand the
client a one-line `<script>` embed.

## What it does

- **Dashboard** at `/dashboard` (password-protected) to create, edit, and
  delete bots, view each bot's leads and conversation transcripts, and copy
  its embed snippet.
- **Per-bot everything**: branding (name, accent color, greeting, persona),
  knowledge base (hours, menu with prices, catering, reservations, parking,
  FAQs), lead notification settings (email + webhook), leads, and transcripts.
- **Answers questions** strictly from the bot's knowledge base — if something
  isn't in there, the bot says so and gives out the restaurant's phone number.
  It never invents answers.
- **Captures leads**: when a visitor asks about catering or a large party, the
  bot conversationally collects name, phone, party size, and event date, saves
  the lead, and notifies that bot's owner by email (Resend) and/or webhook.
- **Embeds anywhere** with one line — a floating, mobile-friendly chat bubble:

  ```html
  <script src="https://YOUR-APP.vercel.app/widget.js" data-bot="BOT_ID" async></script>
  ```

- **Guardrails**: on-topic only, never discusses its own prompt, max message
  length and history caps enforced server-side, bounded tool iterations.

The Anthropic API key lives only in a server-side environment variable.
Nothing secret ever reaches the browser or the embedding website.

## Stack

- Next.js 14 (App Router, TypeScript) — deploys to Vercel with zero config
- `@anthropic-ai/sdk` calling `claude-sonnet-4-6` (per-bot configurable)
- Storage: Upstash Redis (required in production) or local JSON files (dev)
- Notifications: Resend (email) + any webhook URL — plain `fetch`, no SDKs
- Auth: HTTP Basic Auth on the dashboard (single operator)

## Project layout

```
business-config.json          ← Template for NEW bots (the Bayou Belle's demo)
app/dashboard/                ← Bot list, create, editor, per-bot leads
app/api/bots/                 ← Bot CRUD API (Basic Auth protected)
app/api/chat/route.ts         ← Public chat endpoint (per bot, key server-side)
app/api/widget-config/        ← Public branding config for the embed script
app/widget/                   ← The chat UI (loaded in the widget iframe)
app/demo/[botId]/             ← Public per-bot demo/preview page
public/widget.js              ← The one-line embeddable loader (data-bot)
lib/prompt.ts                 ← Builds each bot's system prompt from its config
lib/store.ts                  ← Bots + leads + conversations (Redis or file)
lib/validate.ts               ← Server-side config validation on save
lib/notify.ts                 ← Resend email + webhook notifications
middleware.ts                 ← Basic Auth for /dashboard and /api/bots
```

## Run locally

```bash
npm install
cp .env.example .env.local     # set ANTHROPIC_API_KEY and ADMIN_PASSWORD
npm run dev
```

1. Open http://localhost:3000/dashboard (any username, password =
   `ADMIN_PASSWORD`).
2. Click **New chatbot**, give it a name and color. It starts from the Bayou
   Belle's template, so it works immediately.
3. On the editor page: click **Try it ↗** to chat on the demo page, then ask
   about catering for 40 people and watch the lead appear under **Leads**.
4. Edit the knowledge base JSON, save, and re-test — changes are live
   instantly (no redeploy).

Locally, everything is stored in `.data/` as JSON files — no database needed.

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it at [vercel.com/new](https://vercel.com/new)
   (auto-detected as Next.js, no build settings).
2. Add environment variables:

   | Variable | Required | Notes |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | ✅ | One key for the whole platform |
   | `ADMIN_PASSWORD` | ✅ | Protects `/dashboard` and the bot API |
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

## Onboarding a new client (under 15 minutes)

No cloning, no redeploys — it's all in the dashboard now:

1. **Create** — Dashboard → New chatbot → name + brand color. (1 min)
2. **Fill in the knowledge base** — In the editor, set the real contact info
   and greeting in the form fields, then replace the demo hours/menu/catering/
   FAQs in the knowledge base JSON. Set the client's notification email. (10 min)
3. **Verify** — Open the bot's demo page: ask about hours, ask something
   off-topic (it should deflect), run a fake catering inquiry, and confirm the
   lead shows in the dashboard and the notification arrives. (3 min)
4. **Hand off** — Copy the embed snippet from the editor and send it to the
   client (or paste it into their site yourself). The demo page URL doubles
   as a client-facing preview link.

Editing a live bot later (menu price change, new hours) is the same editor —
changes take effect on the next chat message, no redeploy.

## How it works

- **Template** — `business-config.json` seeds new bots; each bot then owns an
  independent copy of that config in the store, edited via the dashboard.
- **System prompt** — built per request from the bot's config
  (`lib/prompt.ts`); deterministic per bot, so Anthropic's prompt caching
  keeps repeat requests cheap.
- **Lead capture** — the model gets one `capture_lead` tool and instructions
  to collect name/phone/party size/date first. On the tool call the server
  saves the lead (always), then fires the bot's email/webhook (failures
  logged, never break the chat).
- **Embed** — `widget.js` reads its own `data-bot` attribute, fetches the
  bot's public branding, and opens the chat UI in an iframe served from this
  deployment, so the embedding site never sees any credentials.

## Guardrails

- Server-enforced max message length (`bot.maxUserMessageLength`, default 500)
  and history cap (`bot.maxHistoryMessages`, default 20) per bot.
- On-topic only; polite one-sentence deflection for everything else.
- Knowledge base is the single source of truth — unknown topics get the
  restaurant's phone number, not a guess.
- Never reveals or discusses its instructions, even under "ignore your rules"
  prompts.
- Bounded output tokens and tool-loop iterations.

## Costs

Each bot's system prompt (~2–3K tokens with a full menu) is sent with
`cache_control`, so repeat messages within the cache window read it at ~10% of
input price. With Claude Sonnet and short chat exchanges, expect a fraction of
a cent per visitor conversation. Upstash and Resend free tiers cover typical
restaurant volume across several bots.

## Troubleshooting

- **Bot replies "having a little trouble"** → check Vercel function logs;
  almost always a missing/invalid `ANTHROPIC_API_KEY`.
- **Bots disappeared after a deploy** → you're on the file store; configure
  Upstash Redis (see storage warning).
- **`/dashboard` returns 503** → `ADMIN_PASSWORD` isn't set.
- **No lead emails** → `RESEND_API_KEY` missing, the bot has no notification
  email set (and no `LEAD_EMAIL_TO` fallback), or your `LEAD_EMAIL_FROM`
  domain isn't verified in Resend (use the default `onboarding@resend.dev`).
- **Widget doesn't appear on a client site** → check the browser console; the
  script tag needs both the full deployment URL and a valid `data-bot` id.

## Ideas for later

- Real user accounts (e.g. NextAuth) if clients should log in themselves
- Rate limiting on `/api/chat` (per-IP) before heavy public traffic
- Streaming responses for a snappier feel
- Structured menu editor UI instead of the JSON textarea
- Per-bot usage/analytics (message counts, top questions)

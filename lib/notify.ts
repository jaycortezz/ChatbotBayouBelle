import type { Bot, Lead } from "./store";

/**
 * Sends lead notifications for a bot. Two channels, both optional, both fire:
 *
 * - Resend email: RESEND_API_KEY is platform-wide (one Resend account for the
 *   whole platform); the destination address is per-bot (dashboard setting),
 *   falling back to the LEAD_EMAIL_TO env var.
 * - Webhook: per-bot URL (dashboard setting), falling back to LEAD_WEBHOOK_URL.
 *
 * Failures are logged but never break the chat — the lead is already saved
 * to the store before this runs.
 */
export async function notifyLead(bot: Bot, lead: Lead): Promise<void> {
  await Promise.allSettled([sendEmail(bot, lead), sendWebhook(bot, lead)]).then(
    (results) => {
      for (const r of results) {
        if (r.status === "rejected") {
          console.error(`[notify] lead notification failed (bot ${bot.id}):`, r.reason);
        }
      }
    }
  );
}

async function sendEmail(bot: Bot, lead: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = bot.notifications.emailTo || process.env.LEAD_EMAIL_TO;
  if (!apiKey || !to) return;

  const businessName = bot.config.business.name;
  const from = process.env.LEAD_EMAIL_FROM || "Leads <onboarding@resend.dev>";

  const html = `
    <h2>New ${escapeHtml(businessName)} lead from the website chatbot</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><b>Name</b></td><td>${escapeHtml(lead.name)}</td></tr>
      <tr><td><b>Phone</b></td><td>${escapeHtml(lead.phone)}</td></tr>
      <tr><td><b>Party size</b></td><td>${lead.partySize}</td></tr>
      <tr><td><b>Event date</b></td><td>${escapeHtml(lead.eventDate)}</td></tr>
      <tr><td><b>Type</b></td><td>${escapeHtml(lead.eventType || "—")}</td></tr>
      <tr><td><b>Notes</b></td><td>${escapeHtml(lead.notes || "—")}</td></tr>
      <tr><td><b>Received</b></td><td>${lead.createdAt}</td></tr>
    </table>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New lead: ${lead.name} — party of ${lead.partySize} on ${lead.eventDate}`,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}

async function sendWebhook(bot: Bot, lead: Lead): Promise<void> {
  const url = bot.notifications.webhookUrl || process.env.LEAD_WEBHOOK_URL;
  if (!url) return;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "chatbot.lead",
      botId: bot.id,
      business: bot.config.business.name,
      lead,
    }),
  });
  if (!res.ok) {
    throw new Error(`Webhook responded ${res.status}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

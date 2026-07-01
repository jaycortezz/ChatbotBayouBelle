import template from "@/business-config.json";

/**
 * business-config.json is now the TEMPLATE for new bots: every bot created
 * in the dashboard starts as a copy of it (with name/color overrides) and is
 * then edited live in the dashboard. Bots themselves live in the store.
 */
export type BotConfig = typeof template;

export function getTemplateConfig(): BotConfig {
  return JSON.parse(JSON.stringify(template)) as BotConfig;
}

/** The subset of a bot's config that is safe to send to the browser. */
export function getPublicConfig(cfg: BotConfig) {
  return {
    name: cfg.business.name,
    tagline: cfg.business.tagline,
    phone: cfg.business.phone,
    accentColor: cfg.branding.accentColor,
    bubbleLabel: cfg.branding.bubbleLabel,
    greeting: cfg.branding.greeting,
    botName: cfg.branding.botName,
    maxUserMessageLength: cfg.bot.maxUserMessageLength,
  };
}

export function getModel(cfg: BotConfig): string {
  return process.env.ANTHROPIC_MODEL || cfg.bot.model;
}

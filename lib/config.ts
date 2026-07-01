import rawConfig from "@/business-config.json";

export type BusinessConfig = typeof rawConfig;

export function getConfig(): BusinessConfig {
  return rawConfig;
}

/** The subset of config that is safe to send to the browser. */
export function getPublicConfig() {
  const cfg = getConfig();
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

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL || getConfig().bot.model;
}

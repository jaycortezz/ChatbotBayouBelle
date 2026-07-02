export const DEFAULT_MODEL = "claude-sonnet-4-6";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  directionsNote: string;
}

export interface BusinessInfo {
  name: string;
  industry: string;
  tagline: string;
  website: string;
  phone: string;
  email: string;
  address: Address;
}

export interface BrandVoice {
  targetAudience: string;
  painPoints: string;
  brandPromise: string;
  brandValues: string;
  whatYouDo: string;
  differentiators: string;
  tone: string;
}

export interface Branding {
  accentColor: string;
  botName: string;
  bubbleLabel: string;
  greeting: string;
}

export interface Hours {
  schedule: Record<string, string>;
  notes: string;
}

export interface KnowledgeSection {
  title: string;
  content: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface LeadField {
  key: string;
  label: string;
  required: boolean;
}

export interface LeadCapture {
  enabled: boolean;
  triggerDescription: string;
  fields: LeadField[];
}

export interface BotSettings {
  model: string;
  maxUserMessageLength: number;
  maxHistoryMessages: number;
  maxResponseTokens: number;
}

/** The full, industry-agnostic definition of a chatbot. */
export interface BotConfig {
  business: BusinessInfo;
  brandVoice: BrandVoice;
  branding: Branding;
  hours: Hours;
  knowledgeSections: KnowledgeSection[];
  faqs: Faq[];
  leadCapture: LeadCapture;
  bot: BotSettings;
}

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** A fresh, empty config to seed the "New chatbot" wizard. */
export function getBlankConfig(): BotConfig {
  return {
    business: {
      name: "",
      industry: "",
      tagline: "",
      website: "",
      phone: "",
      email: "",
      address: { street: "", city: "", state: "", zip: "", directionsNote: "" },
    },
    brandVoice: {
      targetAudience: "",
      painPoints: "",
      brandPromise: "",
      brandValues: "",
      whatYouDo: "",
      differentiators: "",
      tone: "friendly and professional",
    },
    branding: {
      accentColor: "#4F46E5",
      botName: "Assistant",
      bubbleLabel: "Chat with us",
      greeting: "Hi! How can I help you today?",
    },
    hours: { schedule: {}, notes: "" },
    knowledgeSections: [],
    faqs: [],
    leadCapture: {
      enabled: true,
      triggerDescription:
        "when a visitor wants a quote, wants to book, or asks to be contacted by the team",
      fields: [
        { key: "name", label: "Name", required: true },
        { key: "phone", label: "Phone", required: true },
        { key: "email", label: "Email", required: false },
        { key: "details", label: "What they need", required: false },
      ],
    },
    bot: {
      model: DEFAULT_MODEL,
      maxUserMessageLength: 500,
      maxHistoryMessages: 20,
      maxResponseTokens: 1024,
    },
  };
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
  return process.env.ANTHROPIC_MODEL || cfg.bot.model || DEFAULT_MODEL;
}

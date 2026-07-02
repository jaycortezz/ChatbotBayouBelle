import type { BotConfig } from "./config";

const FIELD_KEY_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validates a bot config submitted from the dashboard before it's saved.
 * Industry-agnostic: the only hard requirements are what the widget and
 * prompt builder actually need (name, branding, valid lead-field keys).
 * Everything else can be blank and is simply omitted from the prompt.
 */
export function validateBotConfig(
  input: unknown
): { ok: true; config: BotConfig } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const cfg = input as Record<string, any>;

  if (!isObj(cfg)) return { ok: false, errors: ["Config must be a JSON object."] };

  // business
  const b = cfg.business;
  if (!isObj(b)) {
    errors.push("Missing 'business' section.");
  } else {
    if (!isStr(b.name)) errors.push("business.name is required.");
    for (const k of ["industry", "tagline", "website", "phone", "email"]) {
      if (typeof b[k] !== "string") errors.push(`business.${k} must be a string (can be empty).`);
    }
    if (!isObj(b.address)) {
      errors.push("business.address must be an object.");
    } else {
      for (const k of ["street", "city", "state", "zip", "directionsNote"]) {
        if (typeof b.address[k] !== "string")
          errors.push(`business.address.${k} must be a string (can be empty).`);
      }
    }
  }

  // brandVoice
  const bv = cfg.brandVoice;
  if (!isObj(bv)) {
    errors.push("Missing 'brandVoice' section.");
  } else {
    for (const k of [
      "targetAudience",
      "painPoints",
      "brandPromise",
      "brandValues",
      "whatYouDo",
      "differentiators",
      "tone",
    ]) {
      if (typeof bv[k] !== "string") errors.push(`brandVoice.${k} must be a string (can be empty).`);
    }
  }

  // branding
  const br = cfg.branding;
  if (!isObj(br)) {
    errors.push("Missing 'branding' section.");
  } else {
    for (const k of ["accentColor", "bubbleLabel", "greeting", "botName"]) {
      if (!isStr(br[k])) errors.push(`branding.${k} must be a non-empty string.`);
    }
    if (isStr(br.accentColor) && !/^#[0-9a-fA-F]{3,8}$/.test(br.accentColor)) {
      errors.push("branding.accentColor must be a hex color like #4F46E5.");
    }
  }

  // hours
  const hours = cfg.hours;
  if (!isObj(hours) || !isObj(hours.schedule)) {
    errors.push("hours.schedule must be an object (can be empty).");
  } else {
    for (const [day, val] of Object.entries(hours.schedule)) {
      if (typeof val !== "string") errors.push(`hours.schedule.${day} must be a string.`);
    }
  }
  if (!isObj(hours) || typeof hours.notes !== "string") {
    errors.push("hours.notes must be a string (can be empty).");
  }

  // knowledgeSections
  if (!Array.isArray(cfg.knowledgeSections)) {
    errors.push("knowledgeSections must be an array (can be empty).");
  } else {
    cfg.knowledgeSections.forEach((s: any, i: number) => {
      if (!isObj(s) || !isStr(s.title) || !isStr(s.content)) {
        errors.push(`knowledgeSections[${i}] needs non-empty 'title' and 'content' strings.`);
      }
    });
  }

  // faqs
  if (!Array.isArray(cfg.faqs)) {
    errors.push("faqs must be an array (can be empty).");
  } else {
    cfg.faqs.forEach((f: any, i: number) => {
      if (!isObj(f) || !isStr(f.q) || !isStr(f.a)) {
        errors.push(`faqs[${i}] needs non-empty 'q' and 'a' strings.`);
      }
    });
  }

  // leadCapture
  const lc = cfg.leadCapture;
  if (!isObj(lc) || typeof lc.enabled !== "boolean") {
    errors.push("leadCapture.enabled must be a boolean.");
  } else if (!Array.isArray(lc.fields)) {
    errors.push("leadCapture.fields must be an array.");
  } else {
    if (typeof lc.triggerDescription !== "string") {
      errors.push("leadCapture.triggerDescription must be a string.");
    }
    if (lc.enabled && (!isStr(lc.triggerDescription) || lc.fields.length === 0)) {
      errors.push(
        "leadCapture is enabled but has no triggerDescription or no fields — either fill those in or turn lead capture off."
      );
    }
    const seenKeys = new Set<string>();
    lc.fields.forEach((f: any, i: number) => {
      if (!isObj(f) || !isStr(f.key) || !isStr(f.label) || typeof f.required !== "boolean") {
        errors.push(`leadCapture.fields[${i}] needs 'key', 'label' (non-empty strings) and 'required' (boolean).`);
        return;
      }
      if (!FIELD_KEY_PATTERN.test(f.key)) {
        errors.push(
          `leadCapture.fields[${i}].key ("${f.key}") must start with a letter/underscore and contain only letters, numbers, underscores.`
        );
      }
      if (seenKeys.has(f.key)) errors.push(`leadCapture.fields[${i}].key ("${f.key}") is duplicated.`);
      seenKeys.add(f.key);
    });
  }

  // bot settings
  const bot = cfg.bot;
  if (!isObj(bot)) {
    errors.push("Missing 'bot' section.");
  } else {
    if (!isStr(bot.model)) errors.push("bot.model must be a model id string.");
    checkNum(bot.maxUserMessageLength, "bot.maxUserMessageLength", 50, 2000, errors);
    checkNum(bot.maxHistoryMessages, "bot.maxHistoryMessages", 2, 60, errors);
    checkNum(bot.maxResponseTokens, "bot.maxResponseTokens", 100, 4000, errors);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, config: cfg as BotConfig };
}

function isObj(v: unknown): v is Record<string, any> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isStr(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function checkNum(v: unknown, label: string, min: number, max: number, errors: string[]) {
  if (typeof v !== "number" || Number.isNaN(v) || v < min || v > max) {
    errors.push(`${label} must be a number between ${min} and ${max}.`);
  }
}

import type { BotConfig } from "./config";

/**
 * Validates a bot config submitted from the dashboard before it's saved.
 * Checks every field the prompt builder and widget actually read, so a bad
 * edit fails at save time with a readable message instead of breaking chat.
 */
export function validateBotConfig(
  input: unknown
): { ok: true; config: BotConfig } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const cfg = input as Record<string, any>;

  if (!isObj(cfg)) return { ok: false, errors: ["Config must be a JSON object."] };

  // business
  const b = cfg.business;
  if (!isObj(b)) errors.push("Missing 'business' section.");
  else {
    for (const k of ["name", "tagline", "phone", "email"]) {
      if (!isStr(b[k])) errors.push(`business.${k} must be a non-empty string.`);
    }
    if (!isObj(b.address)) errors.push("business.address must be an object.");
    else {
      for (const k of ["street", "city", "state", "zip"]) {
        if (!isStr(b.address[k])) errors.push(`business.address.${k} must be a non-empty string.`);
      }
      if (typeof b.address.directionsNote !== "string")
        errors.push("business.address.directionsNote must be a string (can be empty).");
    }
  }

  // branding
  const br = cfg.branding;
  if (!isObj(br)) errors.push("Missing 'branding' section.");
  else {
    for (const k of ["accentColor", "bubbleLabel", "greeting", "botName"]) {
      if (!isStr(br[k])) errors.push(`branding.${k} must be a non-empty string.`);
    }
    if (isStr(br.accentColor) && !/^#[0-9a-fA-F]{3,8}$/.test(br.accentColor)) {
      errors.push("branding.accentColor must be a hex color like #C2451E.");
    }
  }

  // hours
  if (!isObj(cfg.hours)) errors.push("Missing 'hours' section.");
  else {
    const entries = Object.entries(cfg.hours);
    if (entries.length === 0) errors.push("hours must have at least one entry.");
    for (const [day, val] of entries) {
      if (typeof val !== "string") errors.push(`hours.${day} must be a string.`);
    }
    if (typeof (cfg.hours as any).notes !== "string")
      errors.push("hours.notes must be a string (can be empty).");
  }

  // menu
  const menu = cfg.menu;
  if (!isObj(menu) || !Array.isArray(menu.sections)) {
    errors.push("menu.sections must be an array.");
  } else {
    menu.sections.forEach((section: any, i: number) => {
      if (!isObj(section) || !isStr(section.name) || !Array.isArray(section.items)) {
        errors.push(`menu.sections[${i}] needs a 'name' string and an 'items' array.`);
        return;
      }
      section.items.forEach((item: any, j: number) => {
        if (!isObj(item) || !isStr(item.name) || !isStr(item.price)) {
          errors.push(`menu.sections[${i}].items[${j}] needs 'name' and 'price' strings.`);
        } else {
          if (typeof item.description !== "string")
            errors.push(`menu.sections[${i}].items[${j}].description must be a string (can be empty).`);
          if (item.dietary !== undefined && !(Array.isArray(item.dietary) && item.dietary.every(isStr)))
            errors.push(`menu.sections[${i}].items[${j}].dietary must be an array of strings.`);
        }
      });
    });
    if (!isStr(menu.dietaryNotes)) errors.push("menu.dietaryNotes must be a non-empty string.");
  }

  // catering
  const cat = cfg.catering;
  if (!isObj(cat)) errors.push("Missing 'catering' section.");
  else {
    for (const k of ["summary", "pricing", "leadTime", "deliveryArea", "deposit", "privateRoom"]) {
      if (!isStr(cat[k])) errors.push(`catering.${k} must be a non-empty string.`);
    }
    if (typeof cat.minimumGuests !== "number") errors.push("catering.minimumGuests must be a number.");
  }

  // reservations / parking
  if (!isObj(cfg.reservations) || !isStr(cfg.reservations.policy) || !isStr(cfg.reservations.largeParty)) {
    errors.push("reservations needs 'policy' and 'largeParty' strings.");
  }
  if (!isObj(cfg.parking) || !isStr(cfg.parking.details)) {
    errors.push("parking.details must be a non-empty string.");
  }

  // faqs
  if (!Array.isArray(cfg.faqs)) errors.push("faqs must be an array.");
  else {
    cfg.faqs.forEach((f: any, i: number) => {
      if (!isObj(f) || !isStr(f.q) || !isStr(f.a)) errors.push(`faqs[${i}] needs 'q' and 'a' strings.`);
    });
  }

  // bot settings
  const bot = cfg.bot;
  if (!isObj(bot)) errors.push("Missing 'bot' section.");
  else {
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

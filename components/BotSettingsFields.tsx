"use client";

import type { BotSettings } from "@/lib/config";
import { Field, Grid } from "./FormKit";

export default function BotSettingsFields({
  value,
  onChange,
}: {
  value: BotSettings;
  onChange: (v: BotSettings) => void;
}) {
  return (
    <Grid>
      <Field label="Model" value={value.model} onChange={(v) => onChange({ ...value, model: v })} />
      <Field
        label="Max message length (characters)"
        value={String(value.maxUserMessageLength)}
        onChange={(v) => onChange({ ...value, maxUserMessageLength: Number(v) || 0 })}
      />
      <Field
        label="Max history messages"
        value={String(value.maxHistoryMessages)}
        onChange={(v) => onChange({ ...value, maxHistoryMessages: Number(v) || 0 })}
      />
      <Field
        label="Max response tokens"
        value={String(value.maxResponseTokens)}
        onChange={(v) => onChange({ ...value, maxResponseTokens: Number(v) || 0 })}
      />
    </Grid>
  );
}

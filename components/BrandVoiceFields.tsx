"use client";

import type { BrandVoice } from "@/lib/config";
import { Field, Grid } from "./FormKit";

export default function BrandVoiceFields({
  value,
  onChange,
}: {
  value: BrandVoice;
  onChange: (v: BrandVoice) => void;
}) {
  const set = <K extends keyof BrandVoice>(k: K, v: BrandVoice[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <>
      <Grid>
        <Field
          label="What does your brand do?"
          value={value.whatYouDo}
          onChange={(v) => set("whatYouDo", v)}
          placeholder="What do you offer? A sentence or two."
          textarea
        />
        <Field
          label="Target audience"
          value={value.targetAudience}
          onChange={(v) => set("targetAudience", v)}
          placeholder="Who is your brand primarily speaking to?"
          textarea
        />
      </Grid>
      <Grid>
        <Field
          label="Customer pain points"
          value={value.painPoints}
          onChange={(v) => set("painPoints", v)}
          placeholder="What problems or frustrations does your audience face?"
          textarea
        />
        <Field
          label="What makes you better than competitors"
          value={value.differentiators}
          onChange={(v) => set("differentiators", v)}
          placeholder="Why should customers choose you over others?"
          textarea
        />
      </Grid>
      <Grid>
        <Field
          label="Brand promise"
          value={value.brandPromise}
          onChange={(v) => set("brandPromise", v)}
          placeholder="Summarize how your brand benefits your audience"
          textarea
        />
        <Field
          label="Brand values"
          value={value.brandValues}
          onChange={(v) => set("brandValues", v)}
          placeholder="What does your brand stand for (or oppose)?"
          textarea
        />
      </Grid>
      <Field
        label="Tone of voice"
        value={value.tone}
        onChange={(v) => set("tone", v)}
        placeholder="e.g. friendly and professional, playful, no-nonsense and direct"
      />
    </>
  );
}

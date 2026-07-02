"use client";

import type { BusinessInfo } from "@/lib/config";
import { Field, Grid } from "./FormKit";

export default function BusinessFields({
  value,
  onChange,
}: {
  value: BusinessInfo;
  onChange: (v: BusinessInfo) => void;
}) {
  const set = <K extends keyof BusinessInfo>(k: K, v: BusinessInfo[K]) =>
    onChange({ ...value, [k]: v });
  const setAddr = <K extends keyof BusinessInfo["address"]>(k: K, v: string) =>
    onChange({ ...value, address: { ...value.address, [k]: v } });

  return (
    <>
      <Grid>
        <Field label="Business name" value={value.name} onChange={(v) => set("name", v)} />
        <Field
          label="Industry"
          value={value.industry}
          onChange={(v) => set("industry", v)}
          placeholder="Residential cleaning, law firm, dental practice…"
        />
        <Field label="Tagline" value={value.tagline} onChange={(v) => set("tagline", v)} />
        <Field
          label="Website"
          value={value.website}
          onChange={(v) => set("website", v)}
          placeholder="https://…"
        />
        <Field label="Phone" value={value.phone} onChange={(v) => set("phone", v)} />
        <Field label="Email" value={value.email} onChange={(v) => set("email", v)} />
      </Grid>
      <Grid>
        <Field label="Street" value={value.address.street} onChange={(v) => setAddr("street", v)} />
        <Field label="City" value={value.address.city} onChange={(v) => setAddr("city", v)} />
        <Field label="State" value={value.address.state} onChange={(v) => setAddr("state", v)} />
        <Field label="ZIP" value={value.address.zip} onChange={(v) => setAddr("zip", v)} />
      </Grid>
      <Field
        label="Directions / access note (optional — parking, suite number, etc.)"
        value={value.address.directionsNote}
        onChange={(v) => setAddr("directionsNote", v)}
        textarea
      />
    </>
  );
}

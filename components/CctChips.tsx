"use client";

import { CCTS, type Cct } from "@/lib/catalogue";

const SWATCH: Record<Cct, string> = {
  warm: "bg-warm-k",
  neutral: "bg-neutral-k",
  cool: "bg-cool-k",
};

export function CctChips({ value, onChange, label }: { value: Cct; onChange: (c: Cct) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={`Colour temperature for ${label}`} className="grid grid-cols-3 gap-2">
      {CCTS.map((c) => {
        const on = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(c.id)}
            className={`chip h-12 min-w-0 justify-start gap-2 pl-1.5 pr-3 text-left transition-colors ${on ? "" : "bg-canvas"}`}
          >
            <span className={`h-9 w-9 shrink-0 rounded-full ${SWATCH[c.id]}`} aria-hidden />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate">{c.label}</span>
              <span className={`text-caption-md tabular-nums ${on ? "text-on-dark-mute" : "text-mute"}`}>{c.kelvin}K</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CctSwatch({ cct }: { cct: Cct }) {
  return <span className={`inline-block h-3 w-3 rounded-full ${SWATCH[cct]}`} aria-hidden />;
}

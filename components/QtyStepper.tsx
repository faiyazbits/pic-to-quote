"use client";

import { useState } from "react";

type Props = {
  value: number;
  onChange: (n: number) => void;
  label: string;
  size?: "md" | "sm";
  /** Stretch to the parent's width. */
  fill?: boolean;
};

export function QtyStepper({ value, onChange, label, size = "md", fill = false }: Props) {
  // Local text only while typing; otherwise always show the stored value.
  const [draft, setDraft] = useState<string | null>(null);

  const h = size === "md" ? "h-11" : "h-10";
  const w = size === "md" ? "w-11" : "w-10";
  const btn = `${h} ${w} grid shrink-0 place-items-center rounded-full text-heading-md leading-none text-ink transition-colors active:bg-secondary-pressed`;

  const commit = () => {
    const n = parseInt(draft ?? "", 10);
    if (!Number.isNaN(n)) onChange(n);
    setDraft(null);
  };

  return (
    <div className={`items-center rounded-full bg-secondary-bg ${h} ${fill ? "flex w-full" : "inline-flex"}`}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} aria-label={`Remove one ${label}`}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        className={`h-full min-w-0 ${fill ? "flex-1" : "w-10"} bg-transparent text-center text-body-strong text-ink tabular-nums outline-none focus:rounded-sm focus:bg-canvas`}
        value={draft ?? String(value)}
        aria-label={`Quantity of ${label}`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        onFocus={(e) => {
          setDraft(String(value));
          e.currentTarget.select();
        }}
      />
      <button type="button" className={btn} onClick={() => onChange(value + 1)} aria-label={`Add one ${label}`}>
        +
      </button>
    </div>
  );
}

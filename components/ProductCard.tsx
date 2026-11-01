"use client";

import type { Product } from "@/lib/catalogue";
import { formatINR } from "@/lib/format";
import type { LineItem } from "@/lib/quote";
import { LitPhoto } from "./LitPhoto";
import { QtyStepper } from "./QtyStepper";

/** Pin-style tile: the photo is the card, metadata sits on it as pills, details below. */
export function ProductCard({ product, lines, onQty, eager = false }: { product: Product; lines: LineItem[]; onQty: (n: number) => void; eager?: boolean }) {
  const qty = lines.reduce((n, l) => n + l.qty, 0);
  const inQuote = qty > 0;

  return (
    <article className="flex h-full flex-col">
      <LitPhoto
        src={product.image}
        alt={product.name}
        cct={inQuote ? lines[0].cct : null}
        sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
        className="aspect-square rounded-md"
        eager={eager}
      >
        <span className="overlay-pill absolute left-2 top-2 tracking-wide">{product.code}</span>
        {inQuote && (
          <span className="overlay-pill absolute bottom-2 left-2 tabular-nums">
            {qty} in quote
          </span>
        )}
      </LitPhoto>

      <div className="flex flex-1 flex-col px-1 pt-2">
        <h2 className="text-body-strong text-ink sm:text-heading-md">{product.name}</h2>
        <p className="mt-0.5 text-body-sm text-mute">{product.specs.slice(0, 3).map((s) => s.value).join(" · ")}</p>
        <p className="mt-1.5 text-body-strong text-ink tabular-nums">
          {formatINR(product.listPrice, { whole: true })}
          <span className="text-body-sm text-mute"> /{product.unit}</span>
        </p>

        <div className="mt-auto pt-3">
          {inQuote ? (
            <QtyStepper value={qty} onChange={onQty} label={product.name} size="sm" fill />
          ) : (
            <button type="button" onClick={() => onQty(1)} className="btn btn-secondary w-full">
              Add to quote
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

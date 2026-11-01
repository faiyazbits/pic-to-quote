"use client";

import { useEffect, useState } from "react";
import { CATALOGUE } from "@/lib/catalogue";
import { addDays, computeTotals, formatQuoteNumber, type LineItem } from "@/lib/quote";
import { DEFAULT_SHOP } from "@/lib/store";
import type { PdfKind } from "@/pdf/generate";
import type { QuoteDoc } from "@/pdf/shared";

/** Dev-only preview of both PDFs with sample data. Not linked from the app. */
const lines: LineItem[] = [
  { productId: "pnl-sq-36", cct: "cool", qty: 24, unitPrice: 1380 },
  { productId: "pnl-sq-36", cct: "warm", qty: 6, unitPrice: 1380 },
  { productId: "pnl-rd-18", cct: "neutral", qty: 40, unitPrice: 690 },
  { productId: "tub-4f-20", cct: "cool", qty: 18, unitPrice: 320 },
  { productId: "str-5m-24", cct: "warm", qty: 5, unitPrice: 1150 },
  { productId: "blb-9w-e27", cct: "warm", qty: 30, unitPrice: 99 },
];

export default function DevPdfPage() {
  const [kind, setKind] = useState<PdfKind>("quotation");
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let revoked: string | null = null;
    (async () => {
      const date = new Date();
      const doc: QuoteDoc = {
        shop: DEFAULT_SHOP,
        customer: { name: "Rohan Mehta", company: "Mehta Interiors", phone: "94470 12345", address: "Plot 7, Panampilly Nagar, Kochi" },
        lines: lines.map((l) => ({ ...l, product: CATALOGUE.find((p) => p.id === l.productId)! })),
        totals: computeTotals(lines, 5),
        discountPct: 5,
        quoteNumber: formatQuoteNumber(1, date),
        date,
        validUntil: addDays(date, 15),
        origin: window.location.origin,
      };
      const { renderPdf } = await import("@/pdf/generate");
      const blob = await renderPdf(kind, doc);
      revoked = URL.createObjectURL(blob);
      setUrl(revoked);
    })();
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [kind]);

  if (process.env.NODE_ENV === "production") return <p className="p-8">Not available.</p>;

  return (
    <div className="flex h-screen flex-col">
      <div className="flex gap-2 p-2">
        {(["quotation", "catalogue"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`chip ${k === kind ? "bg-ink text-on-dark" : ""}`}>
            {k}
          </button>
        ))}
      </div>
      {url ? <iframe src={url} className="flex-1" title="PDF preview" /> : <p className="p-4">Rendering…</p>}
    </div>
  );
}

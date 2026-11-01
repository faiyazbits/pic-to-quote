import type { Cct } from "./catalogue";

export type LineItem = {
  productId: string;
  cct: Cct;
  qty: number;
  /** Quoted Price: unit price in rupees, GST-exclusive. */
  unitPrice: number;
};

export type Totals = {
  subtotal: number;
  discount: number;
  taxable: number;
  gst: number;
  roundOff: number;
  grandTotal: number;
  itemCount: number;
};

export const GST_RATE = 0.18;

export const lineKey = (productId: string, cct: Cct) => `${productId}:${cct}`;

const paise = (n: number) => Math.round(n * 100) / 100;

export function lineAmount(line: LineItem): number {
  return paise(line.qty * line.unitPrice);
}

export function computeTotals(lines: LineItem[], discountPct: number, gstRate = GST_RATE): Totals {
  const pct = Math.min(Math.max(discountPct || 0, 0), 100);
  const subtotal = paise(lines.reduce((sum, l) => sum + lineAmount(l), 0));
  const discount = paise((subtotal * pct) / 100);
  const taxable = paise(subtotal - discount);
  const gst = paise(taxable * gstRate);
  const exact = paise(taxable + gst);
  const grandTotal = Math.round(exact);
  return {
    subtotal,
    discount,
    taxable,
    gst,
    roundOff: paise(grandTotal - exact),
    grandTotal,
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
  };
}

/** Add qty of a product in a colour temperature, merging into an existing Line Item if one exists. */
export function addToLines(lines: LineItem[], productId: string, cct: Cct, qty: number, unitPrice: number): LineItem[] {
  const key = lineKey(productId, cct);
  const existing = lines.find((l) => lineKey(l.productId, l.cct) === key);
  if (existing) {
    return lines.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l));
  }
  return [...lines, { productId, cct, qty, unitPrice }];
}

/**
 * Change a line's colour temperature. If another line already uses that
 * colour for the same product, the two are merged.
 */
export function changeCct(lines: LineItem[], index: number, cct: Cct): LineItem[] {
  const line = lines[index];
  if (!line || line.cct === cct) return lines;
  const clashIndex = lines.findIndex((l, i) => i !== index && l.productId === line.productId && l.cct === cct);
  if (clashIndex === -1) {
    return lines.map((l, i) => (i === index ? { ...l, cct } : l));
  }
  return lines
    .map((l, i) => (i === clashIndex ? { ...l, qty: l.qty + line.qty } : l))
    .filter((_, i) => i !== index);
}

/** Next colour temperature not yet used for this product, or undefined if all are used. */
export function nextUnusedCct(lines: LineItem[], productId: string, order: Cct[] = ["warm", "neutral", "cool"]): Cct | undefined {
  const used = new Set(lines.filter((l) => l.productId === productId).map((l) => l.cct));
  return order.find((c) => !used.has(c));
}

export function formatQuoteNumber(seq: number, date = new Date()): string {
  return `Q-${date.getFullYear()}-${String(seq).padStart(4, "0")}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

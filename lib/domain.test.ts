import { describe, expect, it } from "vitest";
import { addToLines, changeCct, computeTotals, formatQuoteNumber, nextUnusedCct, type LineItem } from "./quote";
import { amountInWords, formatINR, numberToWordsIndian } from "./format";
import { searchProducts } from "./search";
import { CATALOGUE } from "./catalogue";

describe("computeTotals", () => {
  const lines: LineItem[] = [
    { productId: "pnl-sq-36", cct: "cool", qty: 10, unitPrice: 1450 },
    { productId: "blb-9w-e27", cct: "warm", qty: 3, unitPrice: 99 },
  ];

  it("applies discount before GST and rounds the grand total to the rupee", () => {
    const t = computeTotals(lines, 5);
    expect(t.subtotal).toBe(14797);
    expect(t.discount).toBe(739.85);
    expect(t.taxable).toBe(14057.15);
    expect(t.gst).toBe(2530.29);
    expect(t.grandTotal).toBe(16587);
    expect(t.roundOff).toBe(-0.44);
    expect(t.itemCount).toBe(13);
  });

  it("handles no discount and an empty draft", () => {
    expect(computeTotals(lines, 0).discount).toBe(0);
    expect(computeTotals([], 10)).toMatchObject({ subtotal: 0, grandTotal: 0, itemCount: 0 });
  });

  it("clamps silly discounts", () => {
    expect(computeTotals(lines, 150).taxable).toBe(0);
    expect(computeTotals(lines, -5).discount).toBe(0);
  });
});

describe("Line Items by colour temperature", () => {
  it("merges the same product + colour, keeps different colours apart", () => {
    let lines = addToLines([], "pnl-sq-36", "cool", 10, 1450);
    lines = addToLines(lines, "pnl-sq-36", "cool", 2, 1450);
    lines = addToLines(lines, "pnl-sq-36", "warm", 5, 1450);
    expect(lines).toHaveLength(2);
    expect(lines[0].qty).toBe(12);
    expect(lines[1]).toMatchObject({ cct: "warm", qty: 5 });
  });

  it("merges lines when a colour change collides", () => {
    const lines: LineItem[] = [
      { productId: "p", cct: "cool", qty: 10, unitPrice: 1 },
      { productId: "p", cct: "warm", qty: 5, unitPrice: 1 },
    ];
    const out = changeCct(lines, 1, "cool");
    expect(out).toEqual([{ productId: "p", cct: "cool", qty: 15, unitPrice: 1 }]);
    expect(changeCct(lines, 1, "neutral")[1].cct).toBe("neutral");
  });

  it("suggests the next unused colour", () => {
    const lines: LineItem[] = [{ productId: "p", cct: "cool", qty: 1, unitPrice: 1 }];
    expect(nextUnusedCct(lines, "p")).toBe("warm");
    expect(nextUnusedCct([...lines, { productId: "p", cct: "warm", qty: 1, unitPrice: 1 }, { productId: "p", cct: "neutral", qty: 1, unitPrice: 1 }], "p")).toBeUndefined();
  });
});

describe("searchProducts", () => {
  it("shows everything for an empty query", () => {
    expect(searchProducts("  ")).toEqual({ results: CATALOGUE, isFallback: false });
  });

  it("matches product codes case-insensitively, with or without dashes", () => {
    expect(searchProducts("pnl").results.map((p) => p.code)).toEqual(["PNL-SQ-36", "PNL-RD-18"]);
    expect(searchProducts("tub4f").results.map((p) => p.code)).toEqual(["TUB-4F-20"]);
  });

  it("matches description words", () => {
    expect(searchProducts("round panel").results.map((p) => p.code)).toEqual(["PNL-RD-18"]);
    expect(searchProducts("ip65").results.map((p) => p.code)).toEqual(["STR-5M-24"]);
  });

  it("falls back to all products when nothing matches", () => {
    expect(searchProducts("zzz")).toEqual({ results: CATALOGUE, isFallback: true });
  });
});

describe("formatting", () => {
  it("formats rupees in the Indian grouping", () => {
    expect(formatINR(123456.5)).toBe("₹1,23,456.50");
    expect(formatINR(1450, { whole: true })).toBe("₹1,450");
  });

  it("writes amounts in words using lakh and crore", () => {
    expect(numberToWordsIndian(16587)).toBe("Sixteen Thousand Five Hundred Eighty Seven");
    expect(numberToWordsIndian(12_34_567)).toBe("Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven");
    expect(numberToWordsIndian(2_00_00_000)).toBe("Two Crore");
    expect(amountInWords(105)).toBe("Rupees One Hundred Five Only");
  });

  it("formats quote numbers", () => {
    expect(formatQuoteNumber(7, new Date(2026, 10, 1))).toBe("Q-2026-0007");
  });
});

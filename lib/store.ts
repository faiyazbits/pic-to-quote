"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProduct, type Cct } from "./catalogue";
import { addToLines, changeCct, nextUnusedCct, type LineItem } from "./quote";

export type Customer = { name: string; phone: string; company: string; address: string };

export type ShopDetails = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  logo: string | null;
  terms: string;
  validityDays: number;
};

export const DEFAULT_SHOP: ShopDetails = {
  name: "House of LED",
  tagline: "Decorative & LED lighting · Ernakulam | Kondotty",
  address: "S.M, Bava Estate, Jew St, Padma Junction, Kacheripady, Ernakulam, Kerala 682035",
  phone: "+91 96334 47476 / +91 87142 47476",
  email: "",
  gstin: "",
  logo: null,
  terms: [
    "Prices are exclusive of GST, which is charged at 18%.",
    "Delivery within 3–5 working days of order confirmation.",
    "50% advance with order, balance before dispatch.",
    "LED products carry a 2-year manufacturer warranty against defects.",
  ].join("\n"),
  validityDays: 15,
};

const EMPTY_CUSTOMER: Customer = { name: "", phone: "", company: "", address: "" };

type State = {
  lines: LineItem[];
  customer: Customer;
  discountPct: number;
  /** Quote number of the current draft, frozen at first send. */
  quoteSeq: number | null;
  lastSeq: number;
  shop: ShopDetails;
  shopBannerDismissed: boolean;

  setQty: (productId: string, qty: number) => void;
  setLineQty: (index: number, qty: number) => void;
  setLinePrice: (index: number, price: number) => void;
  setLineCct: (index: number, cct: Cct) => void;
  addAnotherColour: (index: number) => void;
  removeLine: (index: number) => void;
  setCustomer: (patch: Partial<Customer>) => void;
  setDiscount: (pct: number) => void;
  ensureQuoteSeq: () => number;
  startNewQuote: () => void;
  setShop: (patch: Partial<ShopDetails>) => void;
  dismissShopBanner: () => void;
};

const clampQty = (n: number) => Math.max(0, Math.min(99999, Math.floor(n || 0)));

export const useQuote = create<State>()(
  persist(
    (set, get) => ({
      lines: [],
      customer: EMPTY_CUSTOMER,
      discountPct: 0,
      quoteSeq: null,
      lastSeq: 0,
      shop: DEFAULT_SHOP,
      shopBannerDismissed: false,

      // Used from the catalogue card: sets the product's total qty. New products start in Cool.
      setQty: (productId, qty) =>
        set(({ lines }) => {
          qty = clampQty(qty);
          const own = lines.filter((l) => l.productId === productId);
          const current = own.reduce((n, l) => n + l.qty, 0);
          if (own.length === 0) {
            const product = getProduct(productId);
            return qty > 0 && product ? { lines: addToLines(lines, productId, "cool", qty, product.listPrice) } : {};
          }
          // Adjust the last line of this product; drop it if it hits zero.
          const last = own[own.length - 1];
          const newLastQty = last.qty + (qty - current);
          if (qty === 0) return { lines: lines.filter((l) => l.productId !== productId) };
          if (newLastQty <= 0) return { lines: lines.filter((l) => l !== last) };
          return { lines: lines.map((l) => (l === last ? { ...l, qty: newLastQty } : l)) };
        }),

      setLineQty: (index, qty) =>
        set(({ lines }) => ({
          lines: clampQty(qty) === 0 ? lines.filter((_, i) => i !== index) : lines.map((l, i) => (i === index ? { ...l, qty: clampQty(qty) } : l)),
        })),

      setLinePrice: (index, price) =>
        set(({ lines }) => ({
          lines: lines.map((l, i) => (i === index ? { ...l, unitPrice: Math.max(0, Math.round((price || 0) * 100) / 100) } : l)),
        })),

      setLineCct: (index, cct) => set(({ lines }) => ({ lines: changeCct(lines, index, cct) })),

      addAnotherColour: (index) =>
        set(({ lines }) => {
          const line = lines[index];
          const cct = line && nextUnusedCct(lines, line.productId);
          if (!line || !cct) return {};
          const copy: LineItem = { ...line, cct, qty: 1 };
          return { lines: [...lines.slice(0, index + 1), copy, ...lines.slice(index + 1)] };
        }),

      removeLine: (index) => set(({ lines }) => ({ lines: lines.filter((_, i) => i !== index) })),

      setCustomer: (patch) => set(({ customer }) => ({ customer: { ...customer, ...patch } })),

      setDiscount: (pct) => set({ discountPct: Math.min(100, Math.max(0, pct || 0)) }),

      ensureQuoteSeq: () => {
        const { quoteSeq, lastSeq } = get();
        if (quoteSeq) return quoteSeq;
        const next = lastSeq + 1;
        set({ quoteSeq: next, lastSeq: next });
        return next;
      },

      startNewQuote: () => set({ lines: [], customer: EMPTY_CUSTOMER, discountPct: 0, quoteSeq: null }),

      setShop: (patch) => set(({ shop }) => ({ shop: { ...shop, ...patch } })),

      dismissShopBanner: () => set({ shopBannerDismissed: true }),
    }),
    {
      name: "pic-to-quote:v1",
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as State;
        // v0 shipped with a made-up demo shop. Swap in the real one unless the owner already renamed it.
        if (version < 1 && state?.shop?.name === "Prakash Lighting House") {
          const { name, tagline, address, phone, email, gstin } = DEFAULT_SHOP;
          return { ...state, shop: { ...state.shop, name, tagline, address, phone, email, gstin } };
        }
        return state;
      },
    },
  ),
);

/** True once the persisted store has loaded from localStorage on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useQuote.persist.onFinishHydration(onChange),
    () => useQuote.persist.hasHydrated(),
    () => false,
  );
}

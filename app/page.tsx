"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppHeader, CloseIcon, GearIcon, IconLink } from "@/components/AppHeader";
import { ProductCard } from "@/components/ProductCard";
import { CATALOGUE } from "@/lib/catalogue";
import { formatINR } from "@/lib/format";
import { computeTotals } from "@/lib/quote";
import { searchProducts } from "@/lib/search";
import { useHydrated, useQuote } from "@/lib/store";

export default function CataloguePage() {
  const hydrated = useHydrated();
  const { lines, shop, setQty, shopBannerDismissed, dismissShopBanner, discountPct } = useQuote();
  const [query, setQuery] = useState("");
  const { results, isFallback } = useMemo(() => searchProducts(query), [query]);
  const totals = computeTotals(lines, discountPct);
  const lineCount = lines.length;

  return (
    <div className="pb-32">
      <AppHeader
        wide
        title={hydrated ? shop.name : " "}
        sub="New quote"
        right={
          <IconLink href="/settings" label="Shop details">
            <GearIcon />
          </IconLink>
        }
      />

      <main className="mx-auto max-w-6xl px-4">
        {hydrated && !shopBannerDismissed && (
          <div className="card-soft mt-4 flex items-center gap-3 p-4">
            <p className="flex-1 text-body-sm text-body">
              <span className="text-body-sm-strong text-ink">Add your shop details</span> so they appear on your PDFs.
            </p>
            <Link href="/settings" className="btn btn-secondary">
              Add
            </Link>
            <button type="button" onClick={dismissShopBanner} className="btn-icon bg-canvas" aria-label="Dismiss">
              <CloseIcon />
            </button>
          </div>
        )}

        <div className="sticky top-[65px] z-10 -mx-4 bg-canvas px-4 pb-3 pt-4">
          <label htmlFor="search" className="sr-only">
            Search products
          </label>
          <div className="relative mx-auto max-w-2xl">
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              id="search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code or name, e.g. PNL or tube"
              className="search-bar"
            />
          </div>
        </div>

        <p className="mb-3 text-body-sm-strong text-ink" aria-live="polite">
          {isFallback ? (
            <>
              No product matches “{query.trim()}”. <span className="font-normal text-mute">Showing all {CATALOGUE.length}.</span>
            </>
          ) : query.trim() ? (
            `${results.length} of ${CATALOGUE.length} products`
          ) : (
            `${CATALOGUE.length} products`
          )}
        </p>

        <ul className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} lines={hydrated ? lines.filter((l) => l.productId === p.id) : []} onQty={(n) => setQty(p.id, n)} eager={i < 4} />
            </li>
          ))}
        </ul>
      </main>

      <QuoteBar count={hydrated ? lineCount : 0} items={totals.itemCount} subtotal={totals.taxable} />
    </div>
  );
}

function QuoteBar({ count, items, subtotal }: { count: number; items: number; subtotal: number }) {
  const empty = count === 0;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {empty ? (
          <p className="py-3.5 text-body-sm text-mute">Add products to start a quote</p>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-caption-md text-mute">
                {count} {count === 1 ? "line" : "lines"} · {items} {items === 1 ? "unit" : "units"}
              </p>
              <p className="text-heading-lg font-bold text-ink tabular-nums">
                {formatINR(subtotal, { whole: true })} <span className="text-caption-md text-mute">+ GST</span>
              </p>
            </div>
            <Link href="/quote" className="btn btn-primary btn-lg">
              Review quote <span aria-hidden>→</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

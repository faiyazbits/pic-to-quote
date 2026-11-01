"use client";

import { useState } from "react";
import { AppHeader, BackIcon, IconLink } from "@/components/AppHeader";
import { useHydrated, useQuote, type ShopDetails } from "@/lib/store";

/** Shrink an uploaded logo to fit within 400px so it stays small in localStorage. */
async function resizeLogo(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export default function SettingsPage() {
  const hydrated = useHydrated();
  const { shop, setShop, dismissShopBanner } = useQuote();
  const [logoError, setLogoError] = useState<string | null>(null);

  if (!hydrated) return <div className="min-h-screen" />;

  const text = (key: keyof ShopDetails, label: string, opts: { type?: string; mono?: boolean; hint?: string } = {}) => (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-body-sm-strong text-ink">{label}</span>
      <input
        type={opts.type ?? "text"}
        value={String(shop[key] ?? "")}
        onChange={(e) => {
          setShop({ [key]: e.target.value } as Partial<ShopDetails>);
          dismissShopBanner();
        }}
        className={`text-input ${opts.mono ? "uppercase tracking-wide" : ""}`}
      />
      {opts.hint && <span className="mt-1.5 block text-body-sm text-mute">{opts.hint}</span>}
    </label>
  );

  return (
    <div className="pb-16">
      <AppHeader
        title="Shop details"
        sub="Printed on every catalogue and quotation"
        left={
          <IconLink href="/" label="Back to catalogue">
            <BackIcon />
          </IconLink>
        }
      />
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pt-6">
        <section aria-labelledby="shop-h" className="card-soft p-4 sm:p-6">
          <h2 id="shop-h" className="mb-4 text-heading-lg text-ink">
            Your shop
          </h2>
          <div className="mb-6 flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-canvas">
              {shop.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo} alt="Shop logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-caption-md text-ash">No logo</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn btn-secondary cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-outer">
                {shop.logo ? "Change logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setShop({ logo: await resizeLogo(file) });
                      setLogoError(null);
                    } catch {
                      setLogoError("That file couldn't be read as an image. Try a PNG or JPG.");
                    }
                  }}
                />
              </label>
              {shop.logo && (
                <button type="button" onClick={() => setShop({ logo: null })} className="btn btn-tertiary text-mute">
                  Remove logo
                </button>
              )}
              {logoError && <span className="w-full text-body-sm text-error">{logoError}</span>}
            </div>
          </div>

          {text("name", "Shop name")}
          {text("tagline", "Tagline")}
          {text("address", "Address")}
          {text("phone", "Phone", { type: "tel" })}
          {text("email", "Email", { type: "email" })}
          {text("gstin", "GSTIN", { mono: true })}
        </section>

        <section aria-labelledby="quote-h" className="card-soft p-4 sm:p-6">
          <h2 id="quote-h" className="mb-4 text-heading-lg text-ink">
            Quotation
          </h2>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-body-sm-strong text-ink">Valid for (days)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={shop.validityDays}
              onChange={(e) => setShop({ validityDays: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="text-input w-24 tabular-nums"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-body-sm-strong text-ink">Terms & conditions</span>
            <textarea
              value={shop.terms}
              onChange={(e) => setShop({ terms: e.target.value })}
              rows={6}
              className="text-input text-body-sm"
            />
            <span className="mt-1.5 block text-body-sm text-mute">One term per line. They’re numbered on the quotation.</span>
          </label>
        </section>

        <p className="text-center text-caption-sm text-mute">Changes save automatically on this device.</p>
      </main>
    </div>
  );
}

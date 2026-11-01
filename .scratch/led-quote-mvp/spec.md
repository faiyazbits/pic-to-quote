# pic-to-quote: LED shop quoting MVP (Next.js)

Status: ready-for-human (built 2026-11-01; WhatsApp share still to be verified on a real phone)

## Context
A demo MVP for a friend's lights/LED shop. The point is to show it to him and turn it into a full project. He (the **Shop Owner**) opens a shared link on his phone and searches the catalogue by code or description. He adds products with quantities, adjusts prices, enters the Customer's name, and generates a **Catalogue PDF** and a **Quotation PDF**. He sends these to his Customers through WhatsApp. The repo is empty (greenfield). The catalogue is 5 demo products with free stock photos.

## Settled decisions (grilling rounds 1–4)
- **Stack**: Next.js (App Router, TS, Tailwind v4). No auth, no DB, no backend. State lives in localStorage through zustand `persist`. Mobile-first. Deploy on Vercel.
- **Catalogue PDF** = brochure: photo, name, code, specs, colour temperature, unit price for each Line Item. It always shows the *quoted* price, so it matches the Quotation.
- **Quotation PDF** = priced table. Header: auto number `Q-2026-0001` (per-device counter, frozen once the draft is first sent), date, valid until (+15 days, from settings), terms from settings, amount in words (Indian lakh/crore).
- **Pricing**: ₹ INR, list prices GST-exclusive. Unit price can be overridden per line. Optional overall discount %. Totals: Subtotal − discount = taxable, then + GST 18%, rounded to the nearest rupee (round-off line shown).
- **Colour temperature**: each line gets a Warm 3000K / Neutral 4000K / Cool 6500K chip (default Cool). **A Line Item = Product + colour temperature + qty.** "Add another colour" splits a product into a second line.
- **Customer**: name required. Phone, company/site and address optional (behind "More details").
- **Shop details**: an editable settings screen (name, address, phone, email, GSTIN, logo upload, terms, validity days). Saved locally and prefilled with a demo shop, "House of LED".
- **Search**: live filter on code and description. If nothing matches, show all 5 with the hint `No product matches "xyz". Showing all 5.`
- **WhatsApp**: on phones, `navigator.share({ files })` attaches the PDF and he picks the chat. If file sharing isn't supported (desktop), download the PDF and open `wa.me/?text=…` with a prefilled message.
- **Flow**: two main screens. Catalogue screen with a sticky quote bar, then the Review & send screen. Settings sits behind a gear icon.

## UX flow
```
/ (Catalogue)                         /quote (Review & send)
┌──────────────────────────┐          ┌──────────────────────────┐
│ House of LED        ⚙    │          │ ← Catalogue   Q-2026-0001│
│ [🔍 Search code or name ]│          │ Customer name*  [      ] │
│ ┌──────┬───────────────┐ │          │ Phone [     ] More ▾     │
│ │photo │2x2 Panel 36W  │ │          │──────────────────────────│
│ │ glow │PNL-SQ-36 (mono│ │          │ 2x2 Panel 36W            │
│ │      │36W·3600lm·IP40│ │          │ [Warm][Neutral][●Cool]   │
│ │      │₹1,450 [− 4 +] │ │          │ − 10 +   ₹1,450 ✎  ₹14,500│
│ └──────┴───────────────┘ │          │ + Add another colour  🗑 │
│  …5 cards                │          │──────────────────────────│
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│          │ Discount [ 5 ]%          │
│ 3 items · ₹4,210 + GST   │          │ Subtotal/Disc/GST/Total  │
│            Review quote →│          │ [Send quotation] (green) │
└──────────────────────────┘          │ [Send catalogue] [⬇ Both]│
                                      └──────────────────────────┘
```
- On a card, "Add" turns into a −/qty/+ stepper. Tapping the number lets him type it (for 50+ units). New lines start as Cool.
- Pressing Send with no customer name scrolls to the field and shows the inline error "Add the customer's name to send".
- After a send: toast "Quotation sent" and a "Start new quote" button, which clears the draft and moves to the next quote number. No quote history in the MVP.
- The first visit shows a dismissible banner: "Add your shop details so they appear on your PDFs" → Settings.
- Empty quote bar copy: "Add products to start a quote".

## Visual direction (frontend-design)
Subject: the counter of an Indian electrical/lighting shop. The design takes its cues from LED product boxes and their spec labels: watts, lumens, Kelvin, IP rating.
- **Palette**: Diffuser `#F4F6F8` (cool panel-white background), Ink `#121A24`, Aluminium `#C5CCD3` (borders), Indicator `#178A4A` (primary actions; the switchboard power LED, which also reads as WhatsApp), Warm-K `#FFB25E`, Cool-K `#CFE2FF`.
- **Type**: Archivo (Expanded width, 700) for product names and the grand total. IBM Plex Sans for body text. IBM Plex Mono for product codes, specs and amounts (spec-label feel). Bundle the TTFs locally so the PDFs use the same faces. **Check that the font has the ₹ glyph** (react-pdf's default Helvetica doesn't). Use Noto Sans as the fallback if Plex lacks it.
- **Signature, the "Kelvin wash"**: the chosen colour temperature tints the product photo with a soft radial glow in that light colour (amber, neutral or icy). Changing the chip makes the light visibly change, like switching a lamp. A thin 3000K→6500K gradient rule is the only other brand mark: under the app header and under the PDF headers. No other decoration. One short crossfade on the chip change, and `prefers-reduced-motion` turns it off.

## Files to create
- `GLOSSARY.md`: Shop Owner, Customer, Product, Product Code, Colour Temperature, Quote Draft, Line Item, List Price / Quoted Price, Catalogue PDF, Quotation PDF, Shop Details. (Written first, as domain-modeling requires.)
- `.scratch/led-quote-mvp/spec.md`: this spec, per `docs/agents/issue-tracker.md`.
- `lib/catalogue.ts`: the 5 Products:
  - PNL-SQ-36: 2x2 ft square panel, 36W, 3600 lm, IP40, ₹1,450
  - PNL-RD-18: 12" round slim panel, 18W, ₹690
  - TUB-4F-20: 4 ft LED tube light, 20W, ₹320
  - STR-5M-24: 5 m LED strip, 24V, IP65, ₹1,150
  - BLB-9W-E27: 9W LED bulb, E27, ₹99 (E27 to match the stock photo)
- `lib/search.ts`: `searchProducts(query) → { results, isFallback }`.
- `lib/quote.ts`: pure functions: `lineKey(productId, cct)`, `computeTotals(lines, discountPct, gstRate)`, `nextQuoteNumber()`.
- `lib/format.ts`: `formatINR` (`Intl` en-IN) and `amountInWords` (lakh/crore).
- `lib/store.ts`: zustand persisted store (draft lines, customer, discount, shop details, quote counter) with a hydration guard to avoid SSR mismatch.
- `lib/share.ts`: `sharePdf(blob, filename, message)`, which uses Web Share with files or falls back to download + wa.me.
- `pdf/CataloguePdf.tsx`, `pdf/QuotationPdf.tsx`: `@react-pdf/renderer`, A4, fonts registered from `public/fonts`. Dynamically imported on click (`pdf(<Doc/>).toBlob()`) to keep it out of SSR and the first load.
- `app/page.tsx` (Catalogue), `app/quote/page.tsx` (Review & send), `app/settings/page.tsx`, plus `components/` (ProductCard, QtyStepper, CctChips, QuoteBar, TotalsBlock).
- `public/products/*.jpg`: 5 free-licence photos from Unsplash or Pexels, found and downloaded at build time. Credits go in `public/products/CREDITS.md`. If a suitable photo can't be found, use a clean SVG product illustration instead.
- The logo upload is resized client-side to about 400px and stored as a data URL.

## Verification
- `vitest` unit tests (TDD) for `computeTotals` (discount → GST → round-off), `amountInWords`, `searchProducts` (matches, case-insensitive codes, fallback), and line splitting by colour temperature.
- `npm run dev`, then drive it in Chrome at 390px width: search "PNL" → 2 results; search "zzz" → fallback hint + 5. Add 3 products, split one into Warm + Cool, override a price, set 5% discount, enter a customer. Generate both PDFs and check the layout, ₹ glyphs, images, totals and amount in words.
- `npm run build` passes. Deploy a Vercel preview and check the WhatsApp share sheet with the PDF attached on a real phone (Android Chrome and iOS Safari).

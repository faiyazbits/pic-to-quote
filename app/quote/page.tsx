"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppHeader, BackIcon, IconLink } from "@/components/AppHeader";
import { CctChips } from "@/components/CctChips";
import { LitPhoto } from "@/components/LitPhoto";
import { QtyStepper } from "@/components/QtyStepper";
import { getProduct } from "@/lib/catalogue";
import { formatDate, formatINR } from "@/lib/format";
import { addDays, computeTotals, formatQuoteNumber, GST_RATE, lineAmount, nextUnusedCct } from "@/lib/quote";
import { downloadPdfs, safeFilePart, sharePdfs } from "@/lib/share";
import { useHydrated, useQuote } from "@/lib/store";
import type { PdfKind } from "@/pdf/generate";
import type { PdfLine, QuoteDoc } from "@/pdf/shared";

type PendingFile = { blob: Blob; filename: string };
type Busy = PdfKind | "both" | null;

export default function QuotePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const s = useQuote();
  const [busy, setBusy] = useState<Busy>(null);
  const [toast, setToast] = useState<{ text: string; offerNew?: boolean } | null>(null);
  const [nameError, setNameError] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pending, setPending] = useState<{ kind: PdfKind; files: PendingFile[]; message: string } | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.offerNew ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!hydrated) return <div className="min-h-screen" />;

  const lines = s.lines;
  const totals = computeTotals(lines, s.discountPct);
  const previewNumber = formatQuoteNumber(s.quoteSeq ?? s.lastSeq + 1);

  if (lines.length === 0) {
    return (
      <div>
        <Header sub="Review & send" />
        <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
          <p className="text-heading-xl text-ink">No products in this quote yet</p>
          <p className="mt-3 max-w-sm text-body-md text-body">Pick panels and lights from the catalogue, then come back here to send.</p>
          <Link href="/" className="btn btn-primary btn-lg mt-8">
            Browse catalogue
          </Link>
        </main>
      </div>
    );
  }

  const buildDoc = (seq: number): QuoteDoc => {
    const now = new Date();
    return {
      shop: s.shop,
      customer: s.customer,
      lines: lines.map((l) => ({ ...l, product: getProduct(l.productId)! })) as PdfLine[],
      totals,
      discountPct: s.discountPct,
      quoteNumber: formatQuoteNumber(seq, now),
      date: now,
      validUntil: addDays(now, s.shop.validityDays || 15),
      origin: window.location.origin,
    };
  };

  const requireName = () => {
    if (s.customer.name.trim()) return true;
    setNameError(true);
    nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    nameRef.current?.focus({ preventScroll: true });
    return false;
  };

  const makeFiles = async (kinds: PdfKind[]): Promise<{ files: PendingFile[]; doc: QuoteDoc }> => {
    const seq = s.ensureQuoteSeq();
    const doc = buildDoc(seq);
    const { renderPdf } = await import("@/pdf/generate");
    const who = safeFilePart(doc.customer.name);
    const files = await Promise.all(
      kinds.map(async (kind) => ({
        blob: await renderPdf(kind, doc),
        filename: `${kind === "quotation" ? "Quotation" : "Catalogue"}-${doc.quoteNumber}-${who}.pdf`,
      })),
    );
    return { files, doc };
  };

  const messageFor = (kind: PdfKind, doc: QuoteDoc) => {
    const hello = `Hello ${doc.customer.name.trim()},`;
    if (kind === "quotation") {
      return `${hello} please find our quotation ${doc.quoteNumber} attached. Total ${formatINR(doc.totals.grandTotal, { whole: true })} incl. GST, valid until ${formatDate(doc.validUntil)}.\n\n${doc.shop.name}\n${doc.shop.phone}`;
    }
    return `${hello} here is the product catalogue for the lights we discussed (ref ${doc.quoteNumber}).\n\n${doc.shop.name}\n${doc.shop.phone}`;
  };

  const finish = (kind: PdfKind, outcome: "shared" | "downloaded" | "cancelled" | "needs-tap", files: PendingFile[], message: string) => {
    const name = kind === "quotation" ? "Quotation" : "Catalogue";
    if (outcome === "needs-tap") {
      setPending({ kind, files, message });
      return;
    }
    setPending(null);
    if (outcome === "shared") setToast({ text: `${name} sent`, offerNew: true });
    if (outcome === "downloaded") setToast({ text: `${name} downloaded. WhatsApp opened to send it.`, offerNew: true });
  };

  const send = async (kind: PdfKind) => {
    if (!requireName()) return;
    setBusy(kind);
    try {
      const { files, doc } = await makeFiles([kind]);
      const message = messageFor(kind, doc);
      const outcome = await sharePdfs(files, message, { whatsappTo: doc.customer.phone });
      finish(kind, outcome, files, message);
    } catch (e) {
      console.error(e);
      setToast({ text: "Couldn't create the PDF. Check your connection and try again." });
    } finally {
      setBusy(null);
    }
  };

  const sendPending = async () => {
    if (!pending) return;
    const outcome = await sharePdfs(pending.files, pending.message, { whatsappTo: s.customer.phone });
    finish(pending.kind, outcome, pending.files, pending.message);
  };

  const downloadBoth = async () => {
    if (!requireName()) return;
    setBusy("both");
    try {
      const { files } = await makeFiles(["quotation", "catalogue"]);
      downloadPdfs(files);
      setToast({ text: "Quotation and catalogue downloaded" });
    } catch (e) {
      console.error(e);
      setToast({ text: "Couldn't create the PDFs. Check your connection and try again." });
    } finally {
      setBusy(null);
    }
  };

  const startNew = () => {
    if (!confirmNew) {
      setConfirmNew(true);
      setTimeout(() => setConfirmNew(false), 4000);
      return;
    }
    s.startNewQuote();
    router.push("/");
  };

  return (
    <div className="pb-40">
      <Header sub={`${previewNumber} · ${s.quoteSeq ? "sent before" : "draft"}`} />

      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pt-6">
        {/* Customer */}
        <section aria-labelledby="customer-h" className="card-soft p-4 sm:p-6">
          <h2 id="customer-h" className="mb-4 text-heading-lg text-ink">
            Customer
          </h2>
          <Field label="Customer name" required error={nameError ? "Add the customer's name to send" : undefined}>
            <input
              ref={nameRef}
              value={s.customer.name}
              onChange={(e) => {
                s.setCustomer({ name: e.target.value });
                if (e.target.value.trim()) setNameError(false);
              }}
              autoComplete="off"
              placeholder="e.g. Mehta Interiors"
              aria-invalid={nameError}
              className="text-input"
            />
          </Field>
          <Field label="WhatsApp / phone">
            <input
              value={s.customer.phone}
              onChange={(e) => s.setCustomer({ phone: e.target.value })}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="94470 12345"
              className="text-input"
            />
          </Field>
          {moreOpen ? (
            <>
              <Field label="Company or site">
                <input value={s.customer.company} onChange={(e) => s.setCustomer({ company: e.target.value })} className="text-input" />
              </Field>
              <Field label="Address">
                <textarea value={s.customer.address} onChange={(e) => s.setCustomer({ address: e.target.value })} rows={2} className="text-input" />
              </Field>
            </>
          ) : (
            <button type="button" onClick={() => setMoreOpen(true)} className="btn btn-secondary">
              + Add company and address
            </button>
          )}
        </section>

        {/* Line items */}
        <section aria-labelledby="items-h">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="items-h" className="text-heading-lg text-ink">
              {lines.length} {lines.length === 1 ? "line" : "lines"}
            </h2>
            <Link href="/" className="btn btn-secondary">
              Add more products
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {lines.map((l, i) => {
              const p = getProduct(l.productId)!;
              const canSplit = !!nextUnusedCct(lines, l.productId);
              const changed = l.unitPrice !== p.listPrice;
              return (
                <li key={`${l.productId}:${l.cct}`} className="card-soft p-3 sm:p-4">
                  <div className="flex gap-3">
                    <LitPhoto src={p.image} alt={p.name} cct={l.cct} sizes="80px" className="h-20 w-20 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-caption-md tracking-wide text-mute">{p.code}</p>
                      <p className="text-body-strong text-ink">{p.name}</p>
                    </div>
                    <p className="shrink-0 pt-0.5 text-right text-body-strong text-ink tabular-nums" aria-label="Line amount">
                      {formatINR(lineAmount(l))}
                    </p>
                  </div>

                  <div className="mt-4">
                    <CctChips value={l.cct} onChange={(c) => s.setLineCct(i, c)} label={p.name} />
                  </div>

                  <div className="mt-4 flex items-end gap-3">
                    <div>
                      <p className="mb-1.5 text-caption-md text-mute">Qty ({p.unit})</p>
                      <QtyStepper value={l.qty} onChange={(n) => s.setLineQty(i, n)} label={p.name} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-caption-md text-mute" htmlFor={`price-${i}`}>
                        Rate {changed && <span className="line-through">{formatINR(p.listPrice, { whole: true })}</span>}
                      </label>
                      <PriceInput id={`price-${i}`} value={l.unitPrice} onChange={(n) => s.setLinePrice(i, n)} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
                    {canSplit && (
                      <button type="button" onClick={() => s.addAnotherColour(i)} className="btn btn-secondary">
                        + Add another colour
                      </button>
                    )}
                    {changed && (
                      <button type="button" onClick={() => s.setLinePrice(i, p.listPrice)} className="btn btn-tertiary">
                        Reset rate
                      </button>
                    )}
                    <button type="button" onClick={() => s.removeLine(i)} className="btn btn-tertiary ml-auto text-error">
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Totals */}
        <section aria-labelledby="totals-h" className="card-soft p-4 sm:p-6">
          <h2 id="totals-h" className="sr-only">
            Totals
          </h2>
          <div className="mb-4 flex items-center justify-between">
            <label htmlFor="discount" className="text-body-strong text-ink">
              Discount
            </label>
            <div className="text-input-group">
              <input
                id="discount"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                value={s.discountPct || ""}
                placeholder="0"
                onChange={(e) => s.setDiscount(parseFloat(e.target.value))}
                className="w-16 px-3 text-right text-body-md text-ink tabular-nums placeholder:text-ash"
              />
              <span className="pr-4 text-mute">%</span>
            </div>
          </div>
          <dl className="space-y-2 border-t border-hairline pt-4 text-body-sm">
            <Row label="Subtotal" value={formatINR(totals.subtotal)} />
            {s.discountPct > 0 && <Row label={`Discount (${s.discountPct}%)`} value={`− ${formatINR(totals.discount)}`} soft />}
            <Row label={`GST @ ${GST_RATE * 100}%`} value={formatINR(totals.gst)} soft />
            {totals.roundOff !== 0 && <Row label="Round off" value={`${totals.roundOff > 0 ? "+" : "−"} ${formatINR(Math.abs(totals.roundOff))}`} soft />}
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
            <span className="text-body-strong text-ink">Grand total</span>
            <span className="text-heading-xl text-ink tabular-nums">{formatINR(totals.grandTotal, { whole: true })}</span>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <button type="button" onClick={downloadBoth} disabled={!!busy} className="btn btn-secondary">
            {busy === "both" ? "Preparing PDFs…" : "Download both PDFs"}
          </button>
          <button type="button" onClick={startNew} className={`btn btn-tertiary ${confirmNew ? "text-error" : "text-mute"}`}>
            {confirmNew ? "Tap again to clear this quote" : "Start new quote"}
          </button>
        </div>
      </main>

      {/* Actions */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        {toast && (
          <div className="mx-auto max-w-2xl px-4 pb-3">
            <div role="status" className="flex items-center justify-between gap-3 rounded-md bg-surface-dark px-4 py-3 text-body-sm text-on-dark">
              <span>{toast.text}</span>
              {toast.offerNew && (
                <button
                  type="button"
                  onClick={() => {
                    s.startNewQuote();
                    router.push("/");
                  }}
                  className="btn shrink-0 bg-canvas text-ink"
                >
                  Start new quote
                </button>
              )}
            </div>
          </div>
        )}
        <div className="border-t border-hairline bg-canvas">
          <div className="mx-auto flex max-w-2xl gap-2 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            {pending ? (
              <button type="button" onClick={sendPending} className="btn btn-primary btn-lg flex-1">
                PDF ready. Tap to share {pending.kind}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => send("catalogue")} disabled={!!busy} className="btn btn-secondary btn-lg flex-1">
                  {busy === "catalogue" ? "Preparing…" : "Send catalogue"}
                </button>
                <button type="button" onClick={() => send("quotation")} disabled={!!busy} className="btn btn-primary btn-lg flex-[1.3]">
                  <WhatsAppIcon />
                  {busy === "quotation" ? "Preparing…" : "Send quotation"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ sub }: { sub: string }) {
  return (
    <AppHeader
      title="Review & send"
      sub={sub}
      left={
        <IconLink href="/" label="Back to catalogue">
          <BackIcon />
        </IconLink>
      }
    />
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-body-sm-strong text-ink">
        {label}
        {required && <span className="font-normal text-mute"> (required)</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-body-sm text-error">{error}</span>}
    </label>
  );
}

function Row({ label, value, soft }: { label: string; value: string; soft?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={soft ? "text-mute" : "text-body"}>{label}</dt>
      <dd className="text-ink tabular-nums">{value}</dd>
    </div>
  );
}

function PriceInput({ id, value, onChange }: { id: string; value: number; onChange: (n: number) => void }) {
  // Local text only while editing; otherwise always show the stored value.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="text-input-group w-32">
      <span className="pl-4 text-mute">₹</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = parseFloat(draft ?? "");
          if (!Number.isNaN(n)) onChange(n);
          setDraft(null);
        }}
        onFocus={(e) => {
          setDraft(String(value));
          e.currentTarget.select();
        }}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="w-full px-2 text-body-md text-ink tabular-nums"
      />
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z" />
    </svg>
  );
}

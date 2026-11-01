import { pdf } from "@react-pdf/renderer";
import { CataloguePdf } from "./CataloguePdf";
import { QuotationPdf } from "./QuotationPdf";
import { registerFonts, type QuoteDoc } from "./shared";

export type PdfKind = "quotation" | "catalogue";

/** Loaded on demand from the review screen so react-pdf stays out of the first page load. */
export async function renderPdf(kind: PdfKind, doc: QuoteDoc): Promise<Blob> {
  registerFonts(doc.origin);
  const element = kind === "quotation" ? <QuotationPdf doc={doc} /> : <CataloguePdf doc={doc} />;
  return pdf(element).toBlob();
}

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { cctInfo } from "@/lib/catalogue";
import { amountInWords, formatDate, formatINR } from "@/lib/format";
import { GST_RATE, lineAmount } from "@/lib/quote";
import { base, C, CctTag, KelvinRule, ShopBlock, type QuoteDoc } from "./shared";

const COL = { n: 22, qty: 50, rate: 78, amount: 88 };

export function QuotationPdf({ doc }: { doc: QuoteDoc }) {
  const { shop, customer, lines, totals, discountPct } = doc;
  const terms = shop.terms.split("\n").map((t) => t.trim()).filter(Boolean);

  const row = (label: string, value: string, opts: { strong?: boolean; soft?: boolean } = {}) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
      <Text style={opts.soft ? base.soft : undefined}>{label}</Text>
      <Text style={[base.mono, opts.strong ? { fontWeight: 500 } : {}]}>{value}</Text>
    </View>
  );

  return (
    <Document title={`Quotation ${doc.quoteNumber}`} author={shop.name}>
      <Page size="A4" style={base.page}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <ShopBlock shop={shop} />
          <View style={{ alignItems: "flex-end", gap: 3 }}>
            <Text style={[base.display, { fontSize: 20, letterSpacing: 1 }]}>QUOTATION</Text>
            <Meta label="No." value={doc.quoteNumber} />
            <Meta label="Date" value={formatDate(doc.date)} />
            <Meta label="Valid until" value={formatDate(doc.validUntil)} />
          </View>
        </View>
        <KelvinRule />

        {/* Customer */}
        <View style={{ marginTop: 14, marginBottom: 14, padding: 10, backgroundColor: C.diffuser, borderRadius: 4 }}>
          <Text style={[base.soft, { fontSize: 7.5, letterSpacing: 0.6, marginBottom: 3 }]}>QUOTATION FOR</Text>
          <Text style={{ fontSize: 11, fontWeight: 600 }}>{customer.name}</Text>
          {customer.company ? <Text>{customer.company}</Text> : null}
          {customer.address ? <Text style={base.soft}>{customer.address}</Text> : null}
          {customer.phone ? <Text style={[base.soft, base.mono, { fontSize: 8.5 }]}>{customer.phone}</Text> : null}
        </View>

        {/* Line items */}
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.ink, paddingBottom: 4, fontSize: 7.5, color: C.inkSoft }}>
          <Text style={{ width: COL.n }}>#</Text>
          <Text style={{ flex: 1 }}>ITEM</Text>
          <Text style={{ width: COL.qty, textAlign: "right" }}>QTY</Text>
          <Text style={{ width: COL.rate, textAlign: "right" }}>RATE (₹)</Text>
          <Text style={{ width: COL.amount, textAlign: "right" }}>AMOUNT (₹)</Text>
        </View>
        {lines.map((l, i) => {
          const k = cctInfo(l.cct);
          const changed = l.unitPrice !== l.product.listPrice;
          return (
            <View
              key={`${l.productId}-${l.cct}`}
              wrap={false}
              style={{ flexDirection: "row", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: C.hairline, alignItems: "flex-start" }}
            >
              <Text style={[base.mono, base.soft, { width: COL.n }]}>{i + 1}</Text>
              <View style={{ flex: 1, gap: 2, paddingRight: 8 }}>
                <Text style={{ fontWeight: 600 }}>{l.product.name}</Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={[base.mono, base.soft, { fontSize: 7.5 }]}>{l.product.code}</Text>
                  <CctTag cct={l.cct} kelvin={k.kelvin} label={k.label} />
                </View>
              </View>
              <Text style={[base.mono, { width: COL.qty, textAlign: "right" }]}>
                {l.qty} <Text style={[base.soft, { fontSize: 7 }]}>{l.product.unit}</Text>
              </Text>
              <View style={{ width: COL.rate, alignItems: "flex-end" }}>
                <Text style={base.mono}>{formatINR(l.unitPrice, { symbol: false })}</Text>
                {changed && (
                  <Text style={[base.mono, base.soft, { fontSize: 7, textDecoration: "line-through" }]}>
                    {formatINR(l.product.listPrice, { symbol: false })}
                  </Text>
                )}
              </View>
              <Text style={[base.mono, { width: COL.amount, textAlign: "right" }]}>{formatINR(lineAmount(l), { symbol: false })}</Text>
            </View>
          );
        })}

        {/* Totals */}
        <View wrap={false} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 24 }}>
          <View style={{ flex: 1, paddingTop: 4 }}>
            <Text style={[base.soft, { fontSize: 7.5, letterSpacing: 0.6, marginBottom: 3 }]}>AMOUNT IN WORDS</Text>
            <Text style={{ fontWeight: 500, lineHeight: 1.4 }}>{amountInWords(totals.grandTotal)}</Text>
          </View>
          <View style={{ width: 220 }}>
            {row("Subtotal", formatINR(totals.subtotal))}
            {discountPct > 0 && row(`Discount (${discountPct}%)`, `− ${formatINR(totals.discount)}`, { soft: true })}
            {discountPct > 0 && row("Taxable value", formatINR(totals.taxable))}
            {row(`GST @ ${GST_RATE * 100}%`, formatINR(totals.gst), { soft: true })}
            {totals.roundOff !== 0 && row("Round off", `${totals.roundOff > 0 ? "+" : "−"} ${formatINR(Math.abs(totals.roundOff))}`, { soft: true })}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: C.ink, marginTop: 4, paddingTop: 6 }}
            >
              <Text style={{ fontWeight: 600 }}>Grand total</Text>
              <Text style={[base.display, { fontSize: 15 }]}>{formatINR(totals.grandTotal, { whole: true })}</Text>
            </View>
          </View>
        </View>

        {/* Terms + signature */}
        <View wrap={false} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 28, gap: 24 }}>
          <View style={{ flex: 1 }}>
            {terms.length > 0 && (
              <>
                <Text style={[base.soft, { fontSize: 7.5, letterSpacing: 0.6, marginBottom: 4 }]}>TERMS & CONDITIONS</Text>
                {terms.map((t, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: 2.5 }}>
                    <Text style={[base.mono, base.soft, { width: 12, fontSize: 8 }]}>{i + 1}.</Text>
                    <Text style={{ flex: 1, fontSize: 8, lineHeight: 1.35 }}>{t}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
          <View style={{ width: 170, alignItems: "flex-end", justifyContent: "flex-end" }}>
            <Text style={{ fontSize: 8.5 }}>For {shop.name}</Text>
            <View style={{ height: 36 }} />
            <Text style={[base.soft, { fontSize: 8, borderTopWidth: 0.5, borderTopColor: C.aluminium, paddingTop: 3, width: 140, textAlign: "right" }]}>
              Authorised signatory
            </Text>
          </View>
        </View>

        <View style={base.footer} fixed>
          <Text>This is a computer-generated quotation.</Text>
          <Text render={({ pageNumber, totalPages }) => `${doc.quoteNumber} · ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ fontSize: 8.5 }}>
      <Text style={base.soft}>{label} </Text>
      <Text style={base.mono}>{value}</Text>
    </Text>
  );
}

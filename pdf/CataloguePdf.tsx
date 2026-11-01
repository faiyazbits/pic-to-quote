import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { cctInfo } from "@/lib/catalogue";
import { formatDate, formatINR } from "@/lib/format";
import { base, C, CctTag, KelvinRule, ShopBlock, type QuoteDoc } from "./shared";

const WASH = { warm: "#FF9A3C", neutral: "#FFE6C4", cool: "#8FBFFF" } as const;

export function CataloguePdf({ doc }: { doc: QuoteDoc }) {
  const { shop, customer, lines, origin } = doc;
  const forWhom = [customer.name, customer.company].filter(Boolean).join(", ");

  return (
    <Document title={`Catalogue for ${customer.name}`} author={shop.name}>
      <Page size="A4" style={base.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
          <ShopBlock shop={shop} compact />
          <View style={{ alignItems: "flex-end", gap: 2 }}>
            <Text style={[base.display, { fontSize: 18 }]}>Product catalogue</Text>
            <Text style={base.soft}>
              Prepared for {forWhom} · {formatDate(doc.date)}
            </Text>
          </View>
        </View>
        <KelvinRule />

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 18, rowGap: 14 }}>
          {lines.map((l) => {
            const k = cctInfo(l.cct);
            return (
              <View
                key={`${l.productId}-${l.cct}`}
                wrap={false}
                style={{ width: 250, borderWidth: 0.75, borderColor: C.hairline, borderRadius: 6, overflow: "hidden" }}
              >
                <View style={{ width: 250, height: 118, position: "relative" }}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={`${origin}${l.product.image}`} style={{ width: 250, height: 118, objectFit: "cover" }} />
                  {/* Kelvin wash: tint the photo in the chosen colour temperature */}
                  <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: WASH[l.cct], opacity: 0.22 }} />
                </View>
                <View style={{ height: 3, backgroundColor: l.cct === "warm" ? C.warm : l.cct === "neutral" ? "#FFE3BD" : C.cool }} />
                <View style={{ padding: 9, gap: 4 }}>
                  <Text style={[base.mono, base.soft, { fontSize: 7.5, letterSpacing: 0.4 }]}>{l.product.code}</Text>
                  <Text style={[base.display, { fontSize: 11.5 }]}>{l.product.name}</Text>
                  <CctTag cct={l.cct} kelvin={k.kelvin} label={k.label} />
                  <Text style={[base.soft, { fontSize: 8, lineHeight: 1.35 }]}>{l.product.description}</Text>

                  <View style={{ borderTopWidth: 0.5, borderTopColor: C.hairline, marginTop: 2 }}>
                    {l.product.specs.map((s) => (
                      <View
                        key={s.label}
                        style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: C.hairline }}
                      >
                        <Text style={[base.soft, { fontSize: 8 }]}>{s.label}</Text>
                        <Text style={[base.mono, { fontSize: 8 }]}>{s.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 }}>
                    <Text style={[base.mono, { fontSize: 13, fontWeight: 500 }]}>
                      {formatINR(l.unitPrice, { whole: Number.isInteger(l.unitPrice) })}
                      <Text style={[base.soft, { fontFamily: "Plex", fontSize: 8, fontWeight: 400 }]}> /{l.product.unit}</Text>
                    </Text>
                    <Text style={[base.soft, { fontSize: 7.5 }]}>excl. GST</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={base.footer} fixed>
          <Text>
            {shop.name} · {[shop.phone, shop.email].filter(Boolean).join(" · ")}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Ref ${doc.quoteNumber} · ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

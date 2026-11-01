import { Defs, Font, LinearGradient, Rect, Stop, Svg, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import type { Cct, Product } from "@/lib/catalogue";
import type { LineItem, Totals } from "@/lib/quote";
import type { Customer, ShopDetails } from "@/lib/store";

export type PdfLine = LineItem & { product: Product };

export type QuoteDoc = {
  shop: ShopDetails;
  customer: Customer;
  lines: PdfLine[];
  totals: Totals;
  discountPct: number;
  quoteNumber: string;
  date: Date;
  validUntil: Date;
  /** Absolute origin, used to resolve /products/*.jpg for the PDF renderer. */
  origin: string;
};

let registered = false;
export function registerFonts(origin: string) {
  if (registered) return;
  const f = (file: string) => `${origin}/fonts/${file}`;
  Font.register({ family: "Archivo", fonts: [{ src: f("ArchivoExpanded-Bold.ttf"), fontWeight: 700 }] });
  Font.register({
    family: "Plex",
    fonts: [
      { src: f("IBMPlexSans-Regular.woff"), fontWeight: 400 },
      { src: f("IBMPlexSans-Medium.woff"), fontWeight: 500 },
      { src: f("IBMPlexSans-SemiBold.woff"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: "PlexMono",
    fonts: [
      { src: f("IBMPlexMono-Regular.woff"), fontWeight: 400 },
      { src: f("IBMPlexMono-Medium.woff"), fontWeight: 500 },
    ],
  });
  // Never hyphenate product names or codes.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

export const C = {
  ink: "#121A24",
  inkSoft: "#4A5562",
  hairline: "#DFE4E9",
  aluminium: "#C5CCD3",
  diffuser: "#F4F6F8",
  indicator: "#178A4A",
  warm: "#FFB25E",
  neutral: "#FFF1DC",
  cool: "#CFE2FF",
};

export const CCT_FILL: Record<Cct, string> = { warm: C.warm, neutral: C.neutral, cool: C.cool };

export const base = StyleSheet.create({
  page: { fontFamily: "Plex", fontSize: 9, color: C.ink, paddingTop: 36, paddingBottom: 56, paddingHorizontal: 40 },
  mono: { fontFamily: "PlexMono" },
  display: { fontFamily: "Archivo", fontWeight: 700 },
  soft: { color: C.inkSoft },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: C.inkSoft,
    borderTopWidth: 0.5,
    borderTopColor: C.hairline,
    paddingTop: 6,
  },
});

/** The 3000K → 6500K rule: the brand's only ornament. */
export function KelvinRule({ width = 515, height = 3 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="k" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFB25E" />
          <Stop offset="0.35" stopColor="#FFE3BD" />
          <Stop offset="0.5" stopColor="#FFF6EA" />
          <Stop offset="0.65" stopColor="#E6EFFF" />
          <Stop offset="1" stopColor="#CFE2FF" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#k)" />
    </Svg>
  );
}

export function ShopBlock({ shop, compact = false }: { shop: ShopDetails; compact?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", maxWidth: 300 }}>
      {shop.logo && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={shop.logo} style={{ width: 44, height: 44, objectFit: "contain" }} />
      )}
      <View style={{ gap: 2 }}>
        <Text style={[base.display, { fontSize: compact ? 13 : 15 }]}>{shop.name}</Text>
        {shop.tagline ? <Text style={base.soft}>{shop.tagline}</Text> : null}
        {!compact && (
          <>
            {shop.address ? <Text style={[base.soft, { marginTop: 3 }]}>{shop.address}</Text> : null}
            <Text style={base.soft}>{[shop.phone, shop.email].filter(Boolean).join("  ·  ")}</Text>
            {shop.gstin ? <Text style={[base.soft, base.mono, { fontSize: 8 }]}>GSTIN {shop.gstin}</Text> : null}
          </>
        )}
      </View>
    </View>
  );
}

export function CctTag({ cct, kelvin, label }: { cct: Cct; kelvin: number; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: CCT_FILL[cct], borderWidth: 0.5, borderColor: "#00000025" }} />
      <Text style={[base.soft, { fontSize: 8 }]}>
        {label} white · <Text style={base.mono}>{kelvin}K</Text>
      </Text>
    </View>
  );
}

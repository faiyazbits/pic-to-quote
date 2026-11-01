export type Spec = { label: string; value: string };

export type Product = {
  id: string;
  code: string;
  name: string;
  category: "Panel" | "Tube light" | "Strip" | "Bulb";
  description: string;
  specs: Spec[];
  /** List Price in rupees, GST-exclusive. */
  listPrice: number;
  unit: string;
  image: string;
};

export const CATALOGUE: Product[] = [
  {
    id: "pnl-sq-36",
    code: "PNL-SQ-36",
    name: "2×2 ft Square LED Panel",
    category: "Panel",
    description: "Recessed 600×600 mm back-lit panel for false ceilings, offices and showrooms.",
    specs: [
      { label: "Power", value: "36W" },
      { label: "Output", value: "3600 lm" },
      { label: "Size", value: "600×600 mm" },
      { label: "Rating", value: "IP40" },
    ],
    listPrice: 1450,
    unit: "pc",
    image: "/products/pnl-sq-36.jpg",
  },
  {
    id: "pnl-rd-18",
    code: "PNL-RD-18",
    name: "12\" Round Slim Panel",
    category: "Panel",
    description: "Slim round recessed downlight panel for homes, corridors and lobbies.",
    specs: [
      { label: "Power", value: "18W" },
      { label: "Output", value: "1800 lm" },
      { label: "Cut-out", value: "Ø 225 mm" },
      { label: "Rating", value: "IP20" },
    ],
    listPrice: 690,
    unit: "pc",
    image: "/products/pnl-rd-18.jpg",
  },
  {
    id: "tub-4f-20",
    code: "TUB-4F-20",
    name: "4 ft LED Tube Light",
    category: "Tube light",
    description: "T5 batten with integrated driver, a direct swap for old fluorescent tubes.",
    specs: [
      { label: "Power", value: "20W" },
      { label: "Output", value: "2000 lm" },
      { label: "Length", value: "1200 mm" },
      { label: "Life", value: "25,000 h" },
    ],
    listPrice: 320,
    unit: "pc",
    image: "/products/tub-4f-20.jpg",
  },
  {
    id: "str-5m-24",
    code: "STR-5M-24",
    name: "5 m LED Strip, 24V",
    category: "Strip",
    description: "Flexible silicone-coated strip for coves, profiles and under-cabinet lighting.",
    specs: [
      { label: "Power", value: "14.4W/m" },
      { label: "LEDs", value: "120/m" },
      { label: "Voltage", value: "24V DC" },
      { label: "Rating", value: "IP65" },
    ],
    listPrice: 1150,
    unit: "roll",
    image: "/products/str-5m-24.jpg",
  },
  {
    id: "blb-9w-e27",
    code: "BLB-9W-E27",
    name: "9W LED Bulb",
    category: "Bulb",
    description: "Everyday A60 bulb with a wide-angle diffuser, replaces a 60W incandescent.",
    specs: [
      { label: "Power", value: "9W" },
      { label: "Output", value: "900 lm" },
      { label: "Base", value: "E27" },
      { label: "Life", value: "15,000 h" },
    ],
    listPrice: 99,
    unit: "pc",
    image: "/products/blb-9w-e27.jpg",
  },
];

export function getProduct(id: string): Product | undefined {
  return CATALOGUE.find((p) => p.id === id);
}

export type Cct = "warm" | "neutral" | "cool";

export const CCTS: { id: Cct; label: string; kelvin: number }[] = [
  { id: "warm", label: "Warm", kelvin: 3000 },
  { id: "neutral", label: "Neutral", kelvin: 4000 },
  { id: "cool", label: "Cool", kelvin: 6500 },
];

export function cctInfo(cct: Cct) {
  return CCTS.find((c) => c.id === cct)!;
}

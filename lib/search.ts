import { CATALOGUE, type Product } from "./catalogue";

export type SearchResult = { results: Product[]; isFallback: boolean };

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Match every query word against code, name, description and specs.
 * When nothing matches, return the whole catalogue so the Shop Owner is never stuck.
 */
export function searchProducts(query: string, catalogue: Product[] = CATALOGUE): SearchResult {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return { results: catalogue, isFallback: false };

  const results = catalogue.filter((p) => {
    const haystack = normalise(
      [p.code, p.code.replace(/-/g, ""), p.name, p.category, p.description, ...p.specs.map((s) => s.value)].join(" "),
    );
    return words.every((w) => haystack.includes(w));
  });

  return results.length > 0 ? { results, isFallback: false } : { results: catalogue, isFallback: true };
}

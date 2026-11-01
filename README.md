# pic-to-quote

Quote builder MVP for a lighting/LED shop. The Shop Owner searches the catalogue, picks products, quantities and colour temperatures, then sends a **Catalogue PDF** and a **Quotation PDF** to the Customer on WhatsApp. Vocabulary is in [GLOSSARY.md](GLOSSARY.md); the spec is in [.scratch/led-quote-mvp/spec.md](.scratch/led-quote-mvp/spec.md).

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # quote maths, search, Indian number formatting
npm run build
```

- No backend: everything (quote draft, shop details, quote counter) lives in the browser's localStorage.
- PDFs are generated in the browser with `@react-pdf/renderer` (`pdf/`), loaded only when sending.
- On phones, Send opens the share sheet with the PDF attached (pick WhatsApp). On desktop it downloads the PDF and opens WhatsApp Web with a prefilled message.
- `/dev-pdf` previews both PDFs with sample data (development only).
- The catalogue is hard-coded in `lib/catalogue.ts` (5 demo products).

Deploy: push to GitHub and import into Vercel (zero config). The Web Share file attachment needs HTTPS, so test sending on a phone against the Vercel URL.

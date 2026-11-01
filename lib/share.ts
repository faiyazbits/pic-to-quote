"use client";

/** "needs-tap": the browser wants a fresh tap before sharing (iOS after a slow PDF render). */
export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "needs-tap";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** wa.me only accepts digits with country code; assume India for 10-digit numbers. */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Phones: open the share sheet with the PDF(s) attached, so he can pick WhatsApp.
 * Elsewhere: download the PDF(s) and open WhatsApp with a prefilled message.
 */
export async function sharePdfs(
  files: { blob: Blob; filename: string }[],
  message: string,
  opts: { whatsappTo?: string; fallbackToWhatsApp?: boolean } = {},
): Promise<ShareOutcome> {
  const fileObjs = files.map((f) => new File([f.blob], f.filename, { type: "application/pdf" }));

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: fileObjs })) {
    try {
      await navigator.share({ files: fileObjs, text: message });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      if (err instanceof DOMException && err.name === "NotAllowedError") return "needs-tap";
      // Fall through to the download path for any other share failure.
    }
  }

  files.forEach((f) => download(f.blob, f.filename));
  if (opts.fallbackToWhatsApp !== false) {
    const to = opts.whatsappTo ? waNumber(opts.whatsappTo) : "";
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }
  return "downloaded";
}

export function downloadPdfs(files: { blob: Blob; filename: string }[]) {
  files.forEach((f) => download(f.blob, f.filename));
}

export function safeFilePart(s: string): string {
  return s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "Customer";
}

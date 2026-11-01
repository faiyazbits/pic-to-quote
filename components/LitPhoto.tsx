import Image from "next/image";
import type { ReactNode } from "react";
import type { Cct } from "@/lib/catalogue";

/** Product photo with the Kelvin wash: lit in the chosen colour temperature, unlit when cct is null. */
export function LitPhoto({
  src,
  alt,
  cct,
  sizes,
  className = "",
  eager = false,
  children,
}: {
  src: string;
  alt: string;
  cct: Cct | null;
  sizes: string;
  className?: string;
  eager?: boolean;
  /** Overlay pills anchored on the photo. */
  children?: ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface-card ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className={`object-cover transition-[filter] duration-300 ${cct ? "brightness-110 saturate-[0.9]" : "brightness-[0.8] saturate-[0.6]"}`}
      />
      <div className="kelvin-wash" data-cct={cct ?? "cool"} data-on={cct ? "true" : "false"} />
      {children}
    </div>
  );
}

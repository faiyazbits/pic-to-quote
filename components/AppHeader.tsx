import Link from "next/link";
import type { ReactNode } from "react";

export function AppHeader({
  title,
  sub,
  left,
  right,
  wide = false,
}: {
  title: string;
  sub?: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Match the wider catalogue grid instead of the form column. */
  wide?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas">
      <div className={`mx-auto flex h-16 items-center gap-3 px-4 ${wide ? "max-w-6xl" : "max-w-2xl"}`}>
        {left}
        <div className="min-w-0 flex-1">
          <p className="truncate text-heading-md text-ink">{title}</p>
          {sub && <p className="truncate text-caption-md text-mute">{sub}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="btn-icon">
      {children}
    </Link>
  );
}

export const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

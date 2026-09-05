import Link from "next/link";

/**
 * Three pictograms that spell the game, in the manner of the Love, Death & Robots
 * and Noun Project marks: a circle (the people in the room), an X (the vote on a
 * ballot), and three bars (the Feud board). Always monochrome; inherits currentColor.
 */
export function LogoMark({ size = 22, gap = 6, className = "" }: { size?: number; gap?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="currentColor">
        <circle cx="14" cy="14" r="11" />
      </svg>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="square">
        <path d="M6 6 22 22M22 6 6 22" />
      </svg>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="currentColor">
        <rect x="2" y="4" width="24" height="5.5" rx="1" />
        <rect x="2" y="11.25" width="17" height="5.5" rx="1" />
        <rect x="2" y="18.5" width="10" height="5.5" rx="1" />
      </svg>
    </span>
  );
}

/** Full lockup: mark + name. Links home. */
export function Logo({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center no-underline hover:no-underline text-text ${className}`} style={{ gap: size * 0.6 }}>
      <LogoMark size={size} gap={Math.round(size * 0.28)} />
      <span className="font-semibold tracking-[-0.03em] leading-none" style={{ fontSize: size * 1.25 }}>
        FeudyPoll
      </span>
    </Link>
  );
}

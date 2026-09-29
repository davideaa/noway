/** Tre barre inclinate (skewY -12deg): SEGNAPOSTO, il logo lo decide Davide. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" fill="currentColor">
      <g transform="skewY(-12) translate(0 3)">
        <rect x="3" y="12" width="4" height="12" rx="1" />
        <rect x="12" y="7" width="4" height="17" rx="1" />
        <rect x="21" y="2" width="4" height="22" rx="1" />
      </g>
    </svg>
  );
}

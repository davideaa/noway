/**
 * Marchio "Profondita'" (concept B, assets/logo/b-profondita-mono.svg): tre
 * traiettorie che convergono. Inline e monocromatico: prende il colore dal
 * contesto (currentColor). Decorativo: il nome accanto lo descrive.
 */
export function BrandMark({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3 4.8 L27 7.7 L27 8.9 L3 9.2 Z M3 13.8 L27 10.86 L27 12.06 L3 18.2 Z M3 22.8 L27 14.02 L27 15.22 L3 27.2 Z"
      />
    </svg>
  );
}

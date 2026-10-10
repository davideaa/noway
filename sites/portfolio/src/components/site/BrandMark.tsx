import mark from "./logo-mark.png";

/**
 * Il marchio di Davide (assets/logo/logo-davide-originale.webp): tre pannelli
 * con candele, onde e mappa del mondo, in lime su trasparente. Qui solo il
 * simbolo: la scritta del file originale dice "PORTOFOLIO" (refuso), il nome
 * accanto lo scrive il sito. Decorativo: il nome accanto lo descrive.
 */
export function BrandMark({ className = "", size = 38 }: { className?: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- esportazione statica, immagine gia' ridotta (148x192)
    <img
      className={className}
      src={mark.src}
      width={Math.round((size * mark.width) / mark.height)}
      height={size}
      alt=""
      aria-hidden="true"
      decoding="async"
    />
  );
}

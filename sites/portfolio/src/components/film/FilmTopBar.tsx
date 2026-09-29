import Link from "next/link";
import { PauseButton } from "@/components/motion/PauseButton";
import { BrandMark } from "@/components/site/BrandMark";
import { EMAIL_SHOWN, MAILTO_LOWER, SITE_NAME } from "@/lib/site";

/** Barra alta del film: marchio, link ai dettagli, email, pausa. Nient'altro. */
export function FilmTopBar() {
  return (
    <header className="film-top">
      <div className="wrap flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-3 text-acc" aria-label={`${SITE_NAME}, inizio`}>
          <BrandMark />
          <span className="hidden text-sm font-semibold tracking-tight text-ink sm:block">{SITE_NAME}</span>
        </Link>
        <nav aria-label="Pagine" className="ml-auto flex items-center gap-2 sm:gap-3">
          <PauseButton className="film-top__pause" />
          <Link href="/dettagli" className="film-top__link">
            Dettagli
          </Link>
          <a href={MAILTO_LOWER} className="film-top__link" aria-label={`Scrivi via email a ${EMAIL_SHOWN}`}>
            Scrivi via email
          </a>
        </nav>
      </div>
    </header>
  );
}

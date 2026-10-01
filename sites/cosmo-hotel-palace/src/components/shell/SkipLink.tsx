/*
 * Skip link «Vai al contenuto» (UX 3.1, 12): il PRIMO elemento tabulabile della pagina.
 * Sta nel layout, prima dell'header. L'aspetto (nascosto fino al focus) è la classe `.skip-link`
 * di globals.css. La destinazione è `<main id="contenuto" tabIndex={-1}>` del layout: il focus
 * passa lì, quindi il Tab successivo parte dal contenuto.
 */
import { copy } from "@/content/copy"

export const MAIN_ID = "contenuto"

export function SkipLink() {
  return (
    <a className="skip-link" href={`#${MAIN_ID}`}>
      {copy.sito.skipLink}
    </a>
  )
}

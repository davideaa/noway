/*
 * 404 (COPY 13, UX 2.1). Con `output: 'export'` Next la scrive come out/404.html.
 * Una sola azione principale: «Cerca disponibilità» (miele, porta a /prenota/ o apre il pannello);
 * «Torna alla home» è la secondaria. Il layout mette già header, footer e barra di prenotazione.
 * Il h1 è unico; le pagine non rendono un secondo <main> (c'è quello del layout).
 */
import type { Metadata } from "next"
import Link from "next/link"
import { BookLink } from "@/components/shell/BookLink"
import { Button } from "@/components/ui/button"
import { copy } from "@/content/copy"
import { copyShell } from "@/content/copy-shell"

export const metadata: Metadata = {
  // Next aggiunge da solo `noindex` alla 404
  title: copy.servizio.paginaNonTrovata.h1,
}

export default function NotFound() {
  const p = copy.servizio.paginaNonTrovata
  return (
    <div className="wrap section-y">
      <p className="t-label text-(--text-muted)">{copyShell.eyebrow404}</p>
      <h1 className="mt-(--s-3)">{p.h1}</h1>
      <p className="t-lead mt-(--s-4)">{p.corpo}</p>
      <div className="mt-(--s-6) flex flex-col gap-3 sm:flex-row">
        <BookLink variant="action" size="md" focusRing="double">
          {p.cerca}
        </BookLink>
        <Button asChild variant="outline" size="md">
          <Link href="/">{p.home}</Link>
        </Button>
      </div>
    </div>
  )
}

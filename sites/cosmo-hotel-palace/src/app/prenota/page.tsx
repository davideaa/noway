/*
 * /prenota/ (UX 6, COPY 4). Pagina server: testi e struttura; i campi sono componenti client.
 * Il modulo è lo stesso del foglio (BookingForm) ma in pagina. Senza JavaScript il pulsante è già
 * un link al motore (href = link base nell'HTML statico) e c'è l'alternativa umana: telefono ed email.
 *
 * Il <BookingProvider> qui sotto non fa nulla se il layout ne monta già uno (provider annidati
 * passano i figli); serve perché la pagina funzioni anche da sola.
 */
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { BookingForm, BookingNotes, SearchFeedback, SearchLink } from "@/components/booking/BookingForm"
import { BookingProvider } from "@/components/booking/BookingProvider"
import { centralino } from "@/content/contacts"
import { copy, copyPrenotazione } from "@/content/copy"
import { ENGINE_BASE } from "@/lib/booking/config"

export const metadata: Metadata = {
  // il titolo di COPY 14 contiene già il nome dell'hotel: niente suffisso del layout
  title: { absolute: copy.meta.prenota.title },
  description: copy.meta.prenota.description,
}

export default function PrenotaPage() {
  const p = copy.prenota
  return (
    <div className="wrap section-y">
      <div className="grid gap-x-(--gutter) gap-y-(--s-7) lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1>{p.pagina.h1}</h1>
          <p className="t-lead mt-(--s-4)">{p.pagina.sottotitolo}</p>

          <div className="mt-(--s-6) rounded-(--r-3) border border-(--border) bg-(--bg) p-(--s-4) sm:p-(--s-5)">
            <BookingProvider>
              <BookingForm idPrefix="page" layout="stack">
                <div className="flex flex-col gap-3">
                  <SearchLink idPrefix="page" full />
                  <SearchFeedback />
                </div>
              </BookingForm>
              <BookingNotes className="mt-(--s-5)" />
            </BookingProvider>
          </div>

          {/* Senza JavaScript il modulo non funziona: resta il link semplice al motore */}
          <noscript>
            <div className="mt-(--s-5) flex flex-col gap-3">
              <p>{copyPrenotazione.senzaJs}</p>
              <Button asChild variant="action" size="md">
                <a href={ENGINE_BASE} target="_blank" rel="noopener" aria-label={copyPrenotazione.ariaApriMotore}>
                  {p.stati.apriMotore}
                </a>
              </Button>
            </div>
          </noscript>
        </div>

        <aside className="lg:col-span-5" aria-labelledby="alternativa-umana">
          <h2 id="alternativa-umana" className="t-h3">
            {p.alternativaUmana.titolo}
          </h2>
          <p className="mt-(--s-3)">{p.alternativaUmana.corpo}</p>
          <div className="mt-(--s-4) flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild variant="brand" size="md">
              <a href={`tel:${centralino.telHref}`}>{p.alternativaUmana.chiama}</a>
            </Button>
            <Button asChild variant="outline" size="md">
              <a href={`mailto:${centralino.email}`}>{p.alternativaUmana.scrivi}</a>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

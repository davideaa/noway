"use client"
/*
 * BookingSheet: il foglio «Il tuo soggiorno» (UX 6.4), su <Sheet> (dialog modale nativo).
 * Si apre dalla pillola o da `useBooking().openBooking()` / `chooseRoom()`.
 *
 * Corpo che scorre: campi, riepilogo, note (nota sul motore esterno, nota onesta se il motore non
 * è verificato). Piede fisso: «Cerca disponibilità» sempre visibile sopra la tastiera, e sotto
 * la riga sulla camera scelta. Il focus va su «Arrivo»; alla chiusura torna a chi l'aveva
 * (la pillola o il pulsante «Cerca la {camera}»).
 * Si chiude con ✕, Esc, tocco fuori e trascinando la maniglia (gestito da <Sheet>), e da solo
 * al cambio pagina.
 */
import * as React from "react"
import { Sheet } from "@/components/ui/sheet"
import { copy } from "@/content/copy"
import { BookingForm, BookingNotes, SearchFeedback, SearchLink } from "./BookingForm"
import { useBooking } from "./BookingProvider"

export function BookingSheet() {
  const b = useBooking()

  // appena aperto, il focus su «Arrivo» (UX 5.3). Dopo il frame: <Sheet> prima apre e focalizza ✕.
  React.useEffect(() => {
    if (!b.sheetOpen) return
    const id = requestAnimationFrame(() => document.getElementById("sheet-arrivo")?.focus())
    return () => cancelAnimationFrame(id)
  }, [b.sheetOpen])

  return (
    <Sheet
      open={b.sheetOpen}
      onOpenChange={(o) => {
        if (!o) b.closeBooking()
      }}
      title={copy.prenota.pannello.titolo}
      closeLabel={copy.prenota.pannello.ariaChiudi}
      footer={
        <div className="flex flex-col gap-3">
          <SearchLink idPrefix="sheet" full />
          <SearchFeedback />
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <BookingForm idPrefix="sheet" layout="stack" />
        <BookingNotes />
      </div>
    </Sheet>
  )
}

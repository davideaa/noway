"use client"
/*
 * BookingPill: pillola «Prenota» 56 px in basso a destra, telefono e tablet < 1024 (UX 3.3).
 *
 * Apre il foglio (BookingSheet). Bordo 2 px inchiostro sul miele (DECISIONI 4), area di tocco
 * ≥ 44, zona sicura con env(safe-area-inset-*). Compare, nella home, quando il pulsante
 * «Cerca disponibilità» dell'hero (`data-booking-hero-cta`) esce dallo schermo; sulle altre
 * pagine subito; si nasconde con il footer in vista. Dissolvenza 160 ms, nessuna con reduced-motion.
 *
 * Su /centro-congressi/ diventa la pillola verde «Richiedi proposta» che porta a #richiesta
 * (UX 3.3). Su /prenota/ non compare (il modulo è già in pagina).
 */
import { Button } from "@/components/ui/button"
import { copy } from "@/content/copy"
import styles from "./booking.module.css"
import { useBooking } from "./BookingProvider"

export function BookingPill() {
  const b = useBooking()

  if (b.route === "/prenota") return null

  if (b.route === "/centro-congressi") {
    return (
      <div data-booking-dock="" data-visible={b.dockVisible ? "true" : "false"} className={styles.pill}>
        <Button asChild variant="brand" size="lg" focusRing="double">
          <a href="#richiesta">{copy.congressi.presentazione.pulsanti.richiediProposta}</a>
        </Button>
      </div>
    )
  }

  return (
    <div data-booking-dock="" data-booking-pill="" data-visible={b.dockVisible ? "true" : "false"} className={styles.pill}>
      <Button
        variant="action"
        size="lg"
        aria-haspopup="dialog"
        aria-expanded={b.sheetOpen}
        onClick={b.openBooking}
      >
        {copy.prenota.pannello.pillola}
      </Button>
    </div>
  )
}

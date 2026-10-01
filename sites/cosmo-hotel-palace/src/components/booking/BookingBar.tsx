"use client"
/*
 * BookingBar: barra di prenotazione FISSA, solo desktop ≥ 1024 (UX 3.3).
 *
 * Forma: in basso al centro, `min(960px, 100% − 96px)`, --sh-1, fondo --bg pieno.
 * Compare dopo l'hero della home (attributo `data-booking-hero` sull'hero) e subito sulle altre
 * pagine; si nasconde quando il footer è in vista (`data-site-footer`). Dissolvenza 160 ms
 * (DECISIONI 5), nessuna con prefers-reduced-motion.
 * NON compare su /centro-congressi/ (lì l'azione è la proposta) né su /prenota/ (il modulo è già
 * in pagina): in quei casi non rende nulla. Per cambiare l'elenco: NO_BAR_ROUTES nel provider.
 *
 * Contiene: segno «Camera: … ✕» (se c'è una camera scelta), Arrivo, Partenza, Camere, Adulti,
 * Bambini e «Cerca disponibilità» (miele senza bordo: fondo uniforme, DECISIONI 4).
 * Il riepilogo errori compare sopra la barra.
 */
import { copy } from "@/content/copy"
import styles from "./booking.module.css"
import { BookingForm, SearchLink } from "./BookingForm"
import { NO_BAR_ROUTES, useBooking } from "./BookingProvider"

export function BookingBar() {
  const b = useBooking()
  if (NO_BAR_ROUTES.includes(b.route)) return null
  return (
    <section
      aria-label={copy.prenota.pagina.h1}
      data-booking-bar=""
      data-booking-dock=""
      data-visible={b.dockVisible ? "true" : "false"}
      className={styles.bar}
    >
      <BookingForm idPrefix="bar" layout="bar">
        <SearchLink idPrefix="bar" bordered={false} className="ms-auto px-4!" />
      </BookingForm>
    </section>
  )
}

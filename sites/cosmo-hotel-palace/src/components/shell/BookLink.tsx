"use client"
/*
 * BookLink: il link «Prenota» / «Cerca disponibilità» che apre la prenotazione (UX 3.1).
 *
 * È un VERO link a /prenota/: senza JavaScript, o con Ctrl/Cmd/clic centrale, va alla pagina
 * Prenota. Con JavaScript il clic semplice chiama `openBooking()` del BookingProvider: su
 * desktop con la barra visibile porta il focus su «Arrivo», altrimenti apre il foglio.
 * Sulla pagina /prenota/ il modulo è già lì: il clic porta il focus sul suo campo «Arrivo».
 *
 * Va usato dentro <BookingProvider> (il layout lo monta). Fuori, resta un link normale.
 */
import * as React from "react"
import Link from "next/link"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useBookingOptional } from "@/components/booking/BookingProvider"

export type BookLinkProps = Pick<ButtonProps, "variant" | "size" | "full" | "bordered" | "focusRing" | "className" | "arrow"> & {
  children: React.ReactNode
  /** nome accessibile, se il testo visibile non basta (deve contenere il testo visibile) */
  "aria-label"?: string
}

export function BookLink({ children, variant = "brand", size = "sm", ...rest }: BookLinkProps) {
  const booking = useBookingOptional()

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!booking) return
    // clic con tasto modificatore o non principale: lascia fare al browser
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (booking.route === "/prenota") {
      const field = document.getElementById("page-arrivo")
      if (field) {
        field.scrollIntoView({ block: "center" })
        field.focus()
        return
      }
    }
    booking.openBooking()
  }

  return (
    <Button asChild variant={variant} size={size} onClick={onClick} {...rest}>
      <Link href="/prenota/">{children}</Link>
    </Button>
  )
}

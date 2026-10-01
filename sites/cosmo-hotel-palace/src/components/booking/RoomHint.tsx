"use client"
/*
 * RoomHint: tutto ciò che riguarda la «camera scelta» (UX 3.3, 5.3, COPY 4.6).
 *
 *   part="segno"   il segno «Camera: Family Room ✕» (nella barra è il primo elemento).
 *                  Il ✕ toglie la scelta e riporta il focus su «Arrivo».
 *   part="scelta"  segno + riga «Hai scelto: {camera}. Aggiungi le date per cercare.» (foglio, pagina)
 *   part="motore"  riga sotto il pulsante: «Sul motore cerca la {camera} tra le camere
 *                  disponibili.» — il motore NON ha un parametro per il tipo di camera (UX 6.6),
 *                  quindi la scelta preimposta solo gli ospiti e il resto lo dice questa riga.
 *
 * Non rende nulla se non c'è una camera scelta.
 */
import { copy, fmt } from "@/content/copy"
import { roomById } from "@/content/rooms"
import { IconClose } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { useBooking } from "./BookingProvider"

export function RoomHint({ part, className }: { part: "segno" | "scelta" | "motore"; className?: string }) {
  const b = useBooking()
  const id = b.state.camera
  if (!id) return null
  const nome = roomById(id).nome
  const r = copy.prenota.riepilogo

  if (part === "motore") {
    return <p className={cn("text-sm leading-snug text-(--text-muted)", className)}>{fmt(r.cercaSulMotore, { camera: nome })}</p>
  }

  const segno = (
    <button
      type="button"
      onClick={(e) => {
        // il segno sta per sparire: il focus passa al primo campo del suo contenitore
        const root = e.currentTarget.closest<HTMLElement>("[data-booking-root]")
        b.clearRoom()
        root?.querySelector<HTMLElement>("[data-field='arrivo'] input")?.focus()
      }}
      className={cn(
        "inline-flex min-h-(--tap) max-w-full items-center gap-2 self-start rounded-(--r-pill) border-[1.5px] border-(--border-strong)",
        "bg-(--bg-alt) ps-4 pe-3 text-sm leading-tight font-[weight:var(--w-strong)] text-(--text)",
        "transition-[background-color] duration-(--d-micro) ease-(--e-in) hover:bg-(--bg-sunk)",
        part === "segno" && className,
      )}
    >
      <span>{fmt(r.segnoCamera, { nome })}</span>
      <IconClose size={18} aria-hidden="true" />
      <span className="sr-only">. {r.ariaTogliCamera}</span>
    </button>
  )

  if (part === "segno") return segno
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {segno}
      <p className="text-base leading-normal text-(--text)">{fmt(r.cameraScelta, { camera: nome })}</p>
    </div>
  )
}

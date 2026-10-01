/*
 * Dettaglio / FAQ: disclosure nativa <details><summary>. Server component, funziona senza JS.
 *
 * Props
 *   summary        contenuto della riga (può avere un numero grande: «201 camere»)
 *   children       il corpo, visibile solo da aperto
 *   defaultOpen    parte aperto
 *   name           stesso `name` su più <Details> = fisarmonica (se ne apre uno alla volta,
 *                  gestito dal browser)
 *   variant        "row" (default: filetto sotto) | "plain"
 * Stati: normale / hover (fondo --bg-alt, solo con puntatore) / focus (anello) /
 * aperto (segno −, il + diventa −). Il segno è un'icona, mai solo il colore.
 * Riga alta almeno 56 px. Nessuna animazione di altezza (non si anima il layout).
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { IconMinus, IconPlus } from "./icons"

export type DetailsProps = Omit<React.ComponentProps<"details">, "children"> & {
  summary: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: "row" | "plain"
}

export function Details({ summary, children, defaultOpen, variant = "row", className, ...props }: DetailsProps) {
  return (
    <details
      {...props}
      open={defaultOpen || props.open || undefined}
      className={cn("group/details", variant === "row" && "border-b border-(--border)", className)}
    >
      <summary
        className={cn(
          "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-2 py-3",
          "text-lg leading-snug font-[weight:var(--w-strong)] text-(--text)",
          "transition-colors duration-(--d-micro) ease-(--e-in) hover:bg-(--bg-alt)",
          "[&::-webkit-details-marker]:hidden [&::marker]:hidden",
          // l'anello non deve essere tagliato dal bordo: stesso offset del focus globale
          "focus-visible:outline-offset-[-2px]",
        )}
      >
        <span className="min-w-0">{summary}</span>
        <span aria-hidden="true" className="inline-flex size-(--tap) shrink-0 items-center justify-center">
          <IconPlus size={22} className="group-open/details:hidden" />
          <IconMinus size={22} className="hidden group-open/details:block" />
        </span>
      </summary>
      <div className="px-2 pt-1 pb-5 text-base leading-normal text-(--text-muted) [&>p]:max-w-(--measure)">
        {children}
      </div>
    </details>
  )
}

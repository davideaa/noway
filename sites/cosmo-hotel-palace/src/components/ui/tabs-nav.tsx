/*
 * TabsNav: «tab» come LINK veri (navigazione fra pagine o sezioni), non role="tab".
 * Se la voce porta altrove con un indirizzo, il browser lo sa: apri in nuova scheda,
 * indietro, nessuno stato da sincronizzare. Server component.
 *
 * Props
 *   items   [{ href, label, current? }]
 *   current href della voce corrente (alternativa a `current` sulla singola voce);
 *           la voce corrente porta aria-current="page" (o `currentToken`)
 *   aria-label  nome del <nav> (obbligatorio: più nav in pagina devono distinguersi)
 *   currentToken  valore di aria-current (default "page"; "location" per ancore nella pagina)
 *   align   "start" | "center"
 * Stati: normale · hover (sottolineatura spessa, solo con puntatore) · focus (anello) ·
 * corrente (filetto 3 px sotto + peso, mai solo il colore). Ogni voce è alta ≥ 44 px, con 8 px
 * fra le voci; se non entrano vanno a capo (niente scorrimento laterale).
 */
import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type TabsNavItem = {
  href: string
  label: React.ReactNode
  current?: boolean
}

export type TabsNavProps = {
  items: TabsNavItem[]
  current?: string
  currentToken?: "page" | "location" | "step" | "true"
  align?: "start" | "center"
  className?: string
  "aria-label": string
}

export function TabsNav({
  items,
  current,
  currentToken = "page",
  align = "start",
  className,
  "aria-label": ariaLabel,
}: TabsNavProps) {
  return (
    <nav aria-label={ariaLabel} className={className}>
      <ul
        className={cn(
          "m-0 flex list-none flex-wrap gap-x-2 gap-y-1 p-0 border-b border-(--border)",
          align === "center" && "justify-center",
        )}
      >
        {items.map((it) => {
          const isCurrent = it.current ?? (current !== undefined && it.href === current)
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={isCurrent ? currentToken : undefined}
                className={cn(
                  "relative inline-flex min-h-(--tap) items-center px-3 py-2 text-base leading-tight no-underline",
                  "text-(--text-muted) transition-colors duration-(--d-micro) ease-(--e-in)",
                  "hover:text-(--text) hover:underline hover:decoration-2 hover:underline-offset-4",
                  // il filetto della voce corrente sta sopra il bordo del <ul> (-1 px)
                  "after:absolute after:inset-x-3 after:-bottom-px after:h-[3px] after:rounded-t-(--r-1) after:bg-transparent after:content-['']",
                  "aria-[current]:font-[weight:var(--w-strong)] aria-[current]:text-(--text) aria-[current]:after:bg-(--text)",
                  "aria-[current]:hover:no-underline",
                )}
              >
                {it.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

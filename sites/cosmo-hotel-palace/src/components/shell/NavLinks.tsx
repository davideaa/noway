"use client"
/*
 * NavLinks: le voci dell'header desktop (UX 3.1). `<nav>` con nome, link veri.
 *
 * Pagina corrente: `aria-current="page"` sulla voce; sulle sotto-pagine della sezione
 * (es. /camere/suite/) la voce «Camere» resta evidenziata con `aria-current="true"`.
 * Mai solo colore: filetto di 3 px sotto la voce e peso del testo (come TabsNav).
 * Ogni voce è alta ≥ 44 px, con 8 px fra le voci.
 */
import Link from "next/link"
import { usePathname } from "next/navigation"
import { copyShell } from "@/content/copy-shell"
import { cn } from "@/lib/utils"
import { currentState, headerItems, type NavItem } from "./nav-items"

export const navLinkClass = cn(
  "relative inline-flex min-h-(--tap) items-center px-3 py-2 text-base leading-tight no-underline",
  "text-(--text-muted) transition-colors duration-(--d-micro) ease-(--e-in)",
  "hover:text-(--text) hover:underline hover:decoration-2 hover:underline-offset-4",
  "after:absolute after:inset-x-3 after:bottom-1 after:h-[3px] after:rounded-(--r-1) after:bg-transparent after:content-['']",
  "aria-[current]:font-[weight:var(--w-strong)] aria-[current]:text-(--text) aria-[current]:after:bg-(--text)",
  "aria-[current]:hover:no-underline",
)

export function NavLinks({
  items = headerItems,
  className,
  "aria-label": ariaLabel = copyShell.ariaNavPrincipale,
}: {
  items?: readonly NavItem[]
  className?: string
  "aria-label"?: string
}) {
  const pathname = usePathname()
  return (
    <nav aria-label={ariaLabel} className={className}>
      <ul className="m-0 flex list-none items-center gap-2 p-0">
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} aria-current={currentState(pathname, it.base)} className={navLinkClass}>
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

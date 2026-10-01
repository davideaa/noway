"use client"
/*
 * MenuDialog: pulsante «Menu» + menu a schermo intero del telefono (UX 3.2), solo < 1024.
 *
 * Usa <Dialog size="full"> (un <dialog> modale nativo): focus intrappolato, sfondo inerte,
 * Esc chiude, scroll della pagina bloccato. Fondo --bg pieno. All'apertura il focus va sul primo
 * link; alla chiusura torna al pulsante «Menu». Si chiude con «Chiudi il menu», Esc, scelta di
 * una voce, cambio pagina e, se la finestra diventa larga (≥ 1024), da solo.
 *
 * Contenuto: cinque voci in Fraunces su righe da 64 px (pagina corrente: `aria-current`, peso e
 * filetto), «Chiama +39 02 617771» (verde pieno, 48), «Scrivi a info@…» (contorno, 48),
 * «Come arrivare» e «Privacy». Telefono ed email stanno sempre qui e nel footer (WCAG 3.2.6).
 *
 * Senza JavaScript il pulsante non funziona: l'header mostra al suo posto un menu in chiaro
 * (<noscript>) e nasconde il pulsante (attributo data-menu-trigger).
 */
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon } from "@/components/art/Icons"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { IconArrowRight } from "@/components/ui/icons"
import { centralino } from "@/content/contacts"
import { copy } from "@/content/copy"
import { copyShell } from "@/content/copy-shell"
import { cn } from "@/lib/utils"
import { currentState, menuExtra, menuItems } from "./nav-items"

export function MenuDialog({ className }: { className?: string }) {
  const pathname = usePathname()
  // il menu si apre PER una pagina: cambiando pagina si chiude da solo (senza effetti)
  const [openedAt, setOpenedAt] = React.useState<string | null>(null)
  const open = openedAt !== null && openedAt === pathname
  const firstLink = React.useRef<HTMLAnchorElement>(null)

  const close = React.useCallback(() => setOpenedAt(null), [])

  // finestra che diventa larga: il menu del telefono non serve più
  React.useEffect(() => {
    if (!open) return
    const mq = window.matchMedia("(min-width: 1024px)")
    const onChange = () => {
      if (mq.matches) setOpenedAt(null)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [open])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        data-menu-trigger=""
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenedAt(pathname)}
        className={cn("gap-2", className)}
      >
        <Icon nome="menu" size={22} />
        {copy.nav.menu.apri}
      </Button>

      <Dialog
        size="full"
        open={open}
        onOpenChange={(o) => {
          if (!o) close()
        }}
        title={<span className="whitespace-nowrap text-[1.25rem]">{copy.sito.nome}</span>}
        closeText={copy.nav.menu.chiudi}
        initialFocusRef={firstLink}
        bodyClassName="px-0 sm:px-0 py-0"
      >
        <div className="mx-auto flex w-full max-w-xl flex-col pb-[max(var(--s-5),env(safe-area-inset-bottom))]">
          <nav aria-label={copyShell.ariaNavMenu}>
            <ul className="m-0 list-none p-0">
              {menuItems.map((it, i) => (
                <li key={it.href} className="border-b border-(--border)">
                  <Link
                    ref={i === 0 ? firstLink : undefined}
                    href={it.href}
                    onClick={close}
                    aria-current={currentState(pathname, it.base)}
                    className={cn(
                      "t-h3 group flex min-h-16 items-center justify-between gap-4 px-(--s-4) py-3 no-underline sm:px-(--s-5)",
                      // il bordo del riquadro è a filo con lo schermo: l'anello di focus sta DENTRO la riga
                      "-outline-offset-4",
                      "text-(--text) hover:underline hover:decoration-2 hover:underline-offset-4",
                      "aria-[current]:font-[weight:var(--w-strong)]",
                    )}
                  >
                    <span className="relative">
                      {it.label}
                      {/* il filetto della pagina corrente: non solo peso del testo */}
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1 inset-x-0 hidden h-[3px] rounded-(--r-1) bg-(--text) group-aria-[current]:block"
                      />
                    </span>
                    <IconArrowRight size={22} className="text-(--text-muted)" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-3 px-(--s-4) pt-(--s-5) sm:px-(--s-5)">
            <Button asChild variant="brand" size="md" full>
              <a href={`tel:${centralino.telHref}`}>
                <Icon nome="telefono" size={22} />
                {copy.nav.menu.chiama}
              </a>
            </Button>
            <Button asChild variant="outline" size="md" full>
              <a href={`mailto:${centralino.email}`}>
                <Icon nome="email" size={22} />
                {copy.nav.menu.scrivi}
              </a>
            </Button>
          </div>

          <ul className="m-0 flex list-none flex-wrap gap-x-(--s-5) gap-y-1 p-0 px-(--s-4) pt-(--s-4) sm:px-(--s-5)">
            {menuExtra.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={close}
                  aria-current={currentState(pathname, it.base)}
                  className="inline-flex min-h-(--tap) items-center text-(--text) aria-[current]:font-[weight:var(--w-strong)]"
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Dialog>
    </>
  )
}

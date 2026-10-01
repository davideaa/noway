"use client"
/*
 * Header del sito (UX 3.1). Montato dal layout, dentro <BookingProvider>.
 *
 * - Fondo pieno `--header-bg` con filetto 1 px; sticky in cima; MAI sopra il 3D e mai trasparente.
 * - Altezza 56 px (< 1024) / 72 px (≥ 1024): token `--header-h`.
 * - Il nome «Cosmo Hotel Palace» (Fraunces) è un link alla home.
 * - Desktop ≥ 1024: voci in riga (NavLinks) + «Prenota» verde pieno (non miele: il miele è nella
 *   barra in basso e nell'hero). «Prenota» è un link a /prenota/ che chiama `openBooking()`.
 * - Telefono: nome a sinistra, «Menu» a destra (MenuDialog). Nessun «Prenota» in alto: c'è la pillola.
 * - Scorrimento: si nasconde dopo 80 px scendendo, ricompare risalendo o col focus (shell.module.css).
 *   Non fa nulla con prefers-reduced-motion.
 * - Senza JavaScript: <noscript> con le stesse voci in una riga sotto il nome (sotto 1024) e il
 *   pulsante «Menu» nascosto.
 *
 * Attributo `data-site-header` sul <header>: serve a chi vuole misurarlo.
 */
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { copy } from "@/content/copy"
import { copyShell } from "@/content/copy-shell"
import { BookLink } from "./BookLink"
import { MenuDialog } from "./MenuDialog"
import { NavLinks, navLinkClass } from "./NavLinks"
import { currentState, headerItems } from "./nav-items"
import styles from "./shell.module.css"

/** Scendendo oltre questa quota (px) l'header si nasconde. */
const HIDE_AFTER = 80

function useHideOnScroll(ref: React.RefObject<HTMLElement | null>) {
  const pathname = usePathname()

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    let hidden = false
    let last = window.scrollY
    let frame = 0

    const set = (h: boolean) => {
      if (h === hidden) return
      hidden = h
      el.dataset.hidden = h ? "true" : "false"
    }
    const update = () => {
      frame = 0
      const y = Math.max(0, window.scrollY)
      const dy = y - last
      last = y
      if (reduce.matches || y <= HIDE_AFTER) set(false)
      else if (dy > 0) set(true)
      else if (dy < 0) set(false)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // un elemento dell'header che prende il focus (Tab all'indietro, skip link…) lo rimette in vista
    const onFocusIn = () => set(false)

    window.addEventListener("scroll", onScroll, { passive: true })
    el.addEventListener("focusin", onFocusIn)
    return () => {
      window.removeEventListener("scroll", onScroll)
      el.removeEventListener("focusin", onFocusIn)
      if (frame) cancelAnimationFrame(frame)
      set(false)
    }
    // il percorso cambia → la pagina riparte dall'alto: l'header torna visibile
  }, [ref, pathname])
}

export function Header() {
  const ref = React.useRef<HTMLElement>(null)
  const pathname = usePathname()
  useHideOnScroll(ref)

  return (
    <header ref={ref} data-site-header="" data-hidden="false" className={styles.header}>
      <div className="wrap flex h-(--header-h) items-center gap-(--s-4)">
        <Link href="/" className={`${styles.brand} me-auto`} aria-label={copyShell.ariaHome}>
          {copy.sito.nome}
        </Link>

        <NavLinks className="hidden lg:block" />

        <BookLink variant="brand" size="sm" className="hidden lg:inline-flex">
          {copy.nav.header.prenota}
        </BookLink>
        <MenuDialog className="lg:hidden" />
      </div>

      {/* Senza JavaScript: «Menu» non funziona, quindi le voci stanno qui in chiaro (< 1024). */}
      <noscript>
        <style>{"[data-menu-trigger]{display:none!important}"}</style>
        <nav aria-label={copyShell.ariaNavMenuSenzaJs} className={`${styles.noscriptNav} lg:hidden`}>
          <div className="wrap">
            <ul className="-ms-3 m-0 flex list-none flex-wrap gap-x-2 p-0">
              {headerItems.map((it) => (
                <li key={it.href}>
                  <a href={it.href} aria-current={currentState(pathname, it.base)} className={navLinkClass}>
                    {it.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/prenota/" className={navLinkClass}>
                  {copy.nav.header.prenota}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </noscript>
    </header>
  )
}

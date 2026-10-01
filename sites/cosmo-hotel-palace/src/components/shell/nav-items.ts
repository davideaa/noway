/**
 * Voci di navigazione, UNA sola fonte per header (UX 3.1), menu del telefono (3.2) e footer (COPY 11).
 * Gli indirizzi hanno lo slash finale (`trailingSlash: true`, DECISIONI 13).
 *
 * `base` serve a riconoscere la pagina corrente: la voce «Camere» resta evidenziata anche sulle
 * tre sotto-pagine (UX 3.1).
 */
import { copy } from "@/content/copy"

export type NavItem = { href: string; base: string; label: string }

/** Header desktop: Camere · Congressi · Ristorante · Wellness · Contatti. */
export const headerItems: readonly NavItem[] = [
  { href: "/camere/", base: "/camere", label: copy.nav.header.camere },
  { href: "/centro-congressi/", base: "/centro-congressi", label: copy.nav.header.congressi },
  { href: "/ristorazione/", base: "/ristorazione", label: copy.nav.header.ristorante },
  { href: "/wellness/", base: "/wellness", label: copy.nav.header.wellness },
  { href: "/contatti/", base: "/contatti", label: copy.nav.header.contatti },
]

/** Menu del telefono: etichette estese (UX 3.2). Stesso ordine dell'header. */
export const menuItems: readonly NavItem[] = [
  { href: "/camere/", base: "/camere", label: copy.nav.menu.voci.camere },
  { href: "/centro-congressi/", base: "/centro-congressi", label: copy.nav.menu.voci.congressi },
  { href: "/ristorazione/", base: "/ristorazione", label: copy.nav.menu.voci.ristorazione },
  { href: "/wellness/", base: "/wellness", label: copy.nav.menu.voci.wellness },
  { href: "/contatti/", base: "/contatti", label: copy.nav.menu.voci.contatti },
]

/** Link secondari del menu (sotto i pulsanti). */
export const menuExtra: readonly NavItem[] = [
  { href: "/come-arrivare/", base: "/come-arrivare", label: copy.nav.menu.comeArrivare },
  { href: "/privacy/", base: "/privacy", label: copy.nav.menu.privacy },
]

/** Footer, colonna «Esplora» (UX 2.1: solo pagine che esistono). */
export const footerItems: readonly NavItem[] = [
  { href: "/camere/", base: "/camere", label: copy.footer.esplora.voci.camere },
  { href: "/ristorazione/", base: "/ristorazione", label: copy.footer.esplora.voci.ristorazione },
  { href: "/wellness/", base: "/wellness", label: copy.footer.esplora.voci.wellness },
  { href: "/centro-congressi/", base: "/centro-congressi", label: copy.footer.esplora.voci.congressi },
  { href: "/come-arrivare/", base: "/come-arrivare", label: copy.footer.esplora.voci.comeArrivare },
]

/**
 * Stato di una voce rispetto al percorso:
 *   "page"  = è questa pagina (aria-current="page")
 *   "true"  = è la sezione che contiene questa pagina (es. /camere/suite/ → Camere)
 *   undefined = altrove
 */
export function currentState(pathname: string | null, base: string): "page" | "true" | undefined {
  if (!pathname) return undefined
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  if (p === base) return "page"
  if (p.startsWith(`${base}/`)) return "true"
  return undefined
}

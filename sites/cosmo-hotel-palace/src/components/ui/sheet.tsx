"use client"
/*
 * Sheet: foglio dal basso (telefono / tablet) su <dialog> modale nativo. UX 6.4.
 * Altezza ≤ 88 dvh, fondo --bg pieno (sempre tono giorno), raggio --r-3 in alto, --sh-2,
 * maniglia 40×4 con area di tocco 44 px, trascinabile verso il basso per chiudere (con ✕
 * come alternativa a un tocco), piede fisso, Esc e clic sul fondale chiudono, scroll
 * della pagina bloccato, focus intrappolato e restituito. Nessun backdrop-filter.
 * Entrata: traslazione dal basso 240 ms (subito con reduced-motion).
 *
 * Props: open, onOpenChange, title (nome accessibile; `hideTitle` per tenerlo solo per
 * i lettori), description, children (scorrono), footer (fisso), closeLabel (aria-label
 * della ✕; es. «Chiudi il pannello di prenotazione»), returnFocusRef, initialFocusRef,
 * tone, keepMounted, className, bodyClassName.
 */
import { Modal, type ModalProps } from "./modal"

export type SheetProps = Omit<ModalProps, "size" | "closeText">

export function Sheet(props: SheetProps) {
  return <Modal {...props} kind="sheet" />
}

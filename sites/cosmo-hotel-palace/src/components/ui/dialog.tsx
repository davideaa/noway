"use client"
/*
 * Dialog: finestra modale centrata (menu del telefono, avvisi) su <dialog> nativo.
 * Stessa meccanica del Sheet (focus trap, Esc, ritorno del focus, scroll lock, nessun
 * backdrop-filter, solo transform/opacity), ma centrata e con dissolvenza + 12 px.
 *
 * Props: come Sheet, più
 *   size       "sm" | "md" (default) | "lg" | "full" (tutto schermo: menu del telefono)
 *   closeText  se presente il pulsante di chiusura è testuale («Chiudi»), come nel wireframe
 *              del menu (UX 3.2); altrimenti ✕ con aria-label={closeLabel}.
 */
import { Modal, type ModalProps } from "./modal"

export type DialogProps = ModalProps

export function Dialog(props: DialogProps) {
  return <Modal {...props} kind="dialog" />
}

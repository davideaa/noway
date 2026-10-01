"use client"
/*
 * Motore comune di Sheet e Dialog: <dialog> modale nativo.
 *
 *  - showModal(): focus intrappolato, sfondo inerte, Esc chiude (evento `cancel`).
 *  - Scroll della pagina bloccato (scroll-lock.ts, con contatore).
 *  - Al ritorno il focus va a `returnFocusRef` o, se manca, all'elemento che l'aveva alla
 *    apertura (il pulsante che ha aperto il foglio).
 *  - Fondale: tinta piena, SENZA backdrop-filter. Nessun will-change.
 *  - Entrata/uscita: solo transform + opacity, durata --d-ui (0,01 ms con reduced-motion,
 *    che qui diventa «subito»). Gli attributi data-state si impostano a mano sul nodo
 *    (open/closing) per non dipendere da @starting-style.
 *  - Il contenuto (children, footer) si monta solo da aperto (o in uscita), salvo `keepMounted`.
 *  - Il dialog dichiara sempre un proprio tono (`tone`, default giorno): top layer o no,
 *    non eredita il «sera» di una sezione scura (UX 6.4: foglio sempre su fondo chiaro).
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { IconClose } from "./icons"
import { lockScroll, unlockScroll } from "./scroll-lock"

export type ModalKind = "sheet" | "dialog"

export type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** titolo del foglio (nome accessibile del dialog) */
  title: React.ReactNode
  /** nasconde il titolo alla vista ma lo tiene come nome accessibile */
  hideTitle?: boolean
  description?: React.ReactNode
  children?: React.ReactNode
  /** piede fisso sotto il contenuto che scorre (es. «Cerca disponibilità») */
  footer?: React.ReactNode
  /** nome accessibile del pulsante di chiusura (ripresa da COPY) */
  closeLabel?: string
  /** se presente, il pulsante di chiusura è testuale ({closeText}) invece di una ✕ */
  closeText?: string
  /** dove va il focus alla chiusura; default: l'elemento focalizzato all'apertura */
  returnFocusRef?: React.RefObject<HTMLElement | null>
  /** dove va il focus all'apertura; default: il primo elemento focalizzabile */
  initialFocusRef?: React.RefObject<HTMLElement | null>
  tone?: "giorno" | "sera"
  keepMounted?: boolean
  className?: string
  bodyClassName?: string
  /** solo kind="dialog": larghezza */
  size?: "sm" | "md" | "lg" | "full"
  id?: string
}

function transitionMs(el: HTMLElement): number {
  const raw = getComputedStyle(el).transitionDuration.split(",")[0]?.trim() ?? "0s"
  const n = parseFloat(raw)
  if (Number.isNaN(n)) return 0
  return raw.endsWith("ms") ? n : n * 1000
}

export function Modal({
  kind,
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  children,
  footer,
  closeLabel = "Chiudi",
  closeText,
  returnFocusRef,
  initialFocusRef,
  tone = "giorno",
  keepMounted,
  className,
  bodyClassName,
  size = "md",
  id: idProp,
}: ModalProps & { kind: ModalKind }) {
  const ref = React.useRef<HTMLDialogElement>(null)
  const auto = React.useId()
  const id = idProp ?? auto
  const [closing, setClosing] = React.useState(false)
  const opener = React.useRef<HTMLElement | null>(null)
  const locked = React.useRef(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const wasOpen = React.useRef(false)

  const present = open || closing

  const release = React.useCallback(() => {
    if (locked.current) {
      locked.current = false
      unlockScroll()
    }
  }, [])

  // apertura / chiusura
  React.useEffect(() => {
    const d = ref.current
    if (!d) return
    clearTimeout(timer.current)

    if (open) {
      wasOpen.current = true
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      d.style.transform = ""
      d.style.transition = ""
      if (!d.open) d.showModal()
      if (!locked.current) {
        locked.current = true
        lockScroll()
      }
      void d.offsetHeight // il frame di partenza esiste prima di passare a «open»
      d.dataset.state = "open"
      initialFocusRef?.current?.focus()
      return
    }

    if (!wasOpen.current) return
    wasOpen.current = false
    const finish = () => {
      if (d.open) d.close()
      delete d.dataset.state
      setClosing(false)
      release()
      const target = returnFocusRef?.current ?? opener.current
      if (target && target.isConnected) target.focus()
    }
    const ms = transitionMs(d)
    if (ms <= 1) {
      finish()
    } else {
      setClosing(true)
      d.dataset.state = "closing"
      timer.current = setTimeout(finish, ms + 30)
    }
  }, [open, release, returnFocusRef, initialFocusRef])

  // se il componente sparisce da aperto, il blocco dello scroll cade comunque
  React.useEffect(() => {
    const d = ref.current
    return () => {
      clearTimeout(timer.current)
      if (d?.open) d.close()
      release()
    }
  }, [release])

  // tastiera su telefono: il foglio resta sopra la tastiera (visualViewport)
  React.useEffect(() => {
    const d = ref.current
    const vv = typeof window !== "undefined" ? window.visualViewport : null
    if (!open || kind !== "sheet" || !d || !vv) return
    const sync = () => {
      d.style.setProperty("--vv-h", `${vv.height}px`)
      d.style.setProperty("--vv-bottom", `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`)
    }
    sync()
    vv.addEventListener("resize", sync)
    vv.addEventListener("scroll", sync)
    return () => {
      vv.removeEventListener("resize", sync)
      vv.removeEventListener("scroll", sync)
      d.style.removeProperty("--vv-h")
      d.style.removeProperty("--vv-bottom")
    }
  }, [open, kind])

  // trascinamento della maniglia verso il basso (WCAG 2.5.7: la ✕ è l'alternativa)
  const drag = React.useRef<{ y: number; t: number; dy: number } | null>(null)
  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, t: e.timeStamp, dy: 0 }
    if (ref.current) ref.current.style.transition = "none"
  }
  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = drag.current
    if (!s || !ref.current) return
    s.dy = Math.max(0, e.clientY - s.y)
    ref.current.style.transform = `translateY(${s.dy}px)`
  }
  const onHandleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = drag.current
    drag.current = null
    const d = ref.current
    if (!s || !d) return
    const speed = s.dy / Math.max(1, e.timeStamp - s.t)
    d.style.transition = ""
    if (s.dy > 96 || (s.dy > 24 && speed > 0.6)) {
      d.style.transform = "translateY(100%)"
      onOpenChange(false)
    } else {
      d.style.transform = ""
    }
  }

  const sheet = kind === "sheet"

  return (
    <dialog
      ref={ref}
      id={id}
      data-tono={tone}
      data-slot={sheet ? "sheet" : "dialog"}
      aria-labelledby={`${id}-t`}
      aria-describedby={description ? `${id}-d` : undefined}
      onCancel={(e) => {
        // Esc: la chiusura passa dallo stato, così si anima e il focus torna al suo posto
        e.preventDefault()
        onOpenChange(false)
      }}
      onClose={() => {
        // chiuso dal browser (es. form method="dialog"): si riallinea lo stato
        if (open) onOpenChange(false)
      }}
      onClick={(e) => {
        // clic sul fondale = clic sul dialog stesso (il contenuto occupa tutto il resto)
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
      className={cn(
        "m-0 box-border flex-col overflow-hidden border-0 bg-(--bg) p-0 text-(--text) [overscroll-behavior:contain]",
        "open:flex fixed",
        // fondale: tinta piena, mai backdrop-filter
        "backdrop:bg-[color-mix(in_srgb,var(--inchiostro-900)_55%,transparent)] backdrop:opacity-0",
        "backdrop:transition-opacity backdrop:duration-(--d-ui) backdrop:ease-(--e-in)",
        "data-[state=open]:backdrop:opacity-100",
        "transition-[transform,translate,opacity] duration-(--d-ui) ease-(--e-in) data-[state=closing]:ease-(--e-out)",
        sheet
          ? [
              "inset-x-0 top-auto bottom-[var(--vv-bottom,0px)] w-full max-w-none rounded-t-(--r-3) shadow-(--sh-2)",
              "max-h-[min(88dvh,calc(var(--vv-h,100dvh)_-_8px))] lg:inset-x-auto lg:start-1/2 lg:w-[min(44rem,100%)] lg:-translate-x-1/2",
              "translate-y-full data-[state=open]:translate-y-0 data-[state=closing]:translate-y-full",
              "data-[state=open]:ease-(--e-in)",
            ]
          : [
              "inset-0 m-auto h-fit max-h-[min(100dvh_-_2rem,48rem)] rounded-(--r-3) border border-(--border) opacity-0",
              "translate-y-3 data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=closing]:translate-y-3 data-[state=closing]:opacity-0",
              size === "sm" && "w-[min(24rem,100%_-_2rem)]",
              size === "md" && "w-[min(36rem,100%_-_2rem)]",
              size === "lg" && "w-[min(56rem,100%_-_2rem)]",
              size === "full" &&
                "h-dvh max-h-none w-dvw max-w-none rounded-none border-0",
            ],
        // `translate` e `transform` non si mescolano: le classi translate-* usano la proprietà `translate`
        className,
      )}
    >
      {present || keepMounted ? (
        <>
          {sheet ? (
            <div
              aria-hidden="true"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              className="flex h-11 shrink-0 cursor-grab touch-none items-center justify-center"
            >
              <span className="block h-1 w-10 rounded-(--r-pill) bg-(--border-strong)" />
            </div>
          ) : null}
          <header
            className={cn(
              "flex shrink-0 items-center justify-between gap-4 px-(--s-4) sm:px-(--s-5)",
              sheet ? "pb-2" : "min-h-14 border-b border-(--border) py-2",
              hideTitle && sheet && "justify-end",
            )}
          >
            <h2
              id={`${id}-t`}
              className={cn("text-[length:var(--t-h3)] leading-(--lh-h3)", hideTitle && "sr-only")}
            >
              {title}
            </h2>
            {closeText ? (
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} data-modal-close>
                {closeText}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={closeLabel}
                onClick={() => onOpenChange(false)}
                data-modal-close
              >
                <IconClose size={24} />
              </Button>
            )}
          </header>
          {description ? (
            <p id={`${id}-d`} className="px-(--s-4) pb-2 text-(--text-muted) sm:px-(--s-5)">
              {description}
            </p>
          ) : null}
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-(--s-4) py-(--s-4) [overscroll-behavior:contain] sm:px-(--s-5)",
              bodyClassName,
            )}
          >
            {children}
          </div>
          {footer ? (
            <footer className="shrink-0 border-t border-(--border) bg-(--bg) px-(--s-4) pt-(--s-3) pb-[max(var(--s-4),env(safe-area-inset-bottom))] sm:px-(--s-5)">
              {footer}
            </footer>
          ) : null}
        </>
      ) : (
        // un <dialog> chiuso resta nominato anche se vuoto (nessun avviso di aria-labelledby)
        <h2 id={`${id}-t`} className="sr-only">
          {title}
        </h2>
      )}
    </dialog>
  )
}

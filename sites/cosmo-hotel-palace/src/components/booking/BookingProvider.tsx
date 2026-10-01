"use client"
/*
 * BookingProvider: UNICO stato della prenotazione per tutto il sito (UX 3.3, WCAG 3.3.7).
 *
 * Cosa tiene
 *   - lo stato `BookingState` (arrivo, partenza, camere, adulti, bambini, camera scelta),
 *     in sessionStorage tramite `safeSession` (con try/catch; se manca, resta in memoria);
 *   - se il foglio (telefono) è aperto, gli errori da mostrare, lo stato dell'apertura del motore;
 *   - quando barra e pillola devono essere visibili, e lo spazio da riservare in basso
 *     (`--reserve-bottom` su <html>, letto dal body in globals.css).
 *
 * Nessun dato lascia il browser: il link verso il motore è un <a> costruito dallo stato.
 *
 * COME MONTARLO (lo fa il modulo 7, in app/layout.tsx; questo modulo non tocca il layout):
 *
 *   import { BookingProvider } from "@/components/booking/BookingProvider"
 *   import { BookingBar } from "@/components/booking/BookingBar"
 *   import { BookingPill } from "@/components/booking/BookingPill"
 *   import { BookingSheet } from "@/components/booking/BookingSheet"
 *
 *   <body>
 *     <BookingProvider>
 *       ...skip link, <Header/> (può usare useBooking().openBooking), <main>, <Footer data-site-footer/>
 *       <BookingBar />
 *       <BookingPill />
 *       <BookingSheet />
 *     </BookingProvider>
 *     ...regioni #a11y-polite e #a11y-assertive (restano fuori)
 *   </body>
 *
 * Provider annidati: un BookingProvider dentro un altro non fa nulla (passa i figli). Così
 * /prenota/ funziona anche da sola, ma lo stato condiviso sta solo se il provider è nel layout.
 *
 * Attributi che le altre pagine possono mettere (nessuno è obbligatorio):
 *   data-booking-hero        sulla sezione hero della home: la barra desktop compare dopo averla superata
 *   data-booking-hero-cta    sul pulsante «Cerca disponibilità» dell'hero: la pillola del telefono compare
 *                            quando questo pulsante esce dallo schermo
 *   data-site-footer         sul <footer> del sito (se manca si usa `body > footer`): barra e pillola si
 *                            nascondono quando è in vista
 */
import * as React from "react"
import { usePathname } from "next/navigation"
import { announce } from "@/lib/a11y"
import { safeSession } from "@/lib/safe-storage"
import { romeToday } from "@/lib/rome-time"
import { copy, fmt } from "@/content/copy"
import { roomById, roomIds } from "@/content/rooms"
import type { BookingState, Ospiti, RoomId } from "@/content/types"
import { ENGINE_BASE, ENGINE_PARAMS_VERIFIED, LIMITS, STORAGE_KEY } from "@/lib/booking/config"
import { ensureDeparture, formatLong, isValidIso, nights } from "@/lib/booking/dates"
import { buildEngineUrl } from "@/lib/booking/url"
import {
  capienzaAvviso,
  firstInvalid,
  FIELD_ORDER,
  isValid,
  riepilogoErrori,
  validateBooking,
  type BookingErrors,
  type BookingField,
} from "@/lib/booking/validate"

/* ------------------------------------------------------------------ */
/* Percorsi                                                            */
/* ------------------------------------------------------------------ */

/** Dove la barra desktop NON compare: lì l'azione è un'altra (UX 3.3) o il modulo è già in pagina. */
export const NO_BAR_ROUTES: readonly string[] = ["/centro-congressi", "/prenota"]

/** '/camere/' -> '/camere'; '/' resta '/'. */
export function normalizeRoute(pathname: string | null): string {
  if (!pathname) return "/"
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  return p || "/"
}

/* ------------------------------------------------------------------ */
/* Stato persistente                                                   */
/* ------------------------------------------------------------------ */

export const DEFAULT_STATE: BookingState = {
  arrivo: "",
  partenza: "",
  camere: 1,
  adulti: 2,
  bambini: 0,
}

const clamp = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === "number" ? Math.round(v) : Number.NaN
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

/** Rende valido qualunque cosa arrivi (da sessionStorage o da un chiamante distratto). */
export function sanitize(raw: unknown): BookingState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const L = LIMITS
  const camera = typeof r.camera === "string" && (roomIds as readonly string[]).includes(r.camera) ? (r.camera as RoomId) : undefined
  const s: BookingState = {
    arrivo: typeof r.arrivo === "string" && isValidIso(r.arrivo) ? r.arrivo : "",
    partenza: typeof r.partenza === "string" && isValidIso(r.partenza) ? r.partenza : "",
    camere: clamp(r.camere, L.camere.min, L.camere.max, DEFAULT_STATE.camere) as BookingState["camere"],
    adulti: clamp(r.adulti, L.adulti.min, L.adulti.max, DEFAULT_STATE.adulti) as BookingState["adulti"],
    bambini: clamp(r.bambini, L.bambini.min, L.bambini.max, DEFAULT_STATE.bambini) as BookingState["bambini"],
  }
  if (camera) s.camera = camera
  return s
}

type Store = {
  getSnapshot: () => BookingState
  getServerSnapshot: () => BookingState
  subscribe: (cb: () => void) => () => void
  set: (patch: Partial<BookingState>) => void
}

function createStore(): Store {
  let state = DEFAULT_STATE
  let loaded = false
  const subs = new Set<() => void>()
  const load = () => {
    if (loaded || typeof window === "undefined") return
    loaded = true
    state = sanitize(safeSession.getJSON<unknown>(STORAGE_KEY, null))
  }
  return {
    // lato client: legge la sessione una sola volta, poi tiene lo stato in memoria
    getSnapshot: () => {
      load()
      return state
    },
    // lato server (e prima dell'idratazione): sempre lo stato di partenza
    getServerSnapshot: () => DEFAULT_STATE,
    subscribe: (cb) => {
      subs.add(cb)
      return () => {
        subs.delete(cb)
      }
    },
    set: (patch) => {
      load()
      const next = sanitize({ ...state, ...patch })
      if (JSON.stringify(next) === JSON.stringify(state)) return
      state = next
      safeSession.setJSON(STORAGE_KEY, next)
      subs.forEach((f) => f())
    },
  }
}

const noopSubscribe = () => () => {}

/* ------------------------------------------------------------------ */
/* Contesto                                                            */
/* ------------------------------------------------------------------ */

export type SearchStatus = "idle" | "opening" | "opened" | "offline"

export type BookingContextValue = {
  /** Stato condiviso. Sul server e prima dell'idratazione è DEFAULT_STATE. */
  state: BookingState
  /** 'AAAA-MM-GG' di oggi a Roma; '' sul server. */
  today: string
  /** Percorso normalizzato ('/', '/camere', ...). */
  route: string
  /** Notti fra arrivo e partenza, `null` se non c'è un intervallo valido. */
  notti: number | null
  /** Errori DA MOSTRARE (solo dopo una pressione a vuoto, e solo finché il campo è errato). */
  errors: BookingErrors
  /** Il primo campo da mostrare come errato, nell'ordine visivo. */
  firstError: BookingField | null
  /** Avviso di capienza (non blocca). */
  warning: string | null
  /** Lo stato passa la validazione. */
  valid: boolean
  /** href del pulsante «Cerca disponibilità»: link completo se valido e verificato, altrimenti la base. */
  href: string
  /** Il link porta davvero date e ospiti (valido E ENGINE_PARAMS_VERIFIED). Se false: nota «Scegli le date sul motore». */
  carriesData: boolean
  engineVerified: boolean
  status: SearchStatus
  /** Barra desktop e pillola telefono visibili ora (hero superato, footer fuori vista). */
  dockVisible: boolean
  sheetOpen: boolean

  setArrivo: (v: string) => void
  setPartenza: (v: string) => void
  setCamere: (n: number) => void
  setAdulti: (n: number) => void
  setBambini: (n: number) => void
  /** Sceglie una camera (preimposta gli ospiti: UX 5.3) e apre il pannello. */
  chooseRoom: (id: RoomId, ospiti?: Ospiti) => void
  /** Toglie la camera scelta (il «✕» del segno «Camera: …»). */
  clearRoom: () => void
  /** Desktop con barra visibile: porta il focus su «Arrivo». Altrimenti apre il foglio. */
  openBooking: () => void
  closeBooking: () => void
  /**
   * Gestore del clic sul link «Cerca disponibilità». Valida: se non va, annulla la navigazione,
   * mostra gli errori, li annuncia (announce) e porta il focus sul primo campo errato.
   * Se va, lascia fare al browser (un vero <a target="_blank">).
   * `rootId` = id del contenitore dei campi (`${idPrefix}-root`) per il focus.
   */
  search: (e: React.MouseEvent<HTMLElement>, rootId?: string) => void
}

const Ctx = React.createContext<BookingContextValue | null>(null)

export function useBooking(): BookingContextValue {
  const v = React.useContext(Ctx)
  if (!v) throw new Error("useBooking: manca <BookingProvider> sopra questo componente.")
  return v
}

/** Come useBooking, ma `null` fuori dal provider (per componenti che funzionano anche senza). */
export function useBookingOptional(): BookingContextValue | null {
  return React.useContext(Ctx)
}

/** Selettore del campo dentro il contenitore: il primo elemento su cui mettere il focus. */
function fieldFocusTarget(root: ParentNode | null, field: BookingField): HTMLElement | null {
  return root?.querySelector<HTMLElement>(`[data-field="${field}"] input, [data-field="${field}"] button`) ?? null
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const outer = React.useContext(Ctx)
  // già dentro un altro provider (es. quello del layout): non si crea un secondo stato
  if (outer) return <>{children}</>
  return <BookingProviderInner>{children}</BookingProviderInner>
}

function BookingProviderInner({ children }: { children: React.ReactNode }) {
  const [store] = React.useState(createStore)
  const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  // oggi a Roma: '' sul server (nessun testo che dipende dall'orologio nell'HTML statico)
  const today = React.useSyncExternalStore(noopSubscribe, romeToday, () => "")
  const route = normalizeRoute(usePathname())

  const [flagged, setFlagged] = React.useState<BookingField[]>([])
  const [status, setStatus] = React.useState<SearchStatus>("idle")
  // il foglio si apre PER una pagina: cambiando pagina si chiude da solo (senza effetti)
  const [openedAt, setOpenedAt] = React.useState<string | null>(null)
  const sheetOpen = openedAt === route
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => () => clearTimeout(timer.current), [])

  /* ---- errori ---- */
  const all = React.useMemo(() => validateBooking(state, today), [state, today])
  const valid = isValid(all)
  const errors = React.useMemo(() => {
    const out: BookingErrors = {}
    for (const f of flagged) if (all[f]) out[f] = all[f]
    return out
  }, [flagged, all])
  const firstError = firstInvalid(errors)
  const warning = capienzaAvviso(state)
  const notti = state.arrivo && state.partenza ? nights(state.arrivo, state.partenza) : null

  /* ---- modifiche ---- */
  const update = React.useCallback(
    (patch: Partial<BookingState>) => {
      store.set(patch)
      // un campo corretto smette di essere «errato»; l'esito «aperto/offline» non vale più
      const next = store.getSnapshot()
      const now = validateBooking(next, romeToday())
      setFlagged((f) => (f.some((k) => !now[k]) ? f.filter((k) => now[k]) : f))
      setStatus("idle")
    },
    [store],
  )

  const setArrivo = React.useCallback(
    (v: string) => {
      const adj = ensureDeparture(v, store.getSnapshot().partenza)
      update({ arrivo: v, partenza: adj.partenza })
      if (adj.moved) {
        announce(fmt(copy.prenota.campi.partenzaSpostata, { data: formatLong(adj.partenza) }))
      }
    },
    [store, update],
  )
  const setPartenza = React.useCallback((v: string) => update({ partenza: v }), [update])
  const setCamere = React.useCallback((n: number) => update({ camere: n as BookingState["camere"] }), [update])
  const setAdulti = React.useCallback((n: number) => update({ adulti: n as BookingState["adulti"] }), [update])
  const setBambini = React.useCallback((n: number) => update({ bambini: n as BookingState["bambini"] }), [update])
  const clearRoom = React.useCallback(() => update({ camera: undefined }), [update])

  /* ---- foglio / barra ---- */
  const closeBooking = React.useCallback(() => setOpenedAt(null), [])
  const openBooking = React.useCallback(() => {
    const desktop = window.matchMedia("(min-width: 1024px)").matches
    const bar = document.querySelector<HTMLElement>('[data-booking-bar][data-visible="true"]')
    const first = bar?.querySelector<HTMLElement>("[data-booking-first] input")
    if (desktop && first) {
      first.focus()
      return
    }
    setOpenedAt(route)
  }, [route])

  const chooseRoom = React.useCallback(
    (id: RoomId, ospiti?: Ospiti) => {
      const o = ospiti ?? roomById(id).ospitiPreimpostati
      update({ camera: id, adulti: o.adulti, bambini: o.bambini })
      openBooking()
    },
    [update, openBooking],
  )

  /* ---- ricerca ---- */
  const search = React.useCallback(
    (e: React.MouseEvent<HTMLElement>, rootId?: string) => {
      const current = store.getSnapshot()
      const errs = validateBooking(current, romeToday())
      if (!isValid(errs)) {
        // niente navigazione: gli errori si dicono, non si nascondono
        e.preventDefault()
        const keys = FIELD_ORDER.filter((k) => errs[k])
        setFlagged(keys)
        setStatus("idle")
        const msg = [riepilogoErrori(keys.length), ...keys.map((k) => errs[k])].join(" ")
        announce(msg, { politeness: "assertive", clearAfterMs: 8000 })
        const root = rootId ? document.getElementById(rootId) : null
        fieldFocusTarget(root ?? document, keys[0])?.focus()
        return
      }
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        e.preventDefault()
        setStatus("offline")
        announce(copy.prenota.stati.offline, { politeness: "assertive", clearAfterMs: 8000 })
        return
      }
      // valido e in linea: la navigazione la fa il browser (<a target="_blank" rel="noopener">)
      setFlagged([])
      setStatus("opening")
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setStatus("opened")
        announce(copy.prenota.stati.aperto)
      }, 1500)
    },
    [store],
  )

  /* ---- quando barra e pillola si vedono ---- */
  const [heroGone, setHeroGone] = React.useState(false)
  const [footerSeen, setFooterSeen] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    let observers: IntersectionObserver[] = []
    const stop = () => {
      observers.forEach((o) => o.disconnect())
      observers = []
    }
    const start = () => {
      stop()
      // desktop: la barra compare dopo l'hero; telefono: la pillola, quando il pulsante dell'hero esce
      const phone = !mq.matches
      const hero = document.querySelector<HTMLElement>(phone ? "[data-booking-hero-cta]" : "[data-booking-hero]")
      if (hero) {
        const io = new IntersectionObserver((entries) => {
          const en = entries[entries.length - 1]
          // telefono: appena il pulsante non si vede più; desktop: quando l'hero è scorso sopra lo schermo
          setHeroGone(phone ? !en.isIntersecting : !en.isIntersecting && en.boundingClientRect.bottom <= 0)
        })
        io.observe(hero)
        observers.push(io)
      } else {
        // nessun hero in questa pagina: subito (rimandato di un tick, fuori dal corpo dell'effetto)
        queueMicrotask(() => setHeroGone(true))
      }
      const footer = document.querySelector<HTMLElement>("[data-site-footer], body > footer")
      if (footer) {
        const io = new IntersectionObserver((entries) => {
          setFooterSeen(entries[entries.length - 1].isIntersecting)
        })
        io.observe(footer)
        observers.push(io)
      } else {
        queueMicrotask(() => setFooterSeen(false))
      }
    }
    start()
    mq.addEventListener("change", start)
    return () => {
      mq.removeEventListener("change", start)
      stop()
    }
  }, [route])

  const dockVisible = heroGone && !footerSeen

  /* ---- spazio riservato in basso (UX 3.3) ---- */
  React.useEffect(() => {
    const root = document.documentElement
    const docks = () => Array.from(document.querySelectorAll<HTMLElement>("[data-booking-dock]"))
    const measure = () => {
      let r = 0
      for (const el of docks()) {
        const b = el.getBoundingClientRect()
        // un dock con altezza 0 è nascosto dal breakpoint (display: none)
        if (b.height > 0) r = Math.max(r, window.innerHeight - b.top + 16)
      }
      if (r > 0) root.style.setProperty("--reserve-bottom", `${Math.ceil(r)}px`)
      else root.style.removeProperty("--reserve-bottom")
    }
    measure()
    const ro = new ResizeObserver(measure)
    docks().forEach((d) => ro.observe(d))
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
      root.style.removeProperty("--reserve-bottom")
    }
  }, [route])

  /* ---- il link ---- */
  const href = valid ? buildEngineUrl(state) : ENGINE_BASE
  const carriesData = valid && ENGINE_PARAMS_VERIFIED

  const value: BookingContextValue = {
    state,
    today,
    route,
    notti,
    errors,
    firstError,
    warning,
    valid,
    href,
    carriesData,
    engineVerified: ENGINE_PARAMS_VERIFIED,
    status,
    dockVisible,
    sheetOpen,
    setArrivo,
    setPartenza,
    setCamere,
    setAdulti,
    setBambini,
    chooseRoom,
    clearRoom,
    openBooking,
    closeBooking,
    search,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

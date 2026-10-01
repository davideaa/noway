"use client"
/*
 * Campi della prenotazione e pulsante «Cerca disponibilità» (UX 6, 9, 12).
 *
 * Esporta
 *   BookingForm   i campi (Arrivo, Partenza, Camere, Adulti, Bambini), il riepilogo e gli errori.
 *                 layout="stack"  foglio del telefono e pagina /prenota/: errori sotto ogni campo
 *                                 + riepilogo in cima, aiuti visibili.
 *                 layout="bar"    barra desktop: una riga, niente testo sotto i campi; il riepilogo
 *                                 errori sta SOPRA la barra, il riepilogo notti è solo per i lettori
 *                                 di schermo. `children` (di norma <SearchLink/>) va in fondo alla riga.
 *   SearchLink    il pulsante «Cerca disponibilità»: un vero <a href target="_blank" rel="noopener">
 *                 costruito dai dati. Mai disabilitato. Il clic passa da `search()` del provider:
 *                 se lo stato non è valido annulla la navigazione e mostra gli errori.
 *                 Nessun window.open.
 *   SearchFeedback  sotto il pulsante: «Sul motore cerca la {camera}…» e l'errore «offline».
 *   BookingNotes    note sempre visibili sotto il widget (COPY 4.1, 12) + nota onesta quando il
 *                 motore non è stato verificato («Scegli le date sul motore»).
 *
 * `idPrefix` distingue le istanze (bar, sheet, page): serve a id unici e al focus sul primo
 * campo errato (il contenitore ha id `${idPrefix}-root`).
 *
 * Perché non DateField: nella barra l'errore non può stare sotto il campo (la barra è bassa),
 * quindi qui si compone Field + Input (gli stessi componenti) con aria-invalid scritto a mano.
 */
import * as React from "react"
import { Field, Input } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Stepper } from "@/components/ui/stepper"
import { IconAlert } from "@/components/ui/icons"
import { Status } from "@/components/ui/status"
import { copy, copyPrenotazione, fmt, riepilogoNotti, riepilogoPersone } from "@/content/copy"
import { LIMITS } from "@/lib/booking/config"
import { addDays, formatLong, isValidIso } from "@/lib/booking/dates"
import { riepilogoErrori, type BookingField } from "@/lib/booking/validate"
import { cn } from "@/lib/utils"
import { useBooking } from "./BookingProvider"
import { RoomHint } from "./RoomHint"

type Layout = "stack" | "bar"

/* ------------------------------------------------------------------ */
/* Singoli campi                                                       */
/* ------------------------------------------------------------------ */

function BookingDate({
  idPrefix,
  field,
  label,
  hint,
  value,
  min,
  onValueChange,
  error,
  inlineError,
  className,
}: {
  idPrefix: string
  field: "arrivo" | "partenza"
  label: string
  hint?: string
  value: string
  min?: string
  onValueChange: (v: string) => void
  error?: string
  inlineError: boolean
  className?: string
}) {
  return (
    <div data-field={field} data-booking-first={field === "arrivo" ? "" : undefined} className={className}>
      <Field label={label} hint={hint} error={inlineError ? error : undefined} id={`${idPrefix}-${field}`}>
        {(c) => (
          <Input
            {...c}
            type="date"
            value={value}
            min={min || undefined}
            // nella barra l'errore sta nel riepilogo sopra: il campo punta a quella voce
            aria-invalid={error ? true : undefined}
            aria-describedby={inlineError ? c["aria-describedby"] : error ? `${idPrefix}-err-${field}` : undefined}
            onChange={(e) => onValueChange(e.target.value)}
            onClick={(e) => {
              // su desktop il clic su tutto il campo apre il selettore (UX 6.1); dove non c'è, resta il campo normale
              try {
                e.currentTarget.showPicker?.()
              } catch {
                /* showPicker può lanciare (iframe, gesto mancante) */
              }
            }}
          />
        )}
      </Field>
    </div>
  )
}

function BookingStepper({
  field,
  label,
  value,
  min,
  max,
  unit,
  onValueChange,
  error,
  compact,
}: {
  field: "camere" | "adulti" | "bambini"
  label: string
  value: number
  min: number
  max: number
  unit: { uno: string; altro: string }
  onValueChange: (n: number) => void
  error?: string
  compact?: boolean
}) {
  return (
    <div data-field={field} className={cn("flex flex-col gap-2", compact && "shrink-0")}>
      <Stepper
        label={label}
        value={value}
        min={min}
        max={max}
        unitOne={unit.uno}
        unitOther={unit.altro}
        minHint={fmt(copyPrenotazione.limiteMin, { n: min })}
        maxHint={fmt(copyPrenotazione.limiteMax, { n: max })}
        onValueChange={onValueChange}
        // nella barra i pulsanti scendono a 44 px (il minimo di tocco) e il valore si stringe
        className={compact ? "[&_button]:size-(--tap) [&_[role=status]]:min-w-6 [&>div]:min-h-(--control-h)" : undefined}
      />
      {error && !compact ? (
        // errore sotto il campo (solo layout stack)
        <p className="flex items-start gap-2 text-sm leading-snug font-[weight:var(--w-strong)] text-(--danger)">
          <IconAlert size={18} className="mt-px" />
          <span>
            <span className="sr-only">Errore: </span>
            {error}
          </span>
        </p>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Errori e riepilogo                                                  */
/* ------------------------------------------------------------------ */

const ORDER: readonly BookingField[] = ["arrivo", "partenza", "camere", "adulti"]

function ErrorSummary({ idPrefix, list, className }: { idPrefix: string; list: boolean; className?: string }) {
  const b = useBooking()
  const keys = ORDER.filter((k) => b.errors[k])
  if (keys.length === 0) return null
  // role="none": l'annuncio lo fa `announce()` una volta sola alla pressione (UX 6.2)
  return (
    <Status tone="error" role="none" title={riepilogoErrori(keys.length)} className={className}>
      {/* nella barra non c'è testo sotto i campi: l'elenco sta qui e i campi puntano a queste voci.
          Nel foglio e nella pagina gli errori stanno già sotto i campi: il riepilogo è solo il titolo. */}
      {list ? (
        <ul className="m-0 list-none space-y-1 p-0">
          {keys.map((k) => (
            <li key={k} id={`${idPrefix}-err-${k}`}>
              {b.errors[k]}
            </li>
          ))}
        </ul>
      ) : null}
    </Status>
  )
}

/** «{n} notti, dal {data} al {data}.» e «{n} camere · {a} adulti · {b} bambini» (aria-live, solo al cambio). */
function Summary({ srOnly }: { srOnly: boolean }) {
  const b = useBooking()
  const { state, notti } = b
  const persone = riepilogoPersone(state.camere, state.adulti, state.bambini)
  const dates =
    notti !== null && notti >= 1 ? riepilogoNotti(notti, formatLong(state.arrivo), formatLong(state.partenza)) : null
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={cn(srOnly ? "sr-only" : "flex flex-col gap-1 text-base leading-snug text-(--text)")}>
      {dates ? <p className="font-[weight:var(--w-strong)]">{dates}</p> : null}
      <p>{persone}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Il modulo                                                           */
/* ------------------------------------------------------------------ */

export function BookingForm({
  idPrefix,
  layout = "stack",
  children,
  className,
}: {
  idPrefix: string
  layout?: Layout
  /** In fondo (barra: di fianco ai campi) */
  children?: React.ReactNode
  className?: string
}) {
  const b = useBooking()
  const { state, errors } = b
  const bar = layout === "bar"
  const inline = !bar

  // «da oggi»: arrivo ≥ oggi; partenza ≥ arrivo + 1 (o oggi + 1 se manca l'arrivo)
  const minArrivo = b.today || undefined
  const minPartenza = isValidIso(state.arrivo) ? (addDays(state.arrivo, 1) ?? undefined) : b.today ? (addDays(b.today, 1) ?? undefined) : undefined

  const c = copy.prenota.campi
  const L = LIMITS
  const u = copyPrenotazione.unita

  const arrivoEl = (
    <BookingDate
      idPrefix={idPrefix}
      field="arrivo"
      label={c.arrivo.etichetta}
      hint={inline ? c.arrivo.aiuto : undefined}
      value={state.arrivo}
      min={minArrivo}
      onValueChange={b.setArrivo}
      error={errors.arrivo}
      inlineError={inline}
      className={bar ? "min-w-0 flex-[1_1_9.5rem]" : undefined}
    />
  )

  const partenzaEl = (
    <BookingDate
      idPrefix={idPrefix}
      field="partenza"
      label={c.partenza.etichetta}
      value={state.partenza}
      min={minPartenza}
      onValueChange={b.setPartenza}
      error={errors.partenza}
      inlineError={inline}
      className={bar ? "min-w-0 flex-[1_1_9.5rem]" : undefined}
    />
  )

  const camereEl = (
    <BookingStepper
      field="camere"
      label={c.camere.etichetta}
      value={state.camere}
      min={L.camere.min}
      max={L.camere.max}
      unit={u.camere}
      onValueChange={b.setCamere}
      error={errors.camere}
      compact={bar}
    />
  )

  const adultiEl = (
    <BookingStepper
      field="adulti"
      label={c.adulti.etichetta}
      value={state.adulti}
      min={L.adulti.min}
      max={L.adulti.max}
      unit={u.adulti}
      onValueChange={b.setAdulti}
      error={errors.adulti}
      compact={bar}
    />
  )

  const bambiniEl = (
    <BookingStepper
      field="bambini"
      label={c.bambini.etichetta}
      value={state.bambini}
      min={L.bambini.min}
      max={L.bambini.max}
      unit={u.bambini}
      onValueChange={b.setBambini}
      compact={bar}
    />
  )

  if (bar) {
    return (
      <div id={`${idPrefix}-root`} data-booking-root role="group" aria-label={copyPrenotazione.nomeGruppo} className={cn("relative", className)}>
        {/* riepilogo errori SOPRA la barra (UX 6.2); nessuna crescita della barra */}
        <ErrorSummary idPrefix={idPrefix} list className="absolute inset-x-0 bottom-[calc(100%+var(--s-5))] shadow-(--sh-1)" />
        <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
          {/* il segno della camera scelta apre una riga sua: la barra cresce solo quando c'è */}
          {state.camera ? (
            <div className="flex basis-full">
              <RoomHint part="segno" />
            </div>
          ) : null}
          {arrivoEl}
          {partenzaEl}
          {camereEl}
          {adultiEl}
          {bambiniEl}
          {children}
        </div>
        <Summary srOnly />
      </div>
    )
  }

  return (
    <div id={`${idPrefix}-root`} data-booking-root role="group" aria-label={copyPrenotazione.nomeGruppo} className={cn("flex flex-col gap-5", className)}>
      <ErrorSummary idPrefix={idPrefix} list={false} />
      <RoomHint part="scelta" />
      {/* Arrivo e Partenza: a due colonne appena c'è posto */}
      <div className="grid gap-5 min-[480px]:grid-cols-2">
        {arrivoEl}
        {partenzaEl}
      </div>
      {/* uno stepper è largo 160 px: tanti per riga quanti ne stanno, mai oltre il contenitore (320 px: uno per riga) */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-4 gap-y-5">
        {camereEl}
        {adultiEl}
        {bambiniEl}
      </div>
      <p className="-mt-2 text-sm leading-snug text-(--text-muted)">{c.bambini.aiuto}</p>
      <Summary srOnly={false} />
      {b.warning ? (
        <Status tone="neutral" role="status">
          {b.warning}
        </Status>
      ) : null}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pulsante e note                                                     */
/* ------------------------------------------------------------------ */

export function SearchLink({
  idPrefix,
  bordered = true,
  full = false,
  className,
}: {
  idPrefix: string
  /** Bordo 2 px inchiostro: sì sul telefono e sopra contenuto variabile; no nella barra (DECISIONI 4). */
  bordered?: boolean
  full?: boolean
  className?: string
}) {
  const b = useBooking()
  const busy = b.status === "opening"
  return (
    // L'onClick va sul Button (asChild lo applica al <a>) perché il Button lo sostituisce con
    // preventDefault mentre `loading` è attivo: così un secondo clic non apre una seconda scheda.
    <Button
      asChild
      variant="action"
      size="md"
      full={full}
      bordered={bordered}
      loading={busy}
      loadingText={copy.prenota.stati.apertura}
      className={className}
      onClick={(e) => b.search(e, `${idPrefix}-root`)}
    >
      <a
        href={b.href}
        target="_blank"
        rel="noopener"
        // il nome accessibile dice che si apre in una nuova scheda (UX 12); durante l'apertura si legge il testo che cambia
        aria-label={busy ? undefined : copyPrenotazione.ariaCerca}
      >
        {copy.prenota.barra.cerca}
      </a>
    </Button>
  )
}

/** Sotto il pulsante: la riga sulla camera scelta e l'esito «offline». */
export function SearchFeedback({ className }: { className?: string }) {
  const b = useBooking()
  const offline = b.status === "offline"
  if (!b.state.camera && !offline) return null
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {offline ? (
        // annunciato da announce() al clic: qui role="none" per non leggerlo due volte
        <Status tone="error" role="none">
          {copy.prenota.stati.offline}
        </Status>
      ) : null}
      <RoomHint part="motore" />
    </div>
  )
}

/**
 * Note sempre visibili sotto il widget (COPY 4.1, 12). Finché il motore non è verificato
 * (ENGINE_PARAMS_VERIFIED=false) aggiunge la nota onesta: il link apre il motore con i soli id.
 */
export function BookingNotes({ className }: { className?: string }) {
  const b = useBooking()
  return (
    <div className={cn("flex flex-col gap-3 text-sm leading-snug text-(--text-muted)", className)}>
      {!b.engineVerified ? (
        <Status tone="neutral" role="none" title={copy.prenota.stati.scegliDateSulMotore}>
          <p className="text-base">{copy.prenota.stati.parametriNonVerificati}</p>
        </Status>
      ) : null}
      <p>{copy.prenota.pagina.nota}</p>
      <p>{copy.prenota.pagina.motoreEsterno}</p>
    </div>
  )
}

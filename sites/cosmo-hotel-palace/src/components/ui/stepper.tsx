"use client"
/*
 * Stepper  [ − ]  N  [ + ]  (camere, adulti, bambini). UX 6.1, 9.
 *
 * Props
 *   label            etichetta visibile sopra (e nome del gruppo)
 *   value / defaultValue / onValueChange   controllato o no
 *   min / max        limiti (default 0 / 9)
 *   unitOne / unitOther  unità per i lettori di schermo («camera» / «camere»): si legge
 *                    «2 camere». Serializzabile (usabile da un Server Component).
 *   format(n)        alternativa a funzione (solo da Client Component); il numero visibile
 *                    resta la cifra
 *   decrementLabel / incrementLabel   nomi dei pulsanti (default «Meno {label}» / «Più {label}»)
 *   minHint / maxHint testo annunciato se si preme − al minimo o + al massimo
 *   name             <input type="hidden"> per i moduli
 *
 * Al minimo e al massimo i pulsanti sono aria-disabled (non disabled): il focus non
 * sparisce a metà pressione. Il valore sta in una regione aria-live="polite" che si
 * annuncia solo al cambio. Bottoni 48×48, distanza 8 px.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { IconMinus, IconPlus } from "./icons"

export type StepperProps = {
  label: string
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  format?: (n: number) => string
  unitOne?: string
  unitOther?: string
  decrementLabel?: string
  incrementLabel?: string
  minHint?: string
  maxHint?: string
  name?: string
  className?: string
  id?: string
}

const stepBtn = cn(
  "inline-flex size-(--control-h) shrink-0 items-center justify-center rounded-(--r-2)",
  "border-[1.5px] border-(--field-border) bg-(--field-bg) text-(--text)",
  "transition-[color,background-color,border-color,transform] duration-(--d-micro) ease-(--e-in)",
  "not-aria-disabled:hover:bg-(--chip-hover) motion-safe:not-aria-disabled:active:scale-[0.98]",
  "aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:bg-(--btn-disabled-bg) aria-disabled:text-(--btn-disabled-fg)",
)

export function Stepper({
  label,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 9,
  format,
  unitOne,
  unitOther,
  decrementLabel,
  incrementLabel,
  minHint,
  maxHint,
  name,
  className,
  id,
}: StepperProps) {
  const auto = React.useId()
  const baseId = id ?? auto
  const [inner, setInner] = React.useState(defaultValue ?? min)
  const n = value !== undefined ? value : inner
  const [hint, setHint] = React.useState("")

  const set = (next: number) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }
  const dec = () => {
    if (n <= min) return setHint(minHint ?? "")
    setHint("")
    set(n - 1)
  }
  const inc = () => {
    if (n >= max) return setHint(maxHint ?? "")
    setHint("")
    set(n + 1)
  }

  const spoken = format
    ? format(n)
    : unitOne && unitOther
      ? `${n} ${n === 1 ? unitOne : unitOther}`
      : String(n)
  const atMin = n <= min
  const atMax = n >= max

  return (
    <div role="group" aria-labelledby={`${baseId}-l`} className={cn("flex flex-col gap-2", className)}>
      <span id={`${baseId}-l`} className="text-sm leading-snug font-[weight:var(--w-strong)] text-(--text)">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={decrementLabel ?? `Meno ${label.toLowerCase()}`}
          aria-disabled={atMin || undefined}
          onClick={dec}
          className={stepBtn}
        >
          <IconMinus size={22} />
        </button>
        {/* regione viva: si legge «{etichetta}: {valore}» solo quando cambia */}
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="min-w-12 text-center text-xl leading-none font-[weight:var(--w-strong)] text-(--text) tabular-nums"
        >
          <span className="sr-only">{label}: {spoken}{hint ? `. ${hint}` : ""}</span>
          <span aria-hidden="true">{n}</span>
        </span>
        <button
          type="button"
          aria-label={incrementLabel ?? `Più ${label.toLowerCase()}`}
          aria-disabled={atMax || undefined}
          onClick={inc}
          className={stepBtn}
        >
          <IconPlus size={22} />
        </button>
      </div>
      {name ? <input type="hidden" name={name} value={n} /> : null}
    </div>
  )
}

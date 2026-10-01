"use client"
/*
 * Range: slider con etichetta, valore a parole e tastiera (giorno → sera, ora del giorno).
 * Base: <input type="range"> NATIVO, quindi tastiera gratis (frecce ±1 passo, Pagina su/giù,
 * Home/End), tocco e lettori di schermo già a posto.
 *
 * Props
 *   label            etichetta visibile (sopra)
 *   min / max / step valori numerici (default 0 / 1 / 1)
 *   value / defaultValue / onValueChange(n)
 *   valueLabels      testi a parole per posizione (indice = (valore - min) / step): vanno in
 *                    aria-valuetext e nel valore visibile; serializzabile, quindi usabile da un
 *                    Server Component (es. ["Mattina","Giorno","Tramonto","Sera"])
 *   valueText(n)     alternativa a funzione (solo da Client Component)
 *   marks            etichette sotto la traccia, una per posizione (sono decorazione: il valore
 *                    letto è valueText); con più di ~4 voci non entrano su 390 px, restano 4
 *   aria-describedby aiuto esterno
 *   disabled         aria-disabled: il cursore resta focalizzabile ma non si sposta
 *   name             nome del campo
 * Traccia alta 44 px; focus: anello doppio sul cursore. Nessuna animazione sul cursore.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import styles from "./range.module.css"

export type RangeProps = {
  label: React.ReactNode
  min?: number
  max?: number
  step?: number
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  valueText?: (value: number) => string
  valueLabels?: string[]
  marks?: string[]
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  "aria-describedby"?: string
}

export function Range({
  label,
  min = 0,
  max = 1,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  valueText,
  valueLabels,
  marks,
  disabled,
  name,
  id: idProp,
  className,
  "aria-describedby": describedBy,
}: RangeProps) {
  const auto = React.useId()
  const id = idProp ?? auto
  const [inner, setInner] = React.useState(defaultValue ?? min)
  const n = value !== undefined ? value : inner
  const text = valueText
    ? valueText(n)
    : (valueLabels?.[Math.round((n - min) / step)] ?? String(n))
  const pct = max === min ? 0 : ((n - min) / (max - min)) * 100

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm leading-snug font-[weight:var(--w-strong)] text-(--text)">
          {label}
        </label>
        <span aria-hidden="true" className="text-sm leading-snug text-(--text-muted) tabular-nums">
          {text}
        </span>
      </div>
      <input
        id={id}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={n}
        aria-valuetext={text}
        aria-describedby={describedBy}
        aria-disabled={disabled || undefined}
        className={styles.range}
        style={{ "--p": `${pct}%` } as React.CSSProperties}
        onChange={(e) => {
          if (disabled) {
            // aria-disabled non blocca il nativo: si rimette il valore
            e.target.value = String(n)
            return
          }
          const next = Number(e.target.value)
          if (value === undefined) setInner(next)
          onValueChange?.(next)
        }}
      />
      {marks && marks.length > 1 ? (
        // le etichette stanno sotto il centro del cursore di ciascuna posizione (14 px = metà cursore)
        <ul aria-hidden="true" className="relative m-0 h-5 list-none p-0 text-xs leading-tight text-(--text-muted)">
          {marks.map((m, i) => {
            const f = i / (marks.length - 1)
            const edge = i === 0 ? "start" : i === marks.length - 1 ? "end" : "mid"
            return (
              <li
                key={`${m}-${i}`}
                style={{ insetInlineStart: `calc(14px + (100% - 28px) * ${f})` }}
                className={cn(
                  "absolute top-0 whitespace-nowrap",
                  edge === "start" && "-translate-x-3.5",
                  edge === "mid" && "-translate-x-1/2",
                  edge === "end" && "-translate-x-[calc(100%-14px)]",
                  Math.round(n) === min + i * step && "font-[weight:var(--w-strong)] text-(--text)",
                )}
              >
                {m}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

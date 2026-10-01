"use client"
/*
 * Motore comune di Chip (ChipGroup) e Segmented: un gruppo di scelta esclusiva.
 * Schema ARIA «radio group» (APG): role="radiogroup" + role="radio" + aria-checked,
 * una sola voce in tabulazione (roving tabindex), frecce / Home / End spostano E
 * scelgono (le frecce Su/Giù fanno come Destra/Sinistra), Spazio e Invio scelgono.
 *
 * Voci disabilitate: aria-disabled, restano raggiungibili con le frecce (si può
 * leggere perché non sono disponibili) ma non si scelgono. La ragione, se c'è, è un
 * testo visibile sotto il gruppo, collegato con aria-describedby, con icona di divieto.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { IconBan, IconCheck } from "./icons"

export type PillOption = {
  value: string
  label: React.ReactNode
  /** nome accessibile alternativo, se l'etichetta visibile non basta */
  ariaLabel?: string
  disabled?: boolean
  /** perché non è disponibile: testo visibile sotto il gruppo */
  disabledReason?: string
}

export type RadioPillsProps = {
  options: PillOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** se presente, scrive un <input type="hidden"> con il valore (moduli) */
  name?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  /** "chip": pillole separate (40 px, tocco 44). "segmented": segmenti uniti (44 px). */
  variant: "chip" | "segmented"
  className?: string
}

export function RadioPills({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  variant,
  className,
  ...aria
}: RadioPillsProps) {
  const [inner, setInner] = React.useState<string | undefined>(defaultValue)
  const current = value !== undefined ? value : inner
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const baseId = React.useId()

  const select = (v: string) => {
    if (value === undefined) setInner(v)
    if (v !== current) onValueChange?.(v)
  }

  const firstEnabled = options.findIndex((o) => !o.disabled)
  const checkedIndex = options.findIndex((o) => o.value === current)
  const tabStop = checkedIndex >= 0 && !options[checkedIndex].disabled ? checkedIndex : firstEnabled

  const move = (from: number, step: 1 | -1 | "start" | "end") => {
    const n = options.length
    let to: number
    if (step === "start") to = 0
    else if (step === "end") to = n - 1
    else to = (from + step + n) % n
    refs.current[to]?.focus()
    if (!options[to].disabled) select(options[to].value)
  }

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    switch (e.key) {
      case "ArrowRight":
        move(i, rtl ? -1 : 1)
        break
      case "ArrowDown":
        move(i, 1)
        break
      case "ArrowLeft":
        move(i, rtl ? 1 : -1)
        break
      case "ArrowUp":
        move(i, -1)
        break
      case "Home":
        move(i, "start")
        break
      case "End":
        move(i, "end")
        break
      default:
        return
    }
    e.preventDefault()
  }

  const reasons = options.filter((o) => o.disabled && o.disabledReason)
  const seg = variant === "segmented"

  return (
    <div className={cn("flex flex-col gap-2", seg ? "w-fit max-w-full" : "", className)}>
      <div
        role="radiogroup"
        {...aria}
        className={cn(
          seg
            ? "inline-grid auto-cols-fr grid-flow-col overflow-hidden rounded-(--r-pill) border-[1.5px] border-(--chip-border)"
            : "flex flex-wrap gap-x-2 gap-y-3",
        )}
      >
        {options.map((o, i) => {
          const checked = o.value === current
          const reasonId = o.disabled && o.disabledReason ? `${baseId}-r-${i}` : undefined
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={o.ariaLabel}
              aria-disabled={o.disabled || undefined}
              aria-describedby={reasonId}
              tabIndex={i === tabStop ? 0 : -1}
              data-state={checked ? "on" : "off"}
              onClick={() => {
                if (!o.disabled) select(o.value)
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative inline-flex items-center justify-center gap-2 text-base leading-none font-[weight:var(--w-button)] tracking-(--tr-button)",
                "whitespace-nowrap select-none transition-[color,background-color,border-color] duration-(--d-micro) ease-(--e-in)",
                // stati: normale / hover / scelto / disabilitato (spunta o divieto: mai solo colore)
                "bg-transparent text-(--text)",
                "not-aria-disabled:not-aria-checked:hover:bg-(--chip-hover)",
                "aria-checked:bg-(--chip-on-bg) aria-checked:text-(--chip-on-fg)",
                "aria-disabled:cursor-not-allowed aria-disabled:bg-(--btn-disabled-bg) aria-disabled:text-(--btn-disabled-fg)",
                seg
                  ? "min-h-(--tap) px-4 py-2 [&:not(:first-child)]:border-s-[1.5px] [&:not(:first-child)]:border-s-(--chip-border)"
                  : [
                      "h-10 rounded-(--r-pill) border-[1.5px] border-(--chip-border) px-4",
                      // area di tocco 44 px senza gonfiare il pezzo visibile
                      "before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
                      "aria-disabled:border-dashed",
                    ],
              )}
            >
              {checked ? <IconCheck size={18} /> : o.disabled ? <IconBan size={18} /> : null}
              {o.label}
            </button>
          )
        })}
      </div>
      {reasons.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm leading-snug text-(--text-muted)">
          {options.map((o, i) =>
            o.disabled && o.disabledReason ? (
              <li key={o.value} id={`${baseId}-r-${i}`} className="flex items-start gap-2">
                <IconBan size={16} className="mt-0.5" />
                <span>{o.disabledReason}</span>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
      {name ? <input type="hidden" name={name} value={current ?? ""} /> : null}
    </div>
  )
}

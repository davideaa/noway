/*
 * Chip (DESIGN 4.5, UX 9).
 *
 *  - <ChipGroup>  scelta esclusiva (consigliere, filtri sala, disposizioni, tipi):
 *                 radiogroup con frecce da tastiera. Props: options[{value,label,ariaLabel,
 *                 disabled,disabledReason}], value | defaultValue, onValueChange, name,
 *                 aria-label | aria-labelledby.
 *  - <Chip>       pillola singola a interruttore (filtri multipli, «Camera: Family ✕»):
 *                 <button aria-pressed>. `pressed` undefined = azione semplice (nessun
 *                 aria-pressed). Server component: l'onClick lo passa chi lo usa.
 *
 * Altezza 40 px, area di tocco 44 (pseudo-elemento), raggio pillola, bordo --chip-border;
 * scelto: fondo --chip-on-bg, testo --chip-on-fg e SPUNTA (non solo colore).
 * Disabilitato: aria-disabled, bordo tratteggiato, icona di divieto, ragione scritta.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { IconBan, IconCheck } from "./icons"
import { RadioPills, type RadioPillsProps } from "./radio-pills"

export type { PillOption as ChipOption } from "./radio-pills"

export type ChipGroupProps = Omit<RadioPillsProps, "variant">

export function ChipGroup(props: ChipGroupProps) {
  return <RadioPills {...props} variant="chip" />
}

export type ChipProps = Omit<React.ComponentProps<"button">, "disabled"> & {
  /** stato dell'interruttore; non passarlo per un chip che è solo un'azione */
  pressed?: boolean
  /** aria-disabled: resta focalizzabile, non si attiva; scrivere la ragione e collegarla con aria-describedby */
  disabled?: boolean
}

export function Chip({ pressed, disabled = false, className, children, onClick, type, ...props }: ChipProps) {
  return (
    <button
      {...props}
      type={type ?? "button"}
      aria-pressed={pressed}
      aria-disabled={disabled || undefined}
      data-state={pressed ? "on" : "off"}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "relative inline-flex h-10 items-center justify-center gap-2 rounded-(--r-pill) border-[1.5px] border-(--chip-border) px-4",
        "text-base leading-none font-[weight:var(--w-button)] tracking-(--tr-button) whitespace-nowrap select-none",
        "bg-transparent text-(--text) transition-[color,background-color,border-color] duration-(--d-micro) ease-(--e-in)",
        "before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
        "not-aria-disabled:not-aria-pressed:hover:bg-(--chip-hover)",
        "aria-pressed:bg-(--chip-on-bg) aria-pressed:text-(--chip-on-fg)",
        "aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:bg-(--btn-disabled-bg) aria-disabled:text-(--btn-disabled-fg)",
        className,
      )}
    >
      {pressed ? <IconCheck size={18} /> : disabled ? <IconBan size={18} /> : null}
      {children}
    </button>
  )
}

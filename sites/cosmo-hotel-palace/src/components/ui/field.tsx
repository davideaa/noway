/*
 * Campi di modulo (DESIGN 4.5, UX 6, 9, 12). Tutti server component.
 *
 *  <Field>      etichetta SEMPRE visibile sopra + controllo + aiuto + errore.
 *               `children` è una funzione che riceve le props da passare al controllo:
 *               <Field label="Arrivo" hint="…" error={err}>
 *                 {(c) => <Input type="date" name="arrivo" {...c} />}
 *               </Field>
 *               c = { id, aria-describedby (aiuto + errore), aria-invalid, aria-required }.
 *               Props: label, hint, error, required (scrive «obbligatorio» in testo, non solo
 *               asterisco), requiredText, optionalText, errorPrefix («Errore: » per i lettori
 *               di schermo), id.
 *  <Input>      input a 48 px: text, email, tel, number e **date nativo** (stile uniforme,
 *               16 px: iOS non zooma). `invalid` aggiunge aria-invalid + bordo 2 px --danger.
 *  <Textarea>, <Select>   stessi stati.
 *  <CheckField> casella (consenso): quadrato visibile 24 px dentro un'area di tocco da 44.
 *
 * Stati: normale · hover (bordo --text) · focus (anello + bordo --brand) · disabilitato (fondo
 * --bg-sunk) · errore (bordo --danger 2 px + icona + testo sotto, aria-invalid).
 * Il pulsante di invio non si disabilita mai: gli errori si dicono, non si nascondono.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { IconAlert, IconCheck, IconChevronDown } from "./icons"

export type ControlProps = {
  id: string
  "aria-describedby"?: string
  "aria-invalid"?: true
  "aria-required"?: true
}

export type FieldProps = {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  /** testo che segna il campo obbligatorio (default «obbligatorio») */
  requiredText?: string
  /** testo per i facoltativi, se si vuole dichiararli (es. «facoltativo») */
  optionalText?: string
  errorPrefix?: string
  id?: string
  className?: string
  children: (control: ControlProps) => React.ReactNode
}

export function Field({
  label,
  hint,
  error,
  required,
  requiredText = "obbligatorio",
  optionalText,
  errorPrefix = "Errore: ",
  id: idProp,
  className,
  children,
}: FieldProps) {
  const auto = React.useId()
  const id = idProp ?? auto
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  const control: ControlProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "aria-required": required ? true : undefined,
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm leading-snug font-[weight:var(--w-strong)] text-(--text)">
        {label}
        {required ? (
          <span className="ms-2 font-normal text-(--text-muted)">({requiredText})</span>
        ) : optionalText ? (
          <span className="ms-2 font-normal text-(--text-muted)">({optionalText})</span>
        ) : null}
      </label>
      {children(control)}
      {hint ? (
        <p id={hintId} className="text-sm leading-snug text-(--text-muted)">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-2 text-sm leading-snug font-[weight:var(--w-strong)] text-(--danger)">
          <IconAlert size={18} className="mt-px" />
          <span>
            <span className="sr-only">{errorPrefix}</span>
            {error}
          </span>
        </p>
      ) : null}
    </div>
  )
}

/* ───────── controlli ───────── */

const control = cn(
  "block w-full min-h-(--control-h) rounded-(--r-2) border-[1.5px] border-(--field-border) bg-(--field-bg) px-4 text-(--text)",
  "transition-[border-color,background-color] duration-(--d-micro) ease-(--e-in)",
  "placeholder:text-(--text-subtle)",
  "not-disabled:hover:border-(--field-border-hover)",
  "focus-visible:border-(--field-border-focus)",
  "disabled:cursor-not-allowed disabled:bg-(--field-disabled-bg) disabled:text-(--text-subtle)",
  // errore: 1,5 px di bordo + 0,5 px interni = 2 px, senza spostare il layout
  "aria-[invalid=true]:border-(--field-border-error) aria-[invalid=true]:shadow-[inset_0_0_0_0.5px_var(--field-border-error)]",
)

export type InputProps = React.ComponentProps<"input"> & { invalid?: boolean }

export function Input({ invalid, className, type = "text", ...props }: InputProps) {
  return (
    <input
      {...props}
      type={type}
      aria-invalid={invalid ? true : props["aria-invalid"]}
      className={cn(
        control,
        "py-2",
        // data nativa: stessa altezza su iOS (che altrimenti la comprime) e testo a sinistra
        (type === "date" || type === "time" || type === "datetime-local") &&
          "appearance-none text-start [&::-webkit-date-and-time-value]:min-h-6 [&::-webkit-date-and-time-value]:text-start",
        className,
      )}
    />
  )
}

export type TextareaProps = React.ComponentProps<"textarea"> & { invalid?: boolean }

export function Textarea({ invalid, className, rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      aria-invalid={invalid ? true : props["aria-invalid"]}
      className={cn(control, "min-h-28 resize-y py-3 leading-normal", className)}
    />
  )
}

export type SelectProps = React.ComponentProps<"select"> & { invalid?: boolean }

export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        aria-invalid={invalid ? true : props["aria-invalid"]}
        className={cn(control, "cursor-pointer appearance-none py-2 pe-12", className)}
      >
        {children}
      </select>
      <IconChevronDown
        size={22}
        className="pointer-events-none absolute inset-e-4 top-1/2 -translate-y-1/2 text-(--text)"
      />
    </div>
  )
}

/* ───────── casella ───────── */

export type CheckFieldProps = Omit<React.ComponentProps<"input">, "type" | "children"> & {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  errorPrefix?: string
}

export function CheckField({ label, hint, error, errorPrefix = "Errore: ", id: idProp, className, ...props }: CheckFieldProps) {
  const auto = React.useId()
  const id = idProp ?? auto
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="flex min-h-(--tap) cursor-pointer items-start gap-3 py-2 text-base leading-normal text-(--text)">
        <span className="relative mt-px inline-flex size-6 shrink-0">
          <input
            {...props}
            id={id}
            type="checkbox"
            aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              "peer size-6 cursor-pointer appearance-none rounded-(--r-1) border-[1.5px] border-(--field-border) bg-(--field-bg)",
              "transition-[background-color,border-color] duration-(--d-micro) ease-(--e-in)",
              "not-disabled:hover:border-(--field-border-hover) checked:border-(--chip-on-bg) checked:bg-(--chip-on-bg)",
              "aria-[invalid=true]:border-(--field-border-error) aria-[invalid=true]:shadow-[inset_0_0_0_0.5px_var(--field-border-error)]",
              "disabled:cursor-not-allowed disabled:bg-(--field-disabled-bg)",
            )}
          />
          <IconCheck
            size={18}
            strokeWidth={3}
            className="pointer-events-none absolute inset-1 text-(--chip-on-fg) opacity-0 transition-opacity duration-(--d-micro) peer-checked:opacity-100"
          />
        </span>
        <span>{label}</span>
      </label>
      {hint ? (
        <p id={hintId} className="ps-9 text-sm leading-snug text-(--text-muted)">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-2 ps-9 text-sm leading-snug font-[weight:var(--w-strong)] text-(--danger)">
          <IconAlert size={18} className="mt-px" />
          <span>
            <span className="sr-only">{errorPrefix}</span>
            {error}
          </span>
        </p>
      ) : null}
    </div>
  )
}

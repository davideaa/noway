"use client"
/*
 * DateField: <Field> + <input type="date"> nativo (UX 6.1). Aggiunge solo ciò che
 * il nativo non fa: su desktop il clic su tutto il campo apre il selettore
 * (`showPicker()`, in try/catch: dove non c'è, resta il campo normale).
 * Le date sono stringhe 'AAAA-MM-GG'; non si converte mai con new Date('AAAA-MM-GG')
 * (fuso orario). Props: quelle di Field (label, hint, error, required…) +
 * name, value | defaultValue, onChange (stringa), min, max, disabled.
 */
import * as React from "react"
import { Field, Input, type FieldProps } from "./field"

export type DateFieldProps = Omit<FieldProps, "children"> & {
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  min?: string
  max?: string
  disabled?: boolean
  autoComplete?: string
}

export function DateField({ name, value, defaultValue, onValueChange, onBlur, min, max, disabled, autoComplete, ...field }: DateFieldProps) {
  return (
    <Field {...field}>
      {(c) => (
        <Input
          {...c}
          type="date"
          name={name}
          value={value}
          defaultValue={defaultValue}
          min={min}
          max={max}
          disabled={disabled}
          autoComplete={autoComplete}
          onChange={(e) => onValueChange?.(e.target.value)}
          onBlur={onBlur}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.()
            } catch {
              /* showPicker può lanciare (iframe, gesto mancante): il campo resta usabile */
            }
          }}
        />
      )}
    </Field>
  )
}

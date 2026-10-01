/*
 * Segmented: scelta esclusiva a 2-3 voci unite (3D | Pianta, Giorno | Sera).
 * Stessa meccanica del ChipGroup (radiogroup, frecce / Home / End, roving tabindex),
 * ma i segmenti sono incollati in un'unica pillola, alti 44 px, di uguale larghezza.
 *
 * Props: options[{value,label,ariaLabel,disabled,disabledReason}], value | defaultValue,
 * onValueChange, name, aria-label | aria-labelledby (obbligatorio uno dei due: il gruppo
 * non ha etichetta visibile; COPY: «Luce della camera: giorno», «Mostra la pianta in scala»).
 * Una voce non disponibile (es. «3D» senza WebGL) è aria-disabled e la ragione sta scritta
 * sotto il gruppo (`disabledReason`).
 */
import { RadioPills, type RadioPillsProps } from "./radio-pills"

export type { PillOption as SegmentedOption } from "./radio-pills"
export type SegmentedProps = Omit<RadioPillsProps, "variant">

export function Segmented(props: SegmentedProps) {
  return <RadioPills {...props} variant="segmented" />
}

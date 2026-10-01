"use client"
/*
 * ContactChoice: «Prenota un tavolo» (UX 4.3 scena 5, UX 8 ristorazione). Un pulsante che apre
 * (`aria-expanded`) due link da 48 px: «Chiama {telefono}» e «Scrivi a {email}». Non c'è prenotazione
 * online dei tavoli finché il cliente non lo conferma (DECISIONI 11).
 *
 * Uso:
 *   <ContactChoice label={copy.ristorazione.prenotaTavolo} />                  // reparto Ristorante
 *   <ContactChoice label="Chiedi informazioni" reparto="prenotazioni" variant="outline" />
 *
 * Props
 *   label     testo del pulsante (obbligatorio: lo scrive la pagina)
 *   reparto   "ristorante" (default) | "prenotazioni" | "eventi" | "commerciale" — numero ed email da content/contacts
 *   variant   variante del pulsante principale: "brand" (default; su fondo sera diventa chiaro da sé) | "outline" | "action"
 *   size      "md" (48, default) | "sm" | "lg"
 *   full      pulsante a tutta larghezza
 *   className sul contenitore
 *
 * Il pannello si apre sotto il pulsante (nel flusso, niente popover che copre altro). Esc lo chiude e
 * rimette il focus sul pulsante; il secondo clic sul pulsante lo chiude. Senza JavaScript i due link
 * sono già in pagina (<noscript>). Nessuna animazione di movimento: il pannello compare e basta.
 */
import * as React from "react"
import { Icon } from "@/components/art/Icons"
import { Button, type ButtonProps } from "@/components/ui/button"
import { IconChevronDown } from "@/components/ui/icons"
import { repartoById, type RepartoId } from "@/content/contacts"
import { copy, fmt } from "@/content/copy"
import { copyShell } from "@/content/copy-shell"
import { cn } from "@/lib/utils"

export type ContactChoiceProps = {
  label: string
  reparto?: RepartoId
  variant?: Extract<NonNullable<ButtonProps["variant"]>, "brand" | "outline" | "action">
  size?: "sm" | "md" | "lg"
  full?: boolean
  className?: string
}

const LINKS_CLASS = "flex flex-col gap-3 *:w-full sm:flex-row sm:flex-wrap sm:*:w-auto"

export function ContactChoice({
  label,
  reparto = "ristorante",
  variant = "brand",
  size = "md",
  full = false,
  className,
}: ContactChoiceProps) {
  const r = repartoById(reparto)
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  const panel = `${id}-panel`
  const trigger = React.useRef<HTMLButtonElement>(null)

  const callText = fmt(copyShell.chiamaNumero, { telefono: r.telefono })
  const mailText = fmt(copyShell.scriviA, { email: r.email })
  const groupLabel = fmt(copyShell.ariaContactChoice, { reparto: r.nome })

  const links = (
    <>
      <Button asChild variant="outline" size="md" aria-label={fmt(copy.contatti.ariaChiama, { reparto: r.nome, numero: r.telefono })}>
        <a href={`tel:${r.telHref}`}>
          <Icon nome="telefono" size={22} />
          {callText}
        </a>
      </Button>
      <Button asChild variant="outline" size="md" aria-label={fmt(copy.contatti.ariaScrivi, { reparto: r.nome, email: r.email })}>
        <a href={`mailto:${r.email}`}>
          <Icon nome="email" size={22} />
          {mailText}
        </a>
      </Button>
    </>
  )

  return (
    <div
      className={cn("flex flex-col gap-3", full ? "w-full" : "w-fit max-w-full", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation()
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <Button
        ref={trigger}
        variant={variant}
        size={size}
        full={full}
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <IconChevronDown size={20} className={cn("motion-safe:transition-transform motion-safe:duration-(--d-micro)", open && "rotate-180")} />
      </Button>

      <div id={panel} role="group" aria-label={groupLabel} hidden={!open} className={LINKS_CLASS}>
        {links}
      </div>

      <noscript>
        <div role="group" aria-label={groupLabel} className={LINKS_CLASS}>
          {links}
        </div>
      </noscript>
    </div>
  )
}

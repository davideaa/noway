/*
 * Pulsante (DESIGN 4.5, UX 9, DECISIONI 4). Server component: nessuno stato interno.
 *
 * Varianti
 *   action   miele pieno: l'UNICO miele pieno della schermata (prenota / cerca).
 *            `bordered` (default true) = bordo 2 px inchiostro (pillola telefono e
 *            miele sopra contenuto variabile); `bordered={false}` nella barra su fondo uniforme.
 *   brand    verde pieno (sera: testo chiaro su fondo scuro, vedi data-tono)
 *   outline  bordo 1,5 px, fondo trasparente
 *   ghost    nessun bordo, per azioni secondarie (chiudi, ecc.)
 *   link     testo sottolineato con freccia opzionale
 *
 * Stati
 *   disabled  -> aria-disabled="true": resta focalizzabile, non si attiva, niente onClick,
 *                `type="button"`. Mai solo opacità: fondo --btn-disabled-bg, testo
 *                --btn-disabled-fg, bordo tratteggiato. La ragione la scrive chi lo usa
 *                (collegarla con aria-describedby).
 *   nativeDisabled -> attributo `disabled` vero (esce dall'ordine di tabulazione).
 *   loading   -> aria-busy="true", `loadingText` al posto del contenuto, nessuna rotellina.
 *   asChild   -> applica stile e stato al figlio (un <a>, un <Link>): un solo elemento.
 *                Se disabilitato il figlio diventa <span role="link" aria-disabled tabindex=0>.
 *
 * Tocco: ogni taglia è alta almeno 44 px (md 48, sm 44, lg 56). Transizioni solo su
 * colore e scala, con i token di durata; nessun will-change, nessun backdrop-filter.
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { IconArrowRight } from "./icons"

export const buttonVariants = cva(
  [
    "relative inline-flex max-w-full items-center justify-center gap-2 box-border",
    "rounded-(--r-2) text-center text-base leading-tight font-[weight:var(--w-button)] tracking-(--tr-button)",
    "select-none no-underline",
    "transition-[color,background-color,border-color,transform] duration-(--d-micro) ease-(--e-in)",
    "motion-safe:not-aria-disabled:active:scale-[0.98]",
    "aria-[busy=true]:cursor-progress",
    // disabilitato: fondo e testo dedicati + bordo tratteggiato (non solo opacità)
    "aria-disabled:cursor-not-allowed aria-disabled:border-[1.5px] aria-disabled:border-dashed",
    "aria-disabled:border-(--border-strong) aria-disabled:bg-(--btn-disabled-bg) aria-disabled:text-(--btn-disabled-fg)",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        action: [
          "border-2 bg-(--btn-action-bg) text-(--btn-action-fg)",
          "not-aria-disabled:hover:bg-(--btn-action-hover)",
          // premuto: miele più scuro dell'8%
          "not-aria-disabled:active:bg-[color-mix(in_srgb,var(--btn-action-bg),black_8%)]",
        ],
        brand: [
          "border-0 bg-(--btn-brand-bg) text-(--btn-brand-fg)",
          "not-aria-disabled:hover:bg-(--btn-brand-press)",
          "not-aria-disabled:active:bg-(--btn-brand-press)",
        ],
        outline: [
          "border-[1.5px] border-(--btn-outline-border) bg-transparent text-(--text)",
          "not-aria-disabled:hover:bg-(--btn-outline-hover)",
          "not-aria-disabled:active:bg-(--btn-outline-hover)",
        ],
        ghost: [
          "border-0 bg-transparent text-(--text)",
          "not-aria-disabled:hover:bg-(--btn-outline-hover)",
          "not-aria-disabled:active:bg-(--btn-outline-hover)",
        ],
        link: [
          "min-h-(--tap) rounded-(--r-1) border-0 bg-transparent px-0 text-(--link)",
          "underline decoration-[1.5px] underline-offset-4 decoration-(--link-underline)",
          "not-aria-disabled:hover:decoration-2",
          "aria-disabled:border-0 aria-disabled:bg-transparent aria-disabled:no-underline",
        ],
      },
      size: {
        sm: "min-h-(--tap) px-4",
        md: "min-h-(--control-h) px-(--s-5)",
        lg: "min-h-14 px-(--s-6)",
        icon: "size-(--control-h) p-0",
        "icon-sm": "size-(--tap) p-0",
      },
      full: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // il link ignora padding e taglia piena: resta in linea con il testo
      { variant: "link", size: ["sm", "md", "lg"], className: "px-0 min-h-(--tap)" },
      // il bordo tratteggiato dell'azione disabilitata non sposta il testo
      { variant: "action", className: "aria-disabled:border-2" },
    ],
    defaultVariants: { variant: "brand", size: "md", full: false },
  },
)

type ButtonVariantProps = VariantProps<typeof buttonVariants>

export type ButtonProps = Omit<React.ComponentProps<"button">, "disabled"> & {
  variant?: NonNullable<ButtonVariantProps["variant"]>
  size?: NonNullable<ButtonVariantProps["size"]>
  /** larghezza piena (telefono: pulsante solo in riga) */
  full?: boolean
  /** applica stile e attributi al figlio unico (<a>, <Link>) invece di rendere un <button> */
  asChild?: boolean
  /** aria-disabled: resta focalizzabile e non si attiva */
  disabled?: boolean
  /** attributo `disabled` nativo (esce dalla tabulazione): usare solo quando serve davvero */
  nativeDisabled?: boolean
  /** aria-busy + `loadingText`; l'azione è sospesa */
  loading?: boolean
  loadingText?: React.ReactNode
  /** bordo 2 px inchiostro sul miele (default true; false nella barra su fondo uniforme) */
  bordered?: boolean
  /** freccia finale (soprattutto per la variante link) */
  arrow?: boolean
  /**
   * anello di focus: "auto" = doppio sul miele, singolo altrove; "double" lo forza
   * (pulsanti sopra scene 3D o contenuto variabile).
   */
  focusRing?: "auto" | "single" | "double"
}

function Button({
  variant = "brand",
  size = "md",
  full = false,
  asChild = false,
  disabled = false,
  nativeDisabled = false,
  loading = false,
  loadingText,
  bordered = true,
  arrow = false,
  focusRing = "auto",
  className,
  children,
  type,
  onClick,
  ...props
}: ButtonProps) {
  const inert = disabled || nativeDisabled
  const blocked = inert || loading
  const double = focusRing === "double" || (focusRing === "auto" && variant === "action")

  const classes = cn(
    buttonVariants({ variant, size, full }),
    variant === "action" && !bordered && "border-transparent",
    variant === "action" && bordered && "border-(--btn-action-border)",
    className,
  )

  const common = {
    "data-slot": "button",
    "data-variant": variant,
    "data-focus-ring": double ? "double" : undefined,
    "aria-disabled": inert ? true : undefined,
    "aria-busy": loading ? true : undefined,
  } as const

  const arrowIcon = arrow ? <IconArrowRight size={20} /> : null
  const swap = (content: React.ReactNode) =>
    loading && loadingText != null ? loadingText : content

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<
      React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode; href?: string }
    >
    const inner = (
      <>
        {swap(child.props.children)}
        {arrowIcon}
      </>
    )
    if (inert) {
      // un link senza href non si focalizza: lo si sostituisce con uno span focalizzabile
      return (
        <span {...(props as React.HTMLAttributes<HTMLSpanElement>)} {...common} role="link" tabIndex={0} className={classes}>
          {inner}
        </span>
      )
    }
    return React.cloneElement(
      child,
      {
        ...(props as React.HTMLAttributes<HTMLElement>),
        ...common,
        className: cn(classes, child.props.className),
        onClick: loading ? (e: React.MouseEvent<HTMLElement>) => e.preventDefault() : onClick as React.MouseEventHandler<HTMLElement>,
      },
      inner,
    )
  }

  return (
    <button
      {...props}
      {...common}
      // un pulsante bloccato non invia mai un modulo
      type={blocked ? "button" : (type ?? "button")}
      disabled={nativeDisabled || undefined}
      onClick={blocked ? undefined : onClick}
      className={classes}
    >
      {swap(children)}
      {arrowIcon}
    </button>
  )
}

export { Button }

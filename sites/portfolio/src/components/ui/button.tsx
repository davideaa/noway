import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Bottoni del sito. Stile da DESIGN.md: raggio 8, area di tocco 44 px,
 * focus = outline lime (come globals.css), hover con scala 1,02 in 180 ms
 * (MOTION.md), nessuno spostamento verticale. Colori solo da token.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap outline-none select-none transition-[transform,background-color,border-color,color] duration-[180ms] ease-[var(--ease)] focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-acc disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--glow-cta)] hover:bg-[color-mix(in_srgb,var(--acc)_88%,white)]",
        outline: "border-line3 bg-surf text-ink hover:border-acc hover:bg-acc2",
        ghost: "text-ink hover:bg-acc2",
        link: "text-primary underline underline-offset-4",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-11 px-4",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

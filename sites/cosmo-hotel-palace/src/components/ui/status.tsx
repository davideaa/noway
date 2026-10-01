/*
 * Stato / avviso (UX 9): icona + testo, mai solo colore.
 *
 * tone   "ok" | "error" | "neutral"
 * role   default: error -> "alert" (assertivo, per ciò che blocca); ok e neutral -> "status"
 *        (educato). `role="none"` per un messaggio statico, fisso nella pagina
 *        fin dall'inizio (un messaggio che compare già scritto non viene annunciato
 *        in modo affidabile: per gli annunci a comparsa usare lib/a11y.announce o
 *        tenere il contenitore sempre in pagina e cambiarne il testo).
 * title  riga in grassetto opzionale
 * children il testo
 * Il colore del testo resta --text (contrasto pieno); tono e icona vanno su bordo e glifo.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { IconAlert, IconCircleCheck, IconInfo } from "./icons"

export type StatusProps = Omit<React.ComponentProps<"div">, "title"> & {
  tone?: "ok" | "error" | "neutral"
  title?: React.ReactNode
  role?: "alert" | "status" | "none"
}

const tones = {
  ok: { Icon: IconCircleCheck, border: "border-(--ok)", icon: "text-(--ok)", role: "status" as const },
  error: { Icon: IconAlert, border: "border-(--danger)", icon: "text-(--danger)", role: "alert" as const },
  neutral: { Icon: IconInfo, border: "border-(--border-strong)", icon: "text-(--text-muted)", role: "status" as const },
}

export function Status({ tone = "neutral", title, role, className, children, ...props }: StatusProps) {
  const t = tones[tone]
  const r = role ?? t.role
  return (
    <div
      {...props}
      role={r === "none" ? undefined : r}
      data-tone={tone}
      className={cn(
        "flex items-start gap-3 rounded-(--r-2) border-[1.5px] bg-(--bg-alt) p-4 text-base leading-normal text-(--text)",
        t.border,
        className,
      )}
    >
      <t.Icon size={24} className={cn("mt-px shrink-0", t.icon)} />
      <div className="min-w-0">
        {title ? <p className="font-[weight:var(--w-strong)]">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1", "[&>p]:max-w-none")}>{children}</div> : null}
      </div>
    </div>
  )
}

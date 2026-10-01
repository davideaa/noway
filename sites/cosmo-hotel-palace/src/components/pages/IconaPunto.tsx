/*
 * Icona di un punto del Wellness. Il set proprio (art/Icons) non ha un manubrio per le macchine
 * (chest press, pulldown, leg extension): ne disegno una qui, con lo stesso tratto (24 px, 1,5).
 */
import { Icon, type IconName } from "@/components/art/Icons";

const ICONE: Record<string, IconName | "manubrio"> = {
  sauna: "sauna",
  turco: "bagno-turco",
  "tapis-roulant": "tapis-roulant",
  cyclette: "cyclette",
  macchine: "manubrio",
};

export function IconaPunto({ id, size = 24 }: { id: string; size?: number }) {
  const n = ICONE[id];
  if (n === "manubrio") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11" />
      </svg>
    );
  }
  return <Icon nome={n ?? "info"} size={size} />;
}

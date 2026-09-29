import { TriangleAlert } from "lucide-react";

/** Barra fissa in fondo allo schermo, sempre visibile (COPY.md, "Navigazione e barra fissa"). */
export function RiskBar() {
  return (
    <div className="riskbar" role="region" aria-label="Avviso sul rischio">
      <div className="wrap flex items-start gap-3 py-2 text-xs leading-[1.5] text-ink md:items-center md:py-3 md:text-sm">
        <TriangleAlert size={18} strokeWidth={1.6} className="mt-[1px] shrink-0 text-warn md:mt-0" aria-hidden />
        <p>
          Backtest su dati storici, non risultati reali. Trading ad alto rischio. Non è consulenza finanziaria.{" "}
          <a href="#avviso" className="textlink whitespace-nowrap py-2 font-semibold">
            Leggi l&rsquo;avviso completo
          </a>
        </p>
      </div>
    </div>
  );
}

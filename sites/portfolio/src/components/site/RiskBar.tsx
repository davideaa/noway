import { RISK_BAR } from "@/lib/site";

/**
 * Barra fissa in fondo allo schermo, sempre visibile (brief di Davide: testo
 * esatto, mono piccola, discreta). Il link porta all'avviso completo.
 */
export function RiskBar() {
  return (
    <div className="riskbar" role="region" aria-label="Avviso breve sul rischio">
      <div className="wrap riskbar__in">
        <p className="riskbar__text mono">{RISK_BAR}</p>
        <a href="/dettagli#avviso" className="riskbar__link mono">
          Avviso completo
        </a>
      </div>
    </div>
  );
}

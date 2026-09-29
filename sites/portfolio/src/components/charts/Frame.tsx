import type { ReactNode } from "react";
import { BacktestTag } from "@/components/site/ui";

/**
 * Cornice comune di ogni grafico: titolo, etichetta "Backtest", unita' (R),
 * legenda (solo con due o piu' serie), descrizione per screen reader, fonte,
 * e "Vedi i numeri": la tabella gemella, cosi' nessun valore e' raggiungibile
 * solo con il colore o con il puntatore.
 */
export type VoceLegenda = { nome: string; colore: string; tipo?: "linea" | "area" | "quadrato"; tratteggio?: boolean; opacita?: number };
export type Cella = string | number | { v: string; span: number };
export type Tabella = { intestazioni: string[]; righe: Cella[][]; didascalia?: string };

export const FONTE_DEFAULT = "Fonte: simulatore del portafoglio, misura di settembre 2026, operazione per operazione.";

export function Legenda({ voci }: { voci: VoceLegenda[] }) {
  if (voci.length < 2) return null;
  return (
    <ul className="chart__legend" aria-label="Legenda">
      {voci.map((v) => (
        <li key={v.nome}>
          <span
            aria-hidden="true"
            className={`chart__swatch chart__swatch--${v.tipo ?? "linea"}${v.tratteggio ? " chart__swatch--dash" : ""}`}
            style={{ color: v.colore, opacity: v.opacita ?? 1 }}
          />
          {v.nome}
        </li>
      ))}
    </ul>
  );
}

export function ChartFrame({
  id,
  titolo,
  sotto,
  unita = "R",
  descrizione,
  legenda,
  fonte = FONTE_DEFAULT,
  nota,
  tabella,
  children,
}: {
  id: string;
  titolo: string;
  sotto?: ReactNode;
  unita?: string;
  /** cosa mostra il grafico, per chi non lo vede (COPY.md sez. 5: dice sempre "backtest") */
  descrizione: string;
  legenda?: VoceLegenda[];
  fonte?: string;
  nota?: ReactNode;
  tabella?: Tabella;
  children: ReactNode;
}) {
  return (
    <figure className="chart" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}>
      <figcaption className="chart__head">
        <div className="min-w-0">
          <p id={`${id}-t`} className="chart__title">
            {titolo}
          </p>
          {sotto && <p className="chart__sub">{sotto}</p>}
        </div>
        <div className="chart__tags">
          <BacktestTag />
          <span className="chart__unit mono">unità: {unita}</span>
        </div>
      </figcaption>
      <p id={`${id}-d`} className="sr-only">
        {descrizione}
      </p>
      {legenda && <Legenda voci={legenda} />}
      {children}
      {nota && <div className="chart__note">{nota}</div>}
      <p className="chart__source t-note">{fonte}</p>
      {tabella && (
        <details className="chart__table">
          <summary>Vedi i numeri</summary>
          <div className="tscroll mt-3">
            <table className="dtable dtable--narrow">
              {tabella.didascalia && <caption>{tabella.didascalia}</caption>}
              <thead>
                <tr>
                  {tabella.intestazioni.map((h, i) => (
                    <th key={h} scope="col" className={i ? "r" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabella.righe.map((r, k) => (
                  <tr key={k}>
                    {r.map((c, i) => {
                      const cella = typeof c === "object" ? c : { v: String(c), span: 1 };
                      return i === 0 ? (
                        <th key={i} scope="row">
                          {cella.v}
                        </th>
                      ) : (
                        <td key={i} className={cella.span > 1 ? "t-sec" : "r"} colSpan={cella.span > 1 ? cella.span : undefined}>
                          {cella.v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}

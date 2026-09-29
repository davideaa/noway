import { TriangleAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EMAIL_SHOWN, MAILTO, RISK_STATEMENT } from "@/lib/site";
import dati from "../../../data/strategie.json";
import { MagneticCta } from "@/components/film/MagneticCta";
import { BacktestTag, SceneHeader } from "@/components/site/ui";

/**
 * RIEPILOGO (in cima a /dettagli, subito dopo l'hero): per ciascuna strategia
 * dentro/fuori campione e il portafoglio, da data/strategie.json (letto in
 * build: nel bundle arrivano solo i numeri gia' scritti). Etichetta "Backtest ·
 * validato fuori campione" e il rischio accanto a ogni rendimento (DESIGN.md
 * sez. 12). Era il pannello finale del film; Davide ha voluto il film che finisce
 * su un solo bottone verso questa pagina.
 */
type Blocco = { n: number; somma_R: number; R_per_op: number; t: number; vinte_pct: number };
type Strat = {
  dentro_campione: Blocco;
  fuori_campione: Blocco & { da: string };
  per_anno_R: Record<string, number>;
  anno_migliore: string;
  anno_peggiore: string;
  max_drawdown_R_backtest: number;
  perdite_consecutive_max: number;
  per_mese_R: Record<string, number>;
  primo_mese: string;
};

const S = dati.strategie as unknown as Record<"oro" | "nasdaq" | "usdjpy", Strat>;
const CORR = dati.correlazione_mensile as Record<string, number>;

const META = [
  { id: "oro" as const, nome: "Oro", mercato: "XAUUSD", colore: "var(--st-oro)" },
  { id: "nasdaq" as const, nome: "Nasdaq", mercato: "NAS100", colore: "var(--st-nas)" },
  { id: "usdjpy" as const, nome: "USDJPY", mercato: "USDJPY", colore: "var(--st-usdjpy)" },
];

/* formattazione italiana: virgola decimale, meno tipografico, segno esplicito sui rendimenti */
const it = (v: number, d: number) => v.toFixed(d).replace("-", "−").replace(".", ",");
const signed = (v: number, d: number) => (v > 0 ? "+" : "") + it(v, d);
const int = (v: number) => v.toLocaleString("it-IT");
const meseIt = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"][Number(m) - 1]} ${y}`;
};
const mesePrima = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Mesi in cui tutte e tre hanno perso (e guadagnato), sui mesi comuni. */
function mesiInsieme() {
  const chiavi = Object.keys(S.oro.per_mese_R).filter((k) => k in S.nasdaq.per_mese_R && k in S.usdjpy.per_mese_R);
  let neg = 0;
  let pos = 0;
  for (const k of chiavi) {
    const v = [S.oro.per_mese_R[k], S.nasdaq.per_mese_R[k], S.usdjpy.per_mese_R[k]];
    if (v.every((x) => x < 0)) neg++;
    if (v.every((x) => x > 0)) pos++;
  }
  return { n: chiavi.length, neg, pos };
}

const RIGHE: { k: keyof Blocco; label: string; f: (v: number) => string }[] = [
  { k: "n", label: "Operazioni", f: (v) => int(v) },
  { k: "R_per_op", label: "R per operazione", f: (v) => signed(v, 4) },
  { k: "somma_R", label: "Somma R", f: (v) => signed(v, 1) + " R" },
  { k: "t", label: "t", f: (v) => it(v, 2) },
  { k: "vinte_pct", label: "Vinte", f: (v) => it(v, 1) + " %" },
];

function Card({ id, nome, mercato, colore }: (typeof META)[number]) {
  const s = S[id];
  const dentro = s.dentro_campione;
  const fuori = s.fuori_campione;
  return (
    <article className="film-card" style={{ "--zc": colore } as React.CSSProperties} aria-labelledby={`fc-${id}`}>
      <header className="film-card__head">
        <h3 id={`fc-${id}`} className="film-card__name">
          <span className="film-card__dot" aria-hidden="true" />
          {nome}
        </h3>
        <span className="film-card__mkt mono">{mercato}</span>
      </header>
      <table className="film-table">
        <caption className="sr-only">
          {nome}: dentro campione ({meseIt(s.primo_mese)} – {meseIt(mesePrima(fuori.da))}) e fuori campione (dal {meseIt(fuori.da)})
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Misura</span>
            </th>
            <th scope="col">
              Dentro <small>{s.primo_mese.slice(0, 4)}–{mesePrima(fuori.da).slice(0, 4)}</small>
            </th>
            <th scope="col">
              Fuori <small>dal {meseIt(fuori.da)}</small>
            </th>
          </tr>
        </thead>
        <tbody>
          {RIGHE.map((r) => (
            <tr key={r.k}>
              <th scope="row">{r.label}</th>
              <td>{r.f(dentro[r.k])}</td>
              <td>{r.f(fuori[r.k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="film-card__facts">
        <div>
          <dt>Anno migliore</dt>
          <dd>
            {s.anno_migliore} <span className="mono">{signed(s.per_anno_R[s.anno_migliore], 1)} R</span>
          </dd>
        </div>
        <div>
          <dt>Anno peggiore</dt>
          <dd>
            {s.anno_peggiore} <span className="mono">{signed(s.per_anno_R[s.anno_peggiore], 1)} R</span>
          </dd>
        </div>
      </dl>
      {/* il rischio accanto al rendimento: stessa carta, stessa dimensione */}
      <p className="film-card__risk">
        <TriangleAlert size={14} strokeWidth={1.6} aria-hidden />
        <span>
          Rischio: drawdown del backtest <b>{it(s.max_drawdown_R_backtest, 1)} R</b>, {s.perdite_consecutive_max} perdite di fila.
        </span>
      </p>
    </article>
  );
}

export function Riepilogo() {
  const mi = mesiInsieme();
  return (
    <section id="riepilogo" data-scene className="scene" aria-labelledby="riepilogo-t">
      <div className="wrap riepilogo">
        <SceneHeader n="02" label="Riepilogo" id="riepilogo-t" title={["Tre strategie,", "una pagina di numeri"]} />
        <BacktestTag />

        <div className="film-cards">
          {META.map((m) => (
            <Card key={m.id} {...m} />
          ))}
        </div>

        <section className="film-card film-card--port" aria-labelledby="fc-port" style={{ "--zc": "var(--acc)" } as React.CSSProperties}>
          <header className="film-card__head">
            <h3 id="fc-port" className="film-card__name">
              <span className="film-card__dot" aria-hidden="true" />
              Portafoglio
            </h3>
            <span className="film-card__mkt mono">{CORR.mesi} mesi</span>
          </header>
          <div className="film-port">
            <dl className="film-port__corr">
              <div>
                <dt>Oro – Nasdaq</dt>
                <dd className="mono">{signed(CORR["oro-nasdaq"], 2)}</dd>
              </div>
              <div>
                <dt>Oro – USDJPY</dt>
                <dd className="mono">{signed(CORR["oro-usdjpy"], 2)}</dd>
              </div>
              <div>
                <dt>Nasdaq – USDJPY</dt>
                <dd className="mono">{signed(CORR["nasdaq-usdjpy"], 2)}</dd>
              </div>
            </dl>
            <p className="film-port__note">
              Correlazione dei risultati mensili: con {CORR.mesi} mesi il margine di errore è di circa ±0,2, nessuna delle tre si distingue
              dallo zero. <b>Mesi con tutte e tre in perdita: {mi.neg} su {mi.n}.</b> Tutte e tre in utile: {mi.pos} su {mi.n}.
            </p>
          </div>
        </section>

        <p className="film-panel__risk">
          <TriangleAlert size={16} strokeWidth={1.6} aria-hidden />
          <span>{RISK_STATEMENT}</span>
        </p>

        <div className="film-cta riepilogo__cta">
          <MagneticCta href="/simulatore/" className={buttonVariants()}>
            Apri il simulatore
          </MagneticCta>
          <a href={MAILTO} className={buttonVariants({ variant: "outline" })} aria-label={`Scrivi via email a ${EMAIL_SHOWN}`}>
            Scrivi via email
          </a>
        </div>
      </div>
    </section>
  );
}

import type { CSSProperties, ReactNode } from "react";
import { StrategyFlythrough } from "@/components/motion/StrategyFlythrough";
import { BacktestTag, Reveal, RiskNote, SceneHeader, TableScroll } from "@/components/site/ui";

/**
 * COPY.md v2, 3.3: tre strategie, tre mercati. Numeri da data/strategie.json.
 * Orizzonte e regole di Nasdaq e USDJPY sono [DA COMPLETARE]: non si mostrano.
 */
type Strat = {
  id: "oro" | "nas" | "usdjpy";
  n: string;
  nome: string;
  mercato: string;
  colore: string; // token CSS
  numeri: string;
  fuori: ReactNode;
  scomodi: ReactNode;
  anni: string;
  regole?: ReactNode;
};

const STRATS: Strat[] = [
  {
    id: "oro",
    n: "01",
    nome: "ORO",
    mercato: "XAUUSD · ROTTURA su M30 e RITRACCIAMENTO su H4",
    colore: "var(--st-oro)",
    numeri:
      "1.123 operazioni, +0,1643 R per operazione, +184,5 R in totale, t 3,40. Chiude in utile il 42,2% delle operazioni: si perde più spesso di quanto si vinca, e il conto torna perché le vincenti, lasciate correre, pesano più delle perdenti.",
    fuori: (
      <>
        Nel periodo di costruzione (2019–2023) +0,1134 R per operazione su 715 operazioni, t 1,86; fuori campione (dal
        2024) +0,2534 R su 408, t 3,21. Va meglio fuori che dentro: vedi “Il metodo” per perché non è una buona notizia.
      </>
    ),
    scomodi: (
      <>
        Il 2021 è chiuso in perdita (−2,9 R) e il 2024 quasi a zero (+3,9 R). La serie di perdite consecutive più lunga è
        di <strong>14 operazioni</strong>. Il drawdown del backtest è 27,5 R, il più alto delle tre. Il mese peggiore è
        settembre 2019 (−11,5 R). Chi lo guarda deve essere pronto a vederlo pareggiare per un anno intero.
      </>
    ),
    anni: "2019 +5,9 · 2020 +30,7 · 2021 −2,9 · 2022 +8,6 · 2023 +38,8 · 2024 +3,9 · 2025 +55,2 · 2026 (a settembre) +44,3",
    regole: (
      <>
        <p>
          Entrambi entrano quando il prezzo si muove in una direzione e ci restano finché il movimento regge. Non hanno
          un obiettivo di guadagno fisso (nessun take profit): un’uscita a obiettivo fisso è stata provata e peggiorava
          ogni configurazione. Quando il prezzo va bene, un’uscita che lo insegue (il trailing) lo lascia correre.
        </p>
        <ul className="ticks">
          <li>
            <strong>ROTTURA (M30).</strong> Il prezzo chiude oltre il massimo (o sotto il minimo) delle ultime 60 barre da
            30 minuti ed è già al bordo del proprio intervallo delle ultime 480 barre. Entra nella direzione dello
            sfondamento. Stop iniziale 2,0 ATR (l’ATR è l’ampiezza media dei movimenti recenti). Trailing a 4,0 ATR,
            attivato quando l’operazione è a +1R.
          </li>
          <li>
            <strong>RITRACCIAMENTO (H4).</strong> Il trend è stabilito (prezzo sopra la media mobile a 30 periodi, con la
            media inclinata). Il prezzo ritraccia di almeno 1 ATR dal massimo delle ultime 20 barre, poi riparte
            chiudendo sopra il massimo della barra precedente. Stop sotto il minimo del ritracciamento, più un margine di
            0,10 ATR. Trailing a 1,5 ATR, attivato a +1R. Attesa di 3 barre dopo un ingresso.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "nas",
    n: "02",
    nome: "NASDAQ",
    mercato: "indice Nasdaq",
    colore: "var(--st-nas)",
    numeri:
      "1.626 operazioni, +0,1106 R per operazione, +179,8 R in totale, t 4,06. Chiude in utile il 54,5% delle operazioni: è la sola delle tre che vince più spesso di quanto perde, ma le sue operazioni sono anche le più piccole in R.",
    fuori: (
      <>
        Nel periodo di costruzione (2019–2023) +0,0918 R per operazione su 1.050 operazioni, t 2,69, 53,6% in utile.
        Fuori campione (dal 2024) +0,1448 R su 576 operazioni, t 3,21, 56,1% in utile. Anche qui va meglio fuori che
        dentro, e vale lo stesso avvertimento dato per l’oro: il numero da usare per il futuro è il più basso dei due.
      </>
    ),
    scomodi: (
      <>
        Il primo anno, il 2019, è chiuso in perdita (−1,3 R). La serie di perdite consecutive più lunga è di 7
        operazioni. Il drawdown del backtest è 13,7 R. Il mese peggiore è febbraio 2024 (−5,5 R), dentro il fuori
        campione.
      </>
    ),
    anni: "2019 −1,3 · 2020 +29,9 · 2021 +35,8 · 2022 +10,2 · 2023 +21,7 · 2024 +17,1 · 2025 +48,9 · 2026 (a settembre) +17,4",
  },
  {
    id: "usdjpy",
    n: "03",
    nome: "USDJPY",
    mercato: "dollaro contro yen",
    colore: "var(--st-usdjpy)",
    numeri: "1.457 operazioni, +0,0900 R per operazione, +131,2 R in totale, t 3,31. Chiude in utile il 46,8% delle operazioni.",
    fuori: (
      <>
        <strong>Qui il numero scomodo è questo.</strong> Nel periodo di costruzione (2019–2022) +0,1238 R per operazione
        su 725 operazioni, t 3,20. Fuori campione (dal 2023, quindi quasi quattro anni) <strong>+0,0566 R</strong> su 732
        operazioni, <strong>t 1,48</strong>, 45,1% in utile. Fuori campione il guadagno medio è{" "}
        <strong>meno della metà</strong> di quello dentro, e una t di 1,48 non basta a distinguere il risultato dal caso.
        È la strategia del portafoglio con la conferma più debole. Non è bocciata: è ancora in utile su 732 operazioni.
        Ma è quella da guardare per prima in tempo reale.
      </>
    ),
    scomodi: (
      <>
        Il 2026, fino a settembre, è a <strong>+1,4 R</strong>: nove mesi a zero. L’anno intero peggiore è il 2023 (+6,1
        R). La serie di perdite consecutive più lunga è di 8 operazioni. Il drawdown del backtest è 14,0 R. Il mese
        peggiore è gennaio 2025 (−8,3 R). Il 2022, l’anno migliore, è l’ultimo del periodo di costruzione: dopo, la
        strategia non ha più reso allo stesso modo.
      </>
    ),
    anni: "2019 +12,8 · 2020 +6,9 · 2021 +29,1 · 2022 +40,9 · 2023 +6,1 · 2024 +24,5 · 2025 +9,5 · 2026 (a settembre) +1,4",
  },
];

const RIEPILOGO: { voce: string; v: [string, string, string]; bad?: boolean[] }[] = [
  { voce: "Operazioni", v: ["1.123", "1.626", "1.457"] },
  { voce: "Guadagno medio per operazione", v: ["+0,1643 R", "+0,1106 R", "+0,0900 R"] },
  { voce: "Somma dei risultati", v: ["+184,5 R", "+179,8 R", "+131,2 R"] },
  { voce: "t-statistica", v: ["3,40", "4,06", "3,31"] },
  { voce: "Operazioni in utile", v: ["42,2%", "54,5%", "46,8%"] },
  { voce: "Perdite consecutive massime", v: ["14", "7", "8"], bad: [true, true, true] },
  { voce: "Drawdown massimo del backtest", v: ["27,5 R", "13,7 R", "14,0 R"], bad: [true, true, true] },
  { voce: "Anno migliore", v: ["2025 (+55,2 R)", "2025 (+48,9 R)", "2022 (+40,9 R)"] },
  { voce: "Anno peggiore", v: ["2021 (−2,9 R)", "2019 (−1,3 R)", "2026, parziale (+1,4 R)"], bad: [true, true, true] },
  { voce: "Mesi in perdita su 93", v: ["40", "30", "34"], bad: [true, true, true] },
];

/** Scheda-livello nel volo: identita' = colore + nome scritto (mai colore da solo). */
function LayerCard({ s }: { s: Strat }) {
  return (
    <article className="zcard" aria-labelledby={`strat-${s.id}`} style={{ "--zc": s.colore } as CSSProperties}>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">
          <b>Livello {s.n}</b>
        </p>
        <p className="eyebrow inline-flex items-center gap-2" style={{ color: s.colore }}>
          <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: s.colore }} />
          {s.nome}
        </p>
      </div>
      <h3 id={`strat-${s.id}`} className="mt-4 text-2xl font-medium tracking-[-0.04em]" style={{ color: s.colore }}>
        {s.nome} <span className="text-ink">· {s.mercato}</span>
      </h3>
      <p className="mt-4 text-[15px] leading-[1.6] text-ink md:text-base">{s.numeri}</p>
      <p className="t-sec mt-3">Backtest 2019.01–2026.09. Il numero scomodo è nella scheda qui sotto.</p>
      <div className="mt-4">
        <BacktestTag />
      </div>
    </article>
  );
}

export function Strategie() {
  return (
    <section id="strategie" data-scene className="scene" aria-labelledby="strategie-t">
      <div className="wrap">
        <SceneHeader n="03" label="Strategie" id="strategie-t" title={["Tre strategie,", "tre mercati"]} />
        <div className="prose space-y-4">
          <Reveal>
            <p className="t-lead">
              Tre sistemi automatici, uno per mercato: oro (XAUUSD), Nasdaq e USDJPY. Sono presentati con le stesse voci
              e lo stesso periodo (backtest, 2019.01–2026.09, 93 mesi). Per ognuno c’è il numero buono e quello scomodo.
              Il 2026 è un anno parziale: arriva a settembre.
            </p>
          </Reveal>
        </div>

        {/* ---------- Tabella riassuntiva ---------- */}
        <div className="mt-10 space-y-3">
          <Reveal>
            <BacktestTag />
          </Reveal>
          <Reveal i={1}>
            <TableScroll label="Tabella riassuntiva delle tre strategie (backtest, 2019.01–2026.09)">
              <table className="dtable">
                <caption>Tabella riassuntiva (backtest, 2019.01–2026.09)</caption>
                <thead>
                  <tr>
                    <th scope="col">Misura</th>
                    <th scope="col" className="r">Oro (XAUUSD)</th>
                    <th scope="col" className="r">Nasdaq</th>
                    <th scope="col" className="r">USDJPY</th>
                  </tr>
                </thead>
                <tbody>
                  {RIEPILOGO.map((r) => (
                    <tr key={r.voce}>
                      <th scope="row">{r.voce}</th>
                      {r.v.map((val, i) => (
                        <td key={i} className={`r ${r.bad?.[i] ? "text-bad" : ""}`}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </Reveal>
          <Reveal i={2} className="space-y-3">
            <RiskNote />
            <p className="t-sec">
              Il drawdown “del backtest” è quello di un solo percorso, in R: non è il drawdown vero (vedi “Il rischio”).
              “Mesi in perdita” è un conteggio sui risultati mensili.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Volo attraverso i tre livelli: la camera avanza lungo Z con lo scroll */}
      <div className="mt-12 md:mt-16">
        <StrategyFlythrough label="Le tre strategie, un livello ciascuna">
          {STRATS.map((s) => (
            <LayerCard key={s.id} s={s} />
          ))}
        </StrategyFlythrough>
      </div>

      {/* ---------- Schede complete ---------- */}
      <div className="wrap mt-12 space-y-16 md:mt-16 md:space-y-24">
        {STRATS.map((s) => (
          <article key={s.id} className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12" aria-labelledby={`sch-${s.id}`}>
            <Reveal className="lg:col-span-4">
              <h3 id={`sch-${s.id}`} className="t-h2 lg:sticky lg:top-24">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: s.colore }} />
                  {s.nome}
                </span>
                <span className="t-sec block font-normal">{s.mercato}</span>
              </h3>
            </Reveal>
            <div className="prose space-y-5 lg:col-span-8">
              {s.regole && <Reveal className="space-y-4">{s.regole}</Reveal>}
              <Reveal i={1} className="space-y-3">
                <BacktestTag />
                <p>
                  <strong>I numeri (backtest):</strong> {s.numeri}
                </p>
              </Reveal>
              <Reveal i={2}>
                <p>
                  <strong>Dentro e fuori campione:</strong> {s.fuori}
                </p>
              </Reveal>
              <Reveal i={3} className="callout">
                <p>
                  <strong>I numeri scomodi:</strong> {s.scomodi}
                </p>
              </Reveal>
              <Reveal i={4}>
                <p className="t-sec">
                  <strong className="text-ink">Per anno (backtest, in R):</strong> <span className="mono">{s.anni}</span>
                </p>
              </Reveal>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

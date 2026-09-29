import { BacktestTag, Reveal, SceneHeader } from "@/components/site/ui";

/** COPY.md v2, 3.5: le schede riguardano la ricerca sull'oro; per Nasdaq e USDJPY e' [DA COMPLETARE] (omesso). */
type Card = { n: number; titolo: string; sub?: string; testo: React.ReactNode; tag?: boolean };

const CARDS: Card[] = [
  {
    n: 1,
    titolo: "Range mean reversion",
    sub: "comprare il bordo basso di un canale che si stringe",
    tag: true,
    testo: (
      <>
        Bocciata. Su 174 configurazioni con almeno 100 operazioni, <strong>zero</strong> in utile. Più operava, più
        perdeva, con un ordine perfetto. L’ipotesi era invertita: la compressione della volatilità non precede il
        ritorno al centro, precede la rottura. Non c’è un parametro da aggiustare: la regola era sbagliata.
      </>
    ),
  },
  {
    n: 2,
    titolo: "Fade del breakout fallito",
    sub: "la “TRAPPOLA”: vendere le rotture al rialzo che falliscono",
    tag: true,
    testo: (
      <>
        In utile nel periodo di costruzione, <strong className="text-bad">in perdita netta fuori campione</strong>. Vende
        le rotture fallite su un oro che triplica. È stata tolta <em>dopo</em> aver visto il fuori campione: è il punto
        aperto del lavoro, ed è il motivo per cui il fuori campione dell’oro si legge come conferma parziale (vedi “Il
        metodo”). Si decide con dati nuovi, in tempo reale.
      </>
    ),
  },
  {
    n: 3,
    titolo: "Time-series momentum",
    tag: true,
    testo: (
      <>
        Il peso è stato ridotto in tre passi, da 1,0 a 0,5 a 0. Il rapporto profitto/rischio del portafoglio è salito a
        ogni passo. Se togliendola il portafoglio migliora, esce.
      </>
    ),
  },
  {
    n: 4,
    titolo: "EMA cross",
    testo: (
      <>
        Scartata, ma con un motivo sbagliato all’inizio: il profit factor misura la qualità della singola operazione,
        non quanto una strategia porta al portafoglio. La decisione forse è ancora giusta (a drawdown uguale il
        portafoglio senza di lei è migliore), ma il motivo dichiarato non lo era.
      </>
    ),
  },
  {
    n: 5,
    titolo: "Rischio adattivo",
    testo: <>Misurato peggiore. Tenuto spento.</>,
  },
  {
    n: 6,
    titolo: "Take profit fisso",
    tag: true,
    testo: (
      <>
        Peggiorava tutte le configurazioni testate di una delle strategie sull’oro: un obiettivo fisso taglia proprio le
        operazioni che fanno il risultato.
      </>
    ),
  },
];

export function Scartate() {
  return (
    <section id="scartate" data-scene className="scene" aria-labelledby="scartate-t">
      <div className="wrap">
        <SceneHeader
          n="05"
          label="Scartate"
          id="scartate-t"
          title={["Le idee che", "non hanno funzionato"]}
        />
        <Reveal className="prose space-y-3">
          <p className="t-lead">
            Per ogni idea entrata nel portafoglio ce n’è una uscita. Il motivo è misurato, e mostrarlo è parte del metodo:
            chi conosce solo i successi non può giudicare la selezione. Le schede qui sotto riguardano la ricerca
            sull’oro.
          </p>
          <p className="t-sec">
            Nota di lettura: 1 R è il rischio corso in quell’operazione, quindi ogni cifra in R ha già il suo rischio
            dentro. Tutti i risultati di questa sezione sono backtest.
          </p>
        </Reveal>

        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {CARDS.map((c, idx) => (
            <Reveal as="li" key={c.n} i={idx % 3} className="card flex flex-col gap-3">
              <p className="eyebrow">
                <b>Scheda {c.n}</b>
              </p>
              <h3 className="t-h2">{c.titolo}</h3>
              {c.sub && <p className="t-sec">({c.sub})</p>}
              <p className="text-[15px] leading-[1.6] text-ink md:text-base">{c.testo}</p>
              {c.tag && (
                <div className="mt-auto pt-2">
                  <BacktestTag />
                </div>
              )}
            </Reveal>
          ))}
        </ul>

        <Reveal className="callout mt-8">
          <p>
            <strong>Scelta di progetto (non un risultato):</strong> nessun filtro su ore o giorni della settimana.
          </p>
        </Reveal>

        <Reveal className="prose mt-8 border-t border-line pt-8">
          <p>
            Quello che non si è ancora fatto: il confronto con ingressi casuali (per sapere se gli ingressi portano
            informazione o se il merito è tutto dell’uscita) esiste come programma ma non è mai stato eseguito. Il
            risultato è aperto.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

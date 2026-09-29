import { Reveal, SceneHeader } from "@/components/site/ui";

/**
 * COPY.md v2, 3.7. "Cosa si pubblica" e il criterio scritto da Davide per USDJPY sono
 * [DA COMPLETARE]: nota sobria, nessun dato inventato.
 */
export function Monitoraggio() {
  return (
    <section id="monitoraggio" data-scene className="scene" aria-labelledby="monitoraggio-t">
      <div className="wrap">
        <SceneHeader
          n="07"
          label="Monitoraggio"
          id="monitoraggio-t"
          title={["Prima di fidarsi,", "si guarda in tempo reale"]}
        />

        <Reveal className="prose">
          <p className="t-lead">
            Nessun backtest può rispondere a due domande. Gli spread e gli slittamenti veri assomigliano a quelli
            simulati? E si riesce a guardare il sistema fermo per mesi, senza spegnerlo? Per questo il passo successivo
            non è un altro test sugli stessi anni: è un conto demo in tempo reale, con parametri congelati, per tre-sei
            mesi, con tutte e tre le strategie insieme.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Reveal variant="monitor" className="card card--lit lg:col-span-7">
            <h3 className="t-h2">Cosa si controlla</h3>
            <ol className="count mt-5 space-y-4">
              <li>
                <strong>I costi veri contro quelli del modello.</strong> Prima di aprire un conto reale, swap e spread
                reali si confrontano con quelli della simulazione. Se sono peggiori, il sistema non farà quello che ha
                fatto nel backtest, e lo si sa prima.
              </li>
              <li>
                <strong>Il risultato contro la banda simulata.</strong> Il risultato reale di ogni strategia si mette
                dentro la distribuzione del bootstrap: in quale percentile cade? Serve che il bootstrap sulla misura più
                recente sia stato fatto (vedi{" "}
                <a href="#rischio" className="textlink">
                  Il rischio
                </a>
                ).
              </li>
              <li>
                <strong>USDJPY per prima.</strong> È la strategia con il fuori campione più debole (t 1,48) e con il 2026
                a zero. Il criterio per tenerla o toglierla va scritto <em>prima</em> di guardare il demo, non dopo.
              </li>
              <li>
                <strong>Le correlazioni.</strong> Mese per mese si aggiorna il conteggio: quante volte le tre strategie
                perdono insieme. Con pochi mesi il numero dice poco; si accumula.
              </li>
              <li>
                <strong>La strategia scartata sull’oro.</strong> La TRAPPOLA si decide sul demo: è dato nuovo.
              </li>
              <li>
                <strong>Il numero di operazioni.</strong> Con poche operazioni, un risultato anche lontano dallo storico
                resta statisticamente compatibile con esso. Una serie negativa corta non invalida il sistema: sull’oro il
                backtest contiene già 14 perdite di fila.
              </li>
            </ol>
          </Reveal>

          <Reveal variant="monitor" i={1} className="card lg:col-span-5">
            <h3 className="t-h2">Cosa si pubblica</h3>
            <p className="callout mt-5">
              <strong>In preparazione.</strong>
            </p>
            <p className="eyebrow mt-6">Regola per la pagina</p>
            <p className="mt-2">
              Quando compaiono i primi risultati reali, sono mostrati accanto a quelli simulati, con lo stesso formato,
              per ognuna delle tre strategie, e senza togliere i mesi brutti.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

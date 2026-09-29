import { Reveal, SceneHeader } from "@/components/site/ui";

/** "Cosa si pubblica" e' [DA COMPLETARE] in COPY.md: nota sobria, nessun dato inventato. */
export function Monitoraggio() {
  return (
    <section id="monitoraggio" data-scene className="scene" aria-labelledby="monitoraggio-t">
      <div className="wrap">
        <SceneHeader
          n="06"
          label="Monitoraggio"
          id="monitoraggio-t"
          title={["Prima di fidarsi,", "si guarda in tempo reale"]}
        />

        <Reveal className="prose">
          <p className="t-lead">
            Nessun backtest può rispondere a due domande. Gli spread e gli slittamenti veri assomigliano a quelli
            simulati? E si riesce a guardare il sistema fermo per mesi, senza spegnerlo? Per questo il passo successivo
            non è un altro test sugli stessi anni: è un conto demo in tempo reale, con parametri congelati, per tre-sei
            mesi.
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
                <strong>Il risultato contro la banda simulata.</strong> Il risultato reale si mette dentro la
                distribuzione del bootstrap: in quale percentile cade? Così è stato fatto anche sul fuori campione (24°
                percentile).
              </li>
              <li>
                <strong>La strategia scartata.</strong> La TRAPPOLA si decide sul demo: è dato nuovo.
              </li>
              <li>
                <strong>Il numero di operazioni.</strong> Con poche operazioni, un risultato anche lontano dallo storico
                resta statisticamente compatibile con esso. Una serie negativa corta non invalida il sistema.
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
              e senza togliere i mesi brutti.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

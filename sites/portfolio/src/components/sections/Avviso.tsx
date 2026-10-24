import { TriangleAlert } from "lucide-react";
import { Reveal, SceneHeader } from "@/components/site/ui";
import { D, PORT } from "@/lib/dati";
import { it } from "@/lib/format";

/**
 * Avviso sul rischio (COPY.md v2, 3.9): testo completo, su superficie piena, sempre
 * leggibile. Omessi perche' [DA COMPLETARE] in COPY.md: diciture obbligatorie del
 * Paese del titolare e "Titolare del sito" (vedi DA-COMPLETARE.md).
 */
export function Avviso() {
  const o = D.oro;
  const n = D.nasdaq;
  const u = D.usdjpy;
  return (
    <section id="avviso" data-scene className="scene" aria-labelledby="avviso-t">
      <div className="wrap">
        <SceneHeader n="04" label="Avviso" id="avviso-t" title={["Avviso sul rischio"]} />
        <Reveal className="card card--lit max-w-[900px]">
          <TriangleAlert size={24} strokeWidth={1.6} className="mb-4 text-warn" aria-hidden />
          <ul className="ticks space-y-4 text-ink">
            <li>
              <strong>Il trading comporta un alto rischio di perdita.</strong> Si può perdere una parte o tutto il
              capitale. Non operare con denaro che non puoi permetterti di perdere.
            </li>
            <li>
              <strong>
                Risultati di backtest validati fuori campione con metodo quantitativo: criteri fissati prima del test,
                dati mai visti, bootstrap a blocchi.
              </strong>{" "}
              Non garantiscono rendimenti futuri: indicano la mediana di cosa aspettarsi, e il suo intervallo, se il
              vantaggio esiste e non si è rotto. Non possono riprodurre tutto quello che succede su un conto reale:
              slittamenti, differenze di esecuzione, costi diversi da quelli simulati, comportamento di chi opera.
            </li>
            <li>
              <strong>I risultati mostrati sono simulati, non ottenuti su un conto reale.</strong> Un backtest applica le
              regole ai prezzi del passato, sapendo già come sono andati: ha limiti che nessuna verifica elimina del
              tutto, e i risultati reali possono essere molto diversi, anche in peggio.
            </li>
            <li>
              <strong>I risultati passati non garantiscono quelli futuri.</strong> I parametri sono stati scelti
              guardando i dati passati: il risultato in quel periodo è gonfiato per costruzione, e il fuori campione è già
              stato usato.
            </li>
            <li>
              <strong>Le strategie possono andare in perdita per un anno intero, e più.</strong> Lo storico stesso
              contiene, per XAUUSD, un anno in perdita e uno quasi a zero su otto; per USDJPY, nove mesi del 2026 a zero.
            </li>
            <li>
              {/* i numeri del riquadro "Rischio accanto", tolto dalla cima della pagina (Davide): restano qui */}
              <strong>Le perdite dal massimo (drawdown) possono essere profonde.</strong> Nel backtest, su una sola
              sequenza, il drawdown massimo è stato di {it(o.periodi.tutto.dd_max_R, 1)} R per XAUUSD (
              {o.periodi.tutto.perdite_consecutive_max} perdite di fila), {it(n.periodi.tutto.dd_max_R, 1)} R per il
              Nasdaq e {it(u.periodi.tutto.dd_max_R, 1)} R per USDJPY. Con il bootstrap a blocchi di 20, in una
              sequenza su dieci va oltre: XAUUSD {it(o.bootstrap_dd.p90, 1)} R, Nasdaq {it(n.bootstrap_dd.p90, 1)} R,
              USDJPY {it(u.bootstrap_dd.p90, 1)} R; la somma a pari rischio {it(PORT.bootstrap_dd.p90, 1)} R. A rischio
              1% per operazione, {it(o.bootstrap_dd.p90, 1)} R vuol dire circa il {it(o.bootstrap_dd.p90, 0)}% dal
              massimo.
            </li>
            <li>
              <strong>Le strategie algoritmiche cambiano nel tempo.</strong> Sfruttano un vantaggio statistico verificato sul passato, ma
              nessun vantaggio dura per sempre: può indebolirsi o sparire, domani come fra qualche anno. Per questo vengono controllate e, quando
              serve, aggiornate o sostituite.
            </li>
            <li>
              <strong>I costi reali dipendono dal broker.</strong> Commissioni, spread e swap possono essere diversi da quelli del backtest: i
              risultati reali possono essere più bassi, indicativamente del 15–20% sui guadagni, o anche di più.
            </li>
            <li>
              <strong>Tre strategie insieme non eliminano il rischio.</strong> Nello storico hanno perso tutte e tre
              nello stesso mese sei volte su 93. Può succedere di nuovo, e più spesso.
            </li>
            <li>
              <strong>Strumenti a leva: le perdite possono essere rapide.</strong> Oro, indici e valute si negoziano
              spesso con prodotti a leva come i CFD, che sono strumenti complessi: la leva amplifica sia i guadagni sia
              le perdite, e una parte rilevante dei conti dei piccoli investitori perde denaro con questi prodotti.
              Valuta se hai capito come funzionano e se puoi permetterti di correre questo rischio.
            </li>
            <li>
              <strong>
                Questa pagina non è consulenza finanziaria, né una raccomandazione di investimento, né un’offerta o
                sollecitazione a operare o a investire.
              </strong>{" "}
              Nessuna informazione qui tiene conto della tua situazione personale. Per decisioni che riguardano il tuo
              denaro, rivolgiti a un professionista abilitato.
            </li>
            <li>
              <strong>Ogni decisione è solo tua.</strong> Le informazioni sono fornite così come sono, a scopo informativo
              e didattico, possono contenere errori e cambiare senza preavviso. Chi le pubblica non risponde di perdite o
              danni che derivino dal loro uso.
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

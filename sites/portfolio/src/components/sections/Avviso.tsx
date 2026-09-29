import { TriangleAlert } from "lucide-react";
import { Reveal, SceneHeader } from "@/components/site/ui";

/**
 * Avviso sul rischio: testo completo, su superficie piena, sempre leggibile.
 * Omessi perche' [DA COMPLETARE] in COPY.md: diciture obbligatorie del Paese
 * del titolare e "Titolare del sito" (vedi DA-COMPLETARE.md).
 */
export function Avviso() {
  return (
    <section id="avviso" data-scene className="scene" aria-labelledby="avviso-t">
      <div className="wrap">
        <SceneHeader n="08" label="Avviso" id="avviso-t" title={["Avviso sul rischio"]} />
        <Reveal className="card card--lit max-w-[900px]">
          <TriangleAlert size={24} strokeWidth={1.6} className="mb-4 text-warn" aria-hidden />
          <ul className="ticks space-y-4 text-ink">
            <li>
              <strong>Il trading comporta un alto rischio di perdita.</strong> Si può perdere una parte o tutto il
              capitale. Non operare con denaro che non puoi permetterti di perdere.
            </li>
            <li>
              <strong>
                I risultati di questa pagina sono simulazioni (backtest) su dati storici. Non sono risultati reali.
              </strong>{" "}
              Includono spread, commissioni e swap, ma non possono riprodurre tutto quello che succede su un conto reale:
              slittamenti, differenze di esecuzione, comportamento di chi opera.
            </li>
            <li>
              <strong>I risultati passati non garantiscono quelli futuri.</strong> I parametri sono stati scelti
              guardando i dati passati: il risultato in quel periodo è gonfiato per costruzione, e il fuori campione è già
              stato usato.
            </li>
            <li>
              <strong>Le strategie possono andare in perdita per un anno intero, e più.</strong> Lo storico stesso
              contiene due anni praticamente fermi su sette.
            </li>
            <li>
              <strong>
                Questa pagina non è consulenza finanziaria, né una raccomandazione di investimento, né un’offerta o
                sollecitazione a operare o a investire.
              </strong>{" "}
              Nessuna informazione qui tiene conto della tua situazione personale. Per decisioni che riguardano il tuo
              denaro, rivolgiti a un professionista abilitato.
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

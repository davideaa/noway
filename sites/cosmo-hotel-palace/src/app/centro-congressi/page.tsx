/*
 * /centro-congressi/ (UX 7, COPY 8, MOTION 5). Pagina server: testi e struttura. Gli strumenti
 * (configuratore, «Trova la sala», tabella ordinabile, modulo) sono componenti client dentro
 * `<CongressProvider>`, che condivide sala, disposizione e partecipanti fra configuratore e modulo.
 *
 * Senza JavaScript: intro, tabella delle sale e modulo funzionano (il modulo apre la posta con
 * `mailto:`); il configuratore dice che ha bisogno di JavaScript. Non c'è nessun invio vero
 * (`HAS_BACKEND = false`): la pagina non dice mai «Richiesta inviata».
 *
 * Su questa pagina la barra di prenotazione non c'è e la pillola diventa «Richiedi una proposta»
 * (modulo 4: `NO_BAR_ROUTES`, `BookingPill`).
 */
import Link from "next/link";
import { PosterCongress } from "@/components/art/PosterCongress";
import { Configurator } from "@/components/congress/Configurator";
import { CongressProvider } from "@/components/congress/CongressState";
import { HallTable } from "@/components/congress/HallTable";
import { ProposalForm } from "@/components/congress/ProposalForm";
import { ProposalSummary } from "@/components/congress/ProposalSummary";
import { testi } from "@/components/congress/testi";
import s from "@/components/congress/congress.module.css";
import { Button } from "@/components/ui/button";
import { repartoById } from "@/content/contacts";
import { copy } from "@/content/copy";
import { JsonLdBreadcrumb } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

// titolo, descrizione e canonical da COPY 14 (modulo 15)
export const metadata = pageMetadata("centroCongressi");

const p = copy.congressi.presentazione;

/** «oltre 900 m²» -> prefisso «oltre», valore «900», unità «m²» (solo per la scelta tipografica). */
function spezza(numero: string): { prefisso: string; valore: string; unita: string } {
  const m = /^(oltre |fino a )?(\d+)\s*(.*)$/.exec(numero);
  if (!m) return { prefisso: "", valore: numero, unita: "" };
  return { prefisso: (m[1] ?? "").trim(), valore: m[2], unita: m[3] };
}

const NUMERI = [p.numeri.superficie, p.numeri.persone, p.numeri.piani, p.numeri.parcheggio].map(spezza);

/** Le schede che parlano di una sala (stesso id della tabella): il link apre il configuratore su quella sala. */
const SCHEDE_CON_SALA: ReadonlySet<string> = new Set(["costellazioni", "divinita"]);

export default function CentroCongressiPage() {
  const eventi = repartoById("eventi");
  return (
    <CongressProvider>
      <JsonLdBreadcrumb chiave="centroCongressi" />
      {/* ───── Intro ───── */}
      <section className={s.hero} aria-labelledby="titolo-pagina">
        <div className="wrap">
          <div className={s.heroGriglia}>
            <div className={s.heroTesto}>
              <h1 id="titolo-pagina">{p.h1}</h1>
              <p className={`t-lead ${s.lead}`}>{p.sottotitolo}</p>
              <p>{p.corpo}</p>
              <p>{p.piani}</p>
              <div className={s.cta}>
                <Button asChild variant="brand" size="md">
                  <a href="#configura">{p.pulsanti.configura}</a>
                </Button>
                <Button asChild variant="outline" size="md">
                  <a href="#richiesta">{p.pulsanti.richiediProposta}</a>
                </Button>
                <Button asChild variant="link" size="md">
                  <a href={`tel:${eventi.telHref}`}>{p.pulsanti.chiamaEventi}</a>
                </Button>
              </div>
            </div>
            <div className={s.heroArte} aria-hidden="true">
              <PosterCongress tono="giorno" arco />
            </div>
          </div>

          <ul className={s.numeri} aria-label={p.h1}>
            {NUMERI.map((n) => (
              <li key={`${n.prefisso}-${n.valore}-${n.unita}`} className={s.numero}>
                <span className={s.numeroPrefisso}>{n.prefisso}</span>
                <span className={s.numeroValore}>{n.valore}</span>
                <span className={s.numeroUnita}>{n.unita}</span>
              </li>
            ))}
          </ul>

          <div className={s.schede}>
            {p.sottoSchede.map((sc) => (
              <article key={sc.id} className={s.scheda}>
                <h2 className="t-h3">{sc.titolo}</h2>
                <p>{sc.testo}</p>
                {SCHEDE_CON_SALA.has(sc.id) && (
                  <Link
                    className={s.schedaLink}
                    href={`/centro-congressi/?sala=${sc.id}#configura`}
                    aria-label={`${testi.hero.vediSala}: ${sc.titolo}`}
                  >
                    {testi.hero.vediSala}
                  </Link>
                )}
              </article>
            ))}
          </div>

          <div className={s.info}>
            <p>{p.comeCiSiArriva}</p>
            <div className={s.infoContatto}>
              <strong>Ufficio Eventi</strong>
              <a href={`tel:${eventi.telHref}`}>{eventi.telefono}</a>
              <a href={`mailto:${eventi.email}`}>{eventi.email}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Configuratore + Trova la sala ───── */}
      <Configurator />

      {/* ───── Tabella ───── */}
      <section className={`${s.sezione} ${s.sezioneTabella}`} aria-labelledby="sale-titolo">
        <div className="wrap" id="sale">
          <header className={s.testata}>
            <h2 id="sale-titolo" className="t-h2">
              {copy.congressi.configuratore.elencoTitolo}
            </h2>
          </header>
          <HallTable />
        </div>
      </section>

      {/* ───── Richiesta di proposta ───── */}
      <section className={`${s.sezione} ${s.sezioneRichiesta}`} aria-labelledby="richiesta-titolo">
        {/* l'ancora (anche quella della pillola «Richiedi una proposta») sta sul contenitore, sotto il padding */}
        <div className="wrap" id="richiesta">
          <div className={s.richiestaGriglia}>
            <header className={`${s.testata} ${s.richiestaTesto}`}>
              <h2 id="richiesta-titolo" className="t-h2">
                {copy.congressi.modulo.h2}
              </h2>
              <p className="t-lead">{copy.congressi.modulo.sottotitolo}</p>
              <p className={s.contattoRiga}>
                {testi.modulo.contatti}{" "}
                <a href={`tel:${eventi.telHref}`} className={s.contattoLink}>
                  {eventi.telefono}
                </a>
              </p>
            </header>
            <div>
              <ProposalSummary />
              <ProposalForm />
            </div>
          </div>
        </div>
      </section>
    </CongressProvider>
  );
}

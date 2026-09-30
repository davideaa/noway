import { Mail } from "lucide-react";
import { CopyEmail } from "@/components/site/CopyEmail";
import { Reveal, SceneHeader } from "@/components/site/ui";
import { buttonVariants } from "@/components/ui/button";
import { EMAIL_SHOWN, MAILTO } from "@/lib/site";

/** "Tempi di risposta" e' [DA COMPLETARE] in COPY.md: omesso (vedi DA-COMPLETARE.md). */
export function Contatti() {
  return (
    <section id="contatti" data-scene className="scene overflow-hidden" aria-labelledby="contatti-t">
      {/* la camera si ferma: le cornici del tunnel restano ferme come cornice */}
      <div className="frames-still" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="wrap relative">
        <SceneHeader
          n="03"
          label="Contatti"
          id="contatti-t"
          title={["Hai un dubbio?", "Scrivici."]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Reveal className="prose space-y-4 lg:col-span-6">
            <p className="t-lead">
              Se hai un dubbio sul metodo, sui numeri o su come sono stati calcolati, scrivici: rispondiamo volentieri.
            </p>
            <p>
              Le risposte hanno carattere informativo sul metodo. Non è consulenza finanziaria, e non si danno indicazioni
              su cosa comprare o vendere.
            </p>
          </Reveal>

          <Reveal i={1} className="card card--lit space-y-5 lg:col-span-6">
            <p className="eyebrow">Indirizzo</p>
            {/* in grande, nel carattere dei titoli (non mono): il nome davanti, il dominio piu' tenue */}
            <a href={MAILTO} className="mail-big">
              <span className="select-all">
                {EMAIL_SHOWN.split("@")[0]}
                <span className="mail-big__dom">@{EMAIL_SHOWN.split("@")[1]}</span>
              </span>
            </a>
            <div className="flex flex-wrap items-start gap-3">
              <a
                href={MAILTO}
                className={buttonVariants()}
                aria-label={`Contattaci via email a ${EMAIL_SHOWN}`}
              >
                <Mail size={16} strokeWidth={1.6} aria-hidden />
                Contattaci
              </a>
              <CopyEmail />
            </div>
            <div className="t-sec space-y-2">
              <p>Si apre il tuo programma di posta. Nessun dato viene raccolto da questa pagina.</p>
              <p>Non si è aperto il programma di posta? Copia l&rsquo;indirizzo e scrivi da dove preferisci.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

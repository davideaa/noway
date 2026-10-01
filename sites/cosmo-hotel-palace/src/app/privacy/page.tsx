/*
 * /privacy/ (UX 8, COPY 12): informativa breve. Il testo legale lo scrive il cliente o il suo consulente
 * (COPY: DA CONFERMARE): qui c'è il segnaposto di COPY, i punti che si possono dire con certezza (come è
 * costruito il sito) e i `DA CONFERMARE` dichiarati in modo ben visibile, con icona e testo.
 * Testo lungo a 65 caratteri per riga, titoli h2.
 */
import type { Metadata } from "next";
import { PageIntro } from "@/components/pages/PageIntro";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import { centralino } from "@/content/contacts";
import { copy } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: copy.meta.privacy.title },
  description: copy.meta.privacy.description,
};

const t = copyPagine.privacy;

/** Etichetta ben visibile accanto a ciò che il cliente deve ancora confermare. */
function DaConfermare({ children }: { children?: React.ReactNode }) {
  return (
    <Status tone="neutral" role="none" title={t.daConfermare} className={s.daConfermare}>
      {children}
    </Status>
  );
}

export default function PrivacyPage() {
  const c = copy.privacy;
  const z = t.sezioni;
  return (
    <section className="wrap section-y" aria-labelledby="privacy-h1">
      <div className={s.colonna}>
        <PageIntro id="privacy-h1" eyebrow={t.eyebrow} titolo={c.h1} lead={c.sottotitolo} />

        <div className={s.testo}>
          <p>{c.corpo}</p>
          <DaConfermare>
            <p>{z.completa.daConfermare}</p>
          </DaConfermare>

          <h2 className="t-h3">{z.titolare.titolo}</h2>
          <p>{z.titolare.testo}</p>
          <DaConfermare>
            <p>{z.titolare.nota}</p>
          </DaConfermare>

          <h2 className="t-h3">{z.moduli.titolo}</h2>
          <p>{z.moduli.testo}</p>

          <h2 className="t-h3">{z.prenotazione.titolo}</h2>
          <p>{z.prenotazione.testo}</p>
          <p>{z.prenotazione.testo2}</p>

          <h2 className="t-h3">{z.cookie.titolo}</h2>
          <p>{z.cookie.testo}</p>
          <DaConfermare>
            <p>{z.cookie.nota}</p>
          </DaConfermare>

          <h2 className="t-h3">{z.completa.titolo}</h2>
          <p>{t.scrivici}</p>
          <div>
            <Button asChild variant="link">
              <a href={`mailto:${centralino.email}`}>{centralino.email}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

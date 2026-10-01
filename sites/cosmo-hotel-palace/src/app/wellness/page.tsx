/*
 * /wellness/ (UX 8, COPY 7, DECISIONI 3): il 6° piano. h1, badge «aperto ora» subito sotto, illustrazione
 * isometrica con i punti e il percorso in tre tappe, i punti in elenco, accesso e condizioni.
 * Le condizioni di accesso non sono sul sito vecchio (DA CONFERMARE): si scrive solo il ripiego di COPY.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconaPunto } from "@/components/pages/IconaPunto";
import { PageIntro } from "@/components/pages/PageIntro";
import { WellnessPlan } from "@/components/pages/WellnessPlan";
import { OpenNowBadge } from "@/components/wellness/OpenNowBadge";
import { centralino } from "@/content/contacts";
import { copy } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import { wellnessHotspots } from "@/content/hotspots/wellness";
import p from "@/components/pages/pages.module.css";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: copy.meta.wellness.title },
  description: copy.meta.wellness.description,
};

const t = copyPagine.wellness;

export default function WellnessPage() {
  const c = copy.wellness;
  return (
    <>
      <section className="wrap section-y" aria-labelledby="wellness-h1">
        <div className={s.testa}>
          <PageIntro
            id="wellness-h1"
            eyebrow={t.eyebrow}
            titolo={c.h1}
            dopoTitolo={<OpenNowBadge />}
            lead={c.sottotitolo}
          >
            <p className={p.corpo}>{c.corpo}</p>
          </PageIntro>
        </div>
        <div className={s.piano}>
          <WellnessPlan />
        </div>
      </section>

      <section className={p.sezioneAlt} aria-labelledby="cosa-trovi">
        <div className="wrap">
          <div className={s.cosa}>
            <h2 id="cosa-trovi" className="t-h2">
              {t.cosaTrovi}
            </h2>
            <ul className={p.righe}>
              {wellnessHotspots.map((h) => (
                <li key={h.id} className={p.riga}>
                  <span className={p.rigaIcona}>
                    <IconaPunto id={h.id} size={26} />
                  </span>
                  <div>
                    <p className={p.rigaTitolo}>{h.titolo}</p>
                    <p className={p.rigaDato}>{h.dato}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="wrap section-y" aria-labelledby="accesso-titolo">
        <div className={s.accesso}>
          <div className={s.accessoTesto}>
            <h2 id="accesso-titolo" className="t-h2">
              {t.accessoTitolo}
            </h2>
            <p className={p.corpo}>{c.accessoRipiego}</p>
            <p className={s.orario}>
              <strong>{t.orarioTitolo}</strong> · {t.orarioRiga}
            </p>
            <p className={s.nota}>{c.aperto.nota}</p>
          </div>
          <div className={`${p.azioni} ${p.azioniAffiancate}`}>
            <Button asChild variant="brand" arrow>
              <Link href="/prenota/">{c.cercaSoggiorno}</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:${centralino.email}`}>{c.chiediInformazioni}</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

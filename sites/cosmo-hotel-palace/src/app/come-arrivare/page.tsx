/*
 * /come-arrivare/ (UX 8, COPY 9, DECISIONI 8): indirizzo, il percorso in tram e metro (schema SVG, non
 * una mappa), i cinque modi per arrivare tutti aperti, e i luoghi nei dintorni con il filtro.
 * Nessuna mappa incorporata, nessuna terza parte, nessun tempo inventato (COPY: DA CONFERMARE).
 * «Indicazioni stradali» è un link che apre Google Maps solo se lo tocchi (nuova scheda dichiarata).
 */
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/art/Icons";
import { CopyAddress } from "@/components/contact/CopyAddress";
import { Nearby } from "@/components/pages/Nearby";
import { PageIntro } from "@/components/pages/PageIntro";
import { RouteJourney } from "@/components/pages/RouteJourney";
import { SoloJs } from "@/components/pages/SoloJs";
import { Button } from "@/components/ui/button";
import { centralino, indirizzo } from "@/content/contacts";
import { copy } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import p from "@/components/pages/pages.module.css";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: copy.meta.comeArrivare.title },
  description: copy.meta.comeArrivare.description,
};

const t = copyPagine.comeArrivare;

/** Icona e, dove il BRIEF elenca nomi, l'elenco dei nomi (stazioni, aeroporti, fiere). */
const MODI: Record<string, { icona: IconName; nomi?: readonly string[] }> = {
  auto: { icona: "auto" },
  "tram-metro": { icona: "tram" },
  treno: { icona: "treno", nomi: t.stazioni },
  aereo: { icona: "aereo", nomi: t.aeroporti },
  fiere: { icona: "congressi", nomi: t.fiere },
};

const MAPPE = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(indirizzo.perMappe)}`;

export default function ComeArrivarePage() {
  const c = copy.comeArrivare;
  return (
    <>
      <section className="wrap section-y" aria-labelledby="arrivare-h1">
        <div className={s.testa}>
          <PageIntro id="arrivare-h1" eyebrow={t.eyebrow} titolo={c.h1} lead={c.sottotitolo}>
            <p className={p.corpo}>{c.intro}</p>
          </PageIntro>

          <div className={s.indirizzo}>
            <div className={s.via}>
              <Icon nome="mappa" size={24} />
              <address>
                {indirizzo.via}
                <br />
                {indirizzo.cap} {indirizzo.comune} ({indirizzo.provincia})
              </address>
            </div>
            <div className={`${p.azioni} ${p.azioniAffiancate}`}>
              <Button asChild variant="brand">
                <a href={MAPPE} target="_blank" rel="noopener" aria-label={t.ariaIndicazioni}>
                  {c.pulsanti.indicazioni}
                  <Icon nome="esterno" size={20} />
                </a>
              </Button>
              <SoloJs>
                <CopyAddress />
              </SoloJs>
              <Button asChild variant="outline">
                <a href={`tel:${centralino.telHref}`}>{c.pulsanti.chiama}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className={p.sezioneAlt} aria-labelledby="percorso-titolo">
        <div className="wrap">
          <RouteJourney />
        </div>
      </section>

      <section className="wrap section-y" aria-labelledby="modi-titolo">
        <div className={s.modi}>
          <div className={s.modiTesta}>
            <h2 id="modi-titolo" className="t-h2">
              {t.modiTitolo}
            </h2>
            <p className={p.corpo}>{t.tempiNota}</p>
          </div>
          <ul className={p.righe}>
            {c.blocchi.map((b) => {
              const m = MODI[b.id];
              return (
                <li key={b.id} className={p.riga} data-modo={b.id}>
                  <span className={p.rigaIcona}>
                    <Icon nome={m.icona} size={26} />
                  </span>
                  <div>
                    <h3 className={s.modoTitolo}>{b.titolo}</h3>
                    <p className={p.rigaDato}>{b.testo}</p>
                    {m.nomi && (
                      <ul className={p.tags} aria-label={b.titolo}>
                        {m.nomi.map((n) => (
                          <li key={n} className={p.tag}>
                            {n}
                          </li>
                        ))}
                      </ul>
                    )}
                    {b.id === "auto" && (
                      <p className={s.parcheggio}>
                        <span className={`t-num ${s.num}`}>{t.parcheggio.numero}</span>
                        <span>{t.parcheggio.testo}</span>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className={p.sezioneAlt} aria-labelledby="dintorni-titolo">
        <div className="wrap">
          <div className={p.testata}>
            <h2 id="dintorni-titolo" className="t-h2">
              {t.dintorni.titolo}
            </h2>
            <p className="t-lead">{t.dintorni.sottotitolo}</p>
          </div>
          <Nearby />
          <p className={s.notaDintorni}>{t.dintorni.nota}</p>
        </div>
      </section>
    </>
  );
}

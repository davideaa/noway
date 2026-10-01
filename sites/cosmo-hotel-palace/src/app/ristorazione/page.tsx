/*
 * /ristorazione/ (UX 8, COPY 6): Cosmo Grill & Lounge Bar.
 * Sabbia in cima (h1, introduzione, orari, i due locali), poi la sezione in tono sera con la scena 3D
 * e il cursore della giornata (GrillDay), poi il contatto del reparto.
 *
 * Onestà: gli orari non sono sul sito vecchio (COPY: DA CONFERMARE), quindi si scrive solo il ripiego
 * di COPY; il menu non è pubblicato e non se ne inventa uno.
 */
import type { Metadata } from "next";
import { Icon } from "@/components/art/Icons";
import { DepartmentRow } from "@/components/contact/DepartmentRow";
import { GrillDay } from "@/components/pages/GrillDay";
import { PageIntro } from "@/components/pages/PageIntro";
import { Button } from "@/components/ui/button";
import { centralino, repartoById } from "@/content/contacts";
import { copy } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import p from "@/components/pages/pages.module.css";
import s from "./page.module.css";

export const metadata: Metadata = {
  // il titolo di COPY 14 contiene già il nome dell'hotel: niente suffisso del layout
  title: { absolute: copy.meta.ristorazione.title },
  description: copy.meta.ristorazione.description,
};

const t = copyPagine.ristorazione;

export default function RistorazionePage() {
  const c = copy.ristorazione;
  return (
    <>
      <section className="wrap section-y" aria-labelledby="ristorazione-h1">
        <div className={s.testa}>
          <PageIntro id="ristorazione-h1" eyebrow={t.eyebrow} titolo={c.h1} lead={c.sottotitolo}>
            <p className={p.corpo}>{c.intro}</p>
          </PageIntro>

          <aside className={p.pannello} aria-labelledby="orari-titolo">
            <h2 id="orari-titolo" className={p.pannelloTitolo}>
              <Icon nome="orologio" size={22} />
              {t.orariTitolo}
            </h2>
            <p className={s.orariTesto}>{c.orariRipiego}</p>
            <div className={p.azioni}>
              <Button asChild variant="outline">
                <a href={`tel:${centralino.telHref}`}>
                  <Icon nome="telefono" size={22} />
                  {c.chiama}
                </a>
              </Button>
            </div>
            <p className={s.menuNota}>{t.menuNota}</p>
          </aside>
        </div>

        <div className={s.locali}>
          <section className={s.locale} aria-labelledby="grill-titolo">
            <h2 id="grill-titolo" className={`t-h3 ${s.localeTitolo}`}>
              <Icon nome="ristorante" size={28} />
              {t.grill.titolo}
            </h2>
            <ul className={s.fatti}>
              {t.grill.fatti.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
          <section className={s.locale} aria-labelledby="lounge-titolo">
            <h2 id="lounge-titolo" className={`t-h3 ${s.localeTitolo}`}>
              <Icon nome="caffe" size={28} />
              {t.lounge.titolo}
            </h2>
            <ul className={s.fatti}>
              {t.lounge.fatti.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <GrillDay />

      <section className={p.sezioneAlt} aria-labelledby="contatto-titolo">
        <div className="wrap">
          <div className={s.contatto}>
            <h2 id="contatto-titolo" className="t-h2">
              {t.contattoTitolo}
            </h2>
            <DepartmentRow reparto={repartoById("ristorante")} titolo="h3" />
          </div>
        </div>
      </section>
    </>
  );
}

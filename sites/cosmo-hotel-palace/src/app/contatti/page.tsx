/*
 * /contatti/ (UX 8, COPY 10): quattro reparti con «Chiama» e «Scrivi» da 48 px (telefono e email come link
 * veri), indirizzo con «Copia l'indirizzo», social (nuova scheda dichiarata nel nome accessibile) e
 * «Nel mondo Cosmo» (ripiego di COPY 10: senza la parola «gruppo»; nessun link, nessun dato inventato).
 * Nessun orario degli uffici (DA CONFERMARE).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/Icons";
import { CopyAddress } from "@/components/contact/CopyAddress";
import { DepartmentRow } from "@/components/contact/DepartmentRow";
import { PageIntro } from "@/components/pages/PageIntro";
import { SoloJs } from "@/components/pages/SoloJs";
import { Button } from "@/components/ui/button";
import { indirizzo, partner, reparti, social } from "@/content/contacts";
import { copy, fmt } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import p from "@/components/pages/pages.module.css";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: copy.meta.contatti.title },
  description: copy.meta.contatti.description,
};

const t = copyPagine.contatti;

export default function ContattiPage() {
  const c = copy.contatti;
  return (
    <>
      <section className="wrap section-y" aria-labelledby="contatti-h1">
        <PageIntro id="contatti-h1" eyebrow={t.eyebrow} titolo={c.h1} lead={c.sottotitolo} />
        <h2 className="sr-only">{t.repartiTitolo}</h2>
        <div className={s.reparti}>
          {reparti.map((r) => (
            <DepartmentRow key={r.id} reparto={r} />
          ))}
        </div>
      </section>

      <section className={p.sezioneAlt} aria-label={`${c.indirizzoTitolo} e ${c.socialTitolo}`}>
        <div className="wrap">
          <div className={s.dove}>
            <div className={s.blocco}>
              <h2 className="t-h3">{c.indirizzoTitolo}</h2>
              <div className={s.via}>
                <Icon nome="mappa" size={24} />
                <address>
                  {indirizzo.via}
                  <br />
                  {indirizzo.cap} {indirizzo.comune} ({indirizzo.provincia})
                </address>
              </div>
              <div className={`${p.azioni} ${p.azioniAffiancate}`}>
                <SoloJs>
                  <CopyAddress />
                </SoloJs>
                <Button asChild variant="outline" arrow>
                  <Link href="/come-arrivare/">{t.comeArrivare}</Link>
                </Button>
              </div>
            </div>

            <div className={s.blocco}>
              <h2 className="t-h3">{c.socialTitolo}</h2>
              <div className={`${p.azioni} ${p.azioniAffiancate}`}>
                {[social.instagram, social.facebook].map((x) => (
                  <Button key={x.nome} asChild variant="outline">
                    <a href={x.url} target="_blank" rel="noopener" aria-label={fmt(c.ariaSocial, { social: x.nome })}>
                      {x.nome}
                      <Icon nome="esterno" size={20} />
                    </a>
                  </Button>
                ))}
              </div>
              <p className={s.hashtag}>
                <span className="sr-only">{t.hashtagEtichetta}: </span>
                {social.hashtag}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section-y" aria-labelledby="mondo-titolo">
        <div className={s.mondo}>
          <div className={s.mondoTesta}>
            <h2 id="mondo-titolo" className="t-h2">
              {c.partner.titolo}
            </h2>
            <p className={p.corpo}>{c.partner.testo}</p>
          </div>
          <ul className={s.partner}>
            {partner.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

/*
 * Scena 2 — Perché sceglierci (UX 4.3, MOTION 6.1). Sette fatti veri come righe d'elenco, non
 * come carte: numero grande (--t-num) + riga breve; il dettaglio e la piccola illustrazione si
 * aprono con una disclosure nativa (<details name="fatti">: si apre una riga alla volta, funziona
 * anche senza JavaScript). Contatori sui quattro numeri veri (2, 201, 900, 200): salgono solo
 * quando sono visibili; il valore finale è già nell'HTML.
 */

import Link from "next/link";
import { FactIcon } from "@/components/art/FactIcons";
import { Icon, type IconName } from "@/components/art/Icons";
import { IconMinus, IconPlus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { facts } from "@/content/facts";
import { CountUp, LineReveal, Reveal } from "./Fx";
import { ETICHETTA_SCENA } from "@/lib/home/scene-order";
import s from "./whyus.module.css";

/** Un pittogramma per fatto (set di icone del sito): sempre visibile accanto al numero. */
const PITTOGRAMMA: Record<string, IconName> = {
  "vicino-milano": "tram",
  camere: "letto",
  congressi: "congressi",
  parcheggio: "parcheggio",
  wifi: "wifi",
  accessibile: "accessibilita",
  famiglia: "persone",
};

export function WhyUs() {
  return (
    <section id="perche" data-scena="perche" aria-labelledby="perche-titolo" className={s.sezione}>
      <div className={`wrap ${s.grid}`}>
        <header className={s.testa}>
          <p className={`t-label ${s.eyebrow}`}>{ETICHETTA_SCENA.perche}</p>
          <LineReveal as="h2" id="perche-titolo" className={s.h2}>
            {copy.perche.h2}
          </LineReveal>
          <Reveal as="p" className={`t-lead ${s.sotto}`} i={1}>
            {copy.perche.sottotitolo}
          </Reveal>
          <Reveal as="p" className={s.intro} i={2}>
            {copy.perche.intro}
          </Reveal>
          <Reveal className={s.cta} i={3}>
            <Button asChild variant="brand" size="md">
              <Link href="/camere/">{copy.perche.ctaCamere}</Link>
            </Button>
            <Button asChild variant="outline" size="md">
              <Link href="/centro-congressi/">{copy.perche.ctaCongressi}</Link>
            </Button>
          </Reveal>
        </header>

        <ul className={s.elenco} aria-label={copy.perche.h2}>
          {facts.map((f, i) => {
            const numero: { fino: number; suffisso?: string } | undefined = "contatore" in f ? f.contatore : undefined;
            return (
              <Reveal as="li" key={f.id} i={Math.min(i, 4)} className={s.voce}>
                <details name="fatti" open={i === 0} className={s.fatto} data-tipo={numero ? "numero" : "testo"}>
                  <summary className={s.riassunto}>
                    <span className={s.testoRiga}>
                      <span className={s.grande}>
                        {numero ? (
                          <CountUp a={numero.fino} suffisso={numero.suffisso} ritardo={i * 60} />
                        ) : (
                          f.grande
                        )}
                      </span>
                      <span className={s.piccolo}>
                        {f.resto ? <span className={s.resto}>{f.resto}</span> : null}
                        <span className={s.riga}>{f.riga}</span>
                      </span>
                    </span>
                    <span aria-hidden="true" className={s.icona}>
                      <Icon nome={PITTOGRAMMA[f.id]} size={32} />
                    </span>
                    <span aria-hidden="true" className={s.segno}>
                      <IconPlus size={22} className={s.piu} />
                      <IconMinus size={22} className={s.meno} />
                    </span>
                  </summary>
                  <div className={s.corpo}>
                    <p>{f.dettaglio}</p>
                    <div className={s.illustrazione}>
                      <FactIcon id={f.id} decorativo={false} />
                    </div>
                  </div>
                </details>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

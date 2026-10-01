"use client";

/*
 * Scena 7 — Centro Congressi (UX 4.3, MOTION 5.4). La scena 3D mostra la Plenaria del Sole che cambia
 * disposizione: platea → banchi di scuola → ferro di cavallo → banchetto. Le sedie saltano da una
 * disposizione all'altra (la scena fa il lavoro: `configura` con `k` pilotato dallo scroll).
 *
 * Desktop ≥ 1024 e movimento normale: scena fissata per 150 svh, p guida le quattro disposizioni; i
 * chip evidenziano quella attuale e un clic porta la pagina a quel punto. Telefono e movimento
 * ridotto: nessuna scena fissata; i chip cambiano la disposizione direttamente (le sedie scattano
 * con movimento ridotto). Le capienze sono SOLO quelle della tabella di COPY sez. 15, mai quelle
 * del disegno; il numero non sale a contatore (cambia con una dissolvenza, annunciato una volta).
 *
 * Sotto la scena fissata: i tre modi di usare gli spazi (elenco, non carte uguali) e «Trova la sala»,
 * il mini-selettore: partecipanti + disposizione → la sala più piccola adatta e il link alla pagina.
 * Senza JavaScript: poster, numeri, elenco e link alla pagina.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SceneFrame } from "@/components/scene/SceneFrame";
import { useSceneController, useStatoScena } from "@/components/scene/SceneCanvas";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { copy, fmt } from "@/content/copy";
import { copyHome } from "@/content/copy-home";
import { DISPOSIZIONI } from "@/content/congress-halls";
import type { ConfigurazioneSala, Disposizione } from "@/content/types";
import { announce } from "@/lib/a11y";
import {
  etichettaDisposizione,
  SALA_SCENA_ID,
  saleAdatte,
  trovaSala,
} from "@/lib/congress/availability";
import {
  scorriAProgresso,
  tappaDaProgresso,
  useScenaFissata,
  useScenaFissataProgress,
} from "@/lib/motion-fx";
import { clamp01 } from "@/lib/motion";
import { congressDef } from "@/scenes/congress/def";
import { Reveal } from "./Fx";
import s from "./congress.module.css";

const C = copy.congressi;
const SALA = trovaSala(SALA_SCENA_ID)!;

/** Le disposizioni nell'ordine della scena fissata: la scena parte dalla platea (come il poster). */
const SEQUENZA: readonly Disposizione[] = DISPOSIZIONI;

/** Tratti di p in cui avviene ogni passaggio (MOTION 5.4, riscalati: la scena parte già in platea). */
const PASSAGGI: ReadonlyArray<readonly [number, number]> = [
  [0.1, 0.26], // platea → banchi di scuola
  [0.38, 0.54], // banchi di scuola → ferro di cavallo
  [0.66, 0.82], // ferro di cavallo → banchetto
];
/** Dove si ferma la pagina per ogni disposizione (clic sui chip). */
const SOSTE = [0.04, 0.32, 0.6, 0.92] as const;
/** Confini della disposizione evidenziata: a metà di ogni passaggio. */
const SOGLIE = PASSAGGI.map(([a, b]) => (a + b) / 2);

/** p → (da, a, k): quale passaggio è in corso e a che punto è. In sosta da = a e k = 0. */
export function posizioneDaP(p: number): { da: number; a: number; k: number } {
  for (let j = 0; j < PASSAGGI.length; j++) {
    const [i0, i1] = PASSAGGI[j];
    if (p < i0) return { da: j, a: j, k: 0 };
    if (p < i1) return { da: j, a: j + 1, k: clamp01((p - i0) / (i1 - i0)) };
  }
  return { da: PASSAGGI.length, a: PASSAGGI.length, k: 0 };
}

const config = (d: Disposizione): ConfigurazioneSala => ({
  sala: SALA_SCENA_ID,
  disposizione: d,
  ospiti: null,
  divisa: false,
});

/** Divide «oltre 900 m²» in prefisso, numero e resto, per dare al numero la sua dimensione. */
function dividiNumero(t: string): { pre: string; n: string; post: string } {
  const m = /^(\D*?)(\d[\d.]*)(.*)$/.exec(t);
  return m ? { pre: m[1].trim(), n: m[2], post: m[3].trim() } : { pre: "", n: t, post: "" };
}

/* ───────────── «Trova la sala» ───────────── */

function TrovaSala() {
  const [n, setN] = useState("120");
  const [d, setD] = useState<Disposizione>("platea");
  const t = C.configuratore.trovaSala;

  const nn = Number.parseInt(n, 10);
  const valido = Number.isFinite(nn) && nn > 0;
  const adatte = useMemo(() => (valido ? saleAdatte(nn, d) : []), [valido, nn, d]);

  let riga: string;
  if (!valido) riga = copyHome.congressi.selettoreVuoto;
  else if (adatte.length === 0) riga = t.oltreMassimo;
  else {
    const prima = adatte[0];
    const k = adatte.length - 1;
    riga = fmt(t.risultato, {
      n: nn,
      disposizione: etichettaDisposizione(d).toLowerCase(),
      sala: prima.name,
      c: prima.cap[d] ?? 0,
      k,
    });
    // grammatica: «Altre 1 sale» e «Altre 0 sale» non si scrivono
    riga = riga.replace(/ Altre 0 sale vanno bene\.$/, "").replace(/Altre 1 sale vanno bene\./, "Un'altra sala va bene.");
  }
  const href = valido
    ? `/centro-congressi/?n=${nn}&disp=${d}#configura`
    : "/centro-congressi/#configura";

  return (
    <div className={s.trova}>
      <h3 className={s.trovaTitolo}>{t.titolo}</h3>
      <Field label={C.configuratore.partecipanti.etichetta} hint={copyHome.congressi.selettoreAiuto} className={s.campo}>
        {(c) => (
          <Input
            {...c}
            inputMode="numeric"
            autoComplete="off"
            value={n}
            onChange={(e) => setN(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
          />
        )}
      </Field>
      <ChipGroup
        aria-label={copyHome.congressi.ariaSelettore}
        value={d}
        onValueChange={(v) => setD(v as Disposizione)}
        options={SEQUENZA.map((x) => ({ value: x, label: etichettaDisposizione(x) }))}
      />
      <p className={s.trovaRiga} role="status" aria-live="polite">
        {riga}
      </p>
      <Button asChild variant="brand" size="md">
        <Link href={href}>{C.presentazione.pulsanti.configura}</Link>
      </Button>
    </div>
  );
}

/* ───────────── Scena ───────────── */

export function CongressTeaser() {
  const pista = useRef<HTMLDivElement>(null);
  const ctrl = useSceneController(congressDef);
  const stato = useStatoScena(ctrl);
  const fissata = useScenaFissata();
  const [attuale, setAttuale] = useState(0); // indice nella SEQUENZA
  const applicata = useRef<{ da: number; a: number } | null>(null);
  const ultimoP = useRef(0);

  /** Pilota la scena: da/a e k. Il lavoro pesante (`configura`) si fa solo quando cambia il passaggio. */
  const pilota = useCallback(
    (p: number) => {
      const { da, a, k } = posizioneDaP(p);
      const att = applicata.current;
      if (!att || att.da !== da || att.a !== a) {
        applicata.current = { da, a };
        ctrl.configura(config(SEQUENZA[da]), { istantaneo: true });
        if (a !== da) ctrl.configura(config(SEQUENZA[a]), { k });
      }
      if (a !== da) ctrl.setProgresso(k);
    },
    [ctrl],
  );

  useScenaFissataProgress(pista, {
    onProgress: (p, attiva) => {
      if (!attiva) return;
      ultimoP.current = p;
      pilota(p);
      setAttuale((prima) => tappaDaProgresso(p, SOGLIE, prima));
    },
  });

  // la scena (ri)nasce con il suo stato iniziale: si rimette in pari con la posizione di scroll
  useEffect(() => {
    if (stato !== "pronta") return;
    applicata.current = null;
    if (fissata) pilota(ultimoP.current);
    else ctrl.configura(config(SEQUENZA[attuale]), { istantaneo: true });
    // solo quando la scena diventa pronta o cambia la modalità
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stato, fissata]);

  const scegli = (v: string) => {
    const i = SEQUENZA.indexOf(v as Disposizione);
    if (i < 0) return;
    if (fissata && pista.current) {
      // un solo numero, p: la pagina scorre fino alla sosta di quella disposizione
      scorriAProgresso(pista.current, SOSTE[i], true);
    } else {
      setAttuale(i);
      // la scena anima da sola (720 ms; con movimento ridotto scatta)
      applicata.current = null;
      ctrl.configura(config(SEQUENZA[i]));
    }
  };

  // «fino a {n} persone»: cambia con una dissolvenza e si annuncia una volta (debounce 400 ms)
  const disposizione = SEQUENZA[attuale];
  const capienza = SALA.cap[disposizione] ?? 0;
  const risultato = fmt(C.configuratore.risultato.riga, {
    sala: SALA.name,
    disposizione: etichettaDisposizione(disposizione),
    n: capienza,
  });
  const primo = useRef(true);
  useEffect(() => {
    if (primo.current) {
      primo.current = false;
      return;
    }
    const t = setTimeout(() => announce(risultato), 400);
    return () => clearTimeout(t);
  }, [risultato]);

  const numeri = C.presentazione.numeri;

  return (
    <section id="congressi" data-scena="congressi" aria-labelledby="congressi-titolo" className={s.sezione}>
      <div ref={pista} className={s.pista} data-sticky="">
        <div className={s.stage}>
          <div className={`wrap ${s.grid}`}>
            <header className={s.testa}>
              <h2 id="congressi-titolo" className={s.h2}>
                {C.presentazione.h1}
              </h2>
              <p className={`t-lead ${s.sotto}`}>{C.presentazione.sottotitolo}</p>
            </header>

            <div className={s.scena}>
              <div className={s.arcoBox}>
                <SceneFrame
                  def={congressDef}
                  controller={ctrl}
                  className={s.arco}
                  elenco={false}
                  mostraNota={false}
                />
              </div>
              <div className={s.sotto2}>
                <p className={s.nota}>
                  {disposizione === "banchetto" ? C.configuratore.scena.notaBanchetto : C.configuratore.scena.notaDisposizione}
                  {" · "}
                  {copy.hero.nota}
                </p>
                <ChipGroup
                  aria-label={copyHome.congressi.ariaDisposizione}
                  value={disposizione}
                  onValueChange={scegli}
                  options={SEQUENZA.map((x) => ({ value: x, label: etichettaDisposizione(x) }))}
                />
                <p className={s.risultato} data-k={attuale}>
                  <span key={risultato} className={s.risultatoTesto}>
                    {risultato}
                  </span>
                </p>
              </div>
            </div>

            <ul className={s.numeri} aria-label={C.presentazione.h1}>
              {[numeri.superficie, numeri.persone, numeri.parcheggio, numeri.piani].map((t) => {
                const x = dividiNumero(t);
                return (
                  <li key={t} className={s.numero}>
                    {x.pre ? <span className={s.numPre}>{x.pre}</span> : null}
                    <span className={s.numGrande}>
                      {x.n}
                      {x.post ? <span className={s.numPost}> {x.post}</span> : null}
                    </span>
                    <span className="sr-only">{t}</span>
                  </li>
                );
              })}
            </ul>

            <div className={s.azione}>
              <Button asChild variant="brand" size="lg">
                <Link href="/centro-congressi/">{copy.azioni.scopriCongressi}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`wrap ${s.coda}`}>
        <Reveal className={s.spazi}>
          <h3 className={s.spaziTitolo}>{copyHome.congressi.saleTitolo}</h3>
          <ul className={s.spaziElenco}>
            {C.presentazione.sottoSchede.map((x) => (
              <li key={x.id} className={s.spazio}>
                <h4 className={s.spazioNome}>{x.titolo}</h4>
                <p>{x.testo}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal i={1}>
          <TrovaSala />
        </Reveal>
      </div>
    </section>
  );
}

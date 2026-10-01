"use client";

/*
 * Mini-selettore «Trova la sala» (UX 4.3 scena 7, `saleAdatte`): «quante persone, in che disposizione →
 * la sala più piccola adatta». Il risultato è una frase (area di stato), con le sale che vanno bene
 * dalla più piccola in su; il pulsante porta la sala nel configuratore con la disposizione e i
 * partecipanti già scritti. Nessun conteggio del totale delle sale (DECISIONI 7): «Altre {k} sale
 * vanno bene» conta solo quelle adatte a questo numero.
 */

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { copy } from "@/content/copy";
import type { Disposizione } from "@/content/types";
import { DISPOSIZIONI, etichettaDisposizione, saleAdatte } from "@/lib/congress/availability";
import { useCongresso } from "./CongressState";
import { leggiOspiti, risultatoTrova, testi } from "./testi";
import s from "./congress.module.css";

const trova = copy.congressi.configuratore.trovaSala;

const OPZIONI = DISPOSIZIONI.map((d) => ({ value: d, label: etichettaDisposizione(d) }));

export function FindHall() {
  const c = useCongresso();
  const [n, setN] = useState("");
  const [d, setD] = useState<Disposizione>("platea");
  const [uscito, setUscito] = useState(false);
  const etichettaId = useId();

  const num = leggiOspiti(n);
  const sale = num ? saleAdatte(num, d) : [];
  const migliore = sale[0];
  const errore = uscito && n.trim() !== "" && num === null ? testi.trova.cifre : undefined;

  let esito: string;
  if (!n.trim()) esito = testi.trova.vuoto;
  else if (num === null) esito = "";
  else if (!migliore) esito = trova.oltreMassimo;
  else esito = risultatoTrova(num, d, migliore, sale.slice(1));

  const vai = () => {
    if (!migliore || !num) return;
    c.setOspiti(String(num));
    c.scegliSala(migliore.id);
    c.scegliDisposizione(d);
    c.scorriA("configura-strumento");
  };

  return (
    <div className={s.trova} role="group" aria-labelledby={etichettaId}>
      <div className={s.trovaTesta}>
        <h3 id={etichettaId} className={s.trovaTitolo}>
          {trova.titolo}
        </h3>
        <p className={s.aiuto}>{testi.trova.sottotitolo}</p>
      </div>
      <div className={s.trovaControlli}>
        <Field label={testi.trova.persone} error={errore} id="trova-n">
          {(ctl) => (
            <Input
              {...ctl}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={n}
              onChange={(e) => {
                setN(e.target.value);
                if (leggiOspiti(e.target.value) !== null) setUscito(false);
              }}
              onBlur={() => setUscito(true)}
              className={s.campoNumero}
            />
          )}
        </Field>
        <div className={s.trovaDisp}>
          <span className={s.ordinaEtichetta} id={`${etichettaId}-d`}>
            {testi.trova.disposizione}
          </span>
          <ChipGroup
            aria-labelledby={`${etichettaId}-d`}
            options={OPZIONI}
            value={d}
            onValueChange={(v) => setD(v as Disposizione)}
          />
        </div>
      </div>
      <p className={s.trovaEsito} role="status" aria-live="polite" data-vuoto={!n.trim() ? "1" : undefined}>
        {esito}
      </p>
      {migliore && (
        <Button variant="outline" size="md" onClick={vai} className={s.trovaPulsante}>
          {testi.trova.vedi}
        </Button>
      )}
    </div>
  );
}

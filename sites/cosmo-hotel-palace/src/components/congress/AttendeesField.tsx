"use client";

/*
 * «Quanti partecipanti?» (UX 7.2, facoltativo). Campo di testo con tastiera numerica. Il valore sta
 * nello stato condiviso: è lo stesso del modulo «Richiesta di proposta», non si riscrive.
 * Accanto, l'indicatore «{n} su {capienza}» in TESTO, con una barra sottile che non è l'unica
 * informazione. L'avviso se si supera la capienza sta nella riga risultato (non blocca nulla).
 */

import { useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { copy, fmt } from "@/content/copy";
import { useCongresso } from "./CongressState";
import { leggiOspiti, testi } from "./testi";
import s from "./congress.module.css";

const cfg = copy.congressi.configuratore;

export function AttendeesField() {
  const c = useCongresso();
  const [uscito, setUscito] = useState(false);
  const scritto = c.stato.ospiti.trim();
  const valido = scritto === "" || leggiOspiti(scritto) !== null;
  const errore = uscito && !valido ? copy.congressi.modulo.errori.ospitiNonNumerico : undefined;
  const mostraIndicatore = c.ospitiNum !== null && !c.divisa;
  const perc = mostraIndicatore ? Math.min(100, Math.round(((c.ospitiNum as number) / Math.max(1, c.capienza)) * 100)) : 0;
  const oltre = mostraIndicatore && (c.ospitiNum as number) > c.capienza;

  return (
    <div className={s.partecipanti}>
      <Field label={cfg.partecipanti.etichetta} hint={testi.aiutoPartecipanti} error={errore} id="cfg-ospiti">
        {(ctl) => (
          <Input
            {...ctl}
            name="partecipanti"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={c.stato.ospiti}
            onChange={(e) => {
              c.setOspiti(e.target.value);
              if (leggiOspiti(e.target.value) !== null || e.target.value.trim() === "") setUscito(false);
            }}
            onBlur={() => setUscito(true)}
            className={s.campoNumero}
          />
        )}
      </Field>
      {mostraIndicatore && (
        <div className={s.indicatore}>
          <p className={s.indicatoreTesto} data-oltre={oltre ? "1" : undefined}>
            {fmt(cfg.partecipanti.indicatore, { n: c.ospitiNum as number, capienza: c.capienza })}
          </p>
          <div className={s.barra} aria-hidden="true">
            <span className={s.barraRiempita} data-oltre={oltre ? "1" : undefined} style={{ inlineSize: `${perc}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

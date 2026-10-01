"use client";

/*
 * Modulo «Richiesta di proposta» (UX 7.3, COPY 8.3, DECISIONI 11). NESSUN INVIO FINTO: il sito è
 * statico e `HAS_BACKEND = false`. Il pulsante principale controlla i campi e apre la posta
 * dell'utente con un `mailto:` precompilato (`mailto()`); accanto c'è «Copia il testo della richiesta»
 * per chi non ha un programma di posta. «Richiesta inviata» non si mostra mai.
 *
 * Senza JavaScript il modulo funziona lo stesso, alla vecchia maniera: `action="mailto:…"` con
 * `enctype="text/plain"` (alcuni programmi di posta compilano il corpo; non è verificato su client
 * reali) e l'indirizzo scritto sotto. Con JavaScript `noValidate` toglie le bolle del browser e
 * subentrano i controlli del modulo: riepilogo errori con focus, poi un errore per campo all'uscita.
 *
 * Sala, disposizione e partecipanti vivono nello stato condiviso: sono gli stessi del configuratore
 * e restano allineati nei due sensi.
 */

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Status } from "@/components/ui/status";
import { repartoById } from "@/content/contacts";
import { copy, fmt } from "@/content/copy";
import { congressHalls } from "@/content/congress-halls";
import { DISPOSIZIONI, etichettaDisposizione, oltreCapienza } from "@/lib/congress/availability";
import { HAS_BACKEND } from "@/lib/congress/config";
import { EMAIL_EVENTI, mailto, testoRichiesta, type RichiestaProposta } from "@/lib/congress/mailto";
import { romeToday } from "@/lib/rome-time";
import { useCongresso } from "./CongressState";
import { etichettaMin, testi } from "./testi";
import { ORDINE_CAMPI, validaModulo, type CampiModulo, type ChiaveErrore } from "./validazione";
import s from "./congress.module.css";

const m = copy.congressi.modulo;
const campi = m.campi;
const nessunAscolto = () => () => {};

type Locali = {
  nome: string;
  azienda: string;
  email: string;
  telefono: string;
  tipo: string;
  data: string;
  camere: string;
  messaggio: string;
  consenso: boolean;
};

const VUOTI: Locali = {
  nome: "",
  azienda: "",
  email: "",
  telefono: "",
  tipo: "",
  data: "",
  camere: "",
  messaggio: "",
  consenso: false,
};

/** Id dei campi, per i link del riepilogo errori. */
const ID: Record<ChiaveErrore, string> = {
  nome: "richiesta-nome",
  email: "richiesta-email",
  telefono: "richiesta-telefono",
  data: "richiesta-data",
  ospiti: "richiesta-ospiti",
  consenso: "richiesta-consenso",
};

const ETICHETTA: Record<ChiaveErrore, string> = {
  nome: campi.nome.etichetta,
  email: campi.email.etichetta,
  telefono: campi.telefono.etichetta.replace(/\s*\(facoltativo\)\s*$/i, ""),
  data: campi.data.etichetta,
  ospiti: campi.ospiti.etichetta,
  consenso: campi.consenso.etichetta,
};

/** Apre il programma di posta con un link `mailto:` (come un clic su un link). Non invia nulla. */
function apriPosta(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Copia negli appunti: l'API moderna, poi il vecchio `execCommand`. `false` se nessuna delle due riesce. */
async function copiaTesto(testo: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(testo);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = testo;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function ProposalForm() {
  const c = useCongresso();
  const caricato = useSyncExternalStore(
    nessunAscolto,
    () => true,
    () => false,
  );
  const [v, setV] = useState<Locali>(VUOTI);
  const [tentato, setTentato] = useState(false);
  const [toccati, setToccati] = useState<ReadonlySet<ChiaveErrore>>(new Set());
  const [esito, setEsito] = useState<"" | "aperta" | "copiato" | "copia-ko">("");
  const [tagliato, setTagliato] = useState(false);
  const riepilogoErrori = useRef<HTMLDivElement>(null);
  const areaTesto = useRef<HTMLTextAreaElement>(null);

  const imposta = <K extends keyof Locali>(k: K, val: Locali[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setEsito("");
  };

  const valoriControllo: CampiModulo = {
    nome: v.nome,
    email: v.email,
    telefono: v.telefono,
    ospiti: c.stato.ospiti,
    data: v.data,
    consenso: v.consenso,
  };
  const oggi = romeToday();
  const tutti = validaModulo(valoriControllo, oggi);
  const visibile = (k: ChiaveErrore): string | undefined => (tentato || toccati.has(k) ? tutti[k] : undefined);
  const elencoErrori = tentato ? ORDINE_CAMPI.filter((k) => tutti[k]) : [];

  const tocca = (k: ChiaveErrore) => setToccati((p) => (p.has(k) ? p : new Set(p).add(k)));
  const uscita = (k: ChiaveErrore) => () => {
    tocca(k);
  };

  const richiesta = (): RichiestaProposta => ({
    sala: c.hall.name,
    disposizione: c.disposizione,
    ospiti: c.stato.ospiti.trim(),
    data: v.data,
    nome: v.nome,
    azienda: v.azienda,
    email: v.email,
    telefono: v.telefono,
    tipoEvento: v.tipo,
    camere: v.camere,
    messaggio: v.messaggio,
  });

  /** `true` se i campi sono a posto; altrimenti mostra il riepilogo e porta lì il focus. */
  const controlla = (): boolean => {
    setTentato(true);
    const errori = validaModulo(valoriControllo, oggi);
    if (Object.keys(errori).length === 0) return true;
    setEsito("");
    // il riepilogo compare nel prossimo render: il focus si sposta subito dopo
    requestAnimationFrame(() => riepilogoErrori.current?.focus());
    return false;
  };

  const invia = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!controlla()) return;
    const r = mailto(richiesta());
    setTagliato(r.messaggioTagliato);
    setEsito("aperta");
    // Apre il programma di posta dell'utente. Non invia nulla: preme Invia lui.
    apriPosta(r.url);
  };

  const copia = async () => {
    if (!controlla()) return;
    const ok = await copiaTesto(testoRichiesta(richiesta()));
    setEsito(ok ? "copiato" : "copia-ko");
    if (!ok) requestAnimationFrame(() => areaTesto.current?.select());
  };

  const vaiAlCampo = (k: ChiaveErrore) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(ID[k])?.focus();
  };

  const messaggioStato =
    esito === "aperta" ? m.senzaBackend.apertura : esito === "copiato" ? m.senzaBackend.copiato : esito === "copia-ko" ? testi.modulo.copiaFallita : "";

  const eventi = repartoById("eventi");
  const avvisoOltre = oltreCapienza(c.hall, c.disposizione, c.ospitiNum)
    ? fmt(m.errori.ospitiOltreCapienza, {
        n: c.ospitiNum as number,
        disp: etichettaMin(c.disposizione),
        sala: c.hall.name,
      })
    : null;
  const [prima, dopo] = campi.consenso.etichetta.split(campi.consenso.linkTesto);
  // «Non si apre la posta? Scrivi a events@….» con l'indirizzo come link
  const [prefissoIndirizzo, suffissoIndirizzo] = m.senzaBackend.indirizzoAlternativo.split(EMAIL_EVENTI);

  return (
    <form
      className={s.modulo}
      // Senza JavaScript: apertura della posta con i campi compilati (non verificato su client reali)
      action={`mailto:${EMAIL_EVENTI}`}
      method="post"
      encType="text/plain"
      noValidate={caricato}
      onSubmit={invia}
      aria-labelledby="richiesta-titolo"
    >
      {/* riepilogo errori: l'area live esiste sempre, il contenuto compare dopo il tentativo */}
      <div aria-live="polite" className={s.riepilogoErrori}>
        {elencoErrori.length > 0 && (
          <Status
            ref={riepilogoErrori}
            tabIndex={-1}
            tone="error"
            role="none"
            title={fmt(m.errori.riepilogo, { n: elencoErrori.length })}
          >
            <ul className={s.erroriLista}>
              {elencoErrori.map((k) => (
                <li key={k}>
                  <a href={`#${ID[k]}`} onClick={vaiAlCampo(k)}>
                    {ETICHETTA[k]}: {tutti[k]}
                  </a>
                </li>
              ))}
            </ul>
          </Status>
        )}
      </div>

      <div className={s.campiGriglia}>
        <Field label={campi.nome.etichetta} required requiredText={testi.modulo.obbligatorio} error={visibile("nome")} id={ID.nome}>
          {(ctl) => (
            <Input
              {...ctl}
              name="nome"
              autoComplete="name"
              required
              value={v.nome}
              onChange={(e) => imposta("nome", e.target.value)}
              onBlur={uscita("nome")}
            />
          )}
        </Field>
        <Field label={campi.azienda.etichetta} id="richiesta-azienda">
          {(ctl) => (
            <Input
              {...ctl}
              name="azienda"
              autoComplete="organization"
              value={v.azienda}
              onChange={(e) => imposta("azienda", e.target.value)}
            />
          )}
        </Field>

        <Field
          label={campi.email.etichetta}
          hint={campi.email.aiuto}
          required
          requiredText={testi.modulo.obbligatorio}
          error={visibile("email")}
          id={ID.email}
        >
          {(ctl) => (
            <Input
              {...ctl}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={v.email}
              onChange={(e) => imposta("email", e.target.value)}
              onBlur={uscita("email")}
            />
          )}
        </Field>
        <Field label={campi.telefono.etichetta} hint={campi.telefono.aiuto} error={visibile("telefono")} id={ID.telefono}>
          {(ctl) => (
            <Input
              {...ctl}
              name="telefono"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={v.telefono}
              onChange={(e) => imposta("telefono", e.target.value)}
              onBlur={uscita("telefono")}
            />
          )}
        </Field>

        <Field label={campi.tipo.etichetta} id="richiesta-tipo">
          {(ctl) => (
            <Select {...ctl} name="tipo" value={v.tipo} onChange={(e) => imposta("tipo", e.target.value)}>
              <option value="">{testi.modulo.scegliTipo}</option>
              {campi.tipo.opzioni.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={campi.data.etichetta} hint={campi.data.aiuto} error={visibile("data")} id={ID.data}>
          {(ctl) => (
            <Input
              {...ctl}
              name="data"
              autoComplete="off"
              placeholder={campi.data.esempio}
              value={v.data}
              onChange={(e) => imposta("data", e.target.value)}
              onBlur={uscita("data")}
            />
          )}
        </Field>

        <div className={s.campoConAvviso}>
          <Field label={campi.ospiti.etichetta} hint={campi.ospiti.aiuto} error={visibile("ospiti")} id={ID.ospiti}>
            {(ctl) => (
              <Input
                {...ctl}
                name="partecipanti"
                inputMode="numeric"
                autoComplete="off"
                value={c.stato.ospiti}
                onChange={(e) => {
                  c.setOspiti(e.target.value);
                  setEsito("");
                }}
                onBlur={uscita("ospiti")}
              />
            )}
          </Field>
          {/* avviso, non errore: non blocca l'invio. L'area esiste sempre così il testo viene annunciato. */}
          <div role="status" aria-live="polite">
            {avvisoOltre && (
              <Status tone="neutral" role="none">
                <p>{avvisoOltre}</p>
              </Status>
            )}
          </div>
        </div>
        <Field label={campi.camere.etichetta} hint={campi.camere.aiuto} id="richiesta-camere">
          {(ctl) => (
            <Input
              {...ctl}
              name="camere"
              inputMode="numeric"
              autoComplete="off"
              value={v.camere}
              onChange={(e) => imposta("camere", e.target.value)}
            />
          )}
        </Field>

        <Field label={campi.sala.etichetta} id="richiesta-sala">
          {(ctl) => (
            <Select
              {...ctl}
              name="sala"
              value={c.hall.id}
              onChange={(e) => {
                c.scegliSala(e.target.value);
                setEsito("");
              }}
            >
              {([0, -1] as const).map((piano) => (
                <optgroup key={piano} label={piano === 0 ? copy.congressi.configuratore.filtri.piano0 : copy.congressi.configuratore.filtri.pianoMeno1}>
                  {congressHalls
                    .filter((h) => h.floor === piano)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </Select>
          )}
        </Field>
        <Field label={campi.disposizione.etichetta} id="richiesta-disposizione">
          {(ctl) => (
            <Select
              {...ctl}
              name="disposizione"
              value={c.disposizione}
              onChange={(e) => {
                c.scegliDisposizione(e.target.value as (typeof DISPOSIZIONI)[number]);
                setEsito("");
              }}
            >
              {DISPOSIZIONI.map((d) => {
                const manca = c.hall.cap[d] === null;
                return (
                  <option key={d} value={d} disabled={manca}>
                    {etichettaDisposizione(d)}
                    {manca ? ` ${testi.modulo.nonIndicataNelLabel}` : ""}
                  </option>
                );
              })}
            </Select>
          )}
        </Field>

        <Field label={campi.messaggio.etichetta} hint={campi.messaggio.aiuto} id="richiesta-messaggio" className={s.campoIntero}>
          {(ctl) => (
            <Textarea
              {...ctl}
              name="messaggio"
              value={v.messaggio}
              onChange={(e) => imposta("messaggio", e.target.value)}
            />
          )}
        </Field>
      </div>

      <CheckField
        id={ID.consenso}
        name="consenso"
        required
        checked={v.consenso}
        onChange={(e) => {
          imposta("consenso", e.target.checked);
          tocca("consenso");
        }}
        error={visibile("consenso")}
        label={
          <>
            {prima}
            <Link href="/privacy/" target="_blank" rel="noopener" aria-label={testi.modulo.informativaNuovaScheda}>
              {campi.consenso.linkTesto}
            </Link>
            {dopo}
          </>
        }
      />

      {/* azioni: senza backend il pulsante apre la posta, non invia */}
      <div className={s.azioni}>
        <Button type="submit" variant="brand" size="md" className={s.azionePrimaria}>
          {HAS_BACKEND ? m.soloConBackend.invia : m.senzaBackend.pulsante}
        </Button>
        {/* copiare negli appunti ha bisogno di JavaScript: senza, il pulsante non c'è */}
        {caricato && (
          <Button type="button" variant="outline" size="md" onClick={copia} className={s.azione}>
            {m.senzaBackend.copia}
          </Button>
        )}
        <Button asChild variant="ghost" size="md" className={s.azione}>
          <a href={`tel:${eventi.telHref}`}>{m.senzaBackend.chiamaEventi}</a>
        </Button>
      </div>

      {/* stato: l'area esiste sempre, così il cambio di testo viene annunciato */}
      <div role="status" aria-live="polite" className={s.esito}>
        {messaggioStato && (
          <Status tone={esito === "copia-ko" ? "neutral" : "ok"} role="none">
            <p>{messaggioStato}</p>
            {esito === "aperta" && tagliato && <p>{testi.modulo.messaggioTagliato}</p>}
          </Status>
        )}
      </div>

      {esito === "copia-ko" && (
        <textarea
          ref={areaTesto}
          readOnly
          aria-label={testi.modulo.areaTesto}
          className={s.areaCopia}
          rows={10}
          value={testoRichiesta(richiesta())}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}

      <p className={s.notaPiccola}>
        {prefissoIndirizzo}
        <a href={`mailto:${EMAIL_EVENTI}`}>{EMAIL_EVENTI}</a>
        {suffissoIndirizzo}
      </p>
      <noscript>
        <p className={s.notaPiccola}>{testi.modulo.senzaJs}</p>
      </noscript>
    </form>
  );
}

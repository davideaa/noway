"use client";

/*
 * «Le sale e le loro misure»: tabella accessibile e ordinabile (UX 7.1). Tutti i numeri sono quelli
 * pubblicati, copiati dalla tabella di COPY: nessun valore calcolato. Nessun conteggio di sale.
 *
 *  - È una vera <table>: `caption`, `th scope="col"` con `aria-sort`, `th scope="row"` per la sala.
 *  - Senza JavaScript resta la tabella, già ordinata per capienza decrescente; i pulsanti di ordine
 *    nelle intestazioni compaiono solo a pagina caricata (un pulsante morto sarebbe peggio di niente).
 *  - Colonne: prima la sala e le quattro capienze, poi superficie, dimensioni, altezza e piano. Sul
 *    telefono la prima colonna resta ferma e il resto scorre di lato dentro una regione con nome,
 *    raggiungibile con la tastiera (WCAG 1.4.10: tabella di dati).
 *  - Il trattino «–» = disposizione non indicata; ai lettori di schermo dice «non indicata».
 */

import { useMemo, useState, useSyncExternalStore } from "react";
import { ChipGroup } from "@/components/ui/chip";
import { IconChevronDown } from "@/components/ui/icons";
import { copy } from "@/content/copy";
import type { CongressHall, Disposizione } from "@/content/types";
import { announce } from "@/lib/a11y";
import { capienzaMassima, DISPOSIZIONI, saleOrdinate, type FiltroPiano } from "@/lib/congress/availability";
import { misureSala, numIt, pianoSala, testi } from "./testi";
import s from "./congress.module.css";

const cfg = copy.congressi.configuratore;
const t = testi.tabella;
const nessunAscolto = () => () => {};

type Chiave = "capienza" | "nome" | "superficie" | Disposizione;
type Verso = "asc" | "desc";

const FILTRI = [
  { value: "tutte", label: cfg.filtri.tutte },
  { value: "0", label: cfg.filtri.piano0 },
  { value: "-1", label: cfg.filtri.pianoMeno1 },
];

const ORDINI = [
  { value: "capienza", label: cfg.ordina.capienza },
  { value: "superficie", label: cfg.ordina.superficie },
  { value: "nome", label: t.nome },
];

/** Verso di partenza quando si sceglie una colonna: i numeri dal più grande, il nome dalla A. */
const versoIniziale = (k: Chiave): Verso => (k === "nome" ? "asc" : "desc");

const nomeCriterio: Record<Chiave, string> = {
  capienza: cfg.ordina.capienza.toLowerCase(),
  nome: t.nome.toLowerCase(),
  superficie: cfg.ordina.superficie.toLowerCase(),
  platea: cfg.disposizioni.platea.etichetta.toLowerCase(),
  banchi: cfg.disposizioni.banchi.etichetta.toLowerCase(),
  ferro: cfg.disposizioni.ferro.etichetta.toLowerCase(),
  banchetto: cfg.disposizioni.banchetto.etichetta.toLowerCase(),
};

function ordina(sale: readonly CongressHall[], k: Chiave, verso: Verso): CongressHall[] {
  const dir = verso === "asc" ? 1 : -1;
  const base = sale.map((h, i) => ({ h, i }));
  const val = (h: CongressHall): number | null =>
    k === "capienza" ? capienzaMassima(h) : k === "superficie" ? h.areaM2 : k === "nome" ? null : h.cap[k];
  base.sort((a, b) => {
    if (k === "nome") return dir * a.h.name.localeCompare(b.h.name, "it") || a.i - b.i;
    const x = val(a.h);
    const y = val(b.h);
    // le disposizioni non indicate vanno sempre in fondo
    if (x === null && y === null) return a.i - b.i;
    if (x === null) return 1;
    if (y === null) return -1;
    return dir * (x - y) || a.i - b.i;
  });
  return base.map((r) => r.h);
}

function Intestazione({
  chiave,
  testo,
  nascosta,
  nomeAria,
  attivo,
  verso,
  interattivo,
  onOrdina,
  className,
}: {
  chiave: Chiave;
  testo: string;
  nascosta?: string;
  /** Nome della colonna per i lettori di schermo («Ordina per {nome}»), se diverso dal testo. */
  nomeAria?: string;
  attivo: boolean;
  verso: Verso;
  interattivo: boolean;
  onOrdina: (k: Chiave) => void;
  className?: string;
}) {
  const nomeCompleto = nomeAria ?? `${testo}${nascosta ?? ""}`;
  const contenuto = (
    <>
      {testo}
      {nascosta ? <span className="sr-only">{nascosta}</span> : null}
    </>
  );
  return (
    <th
      scope="col"
      className={className}
      aria-sort={attivo ? (verso === "asc" ? "ascending" : "descending") : "none"}
    >
      {interattivo ? (
        <button
          type="button"
          className={s.thPulsante}
          onClick={() => onOrdina(chiave)}
          aria-label={t.ariaOrdina.replace("{colonna}", nomeCompleto)}
        >
          {contenuto}
          <IconChevronDown
            size={16}
            className={s.thFreccia}
            data-attivo={attivo ? "1" : undefined}
            data-verso={attivo ? verso : undefined}
          />
        </button>
      ) : (
        contenuto
      )}
    </th>
  );
}

export function HallTable() {
  const caricato = useSyncExternalStore(
    nessunAscolto,
    () => true,
    () => false,
  );
  const [piano, setPiano] = useState<FiltroPiano>("tutte");
  const [chiave, setChiave] = useState<Chiave>("capienza");
  const [verso, setVerso] = useState<Verso>("desc");

  const righe = useMemo(() => ordina(saleOrdinate({ piano }), chiave, verso), [piano, chiave, verso]);

  const scegliOrdine = (k: Chiave) => {
    let v: Verso;
    if (k === chiave) v = verso === "asc" ? "desc" : "asc";
    else v = versoIniziale(k);
    setChiave(k);
    setVerso(v);
    announce(t.ordinePerAnnuncio.replace("{criterio}", nomeCriterio[k]));
  };

  const th = (k: Chiave, testo: string, nascosta?: string, className?: string, nomeAria?: string) => (
    <Intestazione
      chiave={k}
      testo={testo}
      nascosta={nascosta}
      nomeAria={nomeAria}
      attivo={chiave === k}
      verso={verso}
      interattivo={caricato}
      onOrdina={scegliOrdine}
      className={className}
    />
  );

  return (
    <div className={s.tabellaBlocco}>
      <div className={s.tabellaControlli}>
        {/* filtro e ordine hanno bisogno di JavaScript: senza, la tabella resta ordinata per capienza */}
        {caricato && (
          <ChipGroup
            aria-label={cfg.passi.sala}
            options={FILTRI}
            value={String(piano)}
            onValueChange={(v) => setPiano(v === "0" ? 0 : v === "-1" ? -1 : "tutte")}
          />
        )}
        {/* l'ordine si sceglie anche dalle intestazioni; i chip servono sul telefono e a chi non le trova */}
        {caricato && (
          <div className={s.ordina}>
            <span className={s.ordinaEtichetta} id="tabella-ordina">
              {t.ordinaPer}
            </span>
            <ChipGroup
              aria-labelledby="tabella-ordina"
              options={ORDINI}
              value={chiave === "capienza" || chiave === "superficie" || chiave === "nome" ? chiave : ""}
              onValueChange={(v) => scegliOrdine(v as Chiave)}
            />
          </div>
        )}
      </div>

      <div className={s.tabellaScorri} role="region" aria-label={t.regione} tabIndex={0}>
        <table className={s.tabella}>
          <caption className="sr-only">{cfg.elencoTitolo}</caption>
          <thead>
            <tr>
              {th("nome", t.colonne.sala, undefined, s.thSala, t.nome.toLowerCase())}
              {th("platea", t.colonne.platea, undefined, s.thNum)}
              {th("banchi", t.colonne.banchi, t.nascosta.banchi, s.thNum)}
              {th("ferro", t.colonne.ferro, t.nascosta.ferro, s.thNum)}
              {th("banchetto", t.colonne.banchetto, undefined, s.thNum)}
              {th("superficie", t.colonne.superficie, undefined, s.thNum, cfg.ordina.superficie.toLowerCase())}
              <th scope="col" className={s.thNum}>
                {t.colonne.dimensioni}
              </th>
              <th scope="col" className={s.thNum}>
                {t.colonne.altezza}
              </th>
              <th scope="col" className={s.thTesto}>
                {t.colonne.piano}
              </th>
            </tr>
          </thead>
          <tbody>
            {righe.map((h) => (
              <tr key={h.id}>
                <th scope="row" className={s.tdSala}>
                  <span className={s.tdSalaNome}>{h.name}</span>
                  {h.divisibleInto ? <span className={s.etichetta}>{cfg.divisibile}</span> : null}
                </th>
                {DISPOSIZIONI.map((d) => {
                  const cap = h.cap[d];
                  return (
                    <td key={d} className={s.tdNum}>
                      {cap === null ? (
                        <>
                          <span aria-hidden="true">–</span>
                          <span className="sr-only">{t.nonIndicata}</span>
                        </>
                      ) : (
                        cap
                      )}
                    </td>
                  );
                })}
                <td className={s.tdNum}>{h.areaM2}</td>
                <td className={s.tdNum}>{misureSala(h)}</td>
                <td className={s.tdNum}>{numIt(h.heightM)}</td>
                <td className={s.tdTesto}>{pianoSala(h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={s.notaPiccola}>
        {t.intro} {cfg.risultato.notaMisure}
      </p>
    </div>
  );
}

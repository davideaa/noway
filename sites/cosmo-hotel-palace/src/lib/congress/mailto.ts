/**
 * Richiesta di proposta senza backend (DECISIONI 11, UX 7.3): `mailto:` precompilato e testo da
 * copiare. FUNZIONI PURE (nessun DOM). Il sito non invia nulla da solo e non dice mai
 * «Richiesta inviata»: apre la posta dell'utente, che preme Invia.
 *
 * - Oggetto: «Richiesta di proposta · {sala} · {disposizione}» (COPY).
 * - Corpo: campi su righe separate, a capo `%0D%0A` nell'URL (`encodeURIComponent` di ogni riga).
 * - Il messaggio libero si taglia a 1000 caratteri (i `mailto` lunghi falliscono); se l'URL
 *   completo supera `MAX_URL_MAILTO` il messaggio si accorcia ancora, mai gli altri campi.
 * - Il testo da copiare («Copia il testo della richiesta») è lo stesso corpo con l'oggetto in
 *   cima e il messaggio intero (la copia non ha limiti di lunghezza).
 */

import { copy, fmt } from "../../content/copy";
import { repartoById } from "../../content/contacts";
import type { Disposizione } from "../../content/types";
import { MAX_MESSAGGIO_MAILTO, MAX_URL_MAILTO } from "./config";
import { etichettaDisposizione } from "./availability";

export type RichiestaProposta = {
  /** Nome della sala come in COPY («Plenaria del Sole»). */
  sala: string;
  disposizione: Disposizione;
  /** Partecipanti: numero, testo digitato o vuoto. */
  ospiti?: number | string | null;
  /** Data o periodo, testo libero («12/03/2027 o marzo 2027»). */
  data?: string;
  nome: string;
  azienda?: string;
  email: string;
  telefono?: string;
  tipoEvento?: string;
  camere?: number | string | null;
  messaggio?: string;
};

/** Indirizzo dell'Ufficio Eventi (da `content/contacts.ts`). */
export const EMAIL_EVENTI: string = repartoById("eventi").email;

const campi = copy.congressi.modulo.campi;
const corpo = copy.congressi.modulo.senzaBackend.corpoEmail;

/** «Azienda o organizzazione (facoltativo)» -> «Azienda o organizzazione». */
const senzaFacoltativo = (t: string) => t.replace(/\s*\(facoltativo\)\s*$/i, "");

const pieno = (v: string | number | null | undefined): string =>
  v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim();

/** «Richiesta di proposta · Plenaria del Sole · Banchetto». */
export function oggettoEmail(r: Pick<RichiestaProposta, "sala" | "disposizione">): string {
  return fmt(copy.congressi.modulo.senzaBackend.oggettoEmail, {
    sala: r.sala,
    disposizione: etichettaDisposizione(r.disposizione),
  });
}

/** Taglia a `max` caratteri senza spezzare una coppia surrogata, aggiungendo «…» se ha tagliato. */
export function tagliaMessaggio(testo: string, max: number): string {
  if (testo.length <= max) return testo;
  const t = Array.from(testo).slice(0, Math.max(0, max - 1)).join("");
  return `${t.trimEnd()}…`;
}

/** Righe del corpo (senza oggetto). I campi vuoti non compaiono. `messaggio` già tagliato dal chiamante. */
function righeCorpo(r: RichiestaProposta, messaggio: string): string[] {
  const righe: string[] = [corpo.saluto, corpo.intro, ""];
  const riga = (etichetta: string, valore: string) => {
    if (valore) righe.push(`${etichetta}: ${valore}`);
  };
  righe.push(`${senzaFacoltativo(campi.sala.etichetta)}: ${r.sala}`);
  righe.push(`${senzaFacoltativo(campi.disposizione.etichetta)}: ${etichettaDisposizione(r.disposizione)}`);
  riga(senzaFacoltativo(campi.ospiti.etichetta), pieno(r.ospiti));
  riga(senzaFacoltativo(campi.data.etichetta), pieno(r.data));
  riga(senzaFacoltativo(campi.tipo.etichetta), pieno(r.tipoEvento));
  riga(senzaFacoltativo(campi.camere.etichetta), pieno(r.camere));
  righe.push("");
  riga(senzaFacoltativo(campi.nome.etichetta), pieno(r.nome));
  riga(senzaFacoltativo(campi.azienda.etichetta), pieno(r.azienda));
  riga(senzaFacoltativo(campi.email.etichetta), pieno(r.email));
  riga(senzaFacoltativo(campi.telefono.etichetta), pieno(r.telefono));
  const m = (messaggio ?? "").replace(/\r\n?/g, "\n").trim();
  if (m) {
    righe.push("", corpo.altro, m);
  }
  righe.push("", corpo.chiusura);
  const firma = pieno(r.nome);
  if (firma) righe.push(firma);
  return righe;
}

/**
 * Testo da copiare negli appunti: oggetto, riga vuota e corpo, a capo `\n`. Il messaggio libero
 * resta intero. È ciò che l'utente incolla nella sua posta se il `mailto:` non si apre.
 */
export function testoRichiesta(r: RichiestaProposta): string {
  return [oggettoEmail(r), "", ...righeCorpo(r, r.messaggio ?? "")].join("\n");
}

export type MailtoRisultato = {
  url: string;
  /** true se il messaggio libero è stato accorciato per stare nel limite dell'URL. */
  messaggioTagliato: boolean;
};

const CRLF = "%0D%0A";

function costruisciUrl(r: RichiestaProposta, messaggio: string): string {
  const body = righeCorpo(r, messaggio)
    .map((riga) => encodeURIComponent(riga))
    .join(CRLF);
  return `mailto:${EMAIL_EVENTI}?subject=${encodeURIComponent(oggettoEmail(r))}&body=${body}`;
}

/**
 * `mailto:` precompilato. Il messaggio libero è al massimo `MAX_MESSAGGIO_MAILTO` caratteri e,
 * se l'URL supera `MAX_URL_MAILTO`, si accorcia a passi finché sta dentro (gli altri campi non si
 * toccano mai).
 */
export function mailto(r: RichiestaProposta): MailtoRisultato {
  const intero = (r.messaggio ?? "").replace(/\r\n?/g, "\n").trim();
  let messaggio = tagliaMessaggio(intero, MAX_MESSAGGIO_MAILTO);
  let url = costruisciUrl(r, messaggio);
  while (url.length > MAX_URL_MAILTO && messaggio.length > 0) {
    messaggio = tagliaMessaggio(intero, Math.max(0, Math.floor(messaggio.length * 0.8) - 1));
    if (messaggio === "…") messaggio = "";
    url = costruisciUrl(r, messaggio);
  }
  return { url, messaggioTagliato: messaggio !== intero };
}

/** Solo l'URL (scorciatoia di `mailto(r).url`). */
export const mailtoUrl = (r: RichiestaProposta): string => mailto(r).url;

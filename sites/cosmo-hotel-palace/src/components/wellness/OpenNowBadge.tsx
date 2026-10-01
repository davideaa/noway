"use client";

/*
 * Indicatore «aperto ora» del Wellness (UX 8, COPY 7, MOTION 6.3): ora di Roma, 7:00–22:00 tutti i
 * giorni, con `openStatus` di lib/rome-time.
 *
 * - Nell'HTML statico c'è il testo fisso «Aperto tutti i giorni dalle 7:00 alle 22:00» (e l'altezza è
 *   riservata): lo stato si calcola solo dopo il caricamento, sull'orologio di chi guarda.
 * - Si ricalcola con un timer al prossimo cambio (`msToNextChange`) e quando la scheda torna visibile.
 * - Si annuncia (`role="status"`, via `announce`) SOLO quando lo stato cambia, mai ogni minuto e mai
 *   al primo calcolo.
 * - Icona + testo + forma del pallino (pieno = aperto, vuoto = chiuso): non solo colore.
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Icon } from "@/components/art/Icons";
import { copy } from "@/content/copy";
import { announce } from "@/lib/a11y";
import { openStatus, type OpenState } from "@/lib/rome-time";
import s from "./wellness.module.css";

const TESTI: Record<OpenState, string> = {
  aperto: copy.wellness.aperto.aperto,
  "chiude-presto": copy.wellness.aperto.ultimaOra,
  "chiuso-apre-oggi": copy.wellness.aperto.chiusoPrima,
  "chiuso-riapre-domani": copy.wellness.aperto.chiusoDopo,
};

/** Un solo ascolto per tutti i badge: ricalcola al prossimo cambio e al ritorno della scheda. */
function iscriviti(avvisa: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arma = () => {
    clearTimeout(timer);
    // +50 ms: si ricontrolla appena dopo il cambio, mai un attimo prima
    timer = setTimeout(() => {
      avvisa();
      arma();
    }, openStatus().msToNextChange + 50);
  };
  const visibile = () => {
    if (document.visibilityState === "visible") {
      avvisa();
      arma();
    }
  };
  arma();
  document.addEventListener("visibilitychange", visibile);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", visibile);
  };
}

type Props = {
  /** Mostra sotto la nota «Orario indicato sul sito dell'hotel…». */
  conNota?: boolean;
  className?: string;
};

export function OpenNowBadge({ conNota = false, className }: Props) {
  const stato = useSyncExternalStore<OpenState | null>(
    iscriviti,
    () => openStatus().state,
    () => null, // server e primo render: testo fisso, nessuno stato
  );
  const precedente = useRef<OpenState | null>(null);
  useEffect(() => {
    if (stato && precedente.current && precedente.current !== stato) announce(TESTI[stato]);
    if (stato) precedente.current = stato;
  }, [stato]);

  const aperto = stato === "aperto" || stato === "chiude-presto";
  return (
    <div className={`${s.badgeBox} ${className ?? ""}`}>
      <p className={s.badge} data-stato={stato ?? "fisso"}>
        <Icon nome="orologio" size={22} />
        {stato && <span className={s.pallino} data-aperto={aperto ? "1" : "0"} aria-hidden="true" />}
        <span>{stato ? TESTI[stato] : copy.wellness.orarioFisso}</span>
      </p>
      {conNota && <p className={s.badgeNota}>{copy.wellness.aperto.nota}</p>}
    </div>
  );
}

"use client";

/*
 * La pila delle otto scene della home. Le scene arrivano già costruite (Server Component dove
 * possibile) e qui si decide solo l'ORDINE, cambiando l'ordine dei figli nel DOM: l'ordine di
 * tabulazione coincide con quello visivo (UX 4.2). Al caricamento l'ordine è sempre quello di
 * base («Per piacere»); cambia solo dopo il clic su «Per lavoro» (lib/home/cambia-modo.ts).
 *
 * Con lo scroll la scena in vista aggiorna l'hash con `history.replaceState`, mai `pushState`:
 * il tasto Indietro non deve passare dieci tappe (UX 4.1).
 */

import { Fragment, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { ID_SEZIONE, ORDINE, leggiModo, modoServer, sottoscriviModo, type SceneId } from "@/lib/home/scene-order";
import s from "./pila.module.css";

/** Aggiorna l'hash con la scena che occupa il centro dello schermo. Non scrive nulla finché non si scorre. */
function useHashDiScena() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    let scorso = false;
    let corrente = "";
    const visibili = new Map<Element, number>();
    const decidi = () => {
      let migliore: Element | null = null;
      let area = 0;
      visibili.forEach((a, el) => {
        if (a > area) {
          area = a;
          migliore = el;
        }
      });
      const id = (migliore as Element | null)?.id ?? "";
      if (!id || id === corrente || !scorso) return;
      corrente = id;
      try {
        const url = id === ID_SEZIONE.hero ? `${location.pathname}${location.search}` : `#${id}`;
        history.replaceState(history.state, "", url);
      } catch {
        /* alcuni contesti non lo permettono: l'hash non è essenziale */
      }
    };
    const io = new IntersectionObserver(
      (voci) => {
        for (const v of voci) {
          if (v.isIntersecting) visibili.set(v.target, v.intersectionRect.height);
          else visibili.delete(v.target);
        }
        decidi();
      },
      // una banda sottile al centro dello schermo: vince la scena che lo attraversa
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 1] },
    );
    document.querySelectorAll("[data-scena]").forEach((el) => io.observe(el));
    const primoScroll = () => {
      scorso = true;
      decidi();
    };
    window.addEventListener("scroll", primoScroll, { passive: true, once: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", primoScroll);
    };
  }, []);
}

const SENZA_JS =
  "[data-sticky]{block-size:auto!important;--travel:0px!important}" +
  "[data-sticky]>*{position:static!important;block-size:auto!important;min-block-size:0!important}";

export function SceneStack({ scene }: { scene: Readonly<Record<SceneId, ReactNode>> }) {
  const modo = useSyncExternalStore(sottoscriviModo, leggiModo, modoServer);
  useHashDiScena();
  return (
    <div className={s.pila} data-home-stack="" data-modo={modo}>
      {/* senza JavaScript nessuna scena guida p: niente scene fissate, solo poster e testo (UX 4.1) */}
      <noscript>
        <style>{SENZA_JS}</style>
      </noscript>
      {ORDINE[modo].map((id) => (
        <Fragment key={id}>{scene[id]}</Fragment>
      ))}
    </div>
  );
}

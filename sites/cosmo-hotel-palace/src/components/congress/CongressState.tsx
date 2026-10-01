"use client";

/*
 * Stato condiviso della pagina Centro Congressi (UX 7.3): sala, disposizione, partecipanti,
 * pareti mobili e vista. Lo leggono il configuratore, la scena, il modulo e «Trova la sala»,
 * così sala e disposizione restano allineate in entrambe le direzioni e l'utente non riscrive
 * nulla (WCAG 3.3.7).
 *
 * Il provider possiede anche il `SceneController` della scena 3D e lo pilota: a ogni cambio chiama
 * `controller.configura(...)` (la scena anima le sedie, 720 ms; con reduced-motion scatta).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { congressDef, ariaSala } from "@/scenes/congress/def";
import { SceneController } from "@/components/scene/SceneCanvas";
import type { CongressHall, ConfigurazioneSala, Disposizione, SceneDef } from "@/content/types";
import {
  SALA_INIZIALE_ID,
  disponibilita,
  disposizioneEffettiva,
  eDisposizione,
  trovaSala,
  type FiltroPiano,
  type Ordine,
} from "@/lib/congress/availability";
import { leggiOspiti } from "./testi";

export type Vista = "3d" | "pianta";

type Stato = {
  salaId: string;
  disposizione: Disposizione;
  /** Testo digitato (anche non valido: il controllo lo fa chi lo mostra). */
  ospiti: string;
  divisa: boolean;
  /** `null` = automatica (Pianta sotto 600 px, 3D sopra). */
  vista: Vista | null;
  /** Avviso sotto i chip: ripiego su Platea o disposizione non indicata. */
  avviso: string | null;
  filtro: FiltroPiano;
  ordine: Ordine;
};

type Azione =
  | { t: "sala"; id: string }
  | { t: "disp"; d: Disposizione }
  | { t: "nonDisp"; d: Disposizione }
  | { t: "ospiti"; v: string }
  | { t: "divisa"; v: boolean }
  | { t: "vista"; v: Vista }
  | { t: "filtro"; v: FiltroPiano }
  | { t: "ordine"; v: Ordine }
  | { t: "iniziale"; sala?: string; disp?: Disposizione; n?: string };

const statoIniziale: Stato = {
  salaId: SALA_INIZIALE_ID,
  disposizione: "platea",
  ospiti: "",
  divisa: false,
  vista: null,
  avviso: null,
  filtro: "tutte",
  ordine: "capienza",
};

function haSala(id: string): CongressHall {
  const h = trovaSala(id);
  if (!h) throw new Error(`Sala sconosciuta: ${id}`);
  return h;
}

function riduci(s: Stato, a: Azione): Stato {
  switch (a.t) {
    case "sala": {
      const h = trovaSala(a.id);
      if (!h || a.id === s.salaId) return s;
      const eff = disposizioneEffettiva(h, s.disposizione);
      return {
        ...s,
        salaId: h.id,
        disposizione: eff.disposizione,
        avviso: eff.avviso,
        divisa: h.divisibleInto ? s.divisa : false,
      };
    }
    case "disp": {
      const h = haSala(s.salaId);
      if (h.cap[a.d] === null) return s;
      return { ...s, disposizione: a.d, avviso: null };
    }
    case "nonDisp": {
      const h = haSala(s.salaId);
      return { ...s, avviso: disponibilita(h, a.d).motivo };
    }
    case "ospiti":
      return { ...s, ospiti: a.v };
    case "divisa":
      return { ...s, divisa: haSala(s.salaId).divisibleInto ? a.v : false };
    case "vista":
      return { ...s, vista: a.v };
    case "filtro":
      return { ...s, filtro: a.v };
    case "ordine":
      return { ...s, ordine: a.v };
    case "iniziale": {
      // link profondo (?sala=…&disp=…&n=…): i valori non validi si ignorano
      const h = trovaSala(a.sala) ?? haSala(s.salaId);
      const richiesta = a.disp ?? s.disposizione;
      const eff = disposizioneEffettiva(h, richiesta);
      return {
        ...s,
        salaId: h.id,
        disposizione: eff.disposizione,
        avviso: null,
        ospiti: a.n !== undefined && leggiOspiti(a.n) !== null ? a.n.trim() : s.ospiti,
        divisa: h.divisibleInto ? s.divisa : false,
      };
    }
  }
}

export type Congresso = {
  stato: Stato;
  hall: CongressHall;
  /** Disposizione effettiva (sempre una di quelle indicate per la sala). */
  disposizione: Disposizione;
  /** Capienza della tabella per sala e disposizione scelte. */
  capienza: number;
  /** Partecipanti come numero, se scritti bene. */
  ospitiNum: number | null;
  /** Pareti mobili chiuse (vale solo per le sale divisibili). */
  divisa: boolean;
  controller: SceneController;
  def: SceneDef;
  scegliSala: (id: string) => void;
  scegliDisposizione: (d: Disposizione) => void;
  scegliDisposizioneNonIndicata: (d: Disposizione) => void;
  setOspiti: (v: string) => void;
  setDivisa: (v: boolean) => void;
  setVista: (v: Vista) => void;
  setFiltro: (v: FiltroPiano) => void;
  setOrdine: (v: Ordine) => void;
  /** Porta l'utente al passo successivo (scorrimento istantaneo con movimento ridotto). */
  scorriA: (id: string, opzioni?: { focus?: string }) => void;
};

const Ctx = createContext<Congresso | null>(null);

export function useCongresso(): Congresso {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCongresso va usato dentro <CongressProvider>");
  return c;
}

/**
 * L'aria-label del canvas segue la configurazione (COPY 8.2). La scena legge `def.aria` quando il canvas
 * si monta (lo Stage); qui lo si tiene aggiornato e si corregge il canvas già vivo.
 */
function aggiornaAria(controller: SceneController, aria: string): void {
  controller.def.aria = aria;
  document.querySelector(`[data-stage-slot="${controller.def.id}"] canvas`)?.setAttribute("aria-label", aria);
}

function riduceMovimento(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Legge `?sala=&disp=&n=` (UX 7.2). Va dentro <Suspense>: nell'export statico `useSearchParams` lo richiede. */
function LinkProfondo({ applica }: { applica: (a: { sala?: string; disp?: Disposizione; n?: string }) => void }) {
  const params = useSearchParams();
  const chiave = params.toString();
  useEffect(() => {
    if (!chiave) return;
    const p = new URLSearchParams(chiave);
    const sala = p.get("sala") ?? undefined;
    const disp = p.get("disp");
    const n = p.get("n") ?? undefined;
    if (!sala && !disp && !n) return;
    applica({ sala, disp: eDisposizione(disp) ? disp : undefined, n });
  }, [chiave, applica]);
  return null;
}

export function CongressProvider({ children }: { children: ReactNode }) {
  const [stato, dispatch] = useReducer(riduci, statoIniziale);
  // la definizione è una copia: l'aria-label del canvas cambia con la configurazione (COPY 8.2)
  const [def] = useState<SceneDef>(() => ({ ...congressDef }));
  const [controller] = useState(() => new SceneController(def));

  const hall = haSala(stato.salaId);
  const disposizione = hall.cap[stato.disposizione] === null ? "platea" : stato.disposizione;
  const capienza = hall.cap[disposizione] ?? 0;
  const ospitiNum = leggiOspiti(stato.ospiti);
  const divisa = stato.divisa && !!hall.divisibleInto;

  /* pilota la scena: la prima volta senza tween (link profondo, primo disegno) */
  const primo = useRef(true);
  useEffect(() => {
    const config: ConfigurazioneSala = { sala: hall.id, disposizione, ospiti: ospitiNum, divisa };
    controller.configura(config, primo.current ? { istantaneo: true } : undefined);
    primo.current = false;
    aggiornaAria(controller, ariaSala(config));
  }, [controller, hall.id, disposizione, ospitiNum, divisa]);

  const scegliSala = useCallback((id: string) => dispatch({ t: "sala", id }), []);
  const scegliDisposizione = useCallback((d: Disposizione) => dispatch({ t: "disp", d }), []);
  const scegliDisposizioneNonIndicata = useCallback((d: Disposizione) => dispatch({ t: "nonDisp", d }), []);
  const setOspiti = useCallback((v: string) => dispatch({ t: "ospiti", v }), []);
  const setDivisa = useCallback((v: boolean) => dispatch({ t: "divisa", v }), []);
  const setVista = useCallback((v: Vista) => dispatch({ t: "vista", v }), []);
  const setFiltro = useCallback((v: FiltroPiano) => dispatch({ t: "filtro", v }), []);
  const setOrdine = useCallback((v: Ordine) => dispatch({ t: "ordine", v }), []);
  const applicaLink = useCallback((a: { sala?: string; disp?: Disposizione; n?: string }) => {
    dispatch({ t: "iniziale", ...a });
  }, []);

  const scorriA = useCallback((id: string, opzioni?: { focus?: string }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: riduceMovimento() ? "auto" : "smooth", block: "start" });
    if (opzioni?.focus) {
      const f = document.getElementById(opzioni.focus);
      f?.focus({ preventScroll: true });
    }
  }, []);

  const valore = useMemo<Congresso>(
    () => ({
      stato,
      hall,
      disposizione,
      capienza,
      ospitiNum,
      divisa,
      controller,
      def,
      scegliSala,
      scegliDisposizione,
      scegliDisposizioneNonIndicata,
      setOspiti,
      setDivisa,
      setVista,
      setFiltro,
      setOrdine,
      scorriA,
    }),
    [
      stato,
      hall,
      disposizione,
      capienza,
      ospitiNum,
      divisa,
      controller,
      def,
      scegliSala,
      scegliDisposizione,
      scegliDisposizioneNonIndicata,
      setOspiti,
      setDivisa,
      setVista,
      setFiltro,
      setOrdine,
      scorriA,
    ],
  );

  return (
    <Ctx.Provider value={valore}>
      <Suspense fallback={null}>
        <LinkProfondo applica={applicaLink} />
      </Suspense>
      {children}
    </Ctx.Provider>
  );
}

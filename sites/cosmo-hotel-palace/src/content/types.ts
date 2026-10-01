/**
 * Contratti di tipo condivisi (UX 14.1, MOTION 2-3).
 * Solo tipi: nessun valore a runtime, nessuna dipendenza da componenti.
 * `import type` obbligatorio: i file di content/ devono restare eseguibili anche da Node
 * (vedi scripts/check-content.mjs).
 */
import type { ReactNode } from "react";
import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";

/* ------------------------------------------------------------------ */
/* Comuni                                                              */
/* ------------------------------------------------------------------ */

/** Tono cromatico (DESIGN 2.3): `data-tono="sera"` su sezione o diorama. */
export type Tono = "giorno" | "sera";

/** Identificativo di tipologia di camera. */
export type RoomId = "classic" | "family" | "suite";

/** Terna x, y, z in metri nello spazio della scena. */
export type Posizione3D = readonly [number, number, number];

/* ------------------------------------------------------------------ */
/* Prenotazione (UX 14.1, lib/booking)                                 */
/* ------------------------------------------------------------------ */

export type BookingState = {
  /** 'AAAA-MM-GG' oppure '' se non scelta. */
  arrivo: string;
  /** 'AAAA-MM-GG' oppure '' se non scelta. */
  partenza: string;
  camere: 1 | 2 | 3 | 4;
  adulti: 1 | 2 | 3 | 4;
  bambini: 0 | 1 | 2 | 3 | 4;
  camera?: RoomId;
};

/** Ospiti preimpostati da una scelta (consigliere, scheda camera). */
export type Ospiti = Pick<BookingState, "adulti" | "bambini">;

/* ------------------------------------------------------------------ */
/* Scene 3D (UX 14.1; MOTION 2 e 3)                                    */
/* ------------------------------------------------------------------ */

/**
 * Posa di camera pronta per un hotspot (UX 5.2, MOTION 4.4).
 * `az` e `pol` in GRADI, `dist` in METRI. Convenzione: az 0 = frontale alla scena,
 * pol 0 = dall'alto, 90 = orizzonte (MOTION 4.2: pol 55-80 = elevazione 10-35 gradi).
 */
export type VistaCamera = { az: number; pol: number; dist: number };

export type Hotspot = {
  id: string;
  /** Titolo breve (COPY). */
  titolo: string;
  /** Didascalia / dato mostrato nella pillola (COPY). */
  dato: string;
  vista: VistaCamera;
  /** Ancora 3D del punto. */
  pos: Posizione3D;
  visibileIn?: "giorno" | "sera" | "sempre";
};

/** Livelli di qualità adattiva (MOTION 9.1). */
export type Qualita = "high" | "mid" | "lite1" | "lite2";

/** Proiezione di un punto 3D sul riquadro del canvas, in pixel CSS. */
export type Proiezione = { x: number; y: number; visibile: boolean };

/**
 * Cosa lo Stage (modulo 5) passa alla scena. Il renderer è UNO per tutta la visita
 * (MOTION 2.2): la scena non lo crea, non lo distrugge, non chiama `renderer.dispose()`.
 */
export type SceneContext = {
  readonly renderer: WebGLRenderer;
  readonly canvas: HTMLCanvasElement;
  /** Larghezza e altezza del riquadro in pixel CSS. */
  readonly larghezza: number;
  readonly altezza: number;
  /** DPR effettivo già limitato dal livello di qualità (MOTION 9.1). */
  readonly dpr: number;
  readonly qualita: Qualita;
  /** Dispositivo touch: orbita solo orizzontale, niente sguardo intorno, `touch-action: pan-y`. */
  readonly touch: boolean;
  /** prefers-reduced-motion: niente tween, solo salti con crossfade breve. */
  readonly reducedMotion: boolean;
  /** Sveglia il loop a richiesta (MOTION 2.2: `wake()`), da chiamare dopo ogni cambio di stato. */
  readonly richiediFrame: () => void;
};

/**
 * Ciò che la scena restituisce. Regola d'oro (MOTION 2.1): la scena è una funzione dei numeri
 * che riceve (`t`, `p`, vista); stessi numeri, stesso fotogramma.
 */
export type SceneHandle = {
  /** Radice e camera: lo Stage chiama `renderer.render(scena, camera)`. */
  readonly scena: Scene;
  readonly camera: PerspectiveCamera;
  /** Gruppo da cui lo Stage legge le geometrie per il conteggio memoria in QA. */
  readonly radice: Object3D;
  /**
   * Luce 0..1. Hero: 0 alba, 1/3 mattina, 2/3 pomeriggio, 1 sera. Camere: 0 giorno, 1 sera.
   * Ristorante: 0 mattina, 1/3 pranzo, 2/3 aperitivo, 1 sera.
   */
  setLuce(t: number): void;
  /** Avanzamento 0..1 (scroll della scena fissata, tappa del wellness, tween del configuratore). */
  setProgresso(p: number): void;
  /** Porta la camera su una posa (hotspot, preset). `null` = vista di partenza. */
  vaiA(vista: VistaCamera | null, istantaneo?: boolean): void;
  /** Ruota l'orbita di `gradi` in azimut (pulsanti ◀ ▶: 15, frecce: 10). Rispetta `limiti`. */
  ruota(gradi: number): void;
  /** Proietta un punto 3D sul riquadro. Scrive in `out` (nessuna allocazione nel loop). */
  proietta(pos: Posizione3D, out: Proiezione): void;
  /** Avanza di `dt` secondi. Restituisce `true` se qualcosa è ancora in moto (loop a richiesta). */
  update(dt: number): boolean;
  setQualita(q: Qualita): void;
  resize(larghezza: number, altezza: number, dpr: number): void;
  /** Libera TUTTE le risorse della scena (geometrie, materiali, texture). Il renderer resta. */
  dispose(): void;
};

export type SceneDef = {
  id: string;
  /** aria-label del canvas (`role="img"`). */
  aria: string;
  /** Nota sotto la scena: «Ricostruzione illustrativa, non una fotografia.» */
  nota: string;
  /** Poster SVG: stato iniziale, di riserva e per chi non ha JavaScript. */
  poster: ReactNode;
  hotspots: readonly Hotspot[];
  /** Limiti dell'orbita in gradi (UX 5.2: az ±35 attorno alla posa iniziale). */
  /**
   * Limiti dell'orbita in gradi, ASSOLUTI (stessa convenzione di `VistaCamera`: az 0 = frontale).
   * Esempio: posa iniziale az 10 con ±35 -> `az: [-25, 45]`.
   */
  limiti: { az: readonly [number, number]; pol: readonly [number, number] };
  /**
   * Costruisce la scena. Può essere asincrona (CORREZIONE del modulo 5): così la definizione
   * (id, aria, poster, hotspot, limiti) resta senza `three` nel JS iniziale e `costruisci`
   * fa `await import("./build")` del codice che importa `three`. Lo Stage fa `await`.
   */
  costruisci(ctx: SceneContext): SceneHandle | Promise<SceneHandle>;
};

/* ------------------------------------------------------------------ */
/* Camere                                                              */
/* ------------------------------------------------------------------ */

export type Room = {
  id: RoomId;
  /** Segmento d'URL: /camere/{slug}/ */
  slug: "classic-double-room" | "family-room" | "suite";
  /** Nome come in COPY («Classic Double Room»). */
  nome: string;
  /** Nome breve per i chip e la tabella («Classic Double»). */
  nomeBreve: string;
  sottotitolo: string;
  corpo: string;
  /** Superficie totale in m² (BRIEF). */
  mq: number;
  /** Superfici delle parti, solo dove note: Family = 22 + 22 (UX 5.1). */
  mqParti?: readonly number[];
  /** Ospiti massimi in configurazione base. */
  ospiti: Ospiti;
  /** Configurazione alternativa dichiarata (Suite: 4 adulti oppure 2 + 2). */
  ospitiAlternativa?: Ospiti;
  /** Ospiti preimpostati quando si sceglie la camera (UX 5.3). */
  ospitiPreimpostati: Ospiti;
  /** Riga della tabella di confronto (COPY 3.2). */
  confronto: {
    superficie: string;
    letti: string;
    ospiti: string;
    ambienti: string;
    bagni: string;
    /** `null` = «—». */
    extra: string | null;
  };
  /** Scheda tecnica (COPY 3.3–3.5), un elemento per voce. */
  schedaTecnica: readonly string[];
  /** Dotazioni in elenco (COPY 3.5 e comuni). */
  dotazioni: readonly string[];
  cta: string;
  ctaSecondaria: string;
  ariaDiorama: string;
  piantaAlt: string;
  /** Id della scena 3D (SceneDef.id). */
  sceneId: string;
};

/* ------------------------------------------------------------------ */
/* Centro congressi (UX 7.1)                                           */
/* ------------------------------------------------------------------ */

export type Disposizione = "platea" | "banchi" | "ferro" | "banchetto";

export type CongressHall = {
  /** 'costellazioni', 'sole-plenaria', … come in COPY sez. 15. */
  id: string;
  /** Come in COPY sez. 15. */
  name: string;
  /** 0 = piano terra, -1 = piano inferiore. */
  floor: 0 | -1;
  /** Metri, larghezza × profondità: servono solo al disegno. */
  dims: readonly [number, number];
  /** m² come pubblicato: può non coincidere con `dims`. */
  areaM2: number;
  /** Altezza in metri: 4.22 | 3.4 | 3.1. */
  heightM: number;
  /** Capienze per disposizione. `null` = «-» nella tabella (non indicata). */
  cap: Readonly<Record<Disposizione, number | null>>;
  /** Solo costellazioni (8) e divinita (5). */
  divisibleInto?: number;
  /** Incoerenza nei dati pubblicati. Va sempre con un commento `// DA CONFERMARE` nel file. */
  nota?: string;
};

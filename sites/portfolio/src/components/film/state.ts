/**
 * Stato del film: UN oggetto mutabile scritto una volta per frame.
 *
 * LA REGOLA: ogni valore della scena e' funzione pura di `p` (0..1, lo scroll).
 * Niente state React, niente molle, niente "lerp verso un obiettivo" dentro la
 * scena. Chi legge (useFrame, overlay DOM) legge da qui; React non ri-renderizza
 * mai dallo scroll. Prova: scrub indietro = stesso identico fotogramma.
 *
 * Eccezioni dichiarate (SPEC-FILM.md, Adattamento):
 *  - l'ingresso automatico: un offset che sale a ~0,06 in 2,5 s e decade a zero
 *    con lo scroll (vedi Film.tsx). Dopo 2,5 s p e' di nuovo funzione pura dello
 *    scroll.
 *  - `t` (secondi) serve SOLO a float della figura e grana: mai alla camera.
 */
export const film = {
  /** posizione reale 0..1 (scroll + ingresso) */
  p: 0,
  /** asse degli atti: clamp01(p / 0.82) */
  sp: 0,
  /** solo scroll, senza ingresso */
  scrollP: 0,
  /**
   * Puntatore H(m): normalizzato -1..1 e GIA' SMUSSATO all'ingresso (tau 0.15 s,
   * calcolato con dt in Film.tsx). Si smussa solo l'input, mai un valore di
   * scena: un secondo lerp dentro la scena sarebbe stato nascosto (isteresi).
   * `min` = presenza del puntatore fine (0 su touch, 0 fuori dalla finestra).
   */
  mx: 0,
  my: 0,
  min: 0,
  /** secondi: respiro G(t) (float della figura, deriva delle particelle) e grana. Mai la camera. */
  t: 0,
  reduced: false,
  /** Pausa esplicita dell'utente: G(t) ferma (respiro, grana). */
  paused: false,
  /** Il play automatico sta muovendo lo scroll (informativo: la scena non lo legge). */
  playing: false,
  /** secondi di play accumulati (dt limitato), solo per misurare: la scena non lo legge */
  playT: 0,
  mobile: false,
  /** larghezza/altezza della finestra: scala laterale dei fili e dello swing */
  aspect: 1.6,
  /** gate dei sei atti (esposti su window in dev) */
  gates: [1, 0, 0, 0, 0, 0],
  /** stamp dell'ultimo frame scritto */
  frame: 0,
};

export const ACT_AXIS_END = 0.82;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const actAxis = (p: number) => clamp01(p / ACT_AXIS_END);

/**
 * Gate dei sei atti. Ogni confine si SOVRAPPONE al vicino di 0,06-0,14
 * dell'asse degli atti: dove e' vivo un solo atto c'e' un taglio, e un taglio
 * trasforma il film in una presentazione. Gli atti 1-5 corrono su `sp`;
 * l'uscita del 5 e il 6 (wipe) corrono su `p` reale.
 *
 * Quarto giro (Davide: «il tunnel deve durare di piu'»): gli atti 2-3 occupano
 * sp 0.15..0.86 invece di 0.17..0.72; i fili corrono su sp 0.33..0.80 (+55%
 * rispetto a 0.36..0.669). Il play resta a 20 s per unita' di p: il tempo in
 * piu' del tunnel viene dal prologo (-0,7 s) e dalla valle (-1,6 s).
 *
 *   1 Ingresso   ... -> 0.17..0.27 (out)
 *   2 Metodo     0.15..0.25 (in) -> 0.31..0.41 (out)
 *   3 Strategie  0.29..0.37 -> 0.76..0.86
 *   4 Rischio    0.76..0.84 -> 0.90..0.98
 *   5 Monitor    0.90..0.98 -> p 0.86..0.94
 *   6 Contatti   p 0.80..0.90 -> fine
 */
export function computeGates(p: number, sp: number, out: number[]) {
  out[0] = 1 - smoothstep(0.17, 0.27, sp);
  out[1] = smoothstep(0.15, 0.25, sp) * (1 - smoothstep(0.31, 0.41, sp));
  out[2] = smoothstep(0.29, 0.37, sp) * (1 - smoothstep(0.76, 0.86, sp));
  out[3] = smoothstep(0.76, 0.84, sp) * (1 - smoothstep(0.9, 0.98, sp));
  out[4] = smoothstep(0.9, 0.98, sp) * (1 - smoothstep(0.86, 0.94, p));
  out[5] = smoothstep(0.8, 0.9, p);
  return out;
}

/** Il lime (figura, gabbia, impulso dei fili) e' in scena? Allora la stanza NON e' oro. */
export function limeInFrame(sp: number) {
  const figure = 1 - smoothstep(0.23, 0.28, sp);
  // la coda segue l'ULTIMO impulso lime (filo 8: sp 0.66 + 0.24 x 0.14 = 0.694), non la morte del filo (0.80):
  // cosi' la stanza torna oro prima e non resta il buco grigio fra i fili e la valle (QA-FILM C2)
  const strands = smoothstep(0.3, 0.33, sp) * (1 - smoothstep(0.7, 0.75, sp));
  return Math.max(figure, strands);
}

/**
 * Decadimento dell'offset d'ingresso con lo scroll: smoothstep su 0..0.2, non
 * lineare su 0..0.12 (QA-FILM C1: la velocita' raddoppiava di colpo a 0.12).
 * Derivata massima di smoothstep = 1.5/0.2 = 7.5: con ENTRY 0.06, dp/dscroll
 * resta >= 0.55, quindi p sale sempre, senza spigoli.
 */
export const ENTRY_DECAY_END = 0.2;
export const entryDecay = (scrollP: number) => 1 - smoothstep(0, ENTRY_DECAY_END, scrollP);
/** d(entryDecay)/d(scrollP): serve al play per convertire la velocita' di p in velocita' di scroll. */
export function entryDecaySlope(scrollP: number) {
  const u = clamp01(scrollP / ENTRY_DECAY_END);
  return -(6 * u * (1 - u)) / ENTRY_DECAY_END;
}

/** Figura: visibile nell'atto 1, si dissolve prima che la camera la attraversi. */
export const figureGate = (sp: number) => 1 - smoothstep(0.18, 0.245, sp);
/**
 * Il ventaglio si DISEGNA da solo nell'ingresso (p 0..0.05: le simulazioni
 * "girano"): funzione di p, non di tempo. Con meno movimento e' gia' intero.
 */
export const fanDraw = (p: number, reduced: boolean) => (reduced ? 1 : smoothstep(0, 0.05, p));
/** Gabbia: UNO scalare la tesse (0..0.13) e la stesse (0.18..0.26). */
export const latticeBuild = (sp: number) => smoothstep(0, 0.13, sp) * (1 - smoothstep(0.18, 0.26, sp));
/** Stanza: appare mentre la camera entra. */
export const roomGate = (sp: number) => smoothstep(0.12, 0.23, sp);
/**
 * Il prologo (S1-S3) e' sopra la figura: mentre un testo e' a fuoco la figura e
 * la gabbia si attenuano (funzione di sp), cosi' il bianco non sta sul lime.
 */
export function prologueText(sp: number) {
  let m = 0;
  for (let i = 0; i < 3; i++) {
    const w = OVERLAY_WINDOWS[i];
    m = Math.max(m, smoothstep(w.in0, w.in1, sp) * (1 - smoothstep(w.out0, w.out1, sp)));
  }
  return m;
}
/** Orizzonte (atto 5): la barra sottile in fondo. */
export const horizonGate = (sp: number, p: number) => smoothstep(0.86, 0.96, sp) * (1 - smoothstep(0.9, 0.98, p));

/**
 * LA TABELLA: otto fili che guidano SIA i fili SIA la camera.
 * Spaziatura che si stringe (0.055, 0.055, 0.050, 0.047, 0.044, 0.041, 0.038):
 * il corridoio accelera verso l'atto dopo. lead ~= 3.8 * radius fissa l'angolo
 * dell'ancora fuori dall'asse di vista (atan(r/lead) ~ 14.7 gradi contro una
 * mezza inquadratura di ~29 x 19). Due fili per strategia (XAUUSD, NASDAQ,
 * USDJPY) e due per il portafoglio insieme: e' solo un nome, il disegno e' lo
 * stesso. Otto e non sei allungati: cosi' il tunnel dura di piu' (0.33..0.80)
 * senza rallentare lo swing di ogni filo.
 */
export type Strand = { at: number; span: number; side: 1 | -1; lead: number; radius: number; lift: number; tag: string };
export const STRANDS: Strand[] = [
  { at: 0.33, span: 0.14, side: 1, radius: 5.0, lead: 19.0, lift: 6.0, tag: "XAUUSD" },
  { at: 0.385, span: 0.14, side: -1, radius: 3.4, lead: 12.9, lift: 4.2, tag: "XAUUSD" },
  { at: 0.44, span: 0.135, side: 1, radius: 3.2, lead: 12.2, lift: 4.0, tag: "NASDAQ" },
  { at: 0.49, span: 0.13, side: -1, radius: 3.2, lead: 12.2, lift: 4.0, tag: "NASDAQ" },
  { at: 0.537, span: 0.125, side: 1, radius: 3.4, lead: 12.9, lift: 4.2, tag: "USDJPY" },
  { at: 0.581, span: 0.125, side: -1, radius: 3.2, lead: 12.2, lift: 4.0, tag: "USDJPY" },
  { at: 0.622, span: 0.125, side: 1, radius: 3.4, lead: 12.9, lift: 4.2, tag: "INSIEME" },
  { at: 0.66, span: 0.14, side: -1, radius: 5.2, lead: 19.8, lift: 6.2, tag: "INSIEME" },
];

/** Fasi del filo sul suo t locale. */
export const FIRE_END = 0.12;
export const TAUT_END = 0.55;
export const RELEASE_END = 0.8;
/** Finestra dello swing: 0.08..0.82 della vita del filo, cosi' le finestre si sovrappongono (S-weave). */
export const swingU = (t: number) => clamp01((t - 0.08) / 0.74);

/**
 * Scala laterale: su schermo stretto l'ancora a 14.7 gradi starebbe al 92% della
 * mezza inquadratura (tecnicamente a schermo, invisibile in pratica). Si riduce
 * `side * radius` e lo swing, non il lead.
 */
export const lateralScale = (aspect: number) => Math.min(1, Math.max(0.55, aspect / 1.6));

/**
 * LA SPINA DELLA CAMERA: keyframe su `sp`. z e' un'Hermite cubica con tangenti
 * dichiarate (unita' per unita' di sp): tratti LINEARI dove entrambe le tangenti
 * sono uguali alla corda (il corridoio: marce 300 -> 150 -> 360, con il cambio
 * esattamente dove un filo prende o lascia: 0.385 e 0.622), tangenti a zero
 * solo dove la camera deve davvero fermarsi (riposo iniziale, arrivo).
 * y e' uno smoothstep tra i keyframe (la valle del drawdown: atto 4).
 * Le marce sono le stesse della v1: il tunnel piu' lungo si percorre alla
 * stessa velocita', quindi si va piu' lontano (z -151 all'arrivo, la stanza
 * arriva a -280).
 */
type Key = { sp: number; y: number; z: number; m0: number; m1: number };
export const SPINE: Key[] = [
  // sp     y     z       m0     m1   (m0 = tangente in uscita da questo key, m1 = in arrivo al prossimo)
  { sp: 0.0, y: 9.0, z: 34.0, m0: -44, m1: -44 }, // riposo -> figura, lineare
  { sp: 0.145, y: 9.0, z: 27.62, m0: -44, m1: -300 }, // tuffo attraverso la figura, accelerazione costante
  { sp: 0.33, y: 9.0, z: -4.2, m0: -300, m1: -300 }, // MARCIA 300: il primo filo prende
  { sp: 0.385, y: 9.0, z: -20.7, m0: -150, m1: -150 }, // MARCIA 150: il secondo filo prende
  { sp: 0.622, y: 9.0, z: -56.25, m0: -360, m1: -360 }, // MARCIA 360: il settimo filo prende
  { sp: 0.8, y: 9.0, z: -120.33, m0: -360, m1: -180 }, // discesa nella valle (l'ottavo filo lascia)
  { sp: 0.87, y: 2.0, z: -139.23, m0: -180, m1: -90 }, // fondo della valle
  { sp: 0.94, y: 7.5, z: -148.68, m0: -90, m1: 0 }, // risalita
  { sp: 1.0, y: 8.5, z: -151.38, m0: 0, m1: 0 }, // orizzonte, riposo
];

export function spine(sp: number, out: { x: number; y: number; z: number }) {
  const s = clamp01(sp);
  let i = 0;
  while (i < SPINE.length - 2 && s > SPINE[i + 1].sp) i++;
  const a = SPINE[i];
  const b = SPINE[i + 1];
  const L = b.sp - a.sp;
  const t = clamp01((s - a.sp) / L);
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  out.z = h00 * a.z + h10 * L * a.m0 + h01 * b.z + h11 * L * a.m1;
  out.y = mix(a.y, b.y, t * t * (3 - 2 * t));
  out.x = 0;
  return out;
}

/**
 * dz/dsp ANALITICA della spina (derivata dell'Hermite): la "velocita'" della
 * camera senza stato, senza differenze fra frame. Serve al wormhole: torsione,
 * scia delle particelle, frangia RGB e smear crescono con questa, e sono zero
 * a riposo. Normalizzata sulla marcia piu' alta (360).
 */
export function spineSpeed(sp: number) {
  const s = clamp01(sp);
  let i = 0;
  while (i < SPINE.length - 2 && s > SPINE[i + 1].sp) i++;
  const a = SPINE[i];
  const b = SPINE[i + 1];
  const L = b.sp - a.sp;
  const t = clamp01((s - a.sp) / L);
  const t2 = t * t;
  const dz = (6 * t2 - 6 * t) * a.z + (3 * t2 - 4 * t + 1) * L * a.m0 + (-6 * t2 + 6 * t) * b.z + (3 * t2 - 2 * t) * L * a.m1;
  return Math.abs(dz / L);
}
export const speedNorm = (sp: number) => clamp01(spineSpeed(sp) / 360);

/**
 * WORMHOLE (atti 2-3): la stanza a tre cilindri smette di essere un tubo.
 * Gate sull'asse degli atti: entra con il corridoio, esce nella valle.
 * Le intensita' (torsione, bande, particelle, lente) sono gate x velocita'.
 */
export const wormGate = (sp: number) => smoothstep(0.2, 0.32, sp) * (1 - smoothstep(0.8, 0.88, sp));
/** Frangia RGB + smear: SOLO nel picco di velocita' (marce 300 e 360), mai a riposo. */
export const fringeAmount = (sp: number) => wormGate(sp) * smoothstep(0.5, 0.95, speedNorm(sp));
/** Lente al centro: si apre con il wormhole, un po' di piu' con la velocita'. */
export const lensAmount = (sp: number) => wormGate(sp) * (0.45 + 0.55 * speedNorm(sp));

export type Pose = { x: number; y: number; z: number; tx: number; ty: number; tz: number; bank: number };
const tmpA = { x: 0, y: 0, z: 0 };
const tmpB = { x: 0, y: 0, z: 0 };

/**
 * LA POSA DELLA CAMERA, funzione pura di sp. Spina + swing dalla stessa tabella
 * dei fili: laterale side*3.2*sin(pi u), tuffo di 1.5 (si passa sotto
 * l'ancora), 0.15 rad di bank nella curva. Lo swing va SOLO sulla posizione,
 * mai sul bersaglio: la camera ruota per tenere l'asse mentre trasla, ed e'
 * questo che fa leggere un offset come un arco. Ogni inviluppo e' zero agli
 * estremi: i termini si sommano senza lasciare un offset negli atti dopo.
 * Con prefers-reduced-motion l'ampiezza dello swing e del bank e' zero.
 */
export function cameraPose(sp: number, aspect: number, reduced: boolean, out: Pose) {
  spine(sp, tmpA);
  spine(Math.min(1, sp + 0.035), tmpB);
  let lat = 0;
  let dip = 0;
  let bank = 0;
  if (!reduced) {
    const ls = lateralScale(aspect);
    for (const s of STRANDS) {
      const t = (sp - s.at) / s.span;
      if (t <= 0 || t >= 1) continue;
      const e = Math.sin(Math.PI * swingU(t));
      lat += s.side * 3.2 * ls * e;
      dip += -1.5 * e;
      bank += s.side * 0.15 * e;
    }
    bank += valleyBank(sp);
  }
  out.x = tmpA.x + lat;
  out.y = tmpA.y + dip;
  out.z = tmpA.z;
  out.tx = tmpB.x;
  out.ty = tmpB.y;
  // all'arrivo spina(sp) e spina(sp+0.035) coincidono: il bersaglio resta davanti
  out.tz = Math.min(tmpB.z, tmpA.z - 3);
  out.bank = bank;
  return out;
}

/** Ancora del filo k: DERIVATA dalla spina, mai scritta in coordinate mondo. */
export function strandAnchor(s: Strand, aspect: number, out: { x: number; y: number; z: number }) {
  spine(s.at, out);
  out.x += s.side * s.radius * lateralScale(aspect);
  out.y += s.lift;
  out.z -= s.lead;
  return out;
}

/** Inviluppo del bank nella discesa (atto 4): ~15 gradi a meta' caduta, dritto all'arrivo. */
export const valleyBank = (sp: number) => Math.sin(Math.PI * clamp01((sp - 0.8) / (0.94 - 0.8))) * (15 * Math.PI) / 180;

/**
 * Nebbia: il fondo lontano si dissolve; nel wormhole si APRE (si vede piu'
 * lontano, il tunnel ha una fine luminosa); per il wipe si chiude tutta (su p reale).
 */
export function fogFar(p: number) {
  const open = mix(95, 150, wormGate(actAxis(p)));
  return mix(open, 3.5, smoothstep(0.82, 0.985, p));
}

/**
 * RITMO DEL PLAY AUTOMATICO: secondi per unita' di p, interpolati linearmente
 * fra i nodi. E' VELOCITA', non taglio: tutto il percorso resta intero e viene
 * percorso in fretta (Davide: 10-11 s in tutto). Il prologo tiene i testi a fuoco
 * il tempo di leggerli; wormhole e fili sono il picco; frenata sul finale.
 * Integrale ~9,3 s da p 0.06 + ingresso 1,2 s + partenza dolce = ~10,5 s.
 * Il play muove SOLO lo scroll della pagina: p resta la posizione di scroll,
 * la scena non sa che si sta riproducendo da sola (ONE RULE intatta).
 */
const PLAY_KNOTS: [number, number][] = [
  // Davide: "tutto alla stessa velocita', normale": ritmo costante, ~20 s per l'intero film.
  [0.0, 20],
  [1.0, 20],
];
export function playSecondsPerUnit(p: number) {
  const x = clamp01(p);
  for (let i = 1; i < PLAY_KNOTS.length; i++) {
    const [p0, s0] = PLAY_KNOTS[i - 1];
    const [p1, s1] = PLAY_KNOTS[i];
    if (x <= p1) return mix(s0, s1, (x - p0) / (p1 - p0));
  }
  return PLAY_KNOTS[PLAY_KNOTS.length - 1][1];
}

/** Atto corrente 1..6 = gate piu' alto (per il contatore della barra: intero, mai un conteggio). */
export function currentAct(gates: number[]) {
  let k = 0;
  for (let i = 1; i < gates.length; i++) if (gates[i] > gates[k]) k = i;
  return k + 1;
}

/**
 * E6 - luce che corre lungo il filetto della barra agli snodi di atto: posizione
 * -1..1 (fuori = parcheggiata), funzione di sp su finestre di 0.04. Stesso
 * scroll, stessa fase: mai tempo.
 */
export const PULSE_AT = [0.21, 0.33, 0.8, 0.94];
export function hairlinePulse(sp: number) {
  for (const at of PULSE_AT) {
    const u = (sp - at) / 0.04;
    if (u > 0 && u < 1) return { x: -0.38 + u * 1.76, a: Math.sin(Math.PI * u) };
  }
  return { x: -1, a: 0 };
}

/**
 * Finestre degli overlay DOM sull'ASSE DEGLI ATTI (mai su p reale: con il DOM
 * su p e gli atti su sp ogni scritta arriverebbe un terzo di pagina in ritardo).
 * L'ultima finestra (contatti) corre su p perche' il suo atto corre su p.
 */
export type Win = { in0: number; in1: number; out0: number; out1: number; axis: "sp" | "p" };
export const OVERLAY_WINDOWS: Win[] = [
  // a 20 s per unita' di p (1 sp = 16,4 s) ogni scritta resta leggibile (opacita' > 0,5) per:
  { in0: -1, in1: -0.5, out0: 0.09, out1: 0.12, axis: "sp" }, // S1 titolo + sottotitolo (prologo): 1,7 s + l'ingresso
  { in0: 0.11, in1: 0.14, out0: 0.19, out1: 0.22, axis: "sp" }, // S2 (prologo): 1,3 s
  { in0: 0.21, in1: 0.24, out0: 0.29, out1: 0.32, axis: "sp" }, // S3 processo (prologo, sopra l'ingresso nella stanza): 1,3 s
  { in0: 0.35, in1: 0.38, out0: 0.44, out1: 0.48, axis: "sp" }, // frase A (atto 2): 1,6 s
  { in0: 0.52, in1: 0.56, out0: 0.66, out1: 0.72, axis: "sp" }, // frase B (atto 3): 2,5 s, il respiro in mezzo al tunnel
  { in0: 0.82, in1: 0.86, out0: 0.91, out1: 0.95, axis: "sp" }, // frase A (atto 4, la valle): 1,5 s
  { in0: 0.78, in1: 0.82, out0: 0.86, out1: 0.92, axis: "p" }, // frase B (atto 5): entra a sp 0.95..1.0, esce con il wipe (su p): 1,8 s
  { in0: 0.88, in1: 0.96, out0: 2, out1: 3, axis: "p" }, // finale: titolo + UN bottone (atto 6, su p)
];

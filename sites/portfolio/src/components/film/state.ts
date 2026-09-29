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
 *   1 Ingresso   ... -> 0.16..0.26 (out)
 *   2 Metodo     0.14..0.24 (in) -> 0.34..0.44 (out)
 *   3 Strategie  0.32..0.40 -> 0.62..0.72
 *   4 Rischio    0.62..0.70 -> 0.82..0.92
 *   5 Monitor    0.82..0.90 -> p 0.86..0.94
 *   6 Contatti   p 0.80..0.90 -> fine
 */
export function computeGates(p: number, sp: number, out: number[]) {
  out[0] = 1 - smoothstep(0.16, 0.26, sp);
  out[1] = smoothstep(0.14, 0.24, sp) * (1 - smoothstep(0.34, 0.44, sp));
  out[2] = smoothstep(0.32, 0.4, sp) * (1 - smoothstep(0.62, 0.72, sp));
  out[3] = smoothstep(0.62, 0.7, sp) * (1 - smoothstep(0.82, 0.92, sp));
  out[4] = smoothstep(0.82, 0.9, sp) * (1 - smoothstep(0.86, 0.94, p));
  out[5] = smoothstep(0.8, 0.9, p);
  return out;
}

/** Il lime (figura, gabbia, impulso dei fili) e' in scena? Allora la stanza NON e' oro. */
export function limeInFrame(sp: number) {
  const figure = 1 - smoothstep(0.22, 0.27, sp);
  // la coda segue l'ULTIMO impulso lime (filo 6: sp 0.554 + 0.24 x 0.115 = 0.58), non la morte del filo (0.669):
  // cosi' la stanza torna oro prima e non resta il buco grigio fra i fili e la valle (QA-FILM C2)
  const strands = smoothstep(0.33, 0.36, sp) * (1 - smoothstep(0.59, 0.64, sp));
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
export const figureGate = (sp: number) => 1 - smoothstep(0.17, 0.235, sp);
/** Gabbia: UNO scalare la tesse (0..0.14) e la stesse (0.17..0.25). */
export const latticeBuild = (sp: number) => smoothstep(0, 0.14, sp) * (1 - smoothstep(0.17, 0.25, sp));
/** Stanza: appare mentre la camera entra. */
export const roomGate = (sp: number) => smoothstep(0.1, 0.22, sp);
/** Orizzonte (atto 5): la barra sottile in fondo. */
export const horizonGate = (sp: number, p: number) => smoothstep(0.78, 0.9, sp) * (1 - smoothstep(0.9, 0.98, p));

/**
 * LA TABELLA: sei fili che guidano SIA i fili SIA la camera.
 * Spaziatura che si stringe (0.045, 0.045, 0.038, 0.035, 0.031): il corridoio
 * accelera verso l'atto dopo. lead ~= 3.8 * radius fissa l'angolo dell'ancora
 * fuori dall'asse di vista (atan(r/lead) ~ 14.7 gradi contro una mezza
 * inquadratura di ~29 x 19). Due fili per ROTTURA, due per RITRACCIAMENTO,
 * due per il portafoglio insieme: e' solo un nome, il disegno e' lo stesso.
 */
export type Strand = { at: number; span: number; side: 1 | -1; lead: number; radius: number; lift: number; tag: string };
export const STRANDS: Strand[] = [
  { at: 0.36, span: 0.12, side: 1, radius: 5.0, lead: 19.0, lift: 6.0, tag: "ROTTURA" },
  { at: 0.405, span: 0.12, side: -1, radius: 3.4, lead: 12.9, lift: 4.2, tag: "ROTTURA" },
  { at: 0.45, span: 0.115, side: 1, radius: 3.2, lead: 12.2, lift: 4.0, tag: "RITRACCIAMENTO" },
  { at: 0.488, span: 0.11, side: -1, radius: 3.2, lead: 12.2, lift: 4.0, tag: "RITRACCIAMENTO" },
  { at: 0.523, span: 0.105, side: 1, radius: 3.4, lead: 12.9, lift: 4.2, tag: "INSIEME" },
  { at: 0.554, span: 0.115, side: -1, radius: 5.2, lead: 19.8, lift: 6.2, tag: "INSIEME" },
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
 * esattamente dove un filo prende o lascia: 0.405 e 0.554), tangenti a zero
 * solo dove la camera deve davvero fermarsi (riposo iniziale, arrivo).
 * y e' uno smoothstep tra i keyframe (la valle del drawdown: atto 4).
 */
type Key = { sp: number; y: number; z: number; m0: number; m1: number };
export const SPINE: Key[] = [
  // sp     y     z       m0     m1   (m0 = tangente in uscita da questo key, m1 = in arrivo al prossimo)
  { sp: 0.0, y: 9.0, z: 34.0, m0: -44, m1: -44 }, // riposo -> figura, lineare
  { sp: 0.16, y: 9.0, z: 27.0, m0: -44, m1: -300 }, // tuffo attraverso la figura, accelerazione costante
  { sp: 0.36, y: 9.0, z: -7.4, m0: -300, m1: -300 }, // MARCIA 300: il primo filo prende
  { sp: 0.405, y: 9.0, z: -20.9, m0: -150, m1: -150 }, // MARCIA 150: il secondo filo prende
  { sp: 0.554, y: 9.0, z: -43.25, m0: -360, m1: -360 }, // MARCIA 360: il sesto filo prende
  { sp: 0.68, y: 9.0, z: -88.6, m0: -360, m1: -180 }, // discesa nella valle
  { sp: 0.77, y: 2.0, z: -112.9, m0: -180, m1: -90 }, // fondo della valle
  { sp: 0.86, y: 7.5, z: -125.05, m0: -90, m1: 0 }, // risalita
  { sp: 1.0, y: 8.5, z: -131.35, m0: 0, m1: 0 }, // orizzonte, riposo
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
export const wormGate = (sp: number) => smoothstep(0.22, 0.36, sp) * (1 - smoothstep(0.7, 0.8, sp));
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
export const valleyBank = (sp: number) => Math.sin(Math.PI * clamp01((sp - 0.68) / (0.86 - 0.68))) * (15 * Math.PI) / 180;

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
 * fra i nodi. Corridoio (atti 2-3) veloce, valle (atto 4) lenta, arrivo in
 * frenata. Integrale ~25 s + la partenza dolce: il film intero in 25-30 s.
 * Il play muove SOLO lo scroll della pagina: p resta la posizione di scroll,
 * la scena non sa che si sta riproducendo da sola (ONE RULE intatta).
 */
const PLAY_KNOTS: [number, number][] = [
  [0.0, 30],
  [0.13, 30],
  [0.2, 24],
  [0.3, 20],
  [0.36, 16],
  [0.56, 16],
  [0.6, 40],
  [0.7, 40],
  [0.76, 25],
  [0.88, 22],
  [1.0, 30],
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
export const PULSE_AT = [0.2, 0.38, 0.66, 0.86];
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
  { in0: -1, in1: -0.5, out0: 0.09, out1: 0.17, axis: "sp" }, // titolo (atto 1)
  { in0: 0.2, in1: 0.27, out0: 0.33, out1: 0.4, axis: "sp" }, // frase A (atto 2)
  { in0: 0.43, in1: 0.5, out0: 0.58, out1: 0.65, axis: "sp" }, // frase B (atto 3)
  { in0: 0.72, in1: 0.79, out0: 0.84, out1: 0.9, axis: "sp" }, // frase A (atto 4)
  { in0: 0.738, in1: 0.787, out0: 0.86, out1: 0.92, axis: "p" }, // frase B (atto 5): entra a sp 0.90..0.96, esce con il wipe (su p)
  { in0: 0.88, in1: 0.96, out0: 2, out1: 3, axis: "p" }, // contatti (atto 6, su p)
];

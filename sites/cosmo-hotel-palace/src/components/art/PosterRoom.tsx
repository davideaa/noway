/**
 * Poster delle camere (DESIGN 6, UX 5.2, DECISIONI 10). Casa di bambola vista dall'alto, in
 * prospettiva morbida, come la vista iniziale del diorama 3D. Ritratta gli ambienti delle foto
 * (parquet in rovere, testiera imbottita, abat-jour, tre stampe, tenda beige + velo bianco,
 * scrivania) in modo stilizzato: nessun dato è inventato oltre a quelli del BRIEF.
 *
 * - classic: 22 m², matrimoniale 160 cm, scrivania, finestra con tenda, porta del bagno.
 * - suite: 44 m², due ambienti con due ingressi separati: soggiorno (divano letto, ampia
 *   scrivania) + camera matrimoniale con armadio.
 * - family: due Classic comunicanti (una matrimoniale, una con due letti singoli), in due
 *   archi affiancati: la porta comunicante è nella parete in comune.
 * Proporzioni dei mobili indicative; le superfici (22, 44) sono quelle vere.
 */
import { ArtSvg, Alone, type ArtProps, type Tavolozze } from "./base";
import { kit, persp, type Mat } from "./proj";

export type PosterRoomProps = ArtProps & { tipo: "classic" | "family" | "suite" };

const ALT = {
  classic: "Illustrazione della Classic Double Room: letto matrimoniale con testiera imbottita, due abat-jour, tre stampe, finestra con tenda e scrivania, su parquet in rovere.",
  suite: "Illustrazione della Suite: a sinistra il soggiorno con divano letto e ampia scrivania, a destra la camera matrimoniale con armadio. Due ingressi separati.",
  family: "Illustrazione della Family Room: due camere comunicanti, a sinistra una con letto matrimoniale, a destra una con due letti singoli, unite da una porta.",
} as const;

/* Chiavi: Z fondo · f parquet · a/b fianchi del solaio · w/x muro destro/sinistro · c/e bordo muro
 * d zoccolino · l m n lino · t u v imbottito · o p q legno · i I cuscino/plaid · k tenda · s velo
 * z vetro · r cornice · y stampa · h paralume/luce · j metallo scuro · L foglia · S ombra */
const T: Tavolozze = {
  giorno: {
    Z: "var(--sabbia-100)", f: "var(--rovere-500)", g: "var(--rovere-700)", a: "var(--cemento-300)", b: "var(--cemento-500)",
    w: "var(--sabbia-200)", x: "var(--sabbia-300)", c: "var(--sabbia-50)", e: "var(--sabbia-100)", d: "var(--rovere-700)",
    l: "var(--sabbia-50)", m: "var(--sabbia-100)", n: "var(--sabbia-200)",
    t: "var(--sabbia-300)", u: "var(--sabbia-400)", v: "var(--cemento-500)",
    o: "var(--rovere-300)", p: "var(--rovere-500)", q: "var(--rovere-700)",
    i: "var(--cemento-300)", I: "var(--cemento-500)", k: "var(--sabbia-300)", s: "var(--sabbia-50)", z: "var(--pianta-100)",
    r: "var(--ulivo-600)", y: "var(--sabbia-200)", h: "var(--miele-300)", j: "var(--ulivo-800)", L: "var(--pianta-600)", S: "var(--ulivo-800)",
  },
  sera: {
    Z: "var(--sera-950)", f: "var(--ulivo-800)", g: "var(--sera-950)", a: "var(--sera-900)", b: "var(--sera-950)",
    w: "var(--sera-900)", x: "var(--sera-950)", c: "var(--sera-500)", e: "var(--sera-900)", d: "var(--sera-950)",
    l: "var(--sabbia-200)", m: "var(--sabbia-300)", n: "var(--sabbia-400)",
    t: "var(--sabbia-400)", u: "var(--inchiostro-500)", v: "var(--inchiostro-700)",
    o: "var(--rovere-500)", p: "var(--rovere-700)", q: "var(--ulivo-800)",
    i: "var(--cemento-500)", I: "var(--inchiostro-700)", k: "var(--inchiostro-700)", s: "var(--sera-500)", z: "var(--pianta-900)",
    r: "var(--rovere-700)", y: "var(--sera-500)", h: "var(--miele-glow)", j: "var(--sera-950)", L: "var(--pianta-800)", S: "var(--sera-950)",
  },
};

const X = 5.4; // lunghezza di una camera: 5,4 × 4,1 = 22 m²
const Y = 4.1;
const H = 2.9;
const LINO: Mat = ["l", "m", "n"];
const IMB: Mat = ["t", "u", "v"];
const LEG: Mat = ["o", "p", "q"];
const GR: Mat = ["i", "I", "I"];
const MURO: Mat = ["c", "w", "e"];
const MURO_S: Mat = ["c", "e", "x"];

type K = ReturnType<typeof kit>;

/** Guscio: solaio con parquet, muro di fondo e muro di sinistra. `len` = lunghezza totale. */
function Guscio({ K, len, sera, sole = true }: { K: K; len: number; sera: boolean; sole?: boolean }) {
  const { box, wy, line, quad } = K;
  const assi: number[] = [];
  for (let y = 0.7; y < Y; y += 0.7) assi.push(y);
  return (
    <>
      {box(["f", "a", "b"], -0.15, -0.15, -0.25, len + 0.15, Y + 0.15, 0.25)}
      {/* listoni: righe lungo x */}
      <path d={assi.map((y) => `M${K.s(0, y, 0)}L${K.s(len, y, 0)}`).join("")} fill="none" stroke="var(--g)" strokeWidth={1} opacity={0.5} />
      {!sera && sole && <g opacity={0.45}>{quad("l", [0, 1.1, 0], [0, 3.0, 0], [1.9, 3.7, 0], [1.9, 1.8, 0])}</g>}
      {box(MURO, 0, -0.15, 0, len, 0.15, H)}
      {box(MURO_S, -0.15, -0.15, 0, 0.15, Y + 0.15, H)}
      {wy("d", 0, 0, len, 0, 0.12)}
      {line("var(--d)", 3, [0, 0.01, 0.06], [0, Y, 0.06])}
    </>
  );
}

/** Finestra sul muro di sinistra con tenda beige e velo. */
function Finestra({ K, y0, y1 }: { K: K; y0: number; y1: number }) {
  const { wx, line } = K;
  const z0 = 0.85;
  const z1 = 2.55;
  return (
    <>
      {wx("r", 0, y0 - 0.06, y1 + 0.06, z0 - 0.06, z1 + 0.06)}
      {wx("z", 0, y0, y1, z0, z1)}
      {wx("s", 0, y0, y1, z0, z1)}
      {line("var(--k)", 2, [0, (y0 + y1) / 2, z0], [0, (y0 + y1) / 2, z1])}
      {wx("k", 0.02, y0 - 0.5, y0 + 0.2, 0.08, 2.78)}
      {wx("k", 0.02, y1 - 0.2, y1 + 0.5, 0.08, 2.78)}
      {line("var(--x)", 1.5, [0.03, y0 - 0.2, 0.2], [0.03, y0 - 0.2, 2.7], [0.03, y0 + 0.02, 0.2], [0.03, y0 + 0.02, 2.7])}
      {line("var(--x)", 1.5, [0.03, y1 + 0.2, 0.2], [0.03, y1 + 0.2, 2.7], [0.03, y1 - 0.02, 0.2], [0.03, y1 - 0.02, 2.7])}
    </>
  );
}

/** Scrivania e sedia contro il muro di sinistra. */
function Scrivania({ K }: { K: K }) {
  const { box, line } = K;
  return (
    <>
      {box(LEG, 0.05, 1.15, 0.7, 0.62, 1.7, 0.05)}
      {box(LEG, 0.6, 1.15, 0, 0.06, 0.06, 0.7)}
      {box(LEG, 0.6, 2.75, 0, 0.06, 0.06, 0.7)}
      {box(IMB, 0.95, 1.65, 0.42, 0.46, 0.46, 0.08)}
      {box(IMB, 1.36, 1.65, 0.5, 0.06, 0.46, 0.42)}
      {line("var(--j)", 1.5, [1.0, 1.7, 0], [1.0, 1.7, 0.42], [1.0, 2.07, 0], [1.0, 2.07, 0.42], [1.35, 1.7, 0], [1.35, 1.7, 0.42])}
    </>
  );
}

/** Lampada a parete con alone. */
function Abatjour({ K, x, id, sera }: { K: K; x: number; id: string; sera: boolean }) {
  const { quad, line, P } = K;
  const [cx, cy] = P(x, 0.1, 1.55);
  return (
    <>
      <Alone id={id} cx={cx} cy={cy} r={sera ? 78 : 46} op={sera ? 1 : 0.8} />
      {line("var(--j)", 1.5, [x, 0.0, 1.35], [x, 0.1, 1.35])}
      {quad("h", [x - 0.11, 0.1, 1.72], [x + 0.11, 0.1, 1.72], [x + 0.17, 0.1, 1.34], [x - 0.17, 0.1, 1.34])}
    </>
  );
}

function Stampa({ K, x }: { K: K; x: number }) {
  const { wy, line } = K;
  return (
    <>
      {wy("r", 0, x, x + 0.34, 1.6, 2.12)}
      {wy("y", 0, x + 0.04, x + 0.3, 1.64, 2.08)}
      {line("var(--u)", 1.2, [x + 0.1, 0, 1.75], [x + 0.17, 0, 2.0], [x + 0.25, 0, 1.82])}
    </>
  );
}

function Porta({ K, x, bagno }: { K: K; x: number; bagno?: boolean }) {
  const { wy, quad } = K;
  return (
    <>
      {wy("q", 0, x - 0.05, x + 0.95, 0, 2.15)}
      {wy(bagno ? "p" : "o", 0, x, x + 0.9, 0, 2.1)}
      {quad("j", [x + 0.7, 0, 0.98], [x + 0.82, 0, 0.98], [x + 0.82, 0, 1.04], [x + 0.7, 0, 1.04])}
    </>
  );
}

/** Letto matrimoniale 160 cm, due comodini, due abat-jour, tre stampe. */
function Matrimoniale({ K, x, id, sera }: { K: K; x: number; id: string; sera: boolean }) {
  const { box } = K;
  return (
    <>
      <Abatjour K={K} x={x - 1.15} id={id} sera={sera} />
      <Abatjour K={K} x={x + 1.15} id={id} sera={sera} />
      <Stampa K={K} x={x - 0.64} />
      <Stampa K={K} x={x - 0.17} />
      <Stampa K={K} x={x + 0.3} />
      {box(IMB, x - 0.95, 0, 0.2, 1.9, 0.18, 1.05)}
      {box(LEG, x - 1.5, 0.05, 0, 0.45, 0.42, 0.5)}
      {box(LEG, x + 1.05, 0.05, 0, 0.45, 0.42, 0.5)}
      {box(IMB, x - 0.8, 0.1, 0, 1.6, 2.05, 0.3)}
      {box(LINO, x - 0.8, 0.15, 0.3, 1.6, 2.0, 0.22)}
      {box(LINO, x - 0.7, 0.2, 0.52, 0.6, 0.4, 0.14)}
      {box(LINO, x + 0.1, 0.2, 0.52, 0.6, 0.4, 0.14)}
      {box(GR, x - 0.62, 0.66, 0.52, 0.4, 0.3, 0.12)}
      {box(GR, x + 0.22, 0.66, 0.52, 0.4, 0.3, 0.12)}
      {box(GR, x - 0.8, 1.55, 0.52, 1.6, 0.5, 0.04)}
    </>
  );
}

/** Due letti singoli con un comodino in mezzo. */
function DueSingoli({ K, x, id, sera }: { K: K; x: number; id: string; sera: boolean }) {
  const { box } = K;
  return (
    <>
      <Abatjour K={K} x={x - 1.0} id={id} sera={sera} />
      <Abatjour K={K} x={x + 1.0} id={id} sera={sera} />
      {box(LEG, x - 0.27, 0.05, 0, 0.54, 0.42, 0.5)}
      {[-1, 1].map((s) => {
        const bx = s < 0 ? x - 1.25 : x + 0.35;
        return (
          <g key={s}>
            {box(IMB, bx - 0.05, 0, 0.2, 1.0, 0.16, 0.95)}
            {box(IMB, bx, 0.1, 0, 0.9, 2.05, 0.3)}
            {box(LINO, bx, 0.15, 0.3, 0.9, 2.0, 0.22)}
            {box(LINO, bx + 0.12, 0.2, 0.52, 0.66, 0.4, 0.14)}
            {box(GR, bx, 1.6, 0.52, 0.9, 0.45, 0.04)}
          </g>
        );
      })}
    </>
  );
}

/** Pianta in vaso (ficus): un tocco di verde, come nelle foto. */
function Ficus({ K, x, y }: { K: K; x: number; y: number }) {
  const { box, P } = K;
  const [a, b] = P(x + 0.17, y + 0.17, 1.0);
  return (
    <>
      {box(["q", "p", "j"], x, y, 0, 0.34, 0.34, 0.4)}
      <path className="L" d={`M${a.toFixed(0)} ${(b + 24).toFixed(0)}c-22-4-34-30-26-52c10 10 20 22 26 52zM${a.toFixed(0)} ${(b + 24).toFixed(0)}c22-4 34-30 26-52c-10 10-20 22-26 52zM${a.toFixed(0)} ${(b + 24).toFixed(0)}c-8-20-6-42 0-58c6 16 8 38 0 58z`} />
    </>
  );
}

function Soggiorno({ K, id, sera }: { K: K; id: string; sera: boolean }) {
  const { box, quad } = K;
  return (
    <>
      <Porta K={K} x={0.3} />
      <Stampa K={K} x={1.9} />
      <Stampa K={K} x={2.7} />
      <Abatjour K={K} x={3.95} id={id} sera={sera} />
      {quad("n", [1.2, 1.1, 0.01], [3.9, 1.1, 0.01], [3.9, 2.9, 0.01], [1.2, 2.9, 0.01])}
      {box(IMB, 1.35, 0.05, 0, 2.3, 0.95, 0.42)}
      {box(IMB, 1.35, 0, 0.42, 2.3, 0.22, 0.55)}
      {box(IMB, 1.35, 0.22, 0.42, 0.22, 0.78, 0.22)}
      {box(IMB, 3.43, 0.22, 0.42, 0.22, 0.78, 0.22)}
      {box(GR, 1.75, 0.3, 0.42, 0.45, 0.3, 0.15)}
      {box(GR, 2.8, 0.3, 0.42, 0.45, 0.3, 0.15)}
      {box(LEG, 2.0, 1.55, 0, 1.2, 0.62, 0.36)}
      {box(LEG, 4.05, 0.05, 0.72, 1.3, 0.8, 0.05)}
      {box(LEG, 4.05, 0.05, 0, 0.05, 0.8, 0.72)}
      {box(LEG, 5.3, 0.05, 0, 0.05, 0.8, 0.72)}
      {box(IMB, 4.45, 1.05, 0.42, 0.5, 0.5, 0.08)}
      {box(IMB, 4.45, 1.5, 0.5, 0.5, 0.06, 0.45)}
    </>
  );
}

function Camera({ K, id, sera, doppio, finestra }: { K: K; id: string; sera: boolean; doppio?: boolean; finestra?: boolean }) {
  const { wy } = K;
  return (
    <>
      <Porta K={K} x={0.3} />
      {doppio ? <DueSingoli K={K} x={2.95} id={id} sera={sera} /> : <Matrimoniale K={K} x={2.9} id={id} sera={sera} />}
      {finestra ? (
        <>
          {wy("r", 0, 4.52, 5.28, 0.8, 2.36)}
          {wy("z", 0, 4.58, 5.22, 0.86, 2.3)}
          {wy("s", 0, 4.58, 5.22, 0.86, 2.3)}
          {wy("k", 0, 4.3, 4.62, 0.1, 2.6)}
          {wy("k", 0, 5.2, 5.5, 0.1, 2.6)}
        </>
      ) : (
        <Porta K={K} x={4.4} bagno />
      )}
    </>
  );
}

function Armadio({ K, o }: { K: K; o: number }) {
  const { box, line } = K;
  return (
    <>
      {box(LEG, o + 4.5, 0.05, 0, 0.85, 0.6, 2.2)}
      {line("var(--q)", 1.5, [o + 4.925, 0.65, 0.2], [o + 4.925, 0.65, 2.0])}
    </>
  );
}

export function PosterRoom({ tipo, tono = "giorno", decorativo = true, titolo, className, arco = false }: PosterRoomProps) {
  const sera = tono === "sera";

  if (tipo === "family") {
    const W = 760;
    const Hh = 440;
    return (
      <ArtSvg w={W} h={Hh} tono={tono} tavolozze={T} alt={ALT.family} decorativo={decorativo} titolo={titolo} className={className} arco={arco} archi={2} gap={40}>
        {(id) => {
          const P = persp([2.7, 2.05, 1.0], 56, 34, 26, 49, 180, 238);
          const K = kit(P);
          const sala = (doppio: boolean) => (
            <>
              <Guscio K={K} len={X} sera={sera} sole={false} />
              {/* porta comunicante nella parete in comune (x = 0) */}
              {K.wx("r", 0, 1.35, 2.65, 0, 2.2)}
              {K.wx("h", 0, 1.4, 2.6, 0, 2.15)}
              {!sera && <g opacity={0.4}>{K.quad("h", [0, 1.4, 0], [0, 2.6, 0], [1.7, 3.3, 0], [1.7, 2.1, 0])}</g>}
              <Alone id={id} cx={K.P(0, 2, 1.2)[0]} cy={K.P(0, 2, 1.2)[1]} r={70} op={sera ? 1 : 0.6} />
              {K.line("var(--j)", 3, [0.02, 1.5, 1.05], [0.02, 1.5, 1.2])}
              <Camera K={K} id={id} sera={sera} doppio={doppio} finestra />
            </>
          );
          return (
            <>
              <rect width={W} height={Hh} fill="var(--Z)" />
              <Alone id={id} cx={180} cy={190} r={190} op={sera ? 0.3 : 0.5} />
              <Alone id={id} cx={580} cy={190} r={190} op={sera ? 0.3 : 0.5} />
              <g transform="translate(360 0) scale(-1 1)">{sala(false)}</g>
              <g transform="translate(400 0)">{sala(true)}</g>
            </>
          );
        }}
      </ArtSvg>
    );
  }

  const suite = tipo === "suite";
  const W = suite ? 760 : 360;
  const Hh = suite ? 440 : 440;
  const len = suite ? 2 * X : X;
  const P = suite ? persp([5.4, 2.0, 1.0], 70, 34, 30, 47, 380, 242) : persp([2.7, 2.05, 1.0], 58, 32, 26, 51, 180, 252);
  return (
    <ArtSvg w={W} h={Hh} tono={tono} tavolozze={T} alt={ALT[tipo]} decorativo={decorativo} titolo={titolo} className={className} arco={arco}>
      {(id) => {
        const K = kit(P);
        return (
          <>
            <rect width={W} height={Hh} fill="var(--Z)" />
            <Alone id={id} cx={W / 2} cy={Hh * 0.45} r={suite ? 300 : 190} op={sera ? 0.35 : 0.6} />
            <Guscio K={K} len={len} sera={sera} />
            <Finestra K={K} y0={1.15} y1={2.85} />
            {!suite && <Scrivania K={K} />}
            {!suite && <Camera K={K} id={id} sera={sera} />}
            {!suite && <Ficus K={K} x={0.3} y={3.5} />}
            {suite && (
              <>
                <Soggiorno K={K} id={id} sera={sera} />
                {K.box(MURO, 5.35, 0, 0, 0.14, Y, 1.0)}
                <g transform="translate(0 0)">
                  <SuiteCamera K={K} id={id} sera={sera} />
                </g>
              </>
            )}
          </>
        );
      }}
    </ArtSvg>
  );
}

function SuiteCamera({ K, id, sera }: { K: K; id: string; sera: boolean }) {
  // camera matrimoniale: stessi elementi della Classic, spostati di una camera
  const P2: typeof K.P = (x, y, z) => K.P(x + X, y, z);
  const K2 = kit(P2);
  return (
    <>
      <Porta K={K2} x={0.3} />
      <Matrimoniale K={K2} x={2.9} id={id} sera={sera} />
      <Armadio K={K2} o={0} />
    </>
  );
}

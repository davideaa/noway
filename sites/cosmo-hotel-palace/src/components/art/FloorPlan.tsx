/**
 * Piante in scala delle superfici vere (UX 5.1, DESIGN 6; COPY 3.3-3.5 per gli alt).
 * Scala unica: 40 unità = 1 m, quindi la Classic (22 m²) occupa metà della Suite e della Family
 * (44 m²). Le superfici sono quelle del BRIEF; la forma delle stanze, la posizione di porte,
 * bagni e mobili è INDICATIVA (non conosciamo le misure) e per questo non ci sono quote in
 * metri sui lati: solo i m² totali. Vedi la nota «Proporzioni indicative…» in UX 5.1.
 *
 * Classic: 22 m², matrimoniale 160 cm, bagno. Suite: due ambienti da 22 m² con due ingressi
 * separati (soggiorno con divano letto e ampia scrivania + camera con armadio), due bagni; la
 * parete fra i due ambienti è disegnata senza porta perché il BRIEF non dice se si comunichi.
 * Family: due Classic comunicanti (porta nella parete in comune), matrimoniale + due singoli.
 */
import type { ReactNode } from "react";
import { ArtSvg, type ArtProps, type Tavolozze } from "./base";

export type FloorPlanProps = ArtProps & {
  tipo: "classic" | "family" | "suite" | "confronto";
  /** Scrive «22 m²» ecc. sopra la pianta. Default: sì. */
  etichetta?: boolean;
};

const ALT = {
  classic: "Pianta in scala della Classic Double Room: 22 metri quadri, un letto matrimoniale da 160 centimetri e il bagno.",
  family: "Pianta in scala della Family Room: 44 metri quadri, due camere comunicanti, ognuna con il proprio bagno.",
  suite: "Pianta in scala della Suite: 44 metri quadri, soggiorno e camera con ingressi separati, due bagni.",
  confronto: // NUOVO TESTO
    "Piante a scala comune: la Classic Double Room è di 22 metri quadri, la Suite e la Family Room di 44 metri quadri ciascuna.",
} as const;

/* Z fondo · f pavimento · k muri e contorni · m mobili · M mobili scuri · g vetro finestra · l linee sottili · t testo */
const T: Tavolozze = {
  giorno: {
    Z: "var(--sabbia-50)", f: "var(--sabbia-200)", k: "var(--inchiostro-900)", m: "var(--sabbia-300)", M: "var(--sabbia-400)", g: "var(--pianta-300)", l: "var(--inchiostro-700)", t: "var(--inchiostro-900)", w: "var(--sabbia-100)",
  },
  sera: {
    Z: "var(--sera-950)", f: "var(--sera-900)", k: "var(--sera-50)", m: "var(--sera-500)", M: "var(--inchiostro-500)", g: "var(--pianta-600)", l: "var(--sera-200)", t: "var(--sera-50)", w: "var(--sera-200)",
  },
};

const CW = 216; // una camera: 5,4 m
const CH = 164; // 4,1 m  → 5,4 × 4,1 = 22,1 m²
const MARG = 16;
const TOP = 44; // spazio per l'etichetta

type Cella = "matrimoniale" | "singoli" | "soggiorno" | "camera";

const rr = (x: number, y: number, w: number, h: number, r = 3) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1-${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1-${r}-${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r}-${r}z`;

/** Una camera da 22 m² con l'origine in (x, y). `sx`: dove si trova la finestra; `porta`: porta comunicante a sinistra/destra. */
function Stanza({ x, y, tipo, comunicaS, comunicaD, win }: { x: number; y: number; tipo: Cella; comunicaS?: boolean; comunicaD?: boolean; win: [number, number] }) {
  const [w0, w1] = win;
  const dx = [100, 132]; // ingresso sul lato basso
  // muri esterni, con aperture: finestra in alto, ingresso in basso, porta comunicante
  const pc = [96, 128]; // apertura della porta comunicante (y)
  const muri =
    `M${x} ${y}H${x + w0}M${x + w1} ${y}H${x + CW}` +
    `M${x} ${y + CH}H${x + dx[0]}M${x + dx[1]} ${y + CH}H${x + CW}` +
    (comunicaS ? `M${x} ${y}V${y + pc[0]}M${x} ${y + pc[1]}V${y + CH}` : `M${x} ${y}V${y + CH}`) +
    (comunicaD ? `M${x + CW} ${y}V${y + pc[0]}M${x + CW} ${y + pc[1]}V${y + CH}` : `M${x + CW} ${y}V${y + CH}`);
  const bagno = `M${x} ${y + 88}H${x + 76}V${y + 106}M${x + 76} ${y + 134}V${y + CH}`;
  return (
    <>
      <rect fill="var(--f)" x={x} y={y} width={CW} height={CH} />
      {/* finestra: due linee sottili con vetro */}
      <path d={`M${x + w0} ${y}H${x + w1}`} stroke="var(--g)" strokeWidth={6} />
      <path d={`M${x + w0} ${y - 2}H${x + w1}M${x + w0} ${y + 2}H${x + w1}`} stroke="var(--k)" strokeWidth={1.2} />
      {/* bagno: vasca, water, lavabo */}
      <path d={bagno} stroke="var(--k)" strokeWidth={3.5} fill="none" strokeLinecap="square" />
      <path fill="var(--m)" d={rr(x + 6, y + 94, 28, 66, 6)} stroke="var(--l)" strokeWidth={1.2} />
      <rect fill="var(--m)" x={x + 46} y={y + 146} width={16} height={9} rx={2} stroke="var(--l)" strokeWidth={1.2} />
      <ellipse fill="var(--m)" cx={x + 54} cy={y + 134} rx={7} ry={9} stroke="var(--l)" strokeWidth={1.2} />
      <circle fill="var(--m)" cx={x + 54} cy={y + 106} r={6} stroke="var(--l)" strokeWidth={1.2} />
      {tipo === "matrimoniale" && <Matrimoniale x={x} y={y} />}
      {tipo === "singoli" && <Singoli x={x} y={y} />}
      {tipo === "soggiorno" && <Soggiorno x={x} y={y} />}
      {tipo === "camera" && <CameraArmadio x={x} y={y} />}
      {/* muri */}
      <path d={muri} stroke="var(--k)" strokeWidth={6} fill="none" strokeLinecap="square" />
      {/* porta d'ingresso: anta e arco di apertura */}
      <path d={`M${x + dx[0]} ${y + CH}V${y + CH - 32}`} stroke="var(--k)" strokeWidth={1.8} />
      <path d={`M${x + dx[0]} ${y + CH - 32}A32 32 0 0 1 ${x + dx[1]} ${y + CH}`} stroke="var(--l)" strokeWidth={1} strokeDasharray="3 3" fill="none" />
      {/* porte comunicanti */}
      {comunicaS && (
        <>
          <path d={`M${x} ${y + pc[0]}H${x + 32}`} stroke="var(--k)" strokeWidth={1.8} />
          <path d={`M${x + 32} ${y + pc[0]}A32 32 0 0 0 ${x} ${y + pc[1]}`} stroke="var(--l)" strokeWidth={1} strokeDasharray="3 3" fill="none" />
        </>
      )}
    </>
  );
}

const Cuscini = ({ x, y }: { x: number; y: number }) => (
  <>
    <rect fill="var(--w)" x={x + 6} y={y + 6} width={22} height={14} rx={4} stroke="var(--l)" strokeWidth={1} />
    <rect fill="var(--w)" x={x + 36} y={y + 6} width={22} height={14} rx={4} stroke="var(--l)" strokeWidth={1} />
  </>
);

function Matrimoniale({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect fill="var(--m)" x={x + 66} y={y + 18} width={18} height={18} rx={2} stroke="var(--l)" strokeWidth={1.2} />
      <rect fill="var(--m)" x={x + 150} y={y + 18} width={18} height={18} rx={2} stroke="var(--l)" strokeWidth={1.2} />
      <path fill="var(--m)" d={rr(x + 86, y + 8, 64, 80, 4)} stroke="var(--k)" strokeWidth={1.5} />
      <Cuscini x={x + 86} y={y + 8} />
      <path d={`M${x + 86} ${y + 44}H${x + 150}`} stroke="var(--l)" strokeWidth={1.2} />
      <rect fill="var(--m)" x={x + 176} y={y + 66} width={34} height={64} rx={2} stroke="var(--k)" strokeWidth={1.5} />
      <circle fill="var(--m)" cx={x + 158} cy={y + 98} r={10} stroke="var(--l)" strokeWidth={1.2} />
    </>
  );
}

function Singoli({ x, y }: { x: number; y: number }) {
  return (
    <>
      {[84, 134].map((bx) => (
        <g key={bx}>
          <path fill="var(--m)" d={rr(x + bx, y + 8, 36, 80, 4)} stroke="var(--k)" strokeWidth={1.5} />
          <rect fill="var(--w)" x={x + bx + 5} y={y + 14} width={26} height={14} rx={4} stroke="var(--l)" strokeWidth={1} />
          <path d={`M${x + bx} ${y + 44}H${x + bx + 36}`} stroke="var(--l)" strokeWidth={1.2} />
        </g>
      ))}
      <rect fill="var(--m)" x={x + 122} y={y + 12} width={10} height={14} rx={2} stroke="var(--l)" strokeWidth={1.2} />
      <rect fill="var(--m)" x={x + 176} y={y + 100} width={32} height={50} rx={2} stroke="var(--k)" strokeWidth={1.5} />
    </>
  );
}

function Soggiorno({ x, y }: { x: number; y: number }) {
  return (
    <>
      <path fill="var(--m)" d={rr(x + 88, y + 8, 84, 36, 6)} stroke="var(--k)" strokeWidth={1.5} />
      <path fill="var(--M)" d={rr(x + 94, y + 14, 34, 24, 4)} stroke="var(--l)" strokeWidth={1} />
      <path fill="var(--M)" d={rr(x + 132, y + 14, 34, 24, 4)} stroke="var(--l)" strokeWidth={1} />
      <path fill="var(--m)" d={rr(x + 104, y + 70, 52, 28, 4)} stroke="var(--l)" strokeWidth={1.5} />
      <rect fill="var(--m)" x={x + 8} y={y + 8} width={60} height={30} rx={2} stroke="var(--k)" strokeWidth={1.5} />
      <circle fill="var(--m)" cx={x + 38} cy={y + 52} r={10} stroke="var(--l)" strokeWidth={1.2} />
      <path fill="var(--M)" d={rr(x + 176, y + 66, 28, 28, 6)} stroke="var(--l)" strokeWidth={1.2} />
    </>
  );
}

function CameraArmadio({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect fill="var(--m)" x={x + 76} y={y + 18} width={18} height={18} rx={2} stroke="var(--l)" strokeWidth={1.2} />
      <rect fill="var(--m)" x={x + 160} y={y + 18} width={18} height={18} rx={2} stroke="var(--l)" strokeWidth={1.2} />
      <path fill="var(--m)" d={rr(x + 96, y + 8, 64, 80, 4)} stroke="var(--k)" strokeWidth={1.5} />
      <Cuscini x={x + 96} y={y + 8} />
      <path d={`M${x + 96} ${y + 44}H${x + 160}`} stroke="var(--l)" strokeWidth={1.2} />
      <rect fill="var(--M)" x={x + 186} y={y + 66} width={24} height={72} rx={2} stroke="var(--k)" strokeWidth={1.5} />
      <path d={`M${x + 198} ${y + 66}V${y + 138}`} stroke="var(--l)" strokeWidth={1} />
    </>
  );
}

type Disegno = { w: number; h: number; corpo: ReactNode };

function Piano({ tipo, y0, etichetta }: { tipo: "classic" | "family" | "suite"; y0: number; etichetta: boolean }): ReactNode {
  const x = MARG;
  const y = y0 + TOP;
  const testo = tipo === "classic" ? "22 m²" : tipo === "suite" ? "44 m²" : "22 + 22 m²";
  return (
    <g>
      {etichetta && (
        <text x={x} y={y0 + 30} fontSize={26} fill="var(--t)" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "var(--fvs-display)" }}>
          {testo}
        </text>
      )}
      {tipo === "classic" && <Stanza x={x} y={y} tipo="matrimoniale" win={[160, 206]} />}
      {tipo === "suite" && (
        <>
          <Stanza x={x} y={y} tipo="soggiorno" win={[8, 54]} />
          <Stanza x={x + CW} y={y} tipo="camera" win={[160, 206]} />
        </>
      )}
      {tipo === "family" && (
        <>
          <Stanza x={x} y={y} tipo="matrimoniale" comunicaD win={[160, 206]} />
          <Stanza x={x + CW} y={y} tipo="singoli" comunicaS win={[160, 206]} />
        </>
      )}
    </g>
  );
}

export function FloorPlan({ tipo, tono = "giorno", decorativo = true, titolo, className, arco = false, etichetta = true }: FloorPlanProps) {
  const riga = TOP + CH + MARG; // altezza di una pianta con etichetta
  const larga = 2 * CW + 2 * MARG;
  const d: Disegno =
    tipo === "classic"
      ? { w: CW + 2 * MARG, h: riga + MARG, corpo: <Piano tipo="classic" y0={0} etichetta={etichetta} /> }
      : tipo === "confronto"
        ? {
            w: larga,
            h: 3 * riga + MARG,
            corpo: (
              <>
                <Piano tipo="classic" y0={0} etichetta={etichetta} />
                <Piano tipo="suite" y0={riga} etichetta={etichetta} />
                <Piano tipo="family" y0={2 * riga} etichetta={etichetta} />
              </>
            ),
          }
        : { w: larga, h: riga + MARG, corpo: <Piano tipo={tipo} y0={0} etichetta={etichetta} /> };
  return (
    <ArtSvg w={d.w} h={d.h} tono={tono} tavolozze={T} alt={ALT[tipo]} decorativo={decorativo} titolo={titolo} className={className} arco={arco} fit="meet">
      {() => (
        <>
          <rect width={d.w} height={d.h} fill="var(--Z)" />
          {d.corpo}
        </>
      )}
    </ArtSvg>
  );
}

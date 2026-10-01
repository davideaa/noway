/**
 * Le sette piccole illustrazioni dei fatti «Perché sceglierci» (UX 4.3 scena 2, facts.ts).
 * Stesso linguaggio dei poster: forme piatte, arco come cornice, un solo punto di luce miele.
 * Soggetti da `alt` di facts.ts: tram verso la metro, porte di camere in un corridoio, edificio
 * a due piani, auto in un parcheggio, segnale Wi-Fi, ingresso senza gradini, tavolo di famiglia.
 * Nessun dato è inventato: sono simboli, non rappresentazioni di cose misurate.
 */
import type { Fact } from "@/content/facts";
import { facts } from "@/content/facts";
import { ArtSvg, Alone, type ArtProps, type Tavolozze } from "./base";

export type FactIconProps = ArtProps & { id: Fact["id"] };

/* c luce chiara (soffitto, facciata) · a arco · b suolo · p soggetto · P soggetto scuro · q soggetto chiaro · s carta · S sabbia · w legno · W legno scuro
 * h miele · i inchiostro · g vetro · r asfalto · H luce */
const T: Tavolozze = {
  giorno: {
    a: "var(--sabbia-200)", b: "var(--sabbia-300)", p: "var(--pianta-800)", P: "var(--pianta-900)", q: "var(--pianta-300)", s: "var(--sabbia-50)",
    S: "var(--sabbia-300)", w: "var(--rovere-500)", W: "var(--rovere-700)", h: "var(--miele-500)", i: "var(--inchiostro-900)", g: "var(--pianta-100)", r: "var(--cemento-300)", H: "var(--miele-300)", c: "var(--sabbia-50)",
  },
  sera: {
    a: "var(--sera-900)", b: "var(--sera-950)", p: "var(--pianta-600)", P: "var(--pianta-800)", q: "var(--pianta-300)", s: "var(--sera-50)",
    S: "var(--sera-500)", w: "var(--rovere-500)", W: "var(--rovere-700)", h: "var(--miele-glow)", i: "var(--sera-950)", g: "var(--pianta-900)", r: "var(--sera-500)", H: "var(--miele-300)", c: "var(--sera-200)",
  },
};

/** Finestra ad arco: rettangolo + semicerchio. */
const finArco = (x: number, y: number, w: number, h: number) => `M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}Z`;

function Tram() {
  return (
    <>
      <path d="M10 60H190" stroke="var(--i)" strokeWidth={1.5} />
      <path d="M12 158H188" stroke="var(--i)" strokeWidth={3} />
      <path className="p" d="M28 100a12 12 0 0112-12h72a12 12 0 0112 12v38H28z" />
      <path className="P" d="M28 128h96v10H28z" />
      {[38, 62, 86].map((x) => <path key={x} className="g" d={`M${x} 98h16v18H${x}z`} />)}
      <path className="g" d="M108 98h12a4 4 0 014 4v14h-16z" />
      <path d="M78 88V72l12-12" stroke="var(--i)" strokeWidth={2.5} fill="none" />
      <circle className="h" cx={118} cy={130} r={3} />
      {[50, 106].map((x) => (
        <g key={x}>
          <circle className="i" cx={x} cy={146} r={9} />
          <circle className="s" cx={x} cy={146} r={3} />
        </g>
      ))}
    </>
  );
}

function Metro({ id }: { id: string }) {
  return (
    <>
      <Alone id={id} cx={160} cy={96} r={44} op={0.8} />
      <rect className="i" x={158} y={110} width={4} height={48} />
      <circle className="i" cx={160} cy={92} r={22} />
      <path d="M150 102V82l10 12 10-12v20" stroke="var(--s)" strokeWidth={4} fill="none" />
    </>
  );
}

function Corridoio({ id }: { id: string }) {
  // corridoio in prospettiva: lato sinistro e destro con tre porte ciascuno
  const porte = (lato: 1 | -1) =>
    [0.1, 0.38, 0.62].map((t) => {
      const x = (tt: number) => (lato > 0 ? 20 + 58 * tt : 180 - 58 * tt);
      const top = (tt: number) => 24 + 42 * tt;
      const bot = (tt: number) => 176 - 64 * tt;
      const t2 = t + 0.14;
      const h = (tt: number) => bot(tt) - (bot(tt) - top(tt)) * 0.78;
      return (
        <g key={lato + "" + t}>
          <path className="w" d={`M${x(t)} ${bot(t)}V${h(t)}L${x(t2)} ${h(t2)}V${bot(t2)}Z`} />
          <circle className="W" cx={x(t2) - lato * 3} cy={(h(t2) + bot(t2)) / 2 + 2} r={1.6} />
          <circle className="h" cx={x(t + 0.3) } cy={top(t + 0.3) + (bot(t + 0.3) - top(t + 0.3)) * 0.2} r={3.2} />
        </g>
      );
    });
  return (
    <>
      <path className="c" d="M20 24h160l-58 42H78z" />
      <path className="S" d="M20 24l58 42v46l-58 64z" />
      <path className="b" d="M180 24l-58 42v46l58 64z" opacity={0.75} />
      <path className="b" d="M20 176h160l-58-64H78z" />
      <path className="w" d="M92 78h16v34H92z" />
      <Alone id={id} cx={100} cy={96} r={34} op={0.9} />
      {porte(1)}
      {porte(-1)}
    </>
  );
}

function Edificio() {
  return (
    <>
      <path className="p" d="M34 50h132v12H34z" />
      <path className="c" d="M42 62h116v94H42z" />
      <path className="S" d="M42 108h116v6H42z" />
      <path className="b" d="M48 156h104v8H48z" />
      {[52, 76, 100, 124].map((x) => <path key={x} className="g" d={finArco(x, 70, 20, 32)} />)}
      {[52, 124].map((x) => <path key={x} className="g" d={finArco(x, 122, 20, 34)} />)}
      <path className="w" d={finArco(87, 120, 26, 36)} />
      <path className="W" d="M100 134v22" stroke="var(--W)" strokeWidth={1.5} />
    </>
  );
}

function Parcheggio() {
  return (
    <>
      <rect className="r" x={10} y={122} width={180} height={38} />
      {[44, 104, 160].map((x) => <rect key={x} className="s" x={x} y={122} width={3} height={38} />)}
      <path className="p" d="M44 140v-10a10 10 0 0110-10h72a10 10 0 0110 10v10z" />
      <path className="p" d="M64 122l12-20h38l16 20z" />
      <path className="g" d="M72 120l9-14h12v14zM100 120v-14h12l11 14z" />
      <circle className="h" cx={136} cy={132} r={3} />
      {[66, 124].map((x) => (
        <g key={x}>
          <circle className="i" cx={x} cy={142} r={9} />
          <circle className="s" cx={x} cy={142} r={3} />
        </g>
      ))}
      <rect className="i" x={172} y={70} width={4} height={54} />
      <rect className="P" x={158} y={50} width={32} height={32} rx={6} />
      <path d="M168 74V58h8a5 5 0 010 10h-8" stroke="var(--s)" strokeWidth={4} fill="none" />
    </>
  );
}

function Wifi({ id }: { id: string }) {
  const arco = (r: number) => `M${100 - r * 0.707} ${140 - r * 0.707}A${r} ${r} 0 0 1 ${100 + r * 0.707} ${140 - r * 0.707}`;
  return (
    <>
      <Alone id={id} cx={100} cy={110} r={80} op={0.8} />
      {[26, 50, 74].map((r) => <path key={r} d={arco(r)} stroke="var(--p)" strokeWidth={10} strokeLinecap="round" fill="none" />)}
      <circle className="h" cx={100} cy={140} r={9} />
      <path className="b" d="M60 164h80v6H60z" />
    </>
  );
}

function Ingresso() {
  return (
    <>
      <path className="P" d="M52 52h96v108H52z" />
      <path className="H" d="M60 60h80v100H60z" />
      <path className="g" d="M60 60h34v100H60z" opacity={0.85} />
      <path className="g" d="M106 60h34v100h-34z" opacity={0.85} />
      <path className="s" d="M94 60h12v100H94z" opacity={0.35} />
      <path className="b" d="M10 160h180v10H10z" />
      <circle className="P" cx={162} cy={52} r={17} />
      <circle className="s" cx={162} cy={44} r={2.8} />
      <path d="M162 49v8h7l3.5 7M156 53a8 8 0 1010 10" stroke="var(--s)" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Tavolo({ id }: { id: string }) {
  const sedia = (x: number, y: number) => (
    <g key={x + "-" + y}>
      <rect className="p" x={x} y={y} width={18} height={26} rx={4} />
      <rect className="P" x={x - 1} y={y + 26} width={20} height={6} rx={2} />
      <path d={`M${x + 3} ${y + 32}v14M${x + 15} ${y + 32}v14`} stroke="var(--P)" strokeWidth={2.5} />
    </g>
  );
  return (
    <>
      <Alone id={id} cx={100} cy={84} r={76} op={1} />
      <path d="M100 18V54" stroke="var(--i)" strokeWidth={1.5} />
      <path className="h" d="M84 54h32l12 22H72z" />
      {sedia(32, 96)}
      {sedia(150, 96)}
      <rect className="W" x={96} y={126} width={8} height={30} />
      <ellipse className="W" cx={100} cy={158} rx={22} ry={5} />
      <ellipse className="W" cx={100} cy={124} rx={54} ry={12} />
      <ellipse className="w" cx={100} cy={120} rx={54} ry={12} />
      <ellipse className="s" cx={70} cy={120} rx={11} ry={3.5} />
      <ellipse className="s" cx={130} cy={120} rx={11} ry={3.5} />
      <rect className="q" x={95} y={100} width={10} height={16} rx={3} />
      <circle className="h" cx={95} cy={96} r={4.5} />
      <circle className="s" cx={105} cy={95} r={4} />
      {sedia(56, 128)}
      {sedia(126, 128)}
    </>
  );
}

const SOGGETTI = {
  "vicino-milano": (id: string) => (
    <>
      <Tram />
      <Metro id={id} />
    </>
  ),
  camere: (id: string) => <Corridoio id={id} />,
  congressi: () => <Edificio />,
  parcheggio: () => <Parcheggio />,
  wifi: (id: string) => <Wifi id={id} />,
  accessibile: () => <Ingresso />,
  famiglia: (id: string) => <Tavolo id={id} />,
} as const;

export function FactIcon({ id, tono = "giorno", decorativo = true, titolo, className }: FactIconProps) {
  const alt = facts.find((f) => f.id === id)?.alt ?? "";
  return (
    <ArtSvg w={200} h={200} tono={tono} tavolozze={T} alt={alt} decorativo={decorativo} titolo={titolo} className={className}>
      {(uid) => (
        <>
          <path className="a" d="M8 200V100a92 92 0 01184 0v100z" />
          {id !== "vicino-milano" && id !== "accessibile" && <path className="b" d="M8 168h184v32H8z" opacity={id === "parcheggio" ? 0 : 1} />}
          {SOGGETTI[id](uid)}
        </>
      )}
    </ArtSvg>
  );
}

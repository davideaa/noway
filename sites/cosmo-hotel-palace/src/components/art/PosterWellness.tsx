/**
 * Il sesto piano: Wellness & Fitness (BRIEF; DECISIONI 3 — questa è l'illustrazione ufficiale,
 * isometrica, non un 3D). Ritratta ciò che il BRIEF dichiara: sauna finlandese, bagno turco,
 * sala attrezzi con 2 tapis roulant, cyclette, chest press, pulldown, leg extension.
 * Le misure della pianta e la disposizione sono stilizzate: non sono dati del cliente.
 * Taglio da casa di bambola: i tramezzi sono bassi per far vedere l'interno.
 */
import { ArtSvg, Alone, type ArtProps, type Tavolozze } from "./base";
import { kit, iso, type Mat } from "./proj";

const ALT =
  "Illustrazione isometrica del sesto piano dell'hotel: a sinistra la sauna finlandese in legno e il bagno turco con il vapore, davanti la sala attrezzi con due tapis roulant, una cyclette, chest press, pulldown e leg extension; finestre ad arco.";

/* Z sfondo · a/b solaio · f pavimento · F gomma palestra · w/x pareti · c/e bordi · o p q legno chiaro
 * t u v pietra/piastrelle · l m n acciaio · i j k sedute verdi · b nero cinghia · g vetro · s vapore
 * h luce · y specchio · L foglia · S ombra */
const T: Tavolozze = {
  giorno: {
    Z: "var(--sabbia-100)", a: "var(--cemento-300)", b: "var(--inchiostro-900)", f: "var(--sabbia-100)", F: "var(--sabbia-300)", w: "var(--sabbia-200)", x: "var(--sabbia-300)",
    c: "var(--sabbia-50)", e: "var(--sabbia-100)", o: "var(--rovere-300)", p: "var(--rovere-500)", q: "var(--rovere-700)",
    t: "var(--sabbia-100)", u: "var(--sabbia-200)", v: "var(--sabbia-300)", l: "var(--cemento-300)", m: "var(--cemento-500)", n: "var(--inchiostro-700)",
    i: "var(--pianta-600)", j: "var(--pianta-800)", k: "var(--pianta-900)", g: "var(--pianta-100)", s: "var(--sabbia-50)", h: "var(--miele-400)",
    y: "var(--pianta-100)", L: "var(--pianta-600)", S: "var(--ulivo-800)", d: "var(--cemento-500)",
  },
  sera: {
    Z: "var(--sera-950)", a: "var(--sera-900)", b: "var(--sera-950)", f: "var(--sera-900)", F: "var(--inchiostro-700)", w: "var(--sera-900)", x: "var(--sera-950)",
    c: "var(--sera-500)", e: "var(--sera-900)", o: "var(--rovere-500)", p: "var(--rovere-700)", q: "var(--ulivo-800)",
    t: "var(--sabbia-400)", u: "var(--inchiostro-500)", v: "var(--inchiostro-700)", l: "var(--sera-500)", m: "var(--inchiostro-700)", n: "var(--sera-200)",
    i: "var(--pianta-600)", j: "var(--pianta-800)", k: "var(--pianta-900)", g: "var(--pianta-900)", s: "var(--sera-200)", h: "var(--miele-glow)",
    y: "var(--inchiostro-700)", L: "var(--pianta-800)", S: "var(--sera-950)", d: "var(--sera-500)",
  },
};

const LX = 13;
const LY = 8;
const H = 3.4;
const CB = 3.4; // lato di una cabina
const LEGNO: Mat = ["o", "p", "q"];
const PIETRA: Mat = ["t", "u", "v"];
const ACC: Mat = ["l", "m", "n"];
const SEDUTA: Mat = ["i", "j", "k"];
const NERO: Mat = ["n", "b", "b"];
const MURO: Mat = ["c", "w", "e"];

export function PosterWellness({ tono = "giorno", decorativo = true, titolo, className, arco = false }: ArtProps) {
  const sera = tono === "sera";
  const W = 800;
  const Hh = 560;
  const P = iso(35, 322, 160);
  const K = kit(P);
  const { box, quad, wy, wx, line } = K;
  const arc = (x0: number, x1: number, z0: number, zs: number) => {
    const r = (x1 - x0) / 2;
    const pts: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (Math.PI * i) / 10;
      pts.push(P(x0 + r + r * Math.cos(a), 0, zs + r * Math.sin(a)).map(Math.round).join(" "));
    }
    return `M${P(x0, 0, z0).map(Math.round).join(" ")}L${pts.join("L")}L${P(x1, 0, z0).map(Math.round).join(" ")}Z`;
  };
  const tapis = (x: number) => (
    <>
      {box(NERO, x, 0.5, 0.1, 0.95, 2.2, 0.16)}
      {box(ACC, x - 0.06, 0.55, 0.3, 0.08, 0.1, 1.0)}
      {box(ACC, x + 0.93, 0.55, 0.3, 0.08, 0.1, 1.0)}
      {line("var(--n)", 3, [x - 0.02, 0.62, 1.05], [x - 0.02, 1.9, 1.05])}
      {line("var(--n)", 3, [x + 0.97, 0.62, 1.05], [x + 0.97, 1.9, 1.05])}
      {box(["n", "m", "b"], x - 0.02, 0.5, 1.25, 1.04, 0.24, 0.38)}
      {quad("h", [x + 0.12, 0.76, 1.36], [x + 0.9, 0.76, 1.36], [x + 0.9, 0.76, 1.55], [x + 0.12, 0.76, 1.55])}
    </>
  );
  const vetro = (c: string, ...p: [number, number, number][]) => <g opacity={0.32}>{quad(c, ...p)}</g>;
  return (
    <ArtSvg w={W} h={Hh} tono={tono} tavolozze={T} alt={ALT} decorativo={decorativo} titolo={titolo} className={className} arco={arco}>
      {(id) => {
        const sol = P(1.8, 1.4, 1.3);
        const tur = P(5.4, 1.4, 1.5);
        const tx = CB + 0.25; // inizio del bagno turco
        return (
          <>
            <rect width={W} height={Hh} fill="var(--Z)" />
            <Alone id={id} cx={W / 2} cy={260} r={340} op={sera ? 0.25 : 0.55} />
            {/* solaio e pavimenti */}
            {box(["f", "a", "d"], -0.15, -0.15, -0.35, LX + 0.15, LY + 0.15, 0.35)}
            {quad("F", [0.4, CB + 0.6, 0], [LX - 0.4, CB + 0.6, 0], [LX - 0.4, LY - 0.4, 0], [0.4, LY - 0.4, 0])}
            {quad("F", [2 * CB + 0.8, 0.2, 0], [LX - 0.4, 0.2, 0], [LX - 0.4, CB + 0.6, 0], [2 * CB + 0.8, CB + 0.6, 0])}
            {quad("p", [0, 0, 0.01], [CB, 0, 0.01], [CB, CB, 0.01], [0, CB, 0.01])}
            {quad("u", [tx, 0, 0.01], [tx + CB, 0, 0.01], [tx + CB, CB, 0.01], [tx, CB, 0.01])}
            {/* pareti: fondo (y=0) e sinistra (x=0) */}
            {box(MURO, 0, -0.15, 0, LX, 0.15, H)}
            {box(["c", "e", "x"], -0.15, -0.15, 0, 0.15, LY + 0.15, H)}
            {/* sauna: rivestimento in legno a doghe */}
            {wy("o", 0, 0, CB, 0, 2.5)}
            {wx("p", 0, 0, CB, 0, 2.5)}
            {[0.8, 1.6].map((z) => line("var(--q)", 1, [0, 0, z], [CB, 0, z]))}
            {box(LEGNO, 0.05, 0.05, 0, CB - 0.1, 0.55, 0.85)}
            {box(LEGNO, 0.05, 0.6, 0, CB - 0.1, 0.6, 0.42)}
            {box(LEGNO, 0.05, 1.2, 0, 0.5, 1.9, 0.42)}
            {box(["n", "m", "b"], 2.3, 2.4, 0, 0.7, 0.7, 0.55)}
            <ellipse className="h" cx={P(2.65, 2.75, 0.7)[0]} cy={P(2.65, 2.75, 0.7)[1]} rx={13} ry={6} />
            <Alone id={id} cx={sol[0]} cy={sol[1]} r={sera ? 120 : 62} op={sera ? 1 : 0.7} />
            {/* bagno turco: piastrelle chiare, nicchia ad arco, panca in pietra, vapore */}
            {wy("v", 0, tx, tx + CB, 0, 2.5)}
            <path className="t" d={arc(tx + 0.7, tx + CB - 0.7, 0.5, 1.0)} />
            {[0.8, 1.6].map((z) => line("var(--u)", 1, [tx, 0, z], [tx + CB, 0, z]))}
            {box(PIETRA, tx + 0.05, 0.05, 0, CB - 0.1, 0.65, 0.5)}
            {box(PIETRA, tx + CB - 0.55, 0.7, 0, 0.5, 2.2, 0.5)}
            <g className="s" opacity={0.78}>
              <ellipse cx={tur[0] - 26} cy={tur[1] - 6} rx={32} ry={13} />
              <ellipse cx={tur[0] + 16} cy={tur[1] - 32} rx={38} ry={15} />
              <ellipse cx={tur[0] - 8} cy={tur[1] - 64} rx={30} ry={12} />
              <ellipse cx={tur[0] + 40} cy={tur[1] + 2} rx={24} ry={10} />
            </g>
            {/* pareti di vetro delle due cabine (davanti e a destra) */}
            {vetro("g", [0, CB, 0], [CB, CB, 0], [CB, CB, 2.3], [0, CB, 2.3])}
            {vetro("g", [CB, 0, 0], [CB, CB, 0], [CB, CB, 2.3], [CB, 0, 2.3])}
            {vetro("g", [tx, CB, 0], [tx + CB, CB, 0], [tx + CB, CB, 2.3], [tx, CB, 2.3])}
            {vetro("g", [tx + CB, 0, 0], [tx + CB, CB, 0], [tx + CB, CB, 2.3], [tx + CB, 0, 2.3])}
            {line("var(--q)", 3, [0, CB, 0], [0, CB, 2.3], [CB, CB, 2.3], [CB, 0, 2.3])}
            {line("var(--q)", 3, [CB, CB, 0], [CB, CB, 2.3])}
            {line("var(--v)", 3, [tx, CB, 0], [tx, CB, 2.3], [tx + CB, CB, 2.3], [tx + CB, 0, 2.3])}
            {line("var(--v)", 3, [tx + CB, CB, 0], [tx + CB, CB, 2.3])}
            {line("var(--m)", 3, [1.9, CB, 0.9], [1.9, CB, 1.5])}
            {line("var(--m)", 3, [tx + 1.9, CB, 0.9], [tx + 1.9, CB, 1.5])}
            {/* finestre ad arco della sala attrezzi */}
            {[7.1, 9.6].map((x) => (
              <g key={x}>
                <path className="c" d={arc(x - 0.1, x + 2.1, 0.3, 1.9)} />
                <path className="g" d={arc(x, x + 2.0, 0.4, 1.9)} />
                {line("var(--c)", 2, [x + 1.0, 0, 0.4], [x + 1.0, 0, 2.9])}
              </g>
            ))}
            {/* specchio sul muro di sinistra */}
            {wx("m", 0, CB + 0.9, LY - 0.5, 0.4, 2.6)}
            {wx("y", 0, CB + 1.0, LY - 0.6, 0.5, 2.5)}
                        {/* due tapis roulant e cyclette, contro la finestra */}
            {tapis(7.5)}
            {tapis(9.2)}
            <g>
              {box(NERO, 11.2, 0.9, 0.0, 1.3, 0.45, 0.1)}
              {box(["n", "m", "b"], 11.55, 1.0, 0.1, 0.14, 0.25, 0.85)}
              {box(SEDUTA, 11.15, 0.9, 0.95, 0.6, 0.45, 0.14)}
              {box(["n", "m", "b"], 12.35, 1.0, 0.1, 0.14, 0.25, 1.25)}
              {box(["n", "m", "b"], 12.1, 0.9, 1.3, 0.7, 0.45, 0.12)}
              <path className="m" d={"M" + Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return P(12.0 + 0.5 * Math.cos(a), 1.4, 0.65 + 0.5 * Math.sin(a)).map(Math.round).join(" ");
              }).join("L") + "Z"} />
            </g>
            {/* macchine: leg extension, pulldown, chest press */}
            <g>
              {box(["n", "m", "b"], 1.2, 5.4, 0, 0.6, 0.6, 1.2)}
              {box(SEDUTA, 1.8, 5.5, 0.4, 0.9, 0.8, 0.16)}
              {box(SEDUTA, 2.5, 5.5, 0.5, 0.18, 0.8, 0.9)}
              {line("var(--n)", 5, [1.8, 5.8, 0.35], [1.3, 5.8, 0.35])}
              {box(ACC, 1.0, 5.4, 0.2, 0.3, 0.5, 0.2)}
            </g>
            <g>
              {box(ACC, 4.3, 5.2, 0, 0.14, 0.14, 2.7)}
              {box(ACC, 5.6, 5.2, 0, 0.14, 0.14, 2.7)}
              {box(ACC, 4.3, 5.2, 2.6, 1.44, 0.14, 0.1)}
              {box(SEDUTA, 4.75, 6.0, 0.4, 0.7, 0.7, 0.16)}
              {box(["n", "m", "b"], 4.3, 5.2, 0, 1.44, 0.4, 0.4)}
              {line("var(--n)", 5, [4.5, 5.5, 2.5], [5.7, 5.5, 2.5])}
            </g>
            <g>
              {box(["n", "m", "b"], 7.4, 5.6, 0, 0.6, 0.55, 1.7)}
              {box(SEDUTA, 8.2, 6.2, 0.4, 0.8, 0.8, 0.16)}
              {box(SEDUTA, 8.2, 7.0, 0.5, 0.8, 0.16, 1.0)}
              {line("var(--n)", 5, [8.1, 6.9, 1.4], [7.8, 6.6, 1.4], [7.8, 6.1, 1.4])}
              {line("var(--n)", 5, [9.1, 6.9, 1.4], [9.4, 6.6, 1.4], [9.4, 6.1, 1.4])}
            </g>
            {/* pianta in vaso */}
            {box(["q", "p", "n"], 11.4, 6.2, 0, 0.55, 0.55, 0.5)}
            <path className="L" d={`M${P(11.67, 6.47, 0.55)[0]} ${P(11.67, 6.47, 0.55)[1]}c-30-6-48-46-34-76c16 14 30 36 34 76zM${P(11.67, 6.47, 0.55)[0]} ${P(11.67, 6.47, 0.55)[1]}c30-6 48-46 34-76c-16 14-30 36-34 76zM${P(11.67, 6.47, 0.55)[0]} ${P(11.67, 6.47, 0.55)[1]}c-10-30-8-64 0-88c8 24 10 58 0 88z`} />
          </>
        );
      }}
    </ArtSvg>
  );
}

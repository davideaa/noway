/**
 * Poster della hall (DESIGN 1, 6; UX 4.3 scena 1; DECISIONI 10). Ritratta ciò che il BRIEF e la
 * foto di riferimento mostrano: grande lucernario sul soffitto, scultura di tronco d'ulivo,
 * vetrate, tende bianche, cemento lisciato, ficus in vaso. Le due finestre ad arco sono il
 * segno del sito. Stilizzata: nessun dettaglio è un dato (le misure della hall non sono note).
 * Vista frontale dall'interno, come il punto di vista iniziale del diorama.
 */
import { ArtSvg, Alone, type ArtProps, type Tavolozze } from "./base";
import { kit, persp } from "./proj";

const ALT =
  "Illustrazione della hall del Cosmo Hotel Palace: un grande lucernario sopra una scultura in tronco d'ulivo, due vetrate ad arco con tende bianche, un ficus in vaso e l'ingresso a vetri.";

/* Z sfondo · w parete · x parete laterale · c soffitto · f pavimento · F luce a terra · g vetro
 * G telaio · s tenda · p ingresso · o tronco · O ombra tronco · q luce tronco · Q riflesso
 * L foglia · M foglia chiara · v vaso · h luce · d condotta */
const T: Tavolozze = {
  giorno: {
    Z: "var(--sabbia-100)", w: "var(--sabbia-100)", x: "var(--sabbia-200)", c: "var(--sabbia-200)", f: "var(--cemento-100)",
    F: "var(--sabbia-50)", g: "var(--pianta-100)", G: "var(--inchiostro-700)", s: "var(--sabbia-50)", p: "var(--sabbia-50)",
    o: "var(--ulivo-600)", O: "var(--ulivo-800)", q: "var(--rovere-500)", Q: "var(--rovere-300)",
    L: "var(--pianta-600)", M: "var(--pianta-300)", v: "var(--rovere-700)", h: "var(--miele-300)", d: "var(--cemento-300)", e: "var(--cemento-500)",
  },
  sera: {
    Z: "var(--sera-950)", w: "var(--sera-900)", x: "var(--sera-950)", c: "var(--sera-950)", f: "var(--sera-900)",
    F: "var(--miele-glow)", g: "var(--pianta-900)", G: "var(--sera-500)", s: "var(--sera-200)", p: "var(--sera-900)",
    o: "var(--ulivo-800)", O: "var(--sera-950)", q: "var(--ulivo-600)", Q: "var(--rovere-500)",
    L: "var(--pianta-800)", M: "var(--pianta-600)", v: "var(--inchiostro-700)", h: "var(--miele-glow)", d: "var(--sera-500)", e: "var(--sera-900)",
  },
};

/** Curva liscia (Catmull-Rom → Bézier) attraverso i punti. */
function liscia(p: number[][], chiusa = true) {
  const n = p.length;
  const g = (i: number) => p[chiusa ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < (chiusa ? n : n - 1); i++) {
    const [a, b, c, e] = [g(i - 1), g(i), g(i + 1), g(i + 2)];
    d += `C${Math.round(b[0] + (c[0] - a[0]) / 6)} ${Math.round(b[1] + (c[1] - a[1]) / 6)} ${Math.round(c[0] - (e[0] - b[0]) / 6)} ${Math.round(c[1] - (e[1] - b[1]) / 6)} ${c[0]} ${c[1]}`;
  }
  return d + (chiusa ? "Z" : "");
}

/** Il tronco d'ulivo: coordinate locali 0-220 × 0-390, base in basso al centro. */
function Tronco() {
  const sagoma = [[4, 380], [40, 360], [58, 326], [64, 282], [58, 236], [44, 196], [22, 150], [0, 112], [-20, 72], [-18, 30], [2, 16], [20, 44], [40, 86], [62, 134], [84, 160], [100, 132], [96, 90], [102, 40], [122, 8], [142, 14], [146, 46], [134, 86], [130, 128], [138, 170], [150, 214], [160, 262], [172, 306], [196, 340], [218, 362], [210, 384], [110, 392]];
  return (
    <>
      <path className="O" opacity={0.25} d="M-20 394C50 380 160 384 260 398C190 412 60 414 -20 394Z" />
      <path className="o" d={liscia(sagoma)} />
      {/* lato in ombra: a destra di ogni ramo */}
      <path className="O" opacity={0.55} d={liscia([[100, 132], [104, 90], [110, 46], [124, 12], [142, 16], [146, 46], [134, 86], [130, 128], [138, 170], [150, 214], [160, 262], [172, 306], [196, 340], [218, 362], [210, 384], [170, 382], [150, 340], [134, 290], [122, 230], [112, 180]])} />
      <path className="O" opacity={0.5} d={liscia([[6, 100], [14, 140], [32, 178], [52, 214], [60, 262], [56, 310], [44, 346], [58, 326], [64, 282], [58, 236], [44, 196], [22, 150]])} />
      {/* lato in luce */}
      <path className="q" d={liscia([[-14, 40], [2, 20], [16, 44], [14, 74], [18, 108], [34, 144], [50, 190], [58, 240], [52, 290], [40, 334], [18, 370], [30, 330], [36, 280], [34, 232], [20, 180], [10, 120]])} />
      <path className="Q" opacity={0.85} d={liscia([[-10, 40], [2, 26], [12, 48], [8, 80], [24, 124], [36, 170]], false)} strokeWidth={0} />
      <path className="q" d={liscia([[104, 40], [122, 12], [132, 22], [120, 64], [112, 110], [92, 140], [98, 98]])} />
      <path className="Q" opacity={0.8} d={liscia([[108, 34], [122, 16], [124, 30], [112, 70]])} />
      <path className="q" opacity={0.9} d={liscia([[136, 120], [136, 170], [146, 212], [156, 258], [152, 300], [142, 250], [134, 200], [128, 150]])} />
      {/* cavità e nodi */}
      <path className="O" d={liscia([[78, 200], [92, 184], [102, 206], [98, 252], [86, 268], [76, 236]])} />
      <path className="O" d={liscia([[104, 322], [124, 312], [136, 336], [122, 356], [104, 348]])} />
      <path className="O" d={liscia([[54, 358], [72, 344], [82, 362], [68, 376]])} />
      <path className="O" d={liscia([[80, 96], [90, 82], [94, 108], [86, 132]])} />
      <path className="O" d={liscia([[176, 344], [190, 340], [198, 354], [184, 362]])} />
      {/* venature */}
      <path d="M84 168C92 190 84 230 92 262C98 290 96 310 104 330M112 54C118 90 112 120 124 160M160 282C168 310 186 330 200 350M60 150C44 190 54 214 50 250" fill="none" stroke="var(--O)" strokeWidth={2.5} opacity={0.55} />
      <path d="M72 250C70 290 76 320 86 356M146 200C152 240 158 262 166 290" fill="none" stroke="var(--Q)" strokeWidth={2} opacity={0.6} />
    </>
  );
}

function Ficus() {
  return (
    <>
      <path className="O" opacity={0.25} d="M-30 150C20 140 80 140 130 152C80 166 20 166 -30 150Z" />
      <path d="M50 -10C46 40 52 90 56 130" fill="none" stroke="var(--O)" strokeWidth={7} />
      <path className="v" d="M18 112h76l-8 46H26Z" />
      <g className="L">
        <circle cx={50} cy={-70} r={46} />
        <circle cx={6} cy={-34} r={34} />
        <circle cx={96} cy={-38} r={36} />
        <circle cx={44} cy={4} r={34} />
      </g>
      <g className="M">
        <circle cx={34} cy={-84} r={22} />
        <circle cx={80} cy={-62} r={18} />
        <circle cx={-2} cy={-50} r={16} />
      </g>
    </>
  );
}

export function PosterHall({ tono = "giorno", decorativo = true, titolo, className, arco = false }: ArtProps) {
  const sera = tono === "sera";
  const W = 640;
  const H = 800;
  const P = persp([9, 0, 5], 90, 3, 13, 34, 320, 360);
  const K = kit(P);
  const { quad, wy, line, box } = K;
  const HH = 8.6; // altezza del soffitto
  const arc = (x0: number, x1: number, z0: number, zs: number) => {
    // finestra ad arco sulla parete di fondo: rettangolo fino a `zs`, poi semicerchio
    const r = (x1 - x0) / 2;
    const pts: number[][] = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (Math.PI * i) / 10;
      pts.push([...P(x0 + r + r * Math.cos(a), 0, zs + r * Math.sin(a))].map(Math.round));
    }
    const [bl, br] = [P(x0, 0, z0), P(x1, 0, z0)].map((q) => q.map(Math.round));
    return `M${bl[0]} ${bl[1]}L${pts.map((q) => q.join(" ")).join("L")}L${br[0]} ${br[1]}Z`;
  };
  return (
    <ArtSvg w={W} h={H} tono={tono} tavolozze={T} alt={ALT} decorativo={decorativo} titolo={titolo} className={className} arco={arco}>
      {(id) => {
        const lc = P(12, 3, HH);
        const base = P(8.2, 7, 0);
        const sc = P(9.2, 7, 0)[0] - P(8.2, 7, 0)[0]; // pixel per metro a quella profondità
        const fic = P(12.6, 6.4, 0);
        const sf = P(13.6, 6.4, 0)[0] - P(12.6, 6.4, 0)[0];
        return (
          <>
            <rect width={W} height={H} fill="var(--Z)" />
            {/* pareti e soffitto */}
            {quad("c", [0, 0, HH], [18, 0, HH], [18, 12, HH], [0, 12, HH])}
            {quad("x", [0, 0, 0], [0, 12, 0], [0, 12, HH], [0, 0, HH])}
            {quad("x", [18, 0, 0], [18, 12, 0], [18, 12, HH], [18, 0, HH])}
            {wy("w", 0, 0, 18, 0, HH)}
            {quad("f", [0, 0, 0], [18, 0, 0], [18, 12, 0], [0, 12, 0])}
            {/* condotte a vista sul soffitto */}
            {quad("d", [2.4, 0, HH], [3.2, 0, HH], [3.2, 12, HH], [2.4, 12, HH])}
            {quad("e", [2.9, 0, HH], [3.2, 0, HH], [3.2, 12, HH], [2.9, 12, HH])}
            
            {/* lucernario: vetro con telaio a quadri */}
            {quad("g", [9.4, 1.5, HH], [14.8, 1.5, HH], [14.8, 8, HH], [9.4, 8, HH])}
            {[11.2, 13].map((x) => line("var(--G)", 2, [x, 1.5, HH], [x, 8, HH]))}
            {[3.6, 5.8].map((y) => line("var(--G)", 2, [9.4, y, HH], [14.8, y, HH]))}
            {line("var(--G)", 3.5, [9.4, 1.5, HH], [14.8, 1.5, HH], [14.8, 8, HH], [9.4, 8, HH], [9.4, 1.5, HH])}
            <Alone id={id} cx={lc[0]} cy={lc[1] + 80} r={230} op={sera ? 0.3 : 0.75} />
            {/* due finestre ad arco con tende bianche */}
            {[1.6, 5.3].map((x) => (
              <g key={x}>
                <path className="G" d={arc(x - 0.14, x + 3.14, 0, 6.0)} />
                <path className="g" d={arc(x, x + 3, 0.15, 6.0)} />
                {wy("s", 0, x - 0.05, x + 0.55, 0.1, 6.2)}
                {wy("s", 0, x + 2.45, x + 3.05, 0.1, 6.2)}
                {[0.2, 0.4].map((d) => line("var(--c)", 1.5, [x + d, 0, 0.2], [x + d, 0, 6.1]))}
                {[2.6, 2.8].map((d) => line("var(--c)", 1.5, [x + d, 0, 0.2], [x + d, 0, 6.1]))}
              </g>
            ))}
            {/* vetrata alta sopra l'ingresso e ingresso a vetri */}
            {wy("G", 0, 10.8, 17.4, 3.7, 8.2)}
            {wy("g", 0, 10.9, 17.3, 3.8, 8.1)}
            {[12.5, 14.1, 15.7].map((x) => line("var(--G)", 2, [x, 0, 3.8], [x, 0, 8.1]))}
            {[5.2, 6.6].map((z) => line("var(--G)", 2, [10.9, 0, z], [17.3, 0, z]))}
            {box(["p", "p", "e"], 10.4, 0, 0, 6.6, 2.6, 3.4)}
            {quad("G", [10.4, 2.6, 0.05], [17, 2.6, 0.05], [17, 2.6, 3.0], [10.4, 2.6, 3.0])}
            {quad("g", [10.6, 2.6, 0.15], [16.8, 2.6, 0.15], [16.8, 2.6, 2.9], [10.6, 2.6, 2.9])}
            {[12.2, 13.7, 15.2].map((x) => line("var(--G)", 2.5, [x, 2.6, 0.1], [x, 2.6, 3]))}
            {sera && <g opacity={0.7}>{quad("h", [10.6, 2.6, 0.15], [16.8, 2.6, 0.15], [16.8, 2.6, 2.9], [10.6, 2.6, 2.9])}</g>}
            {sera && [12.2, 13.7, 15.2].map((x) => line("var(--G)", 2.5, [x, 2.6, 0.1], [x, 2.6, 3]))}
            {/* luce del lucernario a terra */}
            <g className="F" opacity={sera ? 0.1 : 0.4}>
              {quad("F", [8.2, 4.6, 0], [10.6, 4.6, 0], [12.9, 9.5, 0], [10.4, 9.5, 0])}
              {quad("F", [11.4, 3.2, 0], [13.4, 3.2, 0], [15.4, 8, 0], [13.4, 8, 0])}
            </g>
            {/* tronco d'ulivo */}
            <g transform={`translate(${Math.round(base[0] - 110 * (sc / 63))} ${Math.round(base[1] - 386 * (sc / 63))}) scale(${(sc / 63).toFixed(3)})`}>
              <Tronco />
            </g>
            <g transform={`translate(${Math.round(fic[0] - 56 * (sf / 78))} ${Math.round(fic[1] - 150 * (sf / 78))}) scale(${(sf / 78).toFixed(3)})`}>
              <Ficus />
            </g>
          </>
        );
      }}
    </ArtSvg>
  );
}

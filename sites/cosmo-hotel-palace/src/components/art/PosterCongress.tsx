/**
 * Poster del Centro Congressi (BRIEF «Centro Congressi», UX 4.3 scena 7 e 7.2, DESIGN 6).
 * La Plenaria delle Costellazioni dal fondo: 25 × 20 m, h 4,22 m (misure del BRIEF; i numeri
 * delle sedie NON sono dati: le file sono uno schema), colonne color travertino, soffitto a
 * gesso con velette luminose, finestre ad arco con veli, moquette, sedie in file con corridoi.
 * Vista frontale dall'ultima fila verso il palco.
 */
import { ArtSvg, Alone, type ArtProps, type Tavolozze } from "./base";
import { kit, persp } from "./proj";

const ALT =
  "Illustrazione della sala plenaria del Centro Congressi vista dal fondo: file di sedie con corridoi verso il palco, colonne color travertino, soffitto a gesso con luci a veletta e finestre ad arco con veli.";

/* Z sfondo · w parete · x parete laterale · c soffitto · C soffitto ribassato · l luce a veletta · f moquette
 * k colonna (3 toni k K j) · g vetro · s velo · P pannello scuro · E schermo · b palco · t sedia · u sedia scura
 * m metallo · L foglia · M foglia chiara · v vaso · S ombra */
const T: Tavolozze = {
  giorno: {
    Z: "var(--sabbia-100)", w: "var(--sabbia-200)", x: "var(--sabbia-300)", c: "var(--sabbia-100)", C: "var(--sabbia-200)", l: "var(--miele-300)", f: "var(--sabbia-300)", D: "var(--sabbia-50)",
    k: "var(--rovere-300)", K: "var(--sabbia-400)", j: "var(--rovere-500)", g: "var(--pianta-100)", s: "var(--sabbia-50)", P: "var(--inchiostro-700)", E: "var(--sabbia-100)",
    b: "var(--sabbia-400)", t: "var(--sabbia-200)", u: "var(--sabbia-400)", m: "var(--cemento-500)", L: "var(--pianta-600)", M: "var(--pianta-300)", v: "var(--rovere-700)", S: "var(--ulivo-800)",
  },
  sera: {
    Z: "var(--sera-950)", w: "var(--sera-900)", x: "var(--sera-950)", c: "var(--sera-900)", C: "var(--sera-950)", l: "var(--miele-glow)", f: "var(--inchiostro-700)", D: "var(--sera-900)",
    k: "var(--sera-500)", K: "var(--sera-900)", j: "var(--inchiostro-700)", g: "var(--pianta-900)", s: "var(--sera-500)", P: "var(--sera-950)", E: "var(--sera-200)",
    b: "var(--inchiostro-700)", t: "var(--sabbia-400)", u: "var(--inchiostro-500)", m: "var(--sera-500)", L: "var(--pianta-800)", M: "var(--pianta-600)", v: "var(--inchiostro-700)", S: "var(--sera-950)",
  },
};

const LX = 25;
const LY = 20;
const HH = 4.22;

export function PosterCongress({ tono = "giorno", decorativo = true, titolo, className, arco = false }: ArtProps) {
  const sera = tono === "sera";
  const W = 800;
  const H = 600;
  const P = persp([12.5, 0, 1.4], 90, 3, 22, 20, 400, 350);
  const K = kit(P);
  const { quad, wy, wx, line } = K;
  const archX = (x: number, y0: number, y1: number, z0: number, zs: number) => {
    const r = (y1 - y0) / 2;
    const pts: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (Math.PI * i) / 10;
      pts.push(P(x, y0 + r + r * Math.cos(a), zs + r * Math.sin(a)).map(Math.round).join(" "));
    }
    return `M${P(x, y0, z0).map(Math.round).join(" ")}L${pts.join("L")}L${P(x, y1, z0).map(Math.round).join(" ")}Z`;
  };
  const colonna = (x: number, y: number) => (
    <>
      {quad("K", [x - 0.4, y + 0.4, 0], [x + 0.4, y + 0.4, 0], [x + 0.4, y + 0.4, HH], [x - 0.4, y + 0.4, HH])}
      {quad("j", [x + 0.4, y - 0.4, 0], [x + 0.4, y + 0.4, 0], [x + 0.4, y + 0.4, HH], [x + 0.4, y - 0.4, HH])}
      {quad("k", [x - 0.4, y - 0.4, 0], [x - 0.4, y + 0.4, 0], [x - 0.4, y + 0.4, HH], [x - 0.4, y - 0.4, HH])}
    </>
  );
  const righe = Array.from({ length: 11 }, (_, i) => 3.4 + i * 1.4);
  const blocchi = [4.1, 9.6, 15.4, 20.9];
  return (
    <ArtSvg w={W} h={H} tono={tono} tavolozze={T} alt={ALT} decorativo={decorativo} titolo={titolo} className={className} arco={arco}>
      {(id) => {
        const sc = (x: number, y: number) => (P(x + 1, y, 0)[0] - P(x, y, 0)[0]) / 40;
        return (
          <>
            <rect width={W} height={H} fill="var(--Z)" />
            <defs>
              {/* una sedia vista da dietro: schienale, seduta, due gambe */}
              <g id={`${id}s`}>
                <rect className="t" x={-10} y={-30} width={20} height={22} rx={4} />
                <rect className="u" x={-7} y={-26} width={14} height={13} rx={3} opacity={0.5} />
                <rect className="u" x={-10} y={-8} width={20} height={6} rx={2} />
                <path d="M-8-2V16M8-2V16" stroke="var(--m)" strokeWidth={2.2} />
              </g>
              <g id={`${id}r`}>
                {[-3, -2, -1, 0, 1, 2, 3].map((n) => (
                  <use key={n} href={`#${id}s`} x={n * 22} />
                ))}
              </g>
            </defs>
            {/* soffitto: lastra ribassata, velette luminose, faretti */}
            {quad("c", [0, 0, HH], [LX, 0, HH], [LX, LY, HH], [0, LY, HH])}
            <g opacity={sera ? 0.8 : 1}>{quad("l", [2.4, 2.4, HH - 0.02], [LX - 2.4, 2.4, HH - 0.02], [LX - 2.4, 17, HH - 0.02], [2.4, 17, HH - 0.02])}</g>
            {quad("C", [3, 3, HH - 0.2], [LX - 3, 3, HH - 0.2], [LX - 3, 16.4, HH - 0.2], [3, 16.4, HH - 0.2])}
            {quad("D", [6, 6, HH - 0.2], [LX - 6, 6, HH - 0.2], [LX - 6, 13, HH - 0.2], [6, 13, HH - 0.2])}
            {[[8, 4.6], [12.5, 4.6], [17, 4.6], [8, 9.5], [12.5, 9.5], [17, 9.5], [8, 14.4], [12.5, 14.4], [17, 14.4]].map(([x, y]) => {
              const [px, py] = P(x, y, HH - 0.2);
              return <ellipse key={x + "-" + y} className="l" cx={Math.round(px)} cy={Math.round(py)} rx={Math.max(2, Math.round(1.6 * sc(x, y) * 10))} ry={Math.max(1, Math.round(0.5 * sc(x, y) * 10))} />;
            })}
            {/* pareti */}
            {wy("w", 0, 0, LX, 0, HH)}
            {wx("x", 0, 0, LY, 0, HH)}
            {wx("x", LX, 0, LY, 0, HH)}
            {quad("f", [0, 0, 0], [LX, 0, 0], [LX, LY, 0], [0, LY, 0])}
            {/* palco, schermo, pannello scuro, piante */}
            {wy("P", 0, 3.2, 21.8, 0.35, 3.5)}
            {wy("E", 0, 8, 17, 1.0, 3.2)}
            {quad("b", [3.5, 0, 0], [21.5, 0, 0], [21.5, 2.2, 0], [3.5, 2.2, 0])}
            {quad("b", [3.5, 2.2, 0], [21.5, 2.2, 0], [21.5, 2.2, 0.3], [3.5, 2.2, 0.3])}
            {quad("K", [3.5, 0, 0.3], [21.5, 0, 0.3], [21.5, 2.2, 0.3], [3.5, 2.2, 0.3])}
            {[2.2, 23].map((x) => {
              const [px, py] = P(x, 1.2, 0.9);
              const s = sc(x, 1.2) * 18;
              return (
                <g key={x}>
                  <path className="v" d={`M${Math.round(px - s * 0.6)} ${Math.round(py)}h${Math.round(s * 1.2)}l-${Math.round(s * 0.2)} ${Math.round(s * 0.8)}h-${Math.round(s * 0.8)}Z`} />
                  <circle className="L" cx={Math.round(px)} cy={Math.round(py - s * 0.9)} r={Math.round(s * 1.1)} />
                  <circle className="M" cx={Math.round(px - s * 0.4)} cy={Math.round(py - s * 1.3)} r={Math.round(s * 0.5)} />
                </g>
              );
            })}
            {/* finestre ad arco con velo, tra le colonne (parete di destra e di sinistra) */}
            {[LX, 0].map((x) =>
              [5.2, 10.2, 15.2].map((y) => (
                <g key={x + "-" + y}>
                  <path className="k" d={archX(x, y - 0.1, y + 3.1, 0, 2.5)} />
                  <path className="g" d={archX(x, y, y + 3, 0.05, 2.5)} />
                  <path className="s" opacity={0.9} d={archX(x, y, y + 3, 0.05, 2.5)} />
                  {line("var(--k)", 1.5, [x, y + 1.5, 0.05], [x, y + 1.5, 3.6])}
                </g>
              )),
            )}
            {/* colonne color travertino */}
            {[4, 9, 14, 19].map((y) => (
              <g key={y}>
                {colonna(1.2, y)}
                {colonna(23.8, y)}
              </g>
            ))}
            <Alone id={id} cx={400} cy={90} r={sera ? 260 : 220} op={sera ? 0.9 : 0.7} />
            {/* file di sedie: quattro blocchi con tre corridoi, dalla più lontana */}
            {righe.map((y) =>
              blocchi.map((x) => {
                const [px, py] = P(x, y, 0);
                const s = sc(x, y);
                return <use key={x + "-" + y} href={`#${id}r`} transform={`translate(${Math.round(px)} ${Math.round(py - 18 * s)}) scale(${s.toFixed(3)})`} />;
              }),
            )}
          </>
        );
      }}
    </ArtSvg>
  );
}

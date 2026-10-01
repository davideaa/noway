/**
 * Poster del Cosmo Grill & Lounge (BRIEF «Ristorazione», UX 4.3 scena 5, DESIGN 6).
 * Ritratta ciò che il BRIEF e la foto di riferimento descrivono: cemento lisciato, travi e
 * canalizzazioni a vista, pilastri scuri, finestre ad arco con veli, lampade ad abat-jour color
 * miele, tavoli bianchi con sedie in alluminio forato, specchi con cornice scura, rami secchi.
 * Stilizzato; la pianta della sala e il numero di tavoli non sono dati.
 * In `sera` le lampade si accendono: è il poster della sezione scura.
 */
import { ArtSvg, Alone, type ArtProps, type Tavolozze } from "./base";
import { kit, persp } from "./proj";

const ALT =
  "Illustrazione della sala del Cosmo Grill e Lounge: cemento lisciato, travi e canalizzazioni a vista, lampade ad abat-jour color miele, tavoli bianchi, sedie in alluminio forato, specchi con cornice scura e rami secchi.";

/* Z sfondo · w parete · P pilastro · c soffitto · b trave · B sotto la trave · d condotta · e condotta ombra
 * f pavimento · r riflesso · g vetro · s velo · T piano tavolo · U bordo tavolo · m metallo (sedie) · M ombra sedie
 * h lampada · H lampada chiara · J cavo · k cornice specchio · y specchio · R ramo · S ombra */
const T: Tavolozze = {
  giorno: {
    Z: "var(--sabbia-100)", w: "var(--sabbia-300)", P: "var(--inchiostro-700)", c: "var(--ulivo-800)", b: "var(--inchiostro-900)", B: "var(--inchiostro-700)",
    d: "var(--cemento-300)", e: "var(--cemento-500)", f: "var(--cemento-300)", r: "var(--cemento-100)", g: "var(--pianta-100)", s: "var(--sabbia-50)",
    T: "var(--sabbia-50)", U: "var(--cemento-100)", m: "var(--cemento-100)", M: "var(--cemento-500)", h: "var(--miele-400)", H: "var(--miele-300)",
    J: "var(--inchiostro-900)", k: "var(--inchiostro-900)", y: "var(--sabbia-200)", R: "var(--ulivo-800)", S: "var(--inchiostro-900)", x: "var(--sabbia-400)",
  },
  sera: {
    Z: "var(--sera-950)", w: "var(--sera-900)", P: "var(--sera-950)", c: "var(--sera-950)", b: "var(--sera-950)", B: "var(--sera-900)",
    d: "var(--sera-500)", e: "var(--inchiostro-700)", f: "var(--sera-900)", r: "var(--inchiostro-700)", g: "var(--pianta-900)", s: "var(--sera-500)",
    T: "var(--sabbia-300)", U: "var(--sabbia-400)", m: "var(--sera-200)", M: "var(--sera-950)", h: "var(--miele-glow)", H: "var(--miele-300)",
    J: "var(--sera-500)", k: "var(--sera-950)", y: "var(--inchiostro-700)", R: "var(--sabbia-400)", S: "var(--sera-950)", x: "var(--sera-500)",
  },
};

const HH = 6.2;
const LX = 14;
const LY = 14;

export function PosterGrill({ tono = "giorno", decorativo = true, titolo, className, arco = false }: ArtProps) {
  const sera = tono === "sera";
  const W = 800;
  const H = 600;
  const P = persp([7, 0, 2.6], 90, 4.5, 24, 47, 400, 330);
  const K = kit(P);
  const { quad, wy, wx, line } = K;
  const arc = (x0: number, x1: number, z0: number, zs: number) => {
    const r = (x1 - x0) / 2;
    const pts: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (Math.PI * i) / 10;
      pts.push(P(x0 + r + r * Math.cos(a), 0, zs + r * Math.sin(a)).map(Math.round).join(" "));
    }
    return `M${P(x0, 0, z0).map(Math.round).join(" ")}L${pts.join("L")}L${P(x1, 0, z0).map(Math.round).join(" ")}Z`;
  };
  // tavoli: (x, y) a terra
  const tavoli: [number, number][] = [[2.8, 3.4], [7, 3.0], [11.2, 3.4], [4.7, 6.2], [9.3, 6.0], [2.2, 9.0], [7.2, 8.8], [11.8, 9.0], [5.2, 12.0], [9.8, 11.8]];
  const lampade: [number, number][] = [[3.4, 5.2], [7.2, 2.6], [11, 6.8], [6, 10]];
  return (
    <ArtSvg w={W} h={H} tono={tono} tavolozze={T} alt={ALT} decorativo={decorativo} titolo={titolo} className={className} arco={arco}>
      {(id) => {
        const sc = (x: number, y: number) => (P(x + 1, y, 0)[0] - P(x, y, 0)[0]) / 60;
        return (
          <>
            <rect width={W} height={H} fill="var(--Z)" />
            <defs>
              {/* sedia in alluminio forato vista di fronte: schienale a fori (tratteggio) + sedile */}
              <g id={`${id}c`}>
                <rect className="M" x={-11} y={-34} width={22} height={24} rx={4} opacity={0.35} transform="translate(2 3)" />
                <rect className="m" x={-11} y={-34} width={22} height={24} rx={4} />
                <path d="M-8-27h16M-8-22h16M-8-17h16" stroke="var(--M)" strokeWidth={2} strokeDasharray="2 2.5" fill="none" />
                <path className="m" d="M-12-8h24l4 9h-32Z" />
                <path d="M-11 1V22M11 1V22" stroke="var(--M)" strokeWidth={2.2} fill="none" />
              </g>
              <g id={`${id}t`}>
                <ellipse className="S" cx={0} cy={50} rx={26} ry={5} opacity={0.18} />
                <path d="M0 14V48" stroke="var(--e)" strokeWidth={4} />
                <ellipse className="e" cx={0} cy={48} rx={13} ry={3.5} />
                <path className="U" d="M-31-6h62l8 15h-78Z" />
                <path className="T" d="M-31-8h62l8 15h-78Z" />
                <path d="M-20 0h40" stroke="var(--U)" strokeWidth={2.5} />
              </g>
            </defs>
            {/* soffitto con travi e condotte */}
            {quad("c", [0, 0, HH], [LX, 0, HH], [LX, 22, HH], [0, 22, HH])}
            {[3, 7, 11].map((y) => (
              <g key={y}>
                {quad("B", [0, y, HH - 0.5], [LX, y, HH - 0.5], [LX, y + 0.4, HH - 0.5], [0, y + 0.4, HH - 0.5])}
                {quad("b", [0, y + 0.4, HH - 0.5], [LX, y + 0.4, HH - 0.5], [LX, y + 0.4, HH], [0, y + 0.4, HH])}
              </g>
            ))}
            {quad("d", [4.2, 0, HH - 0.7], [5.1, 0, HH - 0.7], [5.1, LY, HH - 0.7], [4.2, LY, HH - 0.7])}
            {quad("e", [4.8, 0, HH - 0.7], [5.1, 0, HH - 0.7], [5.1, LY, HH - 0.7], [4.8, LY, HH - 0.7])}
            {quad("d", [9.6, 0, HH - 0.6], [10.3, 0, HH - 0.6], [10.3, LY, HH - 0.6], [9.6, LY, HH - 0.6])}
            {/* pareti */}
            {wx("w", 0, 0, LY, 0, HH)}
            {wx("w", LX, 0, LY, 0, HH)}
            {wy("w", 0, 0, LX, 0, HH)}
            {/* pilastri scuri e finestre ad arco con velo */}
            {[0.1, 4.6, 9.0, 13.3].map((x) => wy("P", 0, x, x + 0.7, 0, HH))}
            {[1.1, 5.6, 10].map((x) => (
              <g key={x}>
                <path className="P" d={arc(x - 0.08, x + 3.48, 0, 2.7)} />
                <path className="g" d={arc(x, x + 3.4, 0.1, 2.7)} />
                {wy("s", 0, x, x + 3.4, 0.1, 3.3)}
                {wy("g", 0, x + 1.2, x + 2.2, 1, 3.8)}
                {wy("s", 0, x + 1.2, x + 2.2, 1, 3.8)}
              </g>
            ))}
            {/* pavimento in cemento lisciato */}
            {quad("f", [0, 0, 0], [LX, 0, 0], [LX, LY, 0], [0, LY, 0])}
            <g opacity={0.45}>{quad("r", [1, 1, 0], [5, 1, 0], [5, LY, 0], [1, LY, 0])}</g>
            {/* specchi con cornice scura e rami secchi sulla parete di destra */}
            {[[2.2, 6.4], [8, 12.2]].map(([a, b]) => (
              <g key={a}>
                {wx("k", LX, a, b, 1.2, 3.6)}
                {wx("y", LX, a + 0.25, b - 0.25, 1.45, 3.35)}
              </g>
            ))}
            {line("var(--R)", 3, [LX, 7.0, 0.4], [LX, 7.3, 1.6], [LX, 7.9, 2.5], [LX, 7.5, 3.4])}
            {line("var(--R)", 2, [LX, 7.3, 1.6], [LX, 6.9, 2.2], [LX, 7.2, 3.0])}
            {line("var(--R)", 2, [LX, 7.9, 2.5], [LX, 8.3, 3.2])}
            {/* tavoli e sedie, dal fondo al davanti */}
            {tavoli
              .slice()
              .sort((a, b) => a[1] - b[1])
              .map(([x, y]) => {
                const [px, py] = P(x, y, 0.75);
                const s = sc(x, y) * 0.85;
                const u = (n: string, dx: number, dy: number) => (
                  <use key={n + dx} href={`#${id}${n}`} transform={`translate(${Math.round(px + dx * s)} ${Math.round(py + dy * s)}) scale(${s.toFixed(3)})`} />
                );
                return (
                  <g key={x + "-" + y}>
                    {u("c", -4, -36)}
                    {u("c", 22, -30)}
                    {u("t", 0, 0)}
                    {u("c", -42, 14)}
                    {u("c", 44, 14)}
                  </g>
                );
              })}
            {/* lampade ad abat-jour color miele */}
            {lampade.map(([x, y]) => {
              const [lx, ly] = P(x, y, 3.8);
              const ty = P(x, y, HH - 0.5)[1];
              const s = sc(x, y);
              const w1 = 22 * s;
              const w2 = 52 * s;
              const hh = 38 * s;
              return (
                <g key={x + "-" + y}>
                  <Alone id={id} cx={lx} cy={ly + hh * 0.6} r={sera ? 150 * s : 80 * s} op={sera ? 1 : 0.7} />
                  <path d={`M${Math.round(lx)} ${Math.round(ty)}V${Math.round(ly)}`} stroke="var(--J)" strokeWidth={1.5} />
                  <path className="h" d={`M${Math.round(lx - w1)} ${Math.round(ly)}h${Math.round(2 * w1)}l${Math.round(w2 - w1)} ${Math.round(hh)}h${-Math.round(2 * w2)}Z`} />
                  <ellipse className="H" cx={Math.round(lx)} cy={Math.round(ly + hh)} rx={Math.round(w2)} ry={Math.max(2, Math.round(w2 * 0.2))} />
                </g>
              );
            })}
          </>
        );
      }}
    </ArtSvg>
  );
}

/**
 * «Come arrivare»: diagramma a linee dal Cosmo a Milano (DECISIONI 8: nessuna mappa incorporata;
 * UX 4.3 scena 4; COPY 5.4). Hotel → tram 31 (pochi passi) → poche fermate → metro M5, fermata
 * Bignami → centro di Milano. A4, Tangenziale Nord ed Est sono solo contesto.
 *
 * NON È IN SCALA e non mostra tempi né distanze: lo dice la didascalia. Verticale, come lo vuole
 * UX (percorso a sinistra, elenco a destra). Le tappe sono numerate come l'elenco in pagina; i
 * testi dentro l'SVG sono pochi e grandi (siglie delle strade, M5) perché a 12 px devono
 * restare leggibili anche se lo schema è ridotto: mostrarlo almeno a 240 px di larghezza.
 *
 * Aggancio per il movimento (modulo 11): i due tratti hanno `data-route="tram"` / `"metro"` e
 * `pathLength=1` (si disegnano con stroke-dashoffset); ogni tappa è `data-stop="1".."5"`.
 */
import { ArtSvg, type ArtProps, type Tavolozze } from "./base";

export type RouteMapProps = ArtProps & {
  /** Tappa evidenziata (1-5). Il tram segnaposto si ferma lì. Default 1. */
  tappa?: 1 | 2 | 3 | 4 | 5;
  /** Didascalia sotto lo schema. `false` per non mostrarla (se la pagina ha la sua). */
  didascalia?: string | false;
};

export const DIDASCALIA_ROUTEMAP =
  "Schema non in scala: le distanze e i tempi non sono rappresentati."; // NUOVO TESTO

const ALT =
  "Schema non in scala: dal Cosmo Hotel Palace il tram 31 porta in poche fermate alla metro M5, fermata Bignami, e da lì al centro di Milano. Sono indicate anche l'A4 e le tangenziali Nord ed Est.";

/* Z fondo · r strada · d tratteggio strada · R percorso · c città · k testo · m testo secondario · s carta · h luce */
const T: Tavolozze = {
  giorno: {
    Z: "var(--sabbia-100)", r: "var(--cemento-300)", d: "var(--sabbia-50)", R: "var(--pianta-800)", c: "var(--sabbia-200)",
    k: "var(--inchiostro-900)", m: "var(--inchiostro-700)", s: "var(--sabbia-50)", h: "var(--miele-500)", b: "var(--sabbia-400)",
  },
  sera: {
    Z: "var(--sera-950)", r: "var(--sera-500)", d: "var(--sera-950)", R: "var(--miele-glow)", c: "var(--sera-900)",
    k: "var(--sera-50)", m: "var(--sera-200)", s: "var(--sera-950)", h: "var(--miele-glow)", b: "var(--sera-500)",
  },
};

/** Posizione di ogni tappa (per il segnaposto e per i badge). */
const STOP: Record<number, [number, number]> = { 1: [130, 100], 2: [130, 178], 3: [160, 262], 4: [200, 352], 5: [222, 486] };
const BADGE: Record<number, [number, number]> = { 1: [184, 100], 2: [184, 178], 3: [214, 262], 4: [254, 352], 5: [296, 440] };

const TRAM = "M130 124V178C130 214 148 238 160 262C172 288 196 312 200 334";
const METRO = "M200 370C204 410 214 440 222 462";

export function RouteMap({ tono = "giorno", decorativo = true, titolo, className, arco = false, tappa = 1, didascalia }: RouteMapProps) {
  const testo = didascalia === undefined ? DIDASCALIA_ROUTEMAP : didascalia;
  const fnt = { fontFamily: "var(--font-body)", fontWeight: 700 } as const;
  return (
    <figure style={{ margin: 0 }}>
      <ArtSvg w={360} h={580} tono={tono} tavolozze={T} alt={ALT} decorativo={decorativo} titolo={titolo} className={className} arco={arco} fit="meet">
        {() => {
          const [tx, ty] = STOP[tappa];
          return (
            <>
              <rect width={360} height={580} fill="var(--Z)" />
              {/* strade di contesto: tangenziale Nord, A4, tangenziale Est */}
              {["M0 38Q180 12 360 42", "M46 70C58 190 22 380 62 580", "M326 70C342 200 316 380 336 580"].map((d) => (
                <g key={d}>
                  <path d={d} stroke="var(--r)" strokeWidth={14} fill="none" />
                  <path d={d} stroke="var(--d)" strokeWidth={2} strokeDasharray="8 8" fill="none" />
                </g>
              ))}
              <g {...fnt} fontSize={20} fill="var(--m)">
                <text x={24} y={26}>Tang. Nord</text>
                <text x={66} y={330}>A4</text>
                <text x={314} y={150} textAnchor="end">Tang. Est</text>
              </g>
              {/* Milano: cerchia e Duomo stilizzato */}
              <circle cx={222} cy={486} r={66} fill="var(--c)" stroke="var(--b)" strokeWidth={2} strokeDasharray="4 6" />
              <g data-stop="5">
                <path fill="var(--R)" d="M200 506V478l7-12 7 8 8-14 8 14 7-8 7 12v28z" />
                <path fill="var(--s)" d="M215 506v-16a7 7 0 0114 0v16z" />
              </g>
              {/* percorso: tram (linea singola) e metro (linea doppia) */}
              <path data-route="tram" pathLength={1} d={TRAM} stroke="var(--R)" strokeWidth={6} fill="none" strokeLinecap="round" />
              <path d={METRO} stroke="var(--R)" strokeWidth={12} fill="none" strokeLinecap="round" />
              <path data-route="metro" pathLength={1} d={METRO} stroke="var(--s)" strokeWidth={3} fill="none" strokeLinecap="round" />
              {/* tappa 1: l'hotel (finestra ad arco) */}
              <g data-stop="1">
                <path fill="var(--R)" d="M110 124V86a20 20 0 0140 0v38z" />
                <path fill="var(--s)" d="M122 124V94a8 8 0 0116 0v30z" />
              </g>
              {/* tappa 2: fermata del tram 31 */}
              <g data-stop="2">
                <circle cx={130} cy={178} r={13} fill="var(--s)" stroke="var(--R)" strokeWidth={5} />
              </g>
              {/* tappa 3: poche fermate */}
              <g data-stop="3" fill="var(--R)">
                {[[149, 240], [160, 262], [172, 284]].map(([x, y]) => <circle key={y} cx={x} cy={y} r={5} />)}
              </g>
              {/* tappa 4: metro M5, Bignami */}
              <g data-stop="4">
                <circle cx={200} cy={352} r={21} fill="var(--s)" stroke="var(--R)" strokeWidth={5} />
                <text x={200} y={358} textAnchor="middle" fontSize={16} {...fnt} fill="var(--k)">M5</text>
              </g>
              {/* badge numerati, come l'elenco in pagina */}
              {[1, 2, 3, 4, 5].map((n) => {
                const [bx, by] = BADGE[n];
                const att = n === tappa;
                return (
                  <g key={n}>
                    <circle cx={bx} cy={by} r={15} fill={att ? "var(--R)" : "var(--s)"} stroke="var(--R)" strokeWidth={2.5} />
                    <text x={bx} y={by + 6} textAnchor="middle" fontSize={17} {...fnt} fill={att ? "var(--s)" : "var(--k)"}>{n}</text>
                  </g>
                );
              })}
              {/* segnaposto del tram nella tappa evidenziata */}
              <g data-route-tram="" transform={`translate(${tx - 46} ${ty - 11})`}>
                <rect fill="var(--h)" width={30} height={20} rx={5} stroke="var(--k)" strokeWidth={2} />
                <path d="M5 5h6v6H5zM13 5h6v6h-6z" fill="var(--s)" />
                <path d="M9 24h12" stroke="var(--k)" strokeWidth={2.5} />
              </g>
            </>
          );
        }}
      </ArtSvg>
      {testo !== false && (
        <figcaption style={{ marginBlockStart: "var(--s-2)", fontSize: "var(--t-small)", color: "var(--text-muted)" }}>{testo}</figcaption>
      )}
    </figure>
  );
}

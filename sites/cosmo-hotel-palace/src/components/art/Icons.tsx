/**
 * Set di icone proprio del Cosmo Hotel Palace (DESIGN 6, UX 9). Griglia 24 px, tratto 1,5,
 * terminali e giunzioni arrotondati, angoli interni a 2 px, solo `currentColor`, nessun
 * riempimento (salvo i punti). Sostituisce Lucide: non si mescolano set diversi (DESIGN 8.6).
 * Server Component, nessun JS. Uso: <Icon nome="letto" /> oppure <Icon nome="menu" titolo="Menu" />.
 * Senza `titolo` l'icona è decorativa (aria-hidden): il testo accanto dice già cosa fa.
 */
import type { ReactNode, SVGProps } from "react";

const R = {
  /* interfaccia */
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  chiudi: <path d="M6 6l12 12M18 6L6 18" />,
  "freccia-destra": <path d="M4 12h15M13 6l6 6-6 6" />,
  "freccia-sinistra": <path d="M20 12H5M11 6l-6 6 6 6" />,
  "freccia-su": <path d="M12 20V5M6 11l6-6 6 6" />,
  "freccia-giu": <path d="M12 4v15M6 13l6 6 6-6" />,
  "chevron-sinistra": <path d="M15 5l-7 7 7 7" />,
  "chevron-destra": <path d="M9 5l7 7-7 7" />,
  "chevron-su": <path d="M5 15l7-7 7 7" />,
  "chevron-giu": <path d="M5 9l7 7 7-7" />,
  spunta: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  divieto: <><circle cx={12} cy={12} r={9} /><path d="M5.6 5.6l12.8 12.8" /></>,
  info: <><circle cx={12} cy={12} r={9} /><path d="M12 11v5.5" /><circle cx={12} cy={7.7} r={0.6} fill="currentColor" /></>,
  copia: <><rect x={8} y={8} width={12} height={12} rx={2} /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></>,
  esterno: <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />,
  vista3d: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12L4 7.5M12 12v9" />,
  pianta: <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2zM4 12h7M11 12V4M15 12v8" />,
  /* luce */
  giorno: <><circle cx={12} cy={12} r={4} /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></>,
  sera: <path d="M8.5 4h7L18 12H6zM12 12v6.5M9 20.5h6" />,
  luna: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  /* contatti e utilità */
  telefono: <path d="M6.5 3.5h3l1.6 4-2 1.3a10 10 0 005.1 5.1l1.3-2 4 1.6v3a2 2 0 01-2.2 2A16 16 0 014.5 5.7 2 2 0 016.5 3.5z" />,
  email: <><rect x={3} y={5} width={18} height={14} rx={2} /><path d="M3.5 7l8.5 6 8.5-6" /></>,
  orologio: <><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 2" /></>,
  mappa: <><path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 10-13 0c0 5 6.5 11 6.5 11z" /><circle cx={12} cy={10} r={2.3} /></>,
  calendario: <><rect x={3.5} y={5} width={17} height={15.5} rx={2} /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  persone: <><circle cx={9} cy={8} r={3} /><path d="M3.5 20a5.5 5.5 0 0111 0" /><circle cx={17} cy={9} r={2.5} /><path d="M16 14.5a4.5 4.5 0 015 4.5" /></>,
  /* servizi */
  parcheggio: <><rect x={3} y={3} width={18} height={18} rx={2} /><path d="M9.5 17V7.5h3.2a2.7 2.7 0 010 5.4H9.5" /></>,
  wifi: <><path d="M3 9.5a13 13 0 0118 0M6 13a8.5 8.5 0 0112 0M9 16.5a4 4 0 016 0" /><circle cx={12} cy={20} r={0.7} fill="currentColor" /></>,
  accessibilita: <><circle cx={12} cy={4.5} r={1.7} /><path d="M12 8v6h5l2.5 5M8.5 11.5a5 5 0 105.5 7.5" /></>,
  tv: <><rect x={3} y={5} width={18} height={12} rx={2} /><path d="M8 20h8M12 17v3" /></>,
  clima: <><rect x={3} y={5} width={18} height={6} rx={2} /><path d="M7 8h10M7 14v4M12 14v5M17 14v4" /></>,
  cassaforte: <><rect x={3} y={4} width={18} height={15} rx={2} /><circle cx={12} cy={11.5} r={3.2} /><path d="M12 8.3v1M12 14v1M6 19v2M18 19v2" /></>,
  caffe: <path d="M5 9h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4zM16 10.5h1.5a2 2 0 010 4H16M8 3.5c-1 1 1 1.5 0 3M12 3.5c-1 1 1 1.5 0 3M4 21.5h13" />,
  /* camere */
  letto: <path d="M3 5.5v14M3 15.5h18v4M3 15.5v-2a2 2 0 012-2h14a2 2 0 012 2v2M5.5 8.5h5v3h-5z" />,
  scrivania: <path d="M3.5 8.5h17M5.5 8.5V20M18.5 8.5V20M11 12.5h7.5v5H11z" />,
  divano: <path d="M5 11V9a3 3 0 013-3h8a3 3 0 013 3v2M3.5 13a2 2 0 014 0v3h9v-3a2 2 0 014 0v5h-17zM6 18v2M18 18v2" />,
  bagno: <path d="M3 12h18v2a5 5 0 01-5 5H8a5 5 0 01-5-5zM6 12V6.5A2.5 2.5 0 018.5 4 2.5 2.5 0 0111 6.5M7 19l-1 2M17 19l1 2" />,
  /* ristorazione, congressi, wellness */
  ristorante: <path d="M6.5 3v5.5a2.5 2.5 0 005 0V3M9 11v10M17.5 21V3c-2 1.5-3.5 4-3.5 8h3.5" />,
  calice: <path d="M8 3h8c0 5-1 8-4 8s-4-3-4-8zM12 11v9.5M8.5 21h7" />,
  congressi: <><rect x={4} y={3.5} width={16} height={9} rx={1.5} /><path d="M12 12.5v4M7 20.5l5-4 5 4M8.5 10V8.5M12 10V6.5M15.5 10V7.5" /></>,
  sauna: <><rect x={3.5} y={10} width={17} height={10} rx={1.5} /><path d="M3.5 14h17M3.5 17h17M8 7c-1-1.2 1-2 0-3.5M12 7c-1-1.2 1-2 0-3.5M16 7c-1-1.2 1-2 0-3.5" /></>,
  "bagno-turco": <path d="M5 20V11a7 7 0 0114 0v9M3 20h18M9.5 17c-1-1.2 1-2 0-3.5M14.5 17c-1-1.2 1-2 0-3.5" />,
  "tapis-roulant": <><circle cx={8} cy={5.5} r={1.6} /><path d="M8 8l1.5 4-2.5 3.2M9.5 12l3.2 1.6M8 8.2l-2.2 2M4 17.5h13l1.5 2.5M17 17.5L19.5 7H15M3 20h16" /></>,
  cyclette: <><circle cx={8.5} cy={16} r={4} /><path d="M8.5 16V9M6.5 9h4M8.5 16l6-3.5V6h3M14.5 6H13M4 21h14" /></>,
  /* come arrivare */
  tram: <path d="M6 4h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zM4 11h16M12 4v7M7 18l-2 3M17 18l2 3M9 2h6" />,
  metro: <><circle cx={12} cy={12} r={9} /><path d="M7.5 16V8l4.5 5 4.5-5v8" /></>,
  auto: <path d="M3.5 16.5v-4l2-4.5a1.5 1.5 0 011.4-1h10.2a1.5 1.5 0 011.4 1l2 4.5v4a1 1 0 01-1 1h-2M7.5 17.5h9M3.5 12.5h17M5.5 17.5h-1a1 1 0 01-1-1M7.5 15.8a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6zM16.5 15.8a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6z" />,
  aereo: <path d="M21 14.5l-8-3.5V6a1.5 1.5 0 00-3 0v5l-8 3.5v1.8l8-1.6v3.8l-2 1.5V21l3.5-1 3.5 1v-1.5l-2-1.5v-3.8l8 1.6z" />,
  treno: <path d="M7 3h10a2 2 0 012 2v10a3 3 0 01-3 3H8a3 3 0 01-3-3V5a2 2 0 012-2zM5 11h14M8 18l-2 3M16 18l2 3M9 14.5h.01M15 14.5h.01" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof R;
export const ICON_NAMES = Object.keys(R) as IconName[];

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "ref"> & {
  nome: IconName;
  /** Lato in px (default 24). */
  size?: number;
  /** Se c'è, l'icona ha un <title> ed è letta; altrimenti è decorativa. */
  titolo?: string;
};

export function Icon({ nome, size = 24, titolo, ...resto }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(titolo ? { role: "img", "aria-label": titolo } : { "aria-hidden": true, focusable: "false" })}
      {...resto}
    >
      {titolo && <title>{titolo}</title>}
      {R[nome]}
    </svg>
  );
}

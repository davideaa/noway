"use client";

/*
 * Pianta della sala (UX 7.2: «Pianta», la vista predefinita sotto 600 px e l'unica senza WebGL).
 * Disegno dall'alto, in SVG, dello STESSO generatore che alimenta la scena 3D (`layoutSala`):
 * stesse sedie, stessi tavoli, stesse posizioni. Le capienze non si calcolano qui: il disegno
 * mostra `min(partecipanti, capienza della tabella)` sedie.
 *
 * La sala si disegna con il lato lungo in orizzontale e il palco a sinistra (il telaio ha sempre
 * il palco sul lato corto). Sale divise: nessuna sedia e le pareti mobili come schema indicativo.
 * Le sedie sono elementi `<use>` con `transform` CSS: cambiando disposizione scivolano al nuovo
 * posto in --d-in (con reduced-motion scattano, i token valgono 0,01 ms). Sedie in più escono
 * da un angolo («parcheggio») con scala 0 → 1, come nella scena 3D.
 */

import { useId, useMemo } from "react";
import type { CongressHall, Disposizione } from "@/content/types";
import { capienzaMassima } from "@/lib/congress/availability";
import { layoutSala, layoutVuoto, OGGETTI, schemaPareti, STRIDE, type Disegno } from "@/lib/congress/layout";
import s from "./congress.module.css";

type Props = {
  hall: CongressHall;
  disposizione: Disposizione;
  ospiti: number | null;
  divisa: boolean;
  /** Alternativa testuale del disegno (la stessa del canvas 3D). */
  aria: string;
};

const trasf = (x: number, z: number, rotY: number, scala: number) =>
  `translate(${x.toFixed(3)}px, ${z.toFixed(3)}px) rotate(${(-rotY).toFixed(4)}rad) scale(${scala.toFixed(3)})`;

export function HallPlan({ hall, disposizione, ospiti, divisa, aria }: Props) {
  const idSedia = `sedia-${useId().replace(/\W/g, "")}`;

  const disegno: Disegno = useMemo(
    () => (divisa ? layoutVuoto(hall, disposizione) : (layoutSala(hall, disposizione, ospiti) ?? layoutVuoto(hall, disposizione))),
    [hall, disposizione, ospiti, divisa],
  );

  const A = disegno.larghezza; // lato corto (asse x)
  const B = disegno.profondita; // lato lungo (asse z)
  const pad = 0.9;
  const slots = capienzaMassima(hall);
  const parcheggio: [number, number] = [A / 2 - 0.6, B / 2 - 0.5];
  const sc = OGGETTI.sedia;
  const tondo = disegno.tipoTavoli === "tondi";

  const sedie = [];
  for (let i = 0; i < slots; i++) {
    const vivo = i < disegno.n;
    const [x, z, rot, k] = vivo
      ? [disegno.sedie[i * STRIDE], disegno.sedie[i * STRIDE + 1], disegno.sedie[i * STRIDE + 2], disegno.sedie[i * STRIDE + 3]]
      : [parcheggio[0], parcheggio[1], 0, 0];
    sedie.push(
      <use
        key={i}
        href={`#${idSedia}`}
        className={s.pSedia}
        style={{ transform: trasf(x, z, rot, vivo ? k : 0), opacity: vivo ? 1 : 0 }}
      />,
    );
  }

  const tavoli = [];
  for (let i = 0; i < disegno.nTavoli; i++) {
    const x = disegno.tavoli[i * STRIDE];
    const z = disegno.tavoli[i * STRIDE + 1];
    const rot = disegno.tavoli[i * STRIDE + 2];
    const k = disegno.tavoli[i * STRIDE + 3];
    tavoli.push(
      tondo ? (
        <circle key={i} className={s.pTavolo} r={OGGETTI.tavoloTondo.diametro / 2} style={{ transform: trasf(x, z, rot, k) }} />
      ) : (
        <rect
          key={i}
          className={s.pTavolo}
          x={-OGGETTI.tavoloRettangolare.lunghezza / 2}
          y={-OGGETTI.tavoloRettangolare.profondita / 2}
          width={OGGETTI.tavoloRettangolare.lunghezza}
          height={OGGETTI.tavoloRettangolare.profondita}
          rx={0.05}
          style={{ transform: trasf(x, z, rot, k) }}
        />
      ),
    );
  }

  /* pareti mobili: schema indicativo, parti uguali (lo stesso schema della scena 3D) */
  let pareti = null;
  if (divisa && hall.divisibleInto) {
    const sch = schemaPareti(hall.divisibleInto, A, B);
    const lungoZ = sch.segmenti.filter((g) => g.asse === "x").length + 1; // parti lungo z
    const lungoX = sch.segmenti.filter((g) => g.asse === "z").length + 1; // parti lungo x
    const celle = [];
    for (let iz = 0; iz < lungoZ; iz++) {
      for (let ix = 0; ix < lungoX; ix++) {
        celle.push(
          <rect
            key={`${ix}-${iz}`}
            x={-A / 2 + (ix * A) / lungoX}
            y={-B / 2 + (iz * B) / lungoZ}
            width={A / lungoX}
            height={B / lungoZ}
            className={(ix + iz) % 2 ? s.pParteB : s.pParteA}
          />,
        );
      }
    }
    pareti = (
      <g>
        {celle}
        {sch.segmenti.map((g, i) =>
          g.asse === "x" ? (
            <line key={i} className={s.pParete} x1={-A / 2} x2={A / 2} y1={-B / 2 + g.frazione * B} y2={-B / 2 + g.frazione * B} />
          ) : (
            <line key={i} className={s.pParete} y1={-B / 2} y2={B / 2} x1={-A / 2 + g.frazione * A} x2={-A / 2 + g.frazione * A} />
          ),
        )}
      </g>
    );
  }

  const p = disegno.palco;

  return (
    <svg
      key={hall.id}
      className={s.pianta}
      viewBox={`${-B / 2 - pad} ${-A / 2 - pad} ${B + 2 * pad} ${A + 2 * pad}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={aria}
    >
      <defs>
        <g id={idSedia}>
          <rect x={-sc.larghezza / 2} y={-sc.profondita / 2} width={sc.larghezza} height={sc.profondita} rx={0.09} className={s.pSedia1} />
          <rect x={-sc.larghezza / 2} y={sc.profondita / 2 - 0.13} width={sc.larghezza} height={0.13} rx={0.05} className={s.pSedia2} />
        </g>
      </defs>
      {/* il disegno è nello spazio del generatore (x corto, z lungo): ruotato di 90° il lato lungo va in orizzontale e il palco a sinistra */}
      <g transform="rotate(-90)">
        <rect x={-A / 2} y={-B / 2} width={A} height={B} className={s.pPavimento} />
        {pareti}
        <rect x={p.xCentro - p.larghezza / 2} y={p.zCentro - p.profondita / 2} width={p.larghezza} height={p.profondita} rx={0.12} className={s.pPalco} />
        <g key={`${disposizione}-${disegno.tipoTavoli}`} className={s.pTavoli}>
          {tavoli}
        </g>
        <g>{sedie}</g>
        <rect x={-A / 2} y={-B / 2} width={A} height={B} className={s.pMuri} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

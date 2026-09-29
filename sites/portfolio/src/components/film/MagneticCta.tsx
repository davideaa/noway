"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

/**
 * E10 - la CTA principale: sweep di luce UNA volta per pointerenter (CSS) e
 * magnetismo leggero: offset = clamp(puntatore - centro) * 0.18 mentre e' sopra,
 * 0 altrimenti (il ritorno e' la transizione CSS con la curva del sito).
 * Solo transform: l'area di tocco e' il box non trasformato + 24 px di margine
 * (il wrapper con padding). Touch e reduced-motion: niente offset, niente sweep
 * (CSS). Un solo bottone per schermo lo fa. Costo: un listener sul bottone, 0 kB.
 */
export function MagneticCta({ href, className, children, ariaLabel }: { href: string; className: string; children: ReactNode; ariaLabel?: string }) {
  const btn = useRef<HTMLAnchorElement>(null);
  const move = (e: React.PointerEvent<HTMLElement>) => {
    const el = btn.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const rx = r.width / 2 + 24;
    const ry = r.height / 2 + 24;
    const dx = Math.max(-rx, Math.min(rx, e.clientX - (r.left + r.width / 2)));
    const dy = Math.max(-ry, Math.min(ry, e.clientY - (r.top + r.height / 2)));
    el.style.setProperty("--mx", `${(dx * 0.18).toFixed(1)}px`);
    el.style.setProperty("--my", `${(dy * 0.18).toFixed(1)}px`);
  };
  const leave = () => {
    const el = btn.current;
    if (!el) return;
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
  };
  const enter = () => {
    const el = btn.current;
    if (!el) return;
    el.classList.remove("is-sweep");
    void el.offsetWidth; // riavvia l'animazione dello sweep
    el.classList.add("is-sweep");
  };
  const external = href.startsWith("http") || href.endsWith(".html") || href.startsWith("/simulatore");
  const props = {
    ref: btn,
    className: `cta-lux ${className}`,
    "aria-label": ariaLabel,
    "data-cursor": "link",
    onPointerEnter: enter,
    onAnimationEnd: () => btn.current?.classList.remove("is-sweep"),
  };
  return (
    <span className="cta-lux__wrap" onPointerMove={move} onPointerLeave={leave}>
      {external ? (
        <a href={href} {...props}>
          {children}
        </a>
      ) : (
        <Link href={href} {...props}>
          {children}
        </Link>
      )}
    </span>
  );
}

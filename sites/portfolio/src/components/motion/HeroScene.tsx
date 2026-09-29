"use client";

/**
 * Hero. Mentre esce dallo schermo il contenuto non "sale": si allontana verso
 * il fondo (translateZ negativo) e sfuma. Si animano solo transform e opacity.
 * Senza JS o con prefers-reduced-motion il contenuto resta fermo (globals.css).
 */
import { useScroll, useTransform } from "framer-motion";
import * as m from "framer-motion/m";
import { useRef, type ReactNode } from "react";
import { HeroBackground } from "./HeroBackground";

export function HeroScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const z = useTransform(scrollYProgress, [0.12, 1], [0, -600]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.9], [1, 0]);

  return (
    <section
      ref={ref}
      id="ingresso"
      data-scene
      className="hero"
      aria-labelledby="titolo-hero"
    >
      <HeroBackground />
      <div className="wrap">
        <div className="hero__persp">
          <m.div className="hero__content" style={{ z, opacity }}>
            {children}
          </m.div>
        </div>
      </div>
    </section>
  );
}

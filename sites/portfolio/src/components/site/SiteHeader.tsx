"use client";

import { useScroll } from "framer-motion";
import * as m from "framer-motion/m";
import { Mail, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { EMAIL_SHOWN, MAILTO, SCENES, SITE_NAME } from "@/lib/site";
import { BrandMark } from "./BrandMark";

const NAV = SCENES.filter((s) => s.nav);

/**
 * Barra in alto: marchio, voci (Metodo, Strategie, Rischio, Monitoraggio,
 * Contatti), contatore di scena, pulsante "Scrivi via email" e filo di
 * avanzamento (scaleX). Sotto 950 px le voci stanno in un menu.
 */
export function SiteHeader() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  // scena attiva = quella che attraversa la fascia centrale dello schermo
  useEffect(() => {
    const els = SCENES.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = SCENES.findIndex((s) => s.id === e.target.id);
            if (idx >= 0) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const current = SCENES[active];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-[20px]">
      <div className="wrap flex h-16 items-center gap-4">
        <a href="#ingresso" className="flex items-center gap-3 text-acc" aria-label={`${SITE_NAME}, torna all'inizio`}>
          <BrandMark />
          <span className="hidden text-sm font-semibold tracking-tight text-ink sm:block">{SITE_NAME}</span>
        </a>

        <nav aria-label="Sezioni" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((s) => {
            const isActive = current.id === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`relative flex h-11 items-center px-3 text-sm font-medium transition-colors duration-300 hover:text-acc ${
                  isActive ? "text-acc" : "text-mut"
                }`}
              >
                {s.label}
                {isActive && <span className="absolute inset-x-3 bottom-1 h-[2px] bg-acc shadow-[0_0_15px_color-mix(in_srgb,var(--acc)_50%,transparent)]" />}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="mono hidden text-xs text-mut md:inline" aria-hidden="true">
            <b className="font-medium text-acc">{current.n}</b> / {SCENES.length.toString().padStart(2, "0")}
          </span>
          <a href={MAILTO} className={buttonVariants({ size: "sm" })} aria-label={`Scrivi via email a ${EMAIL_SHOWN}`}>
            <Mail size={16} strokeWidth={1.6} aria-hidden />
            <span>Scrivi via email</span>
          </a>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md border border-line3 bg-surf text-ink md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Chiudi il menu" : "Apri il menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} strokeWidth={1.6} aria-hidden /> : <Menu size={20} strokeWidth={1.6} aria-hidden />}
          </button>
        </div>
      </div>

      <div id="menu-mobile" hidden={!open} className="border-t border-line bg-surf md:hidden">
        <nav aria-label="Sezioni (menu)" className="wrap py-2">
          <ul>
            {NAV.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-between text-base font-medium text-ink"
                >
                  <span>{s.label}</span>
                  <span className="mono text-xs text-mut">{s.n}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <m.div aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-acc" style={{ scaleX: scrollYProgress }} />
    </header>
  );
}

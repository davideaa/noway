"use client";

import { Pause, Play } from "lucide-react";
import { useMotionPrefs } from "./MotionPrefs";

/**
 * "Pausa animazione" (WCAG 2.2.2): lo shader si muove da solo per piu' di 5 s.
 * Visibile solo quando l'animazione esiste davvero (non con reduced-motion,
 * fallback statico o dispositivi deboli): un comando che non fa niente e' peggio di nessuno.
 */
export function PauseButton({ className = "" }: { className?: string }) {
  const { canAnimate, paused, setPaused } = useMotionPrefs();
  if (!canAnimate) return null;
  return (
    <button
      type="button"
      className={`chip-btn ${className}`}
      aria-pressed={paused}
      onClick={() => setPaused(!paused)}
    >
      {paused ? <Play size={16} strokeWidth={1.6} aria-hidden /> : <Pause size={16} strokeWidth={1.6} aria-hidden />}
      {paused ? "Riprendi animazione" : "Pausa animazione"}
    </button>
  );
}

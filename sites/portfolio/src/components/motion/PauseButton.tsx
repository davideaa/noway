"use client";

import { Pause, Play } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useMotionPrefs } from "./MotionPrefs";

function subscribeFine(cb: () => void) {
  const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getFine = () => window.matchMedia("(pointer: fine) and (hover: hover)").matches;

/**
 * "Pausa animazione": spegne il fluido al mouse (FluidCursor).
 * Visibile solo quando il fluido esiste davvero (mouse, niente reduced-motion,
 * niente dispositivi deboli): un comando che non fa niente e' peggio di nessuno.
 */
export function PauseButton({ className = "" }: { className?: string }) {
  const { canAnimate, paused, setPaused } = useMotionPrefs();
  const fine = useSyncExternalStore(subscribeFine, getFine, () => false);
  if (!canAnimate || !fine) return null;
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

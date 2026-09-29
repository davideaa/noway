"use client";

/**
 * Sfondo dell'hero: ShaderGradient. Questo file e' caricato con import
 * dinamico da HeroBackground, dopo il primo disegno (chunk separato, ~290 kB gzip).
 *
 * Config da DESIGN.md sez. 8: plane, luce 3d, brightness <= 1,0, colori scuri,
 * niente grana, niente `env` (scarica un HDR da server esterni).
 * Colori e numeri NON sono scritti qui: si leggono da :root (globals.css).
 */
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { useEffect, useMemo, useState } from "react";

const WARMUP_FRAMES = 6; // frame di assestamento (compilazione shader), non contati
const SAMPLE_FRAMES = 60; // "nei primi 60 fotogrammi" (DESIGN.md sez. 11)
const MIN_FPS = 40;

function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  const str = (name: string) => cs.getPropertyValue(name).trim();
  const num = (name: string, fallback: number) => {
    const v = parseFloat(str(name));
    return Number.isFinite(v) ? v : fallback;
  };
  const phone = window.matchMedia("(max-width: 820px)").matches;
  return {
    color1: str("--shader-color1"),
    color2: str("--shader-color2"),
    color3: str("--shader-color3"),
    brightness: Math.min(num("--shader-brightness", 1), 1),
    speed: num("--shader-speed", 0.2),
    strength: num("--shader-strength", 1.5),
    density: num("--shader-density", 1.2),
    pixelDensity: num(phone ? "--shader-pixel-phone" : "--shader-pixel-desktop", phone ? 0.7 : 1),
  };
}

export default function ShaderLayer({ onSlow }: { onSlow: () => void }) {
  const t = useMemo(() => readTokens(), []);
  const [on, setOn] = useState(false);

  // Misura gli fps dei primi fotogrammi; sotto soglia passa al fallback e non riprova.
  useEffect(() => {
    let raf = 0;
    let frame = 0;
    let t0 = 0;
    let last = 0;
    let cancelled = false;
    const tick = (now: number) => {
      if (cancelled) return;
      // scheda in background: le misure non valgono, si riparte
      if (last && now - last > 500) {
        frame = 0;
        t0 = 0;
      }
      last = now;
      frame++;
      if (frame === WARMUP_FRAMES) setOn(true);
      if (frame === WARMUP_FRAMES) t0 = now;
      if (frame === WARMUP_FRAMES + SAMPLE_FRAMES) {
        const fps = (SAMPLE_FRAMES * 1000) / (now - t0);
        if (fps < MIN_FPS) {
          onSlow();
          return;
        }
      }
      if (frame <= WARMUP_FRAMES + SAMPLE_FRAMES) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [onSlow]);

  return (
    <div className={`hero__shader${on ? " on" : ""}`}>
      <ShaderGradientCanvas
        pixelDensity={t.pixelDensity}
        fov={45}
        pointerEvents="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <ShaderGradient
          control="props"
          type="plane"
          animate="on"
          lightType="3d"
          brightness={t.brightness}
          grain="off"
          reflection={0.1}
          color1={t.color1}
          color2={t.color2}
          color3={t.color3}
          uSpeed={t.speed}
          uStrength={t.strength}
          uDensity={t.density}
          uFrequency={0}
          uAmplitude={0}
          cAzimuthAngle={180}
          cPolarAngle={90}
          cDistance={3.6}
          cameraZoom={1}
          positionX={-1.4}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={10}
          rotationZ={50}
        />
      </ShaderGradientCanvas>
    </div>
  );
}

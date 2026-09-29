"use client";
import { useEffect, useState } from "react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

const V: Record<string, object> = {
  default: {},
  dark3d: { color1: "#05080b", color2: "#12303a", color3: "#2b2350", brightness: 0.8, grain: "off" },
  darkenv: { color1: "#05080b", color2: "#12303a", color3: "#2b2350", lightType: "env", grain: "off" },
  darkLow: { color1: "#05080b", color2: "#12303a", color3: "#2b2350", brightness: 0.4, grain: "off", uSpeed: 0.1 },
};
export default function Lab() {
  const [v, setV] = useState<string | null>(null);
  useEffect(() => { setV(new URLSearchParams(location.search).get("v") || "default"); }, []);
  if (!v) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#080b0e" }}>
      <ShaderGradientCanvas style={{ position: "absolute", inset: 0 }} pixelDensity={1} lazyLoad={false}>
        <ShaderGradient control="props" type="plane" animate="on" uSpeed={0.2} uStrength={1.5} uDensity={1.5}
          cAzimuthAngle={180} cPolarAngle={90} cDistance={3.6} cameraZoom={1}
          color1="#ff5005" color2="#dbba95" color3="#d0bce1" brightness={1.2} lightType="3d" grain="on" envPreset="city"
          {...V[v]} />
      </ShaderGradientCanvas>
    </div>
  );
}

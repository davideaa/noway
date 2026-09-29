import { ZoomInScene } from "@/components/motion/ZoomInScene";

export const metadata = { title: "Lab: zoom verso l'interno", robots: { index: false } };

export default function LabZoom() {
  return (
    <main className="bg-[#080b0e] text-[#f1f4ee]">
      <ZoomInScene />
      <section className="grid h-svh place-items-center font-mono text-xs text-[#939fa9]">
        Fine della scena
      </section>
    </main>
  );
}

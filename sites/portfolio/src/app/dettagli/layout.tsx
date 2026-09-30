import { FluidCursor } from "@/components/motion/FluidCursor";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/** /dettagli: fluido al mouse (dietro a tutto), barra alta con le voci, contenuto, footer e osservatore delle entrate. */
export default function DettagliLayout({ children }: LayoutProps<"/dettagli">) {
  return (
    <>
      <FluidCursor />
      <SiteHeader />
      <main id="contenuto" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}

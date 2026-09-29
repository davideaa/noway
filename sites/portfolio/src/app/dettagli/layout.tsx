import { RevealObserver } from "@/components/motion/RevealObserver";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/** /dettagli: barra alta con le voci, contenuto, footer e osservatore delle entrate. */
export default function DettagliLayout({ children }: LayoutProps<"/dettagli">) {
  return (
    <>
      <SiteHeader />
      <main id="contenuto" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}

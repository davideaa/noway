import { PauseButton } from "@/components/motion/PauseButton";

/**
 * Footer. Davide: niente ripetizioni (la frase sul rischio e l'indirizzo sono gia'
 * sopra, nell'avviso col triangolo e in Contatti); resta sempre il link all'avviso.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg py-8">
      <div className="wrap flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <p className="text-sm">
          <a href="#avviso" className="py-3 text-ink underline underline-offset-4 hover:text-acc">
            Avviso sul rischio
          </a>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <PauseButton />
          <a href="#ingresso" className="chip-btn">
            Torna su
          </a>
        </div>
      </div>
    </footer>
  );
}

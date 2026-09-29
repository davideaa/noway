import { PauseButton } from "@/components/motion/PauseButton";
import { EMAIL_SHOWN, MAILTO, RISK_SHORT } from "@/lib/site";

/** Footer (COPY.md, "Footer"). Righe con [DA COMPLETARE] omesse: vedi DA-COMPLETARE.md. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg py-8">
      <div className="wrap flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2 text-sm">
          <p className="text-ink">{RISK_SHORT}.</p>
          <p className="text-mut">
            <a href={MAILTO} className="mono py-3 text-ink underline underline-offset-4 hover:text-acc">
              {EMAIL_SHOWN}
            </a>
            {" · "}
            <a href="#avviso" className="py-3 underline underline-offset-4 hover:text-acc">
              Avviso sul rischio
            </a>
          </p>
        </div>
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

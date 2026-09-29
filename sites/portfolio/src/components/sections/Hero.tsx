import { ArrowRight, Mail } from "lucide-react";
import { HeroScene } from "@/components/motion/HeroScene";
import { PauseButton } from "@/components/motion/PauseButton";
import { BacktestTag, Reveal, RiskNote } from "@/components/site/ui";
import { buttonVariants } from "@/components/ui/button";
import { EMAIL_SHOWN, FILM_H1, MAILTO } from "@/lib/site";

// Cifre della fascia (COPY.md v2, 3.1; fonte data/strategie.json). La cifra "mesi di
// risultati in tempo reale" e' [DA COMPLETARE]: non si mostra (vedi DA-COMPLETARE.md).
const STATS = [
  { fig: "3", label: "strategie, su tre mercati che si muovono per motivi diversi" },
  { fig: "4.206", label: "operazioni simulate in 7,7 anni (backtest)" },
  { fig: "93", label: "mesi misurati, mese per mese, senza togliere quelli in perdita" },
  { fig: "6", label: "mesi su 93 in cui hanno perso tutte e tre insieme (backtest)" },
];

export function Hero() {
  return (
    <HeroScene>
      <div className="max-w-[1100px]">
        <Reveal variant="scene">
          <p className="eyebrow chip-solid">
            <b>01</b> &mdash; Ingresso &nbsp;·&nbsp; Oro · Nasdaq · USDJPY · Backtest 2019–2026
          </p>
        </Reveal>
        <Reveal variant="scene" i={1}>
          <h1 id="titolo-hero" className="t-display mt-5">
            {FILM_H1}
          </h1>
        </Reveal>
        <Reveal i={2}>
          <p className="hero__lead mt-6">
            Un portafoglio di tre sistemi automatici su oro (XAUUSD), Nasdaq e USDJPY. Ogni criterio è dichiarato prima
            del test. Ogni numero scomodo resta sul tavolo. E i risultati sono di backtest validati fuori campione: non
            garantiscono rendimenti futuri.
          </p>
        </Reveal>
        <Reveal i={3} className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#metodo" className={buttonVariants()}>
            Vedi come si misura
            <ArrowRight size={16} strokeWidth={1.6} aria-hidden />
          </a>
          <a
            href={MAILTO}
            className={buttonVariants({ variant: "outline" })}
            aria-label={`Scrivi via email a ${EMAIL_SHOWN}`}
          >
            <Mail size={16} strokeWidth={1.6} aria-hidden />
            Scrivi via email
          </a>
        </Reveal>
        <Reveal i={4}>
          <p className="chip-solid t-sec mt-5 max-w-[68ch] text-ink!">
            I risultati sono simulazioni su dati storici. I risultati passati non garantiscono quelli futuri.
          </p>
        </Reveal>
      </div>

      <Reveal i={5} className="mt-10 space-y-3 md:mt-14">
        <div className="flex flex-wrap items-center gap-3">
          <BacktestTag />
          <span className="chip-solid t-note">Periodo 2019.01–2026.09, 93 mesi (il 2026 arriva a settembre)</span>
        </div>
        <ul className="stats">
          {STATS.map((s) => (
            <li key={s.fig} className="stat">
              <span className="fig-xl">{s.fig}</span>
              <span className="t-sec">{s.label}</span>
            </li>
          ))}
        </ul>
        <RiskNote />
        <div className="pt-1">
          <PauseButton />
        </div>
      </Reveal>
    </HeroScene>
  );
}

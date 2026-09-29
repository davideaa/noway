import { ArrowRight, Mail } from "lucide-react";
import { HeroScene } from "@/components/motion/HeroScene";
import { PauseButton } from "@/components/motion/PauseButton";
import { BacktestTag, Reveal, RiskNote } from "@/components/site/ui";
import { buttonVariants } from "@/components/ui/button";
import { EMAIL_SHOWN, MAILTO } from "@/lib/site";

// Cifre della fascia (COPY.md 3.1). La cifra "mesi di risultati in tempo reale"
// e' [DA COMPLETARE]: non si mostra (vedi DA-COMPLETARE.md).
const STATS = [
  { fig: "2", label: "strategie trend following: ROTTURA (M30) e RITRACCIAMENTO (H4)" },
  { fig: "1.122", label: "operazioni simulate in 7,7 anni" },
  { fig: "42,3%", label: "operazioni chiuse in utile: si perde più spesso di quanto si vinca" },
  { fig: "3×", label: "costi attuali: oltre questa soglia il sistema non regge" },
];

export function Hero() {
  return (
    <HeroScene>
      <div className="max-w-[1100px]">
        <Reveal variant="scene">
          <p className="eyebrow chip-solid">
            <b>01</b> &mdash; Ingresso &nbsp;·&nbsp; XAUUSD · Trend following · Backtest 2019–2026
          </p>
        </Reveal>
        <Reveal variant="scene" i={1}>
          <h1 id="titolo-hero" className="t-display mt-5">
            Strategie algoritmiche sull&rsquo;oro, misurate e raccontate senza ritocchi
          </h1>
        </Reveal>
        <Reveal i={2}>
          <p className="hero__lead mt-6">
            Un portafoglio di sistemi automatici sull&rsquo;oro (XAUUSD). Ogni criterio è dichiarato prima del test.
            Ogni numero scomodo resta sul tavolo. E i risultati sono di backtest: non sono risultati reali.
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

      <Reveal i={4} className="mt-10 space-y-3 md:mt-14">
        <div className="flex flex-wrap items-center gap-3">
          <BacktestTag>Backtest · non è un risultato reale</BacktestTag>
          <span className="chip-solid t-note">XAUUSD.p, periodo 2019.01–2026.09</span>
        </div>
        <ul className="stats">
          {STATS.map((s) => (
            <li key={s.fig} className="stat">
              <span className="fig-xl">{s.fig}</span>
              <span className="t-sec">{s.label}</span>
            </li>
          ))}
        </ul>
        <RiskNote level="0.70" />
        <div className="pt-1">
          <PauseButton />
        </div>
      </Reveal>
    </HeroScene>
  );
}

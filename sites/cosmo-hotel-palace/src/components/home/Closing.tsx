"use client";

/*
 * Scena 8 — Chiusura: prenota e contatti (UX 4.3). Lo stesso modulo di /prenota/ (BookingForm),
 * con «Cerca disponibilità» miele: l'unico miele pieno visibile in questa scena. Sotto, «Preferisci
 * parlare con qualcuno?» (telefono, email). Il modulo è già qui: quando la scena è in vista la
 * barra e la pillola di prenotazione si nascondono (attributo su <html>, vedi closing.module.css).
 *
 * Il <BookingProvider> qui sotto non fa nulla se il layout ne monta già uno (i provider annidati
 * passano i figli); serve perché la scena funzioni anche da sola.
 */

import { useEffect, useRef } from "react";
import { BookingForm, BookingNotes, SearchFeedback, SearchLink } from "@/components/booking/BookingForm";
import { BookingProvider } from "@/components/booking/BookingProvider";
import { Icon } from "@/components/art/Icons";
import { Button } from "@/components/ui/button";
import { centralino } from "@/content/contacts";
import { copy } from "@/content/copy";
import { copyHome } from "@/content/copy-home";
import { LineReveal, Reveal } from "./Fx";
import s from "./closing.module.css";

export function Closing() {
  const ref = useRef<HTMLElement>(null);
  const a = copy.prenota.alternativaUmana;

  // il modulo è in pagina: barra e pillola si nascondono finché questa scena è nello schermo
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) root.setAttribute("data-home-prenota", "");
        else root.removeAttribute("data-home-prenota");
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      root.removeAttribute("data-home-prenota");
    };
  }, []);

  return (
    <section id="prenota" ref={ref} data-scena="prenota" aria-labelledby="prenota-titolo" className={s.sezione}>
      <div className={`wrap ${s.grid}`}>
        <header className={s.testa}>
          <LineReveal as="h2" id="prenota-titolo" className={s.h2}>
            {copyHome.chiusura.h2}
          </LineReveal>
          <Reveal as="p" className={`t-lead ${s.corpo}`} i={1}>
            {copyHome.chiusura.corpo}
          </Reveal>
        </header>

        <div className={s.pannello}>
          <BookingProvider>
            <BookingForm idPrefix="chiusura" layout="stack">
              <div className={s.cerca}>
                <SearchLink idPrefix="chiusura" full />
                <SearchFeedback />
              </div>
            </BookingForm>
            <BookingNotes className={s.note} />
          </BookingProvider>
        </div>

        <Reveal className={s.umano} i={2}>
          <h3 className={s.umanoTitolo}>{a.titolo}</h3>
          <p>{a.corpo}</p>
          <div className={s.contatti}>
            <Button asChild variant="brand" size="md">
              <a href={`tel:${centralino.telHref}`}>
                <Icon nome="telefono" size={22} />
                {a.chiama}
              </a>
            </Button>
            <Button asChild variant="outline" size="md">
              <a href={`mailto:${centralino.email}`}>
                <Icon nome="email" size={22} />
                {a.scrivi}
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

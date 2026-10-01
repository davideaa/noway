"use client";

/*
 * Consigliere «Chi viaggia?» (UX 5.1, COPY 3.1). Quattro chip in un radiogroup (frecce da tastiera),
 * la risposta in una scheda sotto (aria-live polite): nome, dati, frase di chiusura, «Vedi {camera}»
 * e «Confronta le tre». La scelta preimposta SOLO gli ospiti del foglio prenotazione (il motore non
 * ha un parametro per il tipo di camera: UX 6.6) e marca come «Consigliata per te» la scheda giusta.
 * Si può non rispondere: nessun passaggio obbligato.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { useBookingOptional } from "@/components/booking/BookingProvider";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { copy, fmt } from "@/content/copy";
import { consigliere, consigliereOrdine, roomById, type ChiViaggia } from "@/content/rooms";
import type { RoomId } from "@/content/types";
import s from "./rooms.module.css";

/* ─────────── La scelta, condivisa fra consigliere e schede ─────────── */

type Scelta = { chi: ChiViaggia | null; camera: RoomId | null; scegli: (c: ChiViaggia) => void };

const AdvisorCtx = createContext<Scelta>({ chi: null, camera: null, scegli: () => {} });

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const booking = useBookingOptional();
  const [chi, setChi] = useState<ChiViaggia | null>(null);
  const scegli = (c: ChiViaggia) => {
    setChi(c);
    // preimposta solo gli ospiti (UX 5.1): non apre il foglio e non sceglie la camera sul motore
    const o = consigliere[c].ospiti;
    booking?.setAdulti(o.adulti);
    booking?.setBambini(o.bambini);
  };
  return (
    <AdvisorCtx.Provider value={{ chi, camera: chi ? consigliere[chi].camera : null, scegli }}>
      {children}
    </AdvisorCtx.Provider>
  );
}

/** La camera consigliata, o `null`. */
export const useConsigliata = (): RoomId | null => useContext(AdvisorCtx).camera;

/* ─────────── Il consigliere ─────────── */

export function Advisor({ className }: { className?: string }) {
  const { chi, scegli } = useContext(AdvisorCtx);
  const k = copy.camere.consigliere;
  const risposta = chi ? k.risposte[chi] : null;
  const room = chi ? roomById(consigliere[chi].camera) : null;

  return (
    <section className={`${s.consigliere} ${className ?? ""}`} aria-labelledby="chi-viaggia">
      <h2 id="chi-viaggia" className="t-h2">
        {k.titolo}
      </h2>
      <p className={s.consigliereSotto}>{k.sottotitolo}</p>

      <ChipGroup
        aria-labelledby="chi-viaggia"
        value={chi ?? undefined}
        onValueChange={(v) => scegli(v as ChiViaggia)}
        options={consigliereOrdine.map((id) => ({ value: id, label: k.opzioni[id] }))}
        className={s.chips}
      />

      {/* Regione sempre presente: il lettore di schermo annuncia la risposta quando cambia */}
      <div className={s.risposta} aria-live="polite" data-vuota={risposta ? "0" : "1"}>
        {risposta && room ? (
          <>
            <p className={s.rispostaNome}>{risposta.camera}</p>
            <p>{risposta.testo}</p>
            <p className={s.rispostaNota}>{k.chiusura}</p>
            <div className={s.rispostaAzioni}>
              <Button asChild variant="brand">
                <Link href={`/camere/${room.slug}/`}>{fmt(k.vedi, { camera: room.nome })}</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="#confronto">{k.confrontaLeTre}</a>
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

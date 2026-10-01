"use client";

/*
 * «Copia l'indirizzo» (UX 8 `/come-arrivare/` e `/contatti/`, COPY 9: «Indirizzo copiato.»).
 * Il messaggio sta in una regione `role="status"` che esiste sempre (anche vuota): i lettori di schermo
 * lo annunciano quando cambia. Compare con 240 ms di dissolvenza, resta 2,4 s e svanisce in 160 ms
 * (MOTION 6.6). Se il browser non permette di copiare, lo dice e mostra l'indirizzo.
 * Senza JavaScript il pulsante non servirebbe: la pagina lo nasconde (SoloJs) e l'indirizzo è scritto.
 */

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/art/Icons";
import { Button } from "@/components/ui/button";
import { indirizzo } from "@/content/contacts";
import { copy } from "@/content/copy";
import { copyPagine } from "@/content/copy-pagine";
import s from "./contact.module.css";

type Esito = "nessuno" | "copiato" | "fallito";

type Props = {
  variant?: "outline" | "brand";
  full?: boolean;
  className?: string;
};

export function CopyAddress({ variant = "outline", full = false, className }: Props) {
  const [esito, setEsito] = useState<Esito>("nessuno");
  // il testo resta nella regione anche mentre svanisce, per non farlo sparire a metà dissolvenza
  const [testo, setTesto] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copia() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(indirizzo.perMappe);
      ok = true;
    } catch {
      ok = false;
    }
    clearTimeout(timer.current);
    setTesto(ok ? copy.comeArrivare.pulsanti.copiato : copyPagine.contatti.copiaFallita);
    setEsito(ok ? "copiato" : "fallito");
    // 2,4 s per «copiato»; il messaggio di errore resta più a lungo (contiene l'indirizzo da copiare a mano)
    timer.current = setTimeout(() => setEsito("nessuno"), ok ? 2400 : 8000);
  }

  return (
    <div className={`${s.copia} ${className ?? ""}`}>
      <Button variant={variant} full={full} onClick={copia} aria-label={copyPagine.contatti.ariaCopiaIndirizzo}>
        <Icon nome="copia" size={22} />
        {copy.comeArrivare.pulsanti.copia}
      </Button>
      <p className={s.esito} role="status" data-visibile={esito === "nessuno" ? "0" : "1"}>
        {testo}
      </p>
    </div>
  );
}

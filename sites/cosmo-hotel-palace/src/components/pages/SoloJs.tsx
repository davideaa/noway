/*
 * Contenuto che serve solo se c'è JavaScript (filtri, pulsanti che copiano): senza JavaScript
 * sarebbe un controllo morto, quindi si nasconde. `<noscript>` mette lo stile che lo spegne.
 * Il contenitore è `display: contents`: non cambia il layout. (UX 4: «Poster+testo sempre presenti,
 * senza JS completa».)
 */
import type { ReactNode } from "react";

export function SoloJs({ children }: { children: ReactNode }) {
  return (
    <>
      <div data-solo-js="" style={{ display: "contents" }}>
        {children}
      </div>
      <noscript>
        <style>{"[data-solo-js]{display:none!important}"}</style>
      </noscript>
    </>
  );
}

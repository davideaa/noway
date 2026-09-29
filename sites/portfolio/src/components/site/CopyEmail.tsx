"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EMAIL_SHOWN } from "@/lib/site";

type State = "idle" | "ok" | "err";

/** Tasto "Copia l'indirizzo" con annuncio per screen reader (COPY.md, microcopy). */
export function CopyEmail() {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(EMAIL_SHOWN);
      ok = true;
    } catch {
      ok = false;
    }
    setState(ok ? "ok" : "err");
    window.clearTimeout(timer.current);
    if (ok) timer.current = window.setTimeout(() => setState("idle"), 4000);
  }

  return (
    <div>
      <button type="button" className="chip-btn h-11" onClick={copy}>
        {state === "ok" ? <Check size={16} strokeWidth={1.6} aria-hidden /> : <Copy size={16} strokeWidth={1.6} aria-hidden />}
        Copia l&rsquo;indirizzo
      </button>
      <p className={`t-note mt-2 min-h-[1.5em] ${state === "err" ? "text-bad" : "text-ok"}`} role="status" aria-live="polite">
        {state === "ok" && "Indirizzo copiato"}
        {state === "err" && "Non è stato possibile copiare. Seleziona l’indirizzo e copialo a mano."}
      </p>
    </div>
  );
}

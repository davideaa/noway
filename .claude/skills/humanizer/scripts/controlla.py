#!/usr/bin/env python3
"""Segnala in un testo italiano i segnali tipici della scrittura IA (vedi references/segnali.md).

  python3 controlla.py testo.txt
  echo "testo" | python3 controlla.py -

Non corregge niente: elenca riga per riga cosa guardare. Alla fine stampa un riepilogo
(densità di segnali, lunghezza media e varietà delle frasi). Le segnalazioni vanno
giudicate a mano: lo script non capisce il contesto.
"""
import re, statistics, sys

PAROLE = {
    "lessico gonfio": r"\b(fondamental[ei]|crucial[ei]|essenzial[ei]|imprescindibil[ei]|indispensabil[ei]|vital[ei]|approfondi\w*|addentr\w+|esplor\w+|immerg\w+|scopri(re|te)?|svela\w*|panoram\w+|testimonianz\w+|sottolinea\w*|evidenzia\w*|metten?do in luce|valorizz\w+|ottimizz\w+|potenzi\w+|favori\w+|promuov\w+|incentiv\w+|garanti\w+|vibrant[ei]|suggestiv\w+|mozzafiato|straordinari\w+|variegat\w+|poliedric\w+|sfaccettat\w+|multiforme|sinergi\w+|olistic\w+|innovativ\w+|all'avanguardia|rivoluzionari\w+|meticolos\w+|minuzios\w+|intricat\w+|cardine|pilastr\w+|fulcro|colonna portante|robust\w+|prezios\w+|dinamic\w+|plasm\w+|ridefini\w+|trasversal\w+|peculiar\w+|intrinsec\w+|implementa\w*|fruibil\w+|fruire|declina\w+)\b",
    "frase fatta": r"(a 360 gradi|in continua evoluzione|nell'era digitale|al giorno d'oggi|nel mondo di oggi|fiore all'occhiello|esperienza (unica|indimenticabile|autentica)|nel cuore d|incastonat\w+|immers\w+ nel verde|connubio perfetto|dove la tradizione incontra|lasciati conquistare|punto di riferimento|valore aggiunto|chiave di volta|a tutto tondo|segno indelebile|profondamente radicat\w+|punto di svolta|ruolo (cruciale|fondamentale|chiave|centrale|determinante)|sempre più|cura dei dettagli|mix perfetto|perfetto equilibrio)",
    "verbo al posto di è/ha": r"\b(vanta|vantano|funge da|fungono da|si configura come|si pone come|si presenta come|costituisce|costituiscono|rappresenta|rappresentano|dispone di|si erge)\b",
    "gerundio di commento": r",\s*(sottolineando|evidenziando|mettendo in luce|contribuendo|garantendo|assicurando|riflettendo|simboleggiando|favorendo|promuovendo|rafforzando|consolidando|testimoniando|segnando|plasmando|offrendo|creando|permettendo)\b",
    "parallelismo negativo": r"(non (è|sono) solo\b|non solo\b.{0,80}\bma anche|non si tratta (solo )?di\b.{0,80}\bma\b|più che\b.{0,40},\s*(è|sono)\b|niente\b[^.]{0,30},\s*niente\b)",
    "attribuzione vaga": r"\b(molti esperti|secondo (alcuni|molti) (esperti|osservatori|studiosi)|alcuni critici|numerosi studi|diversi studi|studi dimostrano|è opinione diffusa|gli esperti (ritengono|concordano|sostengono))\b",
    "conclusione a schema": r"\b(in conclusione|in sintesi|in definitiva|riassumendo|per concludere|tirando le somme|nel complesso|guardando al futuro|nonostante (queste|le) sfide|resta da vedere)\b",
    "frase da chatbot": r"(\bcerto!|\bcertamente!|\bassolutamente!|ottima domanda|hai (perfettamente |assolutamente )?ragione|ecco a te|spero (ti|che questo ti|vi) sia utile|spero (che )?(questo )?(ti|vi) aiuti|fammi sapere|fatemi sapere|vuoi che\b|c'è altro che|è importante notare|vale la pena (notare|sottolineare|ricordare)|va (sottolineato|precisato) che|è bene ricordare|sulla base delle informazioni disponibili|come modello linguistico|al momento del mio ultimo aggiornamento|di seguito trovi|in questa sezione vedremo)",
    "vizio di Claude": r"(la chiave è|il punto è che|ecco il punto|la verità è che|il bello è che|in parole povere|in poche parole|detto questo|semplice ma efficace|fa la differenza|cambia le carte in tavola|il risultato\?|la differenza\?|il motivo è semplice)",
    "collegamento vago": r"\b(è (strettamente )?legat\w+ a|è associat\w+ a|in connessione con|particolarmente associat\w+)\b",
    "transizione meccanica a inizio frase": r"(^|[.!?]\s+)(Inoltre|Tuttavia|Infine|In primo luogo|In secondo luogo|D'altra parte|Di conseguenza|Pertanto|In tal senso|In quest'ottica|Alla luce di)\b",
    "segnaposto o residuo": r"(\[[^\]]{2,40}\]|XX/XX|xx-xx|utm_source=|oaicite|contentReference|INSERT_|\(aggiungi qui)",
}
FORMA = {
    "trattino lungo —": r"—",
    "grassetto Markdown": r"\*\*[^*]+\*\*",
    "titolo Markdown": r"^\s*#{1,6}\s",
    "separatore ---": r"^\s*-{3,}\s*$",
    "emoji": r"[\U0001F300-\U0001FAFF☀-➿✅❌]",
    "etichetta in grassetto + due punti": r"\*\*[^*]{1,30}:\*\*",
}
TRE = re.compile(r"\b(\w+),\s+(\w+)\s+e\s+(\w+)\b")  # «elegante, moderno e accogliente»


def frasi(testo):
    return [f for f in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", testo)) if len(f.split()) > 2]


def main():
    sorgente = sys.argv[1] if len(sys.argv) > 1 else "-"
    testo = sys.stdin.read() if sorgente == "-" else open(sorgente, encoding="utf-8").read()
    righe = testo.splitlines()
    totale, per_tipo = 0, {}
    for n, riga in enumerate(righe, 1):
        trovati = []
        for tipo, pat in {**PAROLE, **FORMA}.items():
            for m in re.finditer(pat, riga, re.I | re.M if tipo in PAROLE else re.M):
                trovati.append((tipo, m.group(0).strip()))
        for m in TRE.finditer(riga):
            trovati.append(("elenco da tre", m.group(0)))
        if trovati:
            print(f"riga {n}: " + riga.strip()[:110])
            for tipo, testo_m in trovati:
                print(f"   - {tipo}: «{testo_m}»")
                per_tipo[tipo] = per_tipo.get(tipo, 0) + 1
                totale += 1
    parole = len(testo.split()) or 1
    lunghezze = [len(f.split()) for f in frasi(testo)]
    print("\n== riepilogo ==")
    print(f"parole: {parole}, segnalazioni: {totale} ({totale * 100 / parole:.1f} ogni 100 parole)")
    for tipo, c in sorted(per_tipo.items(), key=lambda x: -x[1]):
        print(f"  {c:3d}  {tipo}")
    if len(lunghezze) >= 4:
        media, dev = statistics.mean(lunghezze), statistics.pstdev(lunghezze)
        print(f"frasi: {len(lunghezze)}, lunghezza media {media:.1f} parole, variazione {dev:.1f}")
        if dev < 0.35 * media:
            print("  ! frasi troppo regolari: alterna frasi lunghe e corte")
    if totale * 100 / parole > 3:
        print("  ! densità alta: il testo sembra scritto da un'IA")


if __name__ == "__main__":
    main()

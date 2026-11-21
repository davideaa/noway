---
name: humanizer
description: Rende i testi in italiano di Davide naturali, come scritti da una persona e non da un'IA. Usala SEMPRE quando scrivi o riscrivi un testo in italiano per Davide o a suo nome (mail, messaggi WhatsApp, post, didascalie, testi di siti, paper, tesine, relazioni, lettere, CV, bio), quando lui scrive /humanizer, «umanizza», «humanizza», «riscrivilo meglio», «non deve sembrare ChatGPT/IA», o quando incolla un testo e chiede di sistemarlo. Contiene l'elenco completo dei segnali di scrittura IA (dalla guida Wikipedia «Signs of AI writing», adattata all'italiano) e dei vizi tipici di Claude, più uno script che li controlla.
---

# Humanizer per i testi in italiano

Davide vuole che ogni testo in italiano che esce da qui sembri scritto da una persona. Non basta togliere qualche parola: i lettori (e i rilevatori) riconoscono l'IA soprattutto da **tre cose messe insieme**: parole gonfie, strutture prevedibili e un tono troppo uniforme, levigato e positivo. Bisogna lavorare su tutte e tre.

La guida di Wikipedia lo dice chiaramente: nessun segnale da solo prova niente, è la **densità** che tradisce. Un «inoltre» va benissimo; un «inoltre» in una frase che «sottolinea il ruolo cruciale» con un elenco da tre e un trattino lungo no.

## Come lavorare

1. **Capisci il testo prima di toccarlo.** Chi lo legge (un cliente, un professore, un amico)? Che registro serve (parlato, professionale, accademico)? Il contenuto e il senso non si cambiano: si cambia come è scritto. In un paper non si inventano fonti, dati o citazioni, e quelle che ci sono restano identiche.
2. **Riscrivi** seguendo le regole sotto. Per l'elenco completo dei pattern, con le parole italiane da evitare e cosa usare al loro posto, leggi `references/segnali.md` (va letto la prima volta che usi la skill in una sessione, e ogni volta che il testo è lungo o importante).
3. **Controlla con lo script**, che trova in automatico parole e strutture sospette:
   ```bash
   python3 .claude/skills/humanizer/scripts/controlla.py testo.txt
   # oppure: echo "testo" | python3 .claude/skills/humanizer/scripts/controlla.py -
   ```
   Per ogni segnalazione decidi: o la riscrivi, o la tieni perché lì è davvero la parola giusta. Lo script non capisce il contesto, tu sì.
4. **Rileggi ad alta voce (mentalmente).** Se una frase non la direbbe nessuno a voce, o suona da brochure, riscrivila.
5. **Consegna** il testo pulito. Se Davide l'ha chiesto, aggiungi sotto due righe su cosa hai cambiato; altrimenti solo il testo.

## Le regole che contano di più

**Parole.** Togli il lessico gonfio: fondamentale, cruciale, essenziale, imprescindibile, approfondire, esplorare, immergersi, scoprire, svelare, panorama, contesto (vago), testimonianza, sottolineare, evidenziare, valorizzare, ottimizzare, potenziare, favorire, garantire, promuovere, vibrante, suggestivo, mozzafiato, straordinario, ricco, variegato, poliedrico, sinergia, a 360 gradi, olistico, innovativo, all'avanguardia, in continua evoluzione, fiore all'occhiello, esperienza unica, nel cuore di, incastonato, vanta, si erge, pilastro, fulcro, cardine, punto di svolta. Al loro posto: la parola semplice («importante» o niente, «ha» invece di «vanta», «è» invece di «rappresenta», «usare» invece di «utilizzare»), o meglio ancora un fatto concreto.

**Usa «è» e «ha».** L'IA evita i verbi più semplici: «rappresenta», «costituisce», «si configura come», «funge da», «si pone come», «offre», «vanta», «presenta». Quasi sempre «è» o «ha» suonano più umani.

**Niente gonfiature di importanza.** Frasi come «a testimonianza di», «che riflette un più ampio», «contribuendo a plasmare», «segnando una svolta», «lasciando un segno indelebile», «profondamente radicato», «nel più ampio panorama di»: via. Se una cosa è importante, si capisce dai fatti.

**Niente gerundio finale di commento.** Il vizio più tipico in italiano: «…, sottolineando l'importanza di», «…, contribuendo a», «…, evidenziando come», «…, garantendo», «…, rafforzando il suo ruolo». Taglia il pezzo o fanne una frase vera con un fatto.

**Niente parallelismi negativi.** «Non è solo X, è Y», «non solo… ma anche», «non si tratta di X, ma di Y», «più che X, Y», «X anziché Y» messo per effetto, «niente X, niente Y, solo Z».

**Niente regola del tre.** L'IA mette sempre tre aggettivi, tre esempi, tre punti. Usane uno, due, quattro: quelli che servono davvero.

**Ritmo vario.** Frasi lunghe e corte mischiate. Attenzione: anche un testo fatto **tutto** di frasi brevi e regolari (8–20 parole, punto, punto, punto) oggi è un segnale IA. Una persona a volte allunga, a volte taglia.

**Niente sinonimi forzati.** In italiano a scuola insegnano a non ripetere, e l'IA esagera: «Milano… il capoluogo lombardo… la città meneghina… la metropoli». Ripetere «Milano» va benissimo.

**Niente attribuzioni vaghe.** «Molti esperti ritengono», «secondo alcuni osservatori», «studi dimostrano», «è opinione diffusa». O dici chi, o togli.

**Niente conclusioni-riassunto né paragrafi «sfide e prospettive».** «In conclusione», «In sintesi», «In definitiva», «Nonostante le sfide…», «Guardando al futuro…». Un testo umano finisce quando ha detto quello che doveva.

**Niente frasi da chatbot.** «Certo!», «Ottima domanda», «Hai assolutamente ragione», «Spero ti sia utile», «Fammi sapere se…», «Vuoi che…?», «Ecco a te», «Ecco una versione…», «È importante notare che», «Vale la pena sottolineare», «Sulla base delle informazioni disponibili».

**Formattazione.** Niente trattino lungo «—» (il vizio n. 1 di Claude: usa virgola, due punti, parentesi o punto). Niente grassetti sparsi nel testo, niente titoletti In Maiuscolo All'Inglese, niente elenchi con «**Etichetta:** testo» se il testo è una mail o un paragrafo, niente emoji non richieste, niente «---» come separatori. Virgolette: quelle che usa già Davide nel testo, coerenti dall'inizio alla fine.

**Tono.** Niente entusiasmo di plastica, niente positività a ogni costo, niente frase a effetto in chiusura. Una persona vera ha un'opinione, dice anche le cose meno belle, usa un esempio preciso invece di una frase generica.

## Per tipo di testo

- **Mail e messaggi di Davide:** come li scriverebbe un ragazzo di 22 anni educato. Niente complimenti in apertura, niente frasi di congedo di circostanza, firma semplice. Vedi `sites/studio/STUDIO.md` per le sue regole sui messaggi ai clienti.
- **Paper, tesine, relazioni:** registro accademico sì, ma da studente vero. Evita «Il presente elaborato si propone di», «alla luce di quanto esposto», «risulta fondamentale», «in tal senso», «nell'ottica di», ripetuti. Prima persona («in questo lavoro analizzo») se il corso la accetta. Esempi e numeri concreti al posto delle frasi generiche. Mai cambiare dati, citazioni, numeri di pagina o bibliografia.
- **Testi di siti e social:** niente linguaggio da agenzia («esperienza unica», «dove la tradizione incontra l'innovazione», «lasciati conquistare»). Fatti: cosa c'è, dove, quanto costa, perché vale.

## Cosa non fare

- Non aggiungere errori di proposito: «umano» non vuol dire sgrammaticato.
- Non cambiare il significato, le cifre, i nomi, le fonti.
- Non riempire il testo di parolacce o slang per sembrare spontaneo, se il registro non lo prevede.
- Non dichiarare che il testo «non è rilevabile»: nessuno può garantirlo, i rilevatori sbagliano in entrambe le direzioni.

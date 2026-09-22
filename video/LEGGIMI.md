# Il reel

Video verticale 1080×1920, 50 secondi, **un solo piano sequenza**.

    python3 video/reel.py                      # rende video/reel.mp4, muto
    python3 video/reel.py --audio brano.mp3    # monta l'audio
    python3 video/battiti.py brano.mp3         # misura BPM e battiti

## Non ci sono scene

Le versioni prima erano otto scene che si dissolvevano l'una nell'altra, e
dentro ogni scena gli elementi *comparivano* con una dissolvenza e poi
restavano fermi. Questa è una cosa diversa: una sola curva, una sola
inquadratura, e tutto che si trasforma senza fermarsi mai.

| | |
|---|---|
| 0 – 4,5 | Il logo si forma, una lama di luce lo attraversa, si dissolve |
| 4,5 – 15 | La curva si scrive dal vivo, la finestra si allarga da sola |
| 15 – 23 | La curva si sdoppia in tre: oro, nasdaq, insieme |
| 23 – 31 | L'insieme si ripiega sott'acqua — stessi 1.597 punti |
| 31 – 38 | Il sott'acqua si spegne a onda mentre sale la distribuzione |
| 38 – 45,5 | 150 tentativi a caso entrano con la scia, la curva vera li scavalca |
| 45,5 – 50 | Il logo si richiude |

## I quattro meccanismi (`fluido.py`)

**`Vista` — la finestra che si allarga da sola.** La x occupa *sempre* tutta
la larghezza e la y segue il minimo e il massimo cumulativi di quello che è
già disegnato. Risultato: mentre la punta avanza, la parte già scritta si
comprime a sinistra e si schiaccia. Ogni pixel della curva si muove a ogni
fotogramma. È questo che dà la fluidità, non le dissolvenze.

**`morph` — la fusione a onda.** Due serie della stessa lunghezza si fondono
con un ritardo che cresce lungo la serie, così il cambio attraversa la curva
invece di scattare tutto insieme. È come la curva del capitale diventa le
tre gambe, e come le tre gambe si ripiegano sott'acqua: sono sempre gli
stessi 1.597 punti, solo riletti.

**`Camera` — una sola inquadratura.** Dieci tappe per tutti i 50 secondi, e
lei sta sempre in viaggio fra due. Non si azzera mai. Sopra ci sta un respiro
continuo (tre seni a periodi diversi) così anche quando la curva è ferma il
fotogramma non lo è.

**`Scia` — la traccia.** Accumula un pezzo del fotogramma prima. Serve sui
150 tentativi a caso, che senza lascerebbero uno sfarfallio.

## La testina che scorre

Nei tratti in cui un'animazione era finita e non succedeva più niente,
scorre una testina che ripassa i dati e il cruscotto la legge dal vivo:

- **19,6 – 23,4 s** sulle tre gambe, con un puntino su ognuna
- **24,6 – 30,6 s** sulla ripiegazione, e il cruscotto mostra il sott'acqua
  in quel punto esatto
- **34,2 – 37,6 s** sulla distribuzione, riempiendo la probabilità cumulata:
  «81% degli anni sotto +65 R»

## Come si misura se è fluido

Lo stesso metro usato sui riferimenti: quanto cambia un fotogramma rispetto
al precedente, su scala 0–255.

| | movimento medio | minimo su 2 secondi |
|---|---|---|
| prima | 0,22 | **0,01** (due secondi immobili) |
| ora | **0,26** | 0,05 |
| riferimento r8 | 0,25 | — |
| riferimento r1 | 0,47 | — |
| riferimento r6 | 0,92 | — |

Il minimo conta più della media: era il punto in cui il video si fermava.

## I numeri

Tutti da `video/dati.json`, estratto dai report e dal PDF. I controlli sulla
ricostruzione della curva del capitale, sul taglio del fuori campione e
sulle due gambe stanno in `RIFERIMENTI.md` insieme alle misure prese dagli
otto reel di riferimento.

Il logo è `video/logo.png`, ripulito dal rumore di compressione e composto
in somma sul fotogramma: sta su fondo nero, quindi il nero sparisce da solo.

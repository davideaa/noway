# Il reel

Video verticale 1080×1920, 42 secondi, apertura e chiusura sul logo.

    python3 video/reel.py                      # rende video/reel.mp4, muto
    python3 video/reel.py --audio brano.mp3    # misura i battiti e monta l'audio
    python3 video/reel.py --secondi 30         # altra durata
    python3 video/battiti.py brano.mp3         # solo la misura, per controllarla

Niente maniglie, niente didascalie in fondo: lo schermo è tutto per il
numero e per il grafico.

## Le dieci scene

| Scena | Il meccanismo che si muove |
|---|---|
| Logo | Sale dal buio, una lama di luce lo attraversa, pulsa |
| Il gancio | Il capitale si disegna in scala logaritmica, il +1.223% sale |
| Il problema | Tre manopole girano e la curva cambia forma sotto |
| Passo 1 | Il tempo si taglia in due, il lucchetto si chiude, i parametri si bloccano |
| Passo 2 | 150 tentativi a caso, il loro massimo segnato, la curva vera lo scavalca |
| Passo 3 | Le barre degli otto anni crescono, blu dove si è studiato, verde dove no |
| Il prezzo | Il profilo sott'acqua si riempie fino al punto più profondo |
| Monte Carlo | La distribuzione di 10.000 anni, la fascia 5–95, la mediana |
| Le due gambe | Oro, nasdaq e insieme in scala logaritmica: 2,79 × 4,75 = 13,23 |
| Logo | Chiusura |

## La curva del capitale: come è ricostruita, e perché è fedele

Il PDF e i report **non coprono la stessa finestra**, e all'inizio li avevo
mescolati senza accorgermene:

- i report: **2.749 operazioni, 7,7 anni**, dal 2019.01
- il PDF: **2.520 operazioni, 7,03 anni**

La differenza è 229 operazioni e 0,67 anni. Il 2019 ha 344 operazioni, e
229 su 344 è il 67% dell'anno: il PDF non è un altro dataset, è lo stesso
che **parte da fine agosto 2019**. Non è una contraddizione, è una finestra
diversa.

Da lì la ricostruzione: si prende la curva in R dal punto 140 (dove comincia
la finestra del PDF) e si compone ogni operazione a un rischio unico,
cercando quello che porta a 132.328 €. Viene **0,8249% per operazione** —
che sta fra lo 0,65% dell'oro e lo 0,98% del nasdaq, esattamente dove deve
stare per un mix delle due gambe.

I controlli, che non sono stati calibrati e quindi valgono qualcosa:

| | ricostruito | PDF |
|---|---|---|
| capitale finale | 132.328 € | 132.328 € (per costruzione) |
| drawdown massimo | −21,71% | −21,33% |
| tempo sotto il massimo | 87% | 90% |
| sette anni su otto | entro 4 punti | — |

Il drawdown cade a 0,4 punti da quello vero **senza essere stato usato per
calibrare**: è quello che dice che la ricostruzione è buona. Lo scarto
residuo viene dal fatto che la curva è sottocampionata (1.597 punti per
2.749 operazioni), quindi qualche perdita consecutiva si fonde.

**Il 2021 fa eccezione:** ricostruito +22%, il PDF dice +32%. Un rischio
unico non coglie che il mix fra le due gambe cambia ogni anno. Ho provato un
rischio per anno, ma sul 2019 parziale il conto esplode e rompe la catena:
meglio il rischio unico e questa nota.

## Gli altri numeri

Tutti da `video/dati.json`, estratto dai due report e dal PDF. Niente è
scritto a mano nel codice.

**Il taglio del fuori campione è verificato.** 984 operazioni su 2.749
significa tagliare la curva al punto 1.025 di 1.597: i due pezzi valgono
+169,4 R e +180,6 R, cioè esattamente i due numeri del report. La nuvola del
passo 2 e il "sei su un milione" parlano tutti e due di quelle 984
operazioni — se non combaciassero, il confronto non vorrebbe dire niente.

**Le due gambe tornano.** Dai rendimenti annuali del PDF: oro ×2,81,
nasdaq ×4,75, prodotto ×13,32, insieme ×13,35. Il PDF dice 2,79 × 4,75 =
13,23; lo scarto è l'arrotondamento delle percentuali annuali a numero
intero. Le tre curve sono a risoluzione annuale, perché per le gambe
separate ho solo i rendimenti anno per anno.

**Una differenza trovata nel report:** dice che il sistema muore a **5,5×**
i costi, ma il suo stesso grafico incrocia lo zero a **5,757×** (fra +55,7 R
a 5× e −17,9 R a 6×). Quella scena non è più nel reel, ma il testo del
report va corretto lo stesso.

## Il logo

`video/logo.png` è la foto che mi hai mandato, ripulita: sotto il valore 9
è rumore di compressione JPEG, non logo, quindi viene tolto. Si compone in
**somma** sul fotogramma: siccome il logo sta su fondo nero, il nero sparisce
da solo e non si vede nessun riquadro. La lama di luce segue la luminosità
del logo, così illumina il metallo e non il vuoto attorno.

## I battiti, e come si arriva ai secondi esatti

`battiti.py` misura il brano senza sentirlo: calcola l'energia ogni 256
campioni, tiene solo dove sale (è lì che sta il colpo), e l'autocorrelazione
di quel segnale ha un picco al periodo del battito. Poi prova tutte le fasi
dentro un periodo e tiene quella che fa cadere i battiti sui colpi più forti.

Il punto delicato è l'armonico: l'autocorrelazione dà spesso il doppio del
tempo vero. Per questo si sommano i multipli (il battito vero ha un picco
anche a 2×, 3×, 4×; una suddivisione no) e si scende di un'ottava finché il
periodo doppio tiene almeno l'80% del punteggio. Sull'audio del reel di
esempio senza questa correzione usciva 178 BPM, con la correzione 89.

Le scene in `SCENE` non hanno una durata fissa ma un **peso**. `alloca()`
converte i pesi in battiti interi che sommati fanno i secondi chiesti: così
ogni cambio scena cade su un battito **e** il video dura quanto deve,
qualunque sia il BPM del brano.

## Cosa cambiare

- `SCENE` in fondo a `reel.py`: la lista `(peso, funzione, disegna_sul_fotogramma)`.
  Alzare un peso allunga quella scena e accorcia le altre.
- I testi stanno dentro le funzioni `s_*`, una per scena.
- `EYEBROW` in cima a `reel.py` è la scritta in alto a sinistra.

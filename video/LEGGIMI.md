# Il reel

Video verticale 1080×1920, 40 secondi, nello stile del reel di riferimento
che mi hai mandato (@quant_labde).

    python3 video/reel.py                      # rende video/reel.mp4, muto
    python3 video/reel.py --audio brano.mp3    # misura i battiti e monta l'audio
    python3 video/reel.py --secondi 30         # altra durata
    python3 video/battiti.py brano.mp3         # solo la misura, per controllarla

## Cosa racconta

Non spiega i report. Racconta **come si fa a sapere se un metodo per
investire funziona davvero**, a qualcuno che non sa niente di questo mondo:
quattro passaggi, uno per scena, e ognuno si vede muovere.

| Scena | Il meccanismo che si muove |
|---|---|
| Il gancio | La curva si disegna, il +1.223% sale |
| Il problema | Tre manopole si girano e la curva cambia forma sotto: adattare non è prevedere |
| Passo 1 | Il tempo si taglia in due, il lucchetto si chiude sulla metà mai vista, i parametri si bloccano |
| Passo 2 | 150 tentativi a caso riempiono lo schermo, si segna il loro massimo, la curva vera lo scavalca |
| Passo 3 | La ghigliottina scende da 10,8 R a 3 R, la coda si spegne, il totale cala a +180 R |
| Passo 4 | La manopola dei costi sale da 1× a 8×, il totale scende fino a −165 R |
| Il risultato | Curva e sott'acqua insieme, con i tre numeri che contano |
| La chiusura | Cosa servono davvero questi passaggi |

## Da dove vengono i numeri

Da `video/dati.json`, estratto dai due report. La curva sono le 1.597 tappe
vere del capitale in R, cucite anno per anno. Niente è scritto a mano: se
rigeneri i report, rigeneri il json e il reel cambia da solo.

**Il taglio del fuori campione è verificato.** 984 operazioni su 2.749
significa tagliare la curva al punto 1.025 di 1.597: i due pezzi valgono
+169,4 R e +180,6 R, cioè esattamente i due numeri del report. La nuvola del
passo 2 e il "sei su un milione" parlano tutti e due di quelle 984
operazioni, non di tutta la serie — se non combaciassero, il confronto non
vorrebbe dire niente.

**Una differenza trovata nel report:** dice che il sistema muore a **5,5×**
i costi, ma il suo stesso grafico incrocia lo zero a **5,757×** (fra +55,7 R
a 5× e −17,9 R a 6×). Nel video c'è 5,8×, il numero che esce dai dati.

## Lo stile, e da dove l'ho preso

Non ho guardato il video: l'ho tagliato in fotogrammi e ho campionato i
pixel. Il fondo non è nero pieno, è un chiarore radiale centrato al 42%
dell'altezza che va da `#0d0e15` a `#07080d`. I riquadri sono `#1f283b` con
bordo `#384560`. I caratteri sono Archivo (titoli, peso 800 e larghezza 94:
nell'esempio sono leggermente stretti) e IBM Plex Mono con la spaziatura fra
le lettere aperta.

Tutto il contenuto sta fra y=220 e y=1330. Sotto ci va l'interfaccia di
Instagram e qualunque cosa scritta lì viene coperta.

## I battiti, e come si arriva a 40 secondi esatti

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
ogni cambio scena cade su un battito **e** il video dura 40 secondi,
qualunque sia il BPM del brano. Cambiando canzone non si rompe niente.

## Cosa cambiare

- `MANIGLIA` in `reel.py`: ora c'è `@quant_davide`, che me lo sono inventato.
- `SCENE` in fondo a `reel.py`: la lista `(peso, funzione)`. Alzare un peso
  allunga quella scena e accorcia le altre, mantenendo i 40 secondi.
- I testi stanno dentro le funzioni `s_*`, una per scena.

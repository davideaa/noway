# Il reel

Video verticale 1080×1920, nello stile del reel di riferimento che mi hai
mandato (@quant_labde), ma con i numeri di questo progetto.

    python3 video/reel.py                      # rende video/reel.mp4, muto
    python3 video/reel.py --bpm 89             # altra griglia di battiti
    python3 video/reel.py --audio brano.mp3    # misura i battiti e monta l'audio
    python3 video/battiti.py brano.mp3         # solo la misura, per controllarla

## Da dove vengono i numeri

Da `video/dati.json`, estratto dai due report HTML. La curva sono le 1.597
tappe vere del capitale in R, cucite anno per anno; le t, i tetti, lo stress
sui costi e il Monte Carlo sono i valori dei report, non riscritti a mano.
Se rigeneri i report, rigeneri il json e il reel cambia da solo.

Una differenza trovata mentre lo costruivo: il report scrive che il sistema
**muore a 5,5×** i costi, ma il suo stesso grafico incrocia lo zero a
**5,757×** (fra +55,7 R a 5× e −17,9 R a 6×). Nel video c'è 5,8×, che è il
numero che esce dai dati. Il testo del report va corretto.

## Lo stile, e da dove l'ho preso

Non ho guardato il video: l'ho tagliato in fotogrammi e ho campionato i
pixel. Il fondo non è nero pieno, è un chiarore radiale centrato al 42%
dell'altezza che va da `#0d0e15` a `#07080d`. I riquadri sono `#1f283b` con
bordo `#384560`. I caratteri sono Archivo (titoli, peso 800 e larghezza 94:
nell'esempio sono leggermente stretti) e IBM Plex Mono (etichette, con la
spaziatura fra le lettere aperta).

Tutto il contenuto sta fra y=220 e y=1330. Sotto ci va l'interfaccia di
Instagram e qualunque cosa scritta lì viene coperta.

## I battiti

`battiti.py` misura il brano senza sentirlo: calcola l'energia ogni 256
campioni, tiene solo dove sale (è lì che sta il colpo), e l'autocorrelazione
di quel segnale ha un picco al periodo del battito. Poi prova tutte le fasi
dentro un periodo e tiene quella che fa cadere i battiti sui colpi più forti.

Il punto delicato è l'armonico: l'autocorrelazione dà spesso il doppio del
tempo vero. Per questo si sommano i multipli (il battito vero ha un picco
anche a 2×, 3×, 4×; una suddivisione no) e si scende di un'ottava finché il
periodo doppio tiene almeno l'80% del punteggio. Sull'audio del reel di
esempio senza questa correzione usciva 178 BPM, con la correzione 89.

Le scene durano un numero intero di battiti, quindi ogni cambio cade su un
battito. Gli elementi entrano sfalsati dentro la scena, e c'è un respiro
dell'1% sulla pulsazione.

## Cosa cambiare

- `MANIGLIA` in `reel.py`: ora c'è `@quant_davide`, che me lo sono inventato.
- `SCENE` in fondo a `reel.py`: la lista `(battiti, funzione)`. Togliere una
  scena vuol dire togliere una riga.
- I testi stanno dentro le funzioni `s_*`, una per scena.

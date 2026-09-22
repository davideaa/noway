# Il reel — il mosaico

Video verticale 1080×1920, 50 secondi. Versione visivamente opposta a quella
a linee: qui non si scrive niente, ci sono **tessere che migrano**.

    python3 video/reel.py                      # rende video/reel.mp4, muto
    python3 video/reel.py --audio brano.mp3    # monta l'audio
    python3 video/battiti.py brano.mp3         # misura BPM e battiti

## L'idea

Gli stessi 85 mesi del calendario si ridispongono da soli, e basta: una
tessera non nasce e non muore mai, è sempre lo stesso mese in un posto
diverso. Per questo si vede *dove va a finire* ogni mese quando il mosaico
cambia forma.

| | |
|---|---|
| 0 – 4,5 | Il logo |
| 4,5 – 13,8 | Il calendario si riempie, un mese alla volta, in ordine di tempo |
| 13,8 – 20,4 | I mesi escono dalla griglia e si ordinano dal peggiore al migliore |
| 20,4 – 27,4 | Si impilano nella distribuzione |
| 27,4 – 34 | Si dividono in due pile: 58 in utile, 27 in perdita |
| 34 – 44 | 2.749 operazioni si ordinano: il 25% più grandi fa il 61% degli utili |
| 44 – 50 | Il logo |

Ogni tessera parte con un ritardo suo, così il cambio attraversa il mosaico
come un'onda invece di scattare tutto insieme (`mosaico.fondi`).

## Dal pdf, le pagine che non avevo mai aperto

**Pagina 3, il calendario.** 85 mesi, uno per tessera. I controlli tornano:
68% in utile (il pdf dice 68%), migliore +19,5% a 2025.09, peggiore −10,5%
a 2021.11, media +3,25% contro il +3,28% del pdf.

Una cosa che mi era sfuggita: il pdf stampa **«+0» e «−0»** per i mesi
chiusi con un utile o una perdita minima. Schiacciandoli tutti a zero
uscivano 65 mesi in utile su 85 invece di 68. Rimesso il segno, torna.

**Pagina 5, le operazioni.** Il pdf dice che il 25% più grandi fa il 62%
degli utili e il 50% ne fa l'85%. Ricalcolandolo dall'istogramma dei report
— che è un'altra fonte, 2.749 operazioni invece di 2.520 — viene **61% e
83%**. Due dataset diversi che danno la stessa risposta a un punto di
distanza: nel video c'è il 61%, quello che so calcolare.

## Le disposizioni (`mosaico.py`)

| | |
|---|---|
| `calendario` | Griglia 12 colonne × 8 righe |
| `ordinate` | In fila per valore: l'altezza **è** il rendimento del mese |
| `istogramma` | Impilate per fascia: la distribuzione |
| `colonne` | Due pile, utile e perdita |
| `campo` / `in_fila` | Il campo fitto delle 2.749 operazioni |

`dipingi` disegna le tessere direttamente nella matrice del fotogramma (con
qualche migliaio di pezzi passare da PIL uno per uno è troppo lento: 55 ms
contro secondi). `dipingi_varie` invece passa da PIL perché serve una misura
diversa per ogni tessera — nel grafico a colonne l'altezza porta il dato, e
schiacciarla a un quadrato lo buttava via.

## Quanto si muove

Stesso metro usato sui riferimenti: quanto cambia un fotogramma rispetto al
precedente, scala 0–255.

| | medio | minimo su 2 s |
|---|---|---|
| versione a linee | 0,26 | 0,05 |
| **questa** | **0,41** | 0,07 |
| riferimenti | 0,25 – 0,92 | — |

Due punti fermi trovati misurando e chiusi: l'ordinamento delle operazioni
finiva due secondi prima del cambio, e il campo delle operazioni era
calcolato su un riquadro fisso, quindi il respiro della camera non lo
toccava e per due secondi non si muoveva un pixel.

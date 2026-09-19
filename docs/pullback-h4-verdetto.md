# Pullback H4 — non passa i criteri. Ma non e' rotta come il range.

192 configurazioni, XAUUSD.p H4, 2019.06.01–2023.12.31, tick reali,
rischio 0,6%. Criteri dichiarati prima del test (scritti anche in testa
al sorgente): **≥150 trade, PF ≥ 1,20, t ≥ 3,4**.

| Configurazioni che centrano tutti e tre | **0** |
|---|---|
| Che centrano trade + PF | 9 |
| Miglior t fra quelle | **1,61** |

## Perche' non e' la stessa storia del range

| | Range MR | Pullback H4 |
|---|---:|---:|
| Configurazioni in utile | 35% | **73%** |
| Con ≥100 trade, in utile | **0 su 174** | la maggioranza |
| Correlazione trade ↔ profitto | **negativa** | **+0,40** |

| Fascia di trade | Profitto mediano |
|---|---:|
| 100–150 | 234 |
| 150–200 | 219 |
| 200–250 | 360 |
| 250–400 | **713** |

Piu' opera, piu' guadagna. E' la firma opposta a quella del range, dove
ogni riga della stessa tabella peggiorava. **Il meccanismo non e'
invertito: e' solo debole.** La migliore fa 2.190 in 4,6 anni, cioe'
+4,4% l'anno, contro il +26% di S3.

## Il difetto che pesa di piu': nessun plateau sull'EMA

| EMA di trend | Profitto mediano |
|---:|---:|
| 30 | **567** |
| 60 | **−68** |
| 90 | 176 |
| 120 | **643** |

A U. Se il meccanismo fosse reale, allungare il filtro di trend
cambierebbe le cose gradualmente. Un buco in mezzo fra due picchi ai
bordi e' la firma del rumore, non di una struttura. E' lo stesso test
che ha salvato S1: li' la griglia fine mostro' una collina vera
(4,0 / 4,25 / 4,5 = 89 / 83 / 90 punti R), qui no.

## L'esperimento pero' era incompleto

Due parametri su quattro hanno l'ottimo **sul bordo della griglia**, e in
modo monotono:

| Trailing | Profitto mediano | | Buffer stop | Profitto mediano |
|---:|---:|---|---:|---:|
| 2,0 | **634** | | 0,25 | **478** |
| 3,0 | 360 | | 0,50 | 289 |
| 4,0 | 222 | | 0,75 | 282 |
| 5,0 | 96 | | | |

Scendono sempre allontanandosi dal bordo: l'ottimo sta **fuori** da
quello che abbiamo provato. E' gia' successo due volte in questo
progetto (trailing di S1, pendenza di S2) e tutte e due le volte
l'estensione ha trovato un ottimo interno vero.

Quindi una passata di estensione e' dovuta — non per contrattare con il
risultato, ma perche' la griglia non ha testato la zona giusta.
**Costa pero' qualcosa**: piu' configurazioni si provano, piu' si alza
la soglia di t richiesta.

## Regola di arresto, dichiarata adesso

Estensione su 80 configurazioni: trailing 1,0–2,5 e buffer 0,05–0,25,
EMA 20–50 per vedere se il 30 e' una collina o una punta.

**Se il miglior t resta sotto 2,5, la strategia e' chiusa** e si resta a
due gambe: S1 FADE + S3 DONCHIAN.

## Nota di metodo

Il trailing corto che vince (2 ATR, e forse meno) e' in tensione con
quello che abbiamo imparato su S1 e S3, dove il trailing doveva essere
1,5–3 volte la distanza di stop. Qui lo stop non e' un multiplo di ATR
ma la profondita' del ritracciamento, quindi il rapporto e' diverso e il
confronto non e' immediato. Resta il sospetto: se il profitto viene da
movimenti brevi e non dal cavalcare il trend, la premessa della
strategia — "resta dentro dove S3 viene stoppata" — non si sta
verificando.

# Ora di ingresso NFP: 14:29:00 contro 14:29:30 (solo descrittivo)

Scritto il 20/10/2026. **Non pre-registrato, non decide niente.** Il sito
e tutti i test restano con l'ingresso alle 14:29:00.

## Perché

Davide, 20/10: «per te entri alle 14.29, però io nella realtà entro alle
14.30». Letto come 14:29:30, cioè 30 secondi prima del dato. Serve sapere
se i numeri del sito valgono anche per il suo ingresso vero.

## Come

`scripts/descr_ingresso.py`. È lo stesso trade di H-X39, regola B:
- regola H-X8;
- stop H-X37;
- prezzi S4 (spread almeno 30 pips da −20 s a +10 s);
- uscita alle 14:31;
- 148 NFP 2014–2026.

Cambia solo l'ora di ingresso.

Controllo: con l'ingresso alle 14:29:00 il risultato coincide con la
regola B di H-X39 in 148 casi su 148.

## Numeri

| Ingresso | 2014–19 | 2020–26 | Ultimi 3 anni | Tutto (R totali) | Salvato quando giusta |
|---|---|---|---|---|---|
| 14:29:00 (sito) | +0,060 | +0,370 | +0,748 | +0,223 (+33,0) | 68/90 |
| 14:29:30 | +0,037 | +0,368 | +0,761 | +0,211 (+31,3) | 68/90 |
| 14:29:45 | −0,954 | −0,666 | −0,255 | −0,802 (−118,7) | 5/90 |

Le 14:29:30 rispetto alle 14:29:00, NFP per NFP:
- meglio in 39;
- peggio in 38;
- uguale in 71.

## Lettura

- **Le 14:29:30 equivalgono alle 14:29:00.** I numeri del sito valgono
  anche per l'ingresso vero di Davide.
- **Le 14:29:45 cadono dentro lo spread allargato** dell'ipotesi S4: si
  paga lo spread di 30 pips all'ingresso e lo stop salta quasi sempre.
  - Il numero dipende interamente da quell'ipotesi, che è la descrizione
    di Davide del suo broker. Non è misurato sul suo broker.
  - Regola pratica: non entrare negli ultimi 20 secondi.
- **L'ingresso alle 14:30:00 in punto, cioè all'uscita del dato, non è
  misurato.** Lì lo spread è al massimo e conta l'esecuzione al
  millisecondo.

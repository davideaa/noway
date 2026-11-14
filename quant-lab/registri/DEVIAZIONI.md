# Deviazioni dal protocollo e errori corretti

## Protocollo 01

1. **Strategia A — niente reingresso dopo uno stop.** Il protocollo non diceva cosa fare
   dopo uno stop a |z| ≥ 4. Scelta: la coppia non rientra fino alla finestra successiva.
   Decisa nel codice prima del primo run, scritta qui dopo.
2. **Strategia A — prima del 2020 funding = 0.** I perpetui Binance USD-M hanno dati di
   funding solo dal 2020-01. Nel 2019 la gamba short non sarebbe stata eseguibile sui
   perpetui come previsto: il 2019 di A è solo indicativo.
3. **Strategia B — margine del perpetuo fissato al 50% del nozionale.** Il protocollo diceva
   "spot pagato per intero + margine del perpetuo" senza numero. Fissato a 50% (leva 2x sulla
   gamba short) prima del primo run.
4. **ERRORE nel primo run di B (corretto).** Il P&L usava la quantità fissa comprata
   all'ingresso: in una posizione tenuta per anni il valore della posizione cresceva con il
   prezzo (BTC da 7k a 100k) mentre il capitale restava 1 → leva nascosta fino a 10x. La
   versione "sempre aperto" risultava al 68% annuo fuori campione: falso. Corretto con
   nozionale costante ribilanciato ogni giorno, con il costo del ribilanciamento. **I numeri
   del primo run di B non valgono.** La strategia A non ha lo stesso problema in misura
   rilevante (posizioni ≤ 90 giorni, che sono trade reali a quantità fissa).
5. **ERRORE trovato dal revisore indipendente (corretto).** Il costo del ribilanciamento
   giornaliero di B era sottostimato di circa 130 volte: si contava N·|rs − rp| invece di
   N·|rs| sullo spot + N·|rp| sul perpetuo. La deviazione n.4 diceva "con il costo del
   ribilanciamento", e invece di fatto non c'era. Dopo la correzione "sempre aperto" fuori
   campione scende da 4,81% a 3,81% annuo. Il ribilanciamento giornaliero è il caso
   peggiore: senza nessun costo di ribilanciamento si torna a 4,81%. Il valore vero sta tra
   i due e **in entrambi i casi è vicino o sotto il T-bill del periodo (4,49%)**.
6. **Strategia A girata sui prezzi spot, non sui perpetui** (il protocollo diceva perpetui).
   Non dichiarato prima. Il revisore ha misurato l'impatto: nullo (−9,19% annuo in entrambi
   i casi, 23 trade contro 24).
7. **Il p-value del bootstrap è calcolato sull'eccesso rispetto al T-bill**, mentre il
   criterio 1 diceva "rendimento netto > 0". È più severo del dichiarato. Con il rendimento
   semplice: A p = 0,87 (non passa comunque), B "sempre" p ≈ 0 (passerebbe il criterio 1, ma
   non il 2, perché non batte il T-bill).
8. **DSR di A non calcolato nel primo report**: calcolato dopo, vale 0,0004 (soglia 0,95).
   Il DSR di B usa 5 prove invece di 7 più il run invalidato: non cambia l'esito.
9. Altre osservazioni del revisore, minori, non corrette perché non cambiano l'esito e
   correggerle adesso sarebbe ottimizzare guardando l'OOS:
   - Engle-Granger è fatto in una sola direzione; sulla finestra 2023-06 l'altra direzione
     seleziona coppie diverse, quindi la selezione è fragile;
   - in A si può entrare con |z| già ≥ 4: 16 trade su 24 sono stop;
   - in A non c'è un limite alle coppie che condividono una gamba: il −35% del 2023 sono
     cinque coppie tutte short BCH;
   - in B il capitale fermo non incassa il T-bill (vedi report).

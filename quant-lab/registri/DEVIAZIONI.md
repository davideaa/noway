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

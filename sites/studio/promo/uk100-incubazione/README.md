# Reel «UK100 · in incubazione» (06/10/2026)

25 s, 1080×1920, 60 fps. Stile del video di riferimento di Davide (testi animati su fondo nero con bagliore
arancio-rosso: pixel, macchina da scrivere infuocata, luce, scorrimento da destra, rimbalzo) + pannelli «liquid glass».
Grafica tutta ricreata, nessuno screenshot. Dati dalla pagina `dettagli/uk100` del sito (versione 4, zip di Davide).

Dati usati: FTSE 100, H1, backtest MT5 ogni tick 2019–2026; tre gambe (rimbalzo dopo un crollo, lunedì debole,
pullback nel trend); stop su ATR, uscita entro 24–48 ore; dopo 2 perdite di fila rischio dimezzato; 1.763 trade;
fuori campione 2023–2026 in utile; test con 1.000 entrate a caso (−0,043 R contro +0,095 R a trade, batte il 100%);
quasi scorrelata da oro, Nasdaq, USDJPY; giudizio «vantaggio vero ma sottile» → gira in demo.
Nessun rendimento in percentuale nel video. La forma della nuvola di punti è illustrativa (media e strategia sono vere).

Musica (non nel repository): il clip di 10 s del riferimento, ripetuto a tempo (battito 0,3932 s dal 1,256 s):
0→8,73 + 1,256→8,73 + 1,256→fine, dissolvenze 15 ms → 24,88 s.
Render: `render.cjs` della cartella portfolio-claude con `DUR=24.88`.

## Versione 2 (06/10/2026, sera) — quella consegnata
Davide: contenuto più accattivante, risultati, in/out of sample, incubazione = demo live, almeno 30 s, rischio 1%,
e un inizio che mostri la scelta della strategia sul sito (clic su UK100).
- 39,8 s: musica con una frase in più (0→8,73 + 3×[1,256→8,73] + 1,256→fine); le scene della v1 spostate di 7,456 s.
- Intro: pannello «Scegline una.» con le 5 schede del sito ricreate (curve mini vere dal sito v4), cursore, clic su UK100.
- Numeri (curva MT5 della pagina uk100, costi Fusion, rischio 1%, `curva.js`): $10.000 → $39.072 (+290,7%) dal
  02/01/2019 al 01/10/2026; in sample 2019–2022 +63,5%; out of sample 2023–2026 +138,9%; anni 2019–2026 tutti positivi
  (+3, +9, +12, +30, +33, +17, +33, +15 fino a ottobre); discesa massima 20,2%; 1.763 trade.
- Nella pagina c'è anche «$30,671 / +206,7%»: è un valore statico dell'HTML, non coerente con la curva (0,75% → +184%).

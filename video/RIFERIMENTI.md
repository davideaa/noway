# I riferimenti: cosa ho misurato

Otto reel di riferimento (@quantlab / @quant_lab.de), tutti 720×1280 a 30 fps
tranne uno a 25. Non li ho guardati: li ho tagliati in fotogrammi e misurati.
Qui c'è quello che ne è uscito, in numeri. È questa la specifica da seguire.

## Il ritmo — la cosa che sbagliavo di più

| | durata | BPM | cambi di scena | ogni | movimento medio |
|---|---|---|---|---|---|
| r1 | 50,9 s | 86 | 0 | — | 0,47 |
| r2 | 43,8 s | 52 | 7 | 6,3 s | 0,60 |
| r3 | 46,8 s | 65 | 4 | 11,7 s | 0,53 |
| r4 | 46,1 s | 76 | 1 | 46 s | 0,29 |
| r5 | 63,8 s | 76 | 0 | — | 0,25 |
| r6 | 32,0 s | 64 | 6 | 5,3 s | 0,92 |
| r7 | 68,2 s | 89 | 1 | — | 0,27 |
| r8 | 61,3 s | 57 | 4 | 15,3 s | 0,25 |

Il "movimento" è quanto cambia un fotogramma rispetto al precedente, su una
scala 0–255. Valori fra **0,25 e 0,9**: sono video *calmi*. Non stacchi
continui — trasformazioni lente e continue, e pochissimi tagli netti.

**Durata mediana 48 s, non 40.** E i cambi di scena stanno fra i 5 e i 15
secondi, non ogni 4 come facevo io. La scena resta, e dentro cambia qualcosa.

## I colori, campionati dai pixel

| | fondo | verde | rosso | ciano/blu | oro |
|---|---|---|---|---|---|
| r1 (nasdaq) | `#050911` | `#45b281` | | `#5ac1df` | |
| r3 (nasdaq) | `#080c12` | | | `#5670b0` | |
| r4 (news) | `#060a10` | | `#bb5952` | `#43aec8` | |
| r8 (**oro**) | `#0b0c11` | | | | `#ac935b` `#bfa272` |

Due cose:

1. **Il fondo è più scuro e più blu del mio** (`#0d0e15` al centro). Loro
   stanno su `#050911`–`#0b0c11`, più piatto, quasi senza chiarore.
2. **L'accento segue lo strumento.** Il reel sull'oro usa un oro spento
   (`#ac935b`), quelli sul nasdaq il ciano. Per il portafoglio oro + nasdaq
   questo dice: oro per una gamba, ciano per l'altra, verde per l'insieme.
3. **Verde e rosso sono smorzati**: `#45b281` e `#bb5952`, non colori accesi.
   Il mio rosso `#e07149` è troppo arancione, va portato verso `#bb5952`.

## La griglia (misure su 720×1280, fra parentesi il ×1,5 per 1080×1920)

- **Testata** a y≈166 (249): maniglia a sinistra x=65 (98), strumento a destra
  allineato a x≈655 (982). Mono ~11 px (16), grigio, spaziatura fra le
  lettere molto aperta.
- **Titolo** subito sotto, y≈211 (317). In r8 è **allineato a sinistra** e
  piccolo: corpo ~30 px (45). In r1/r3/r6 è centrato e più grosso (~40 px →
  60). Due famiglie, entrambe valide.
- **Occhiello** colorato sopra o sotto il titolo, y≈302 (453), mono ~9 px (13),
  nel colore dell'accento.
- **Numero grosso** ~34 px (51). **Molto più piccolo dei miei 150 px.**
- **Didascalia** centrata in fondo a y≈850 (1275), ~19 px (28).
- Il grafico può occupare **metà schermo e basta**: r8 tiene tutto nella metà
  sinistra e lascia il resto vuoto. Lo spazio vuoto è parte del disegno.

## Gli elementi ricorrenti, quelli da costruire

**Etichette a staffa sul grafico.** Una barra verticale più il testo mono
attaccato: `|ENTRY`, `|STOP LOSS`, `|4.5R`, `|09:30 NY`, `|SAMPLE RESULT`,
`|NEW ALL-TIME HIGH`. È la firma grafica più riconoscibile di tutti e otto.

**Didascalia a due righe.** Sopra una riga mono maiuscola con i dati
(`RISK 4.5R · REWARD 0.5R`, `EQUITY CURVE · LOG SCALE`), sotto la frase
parlata in tondo grigio. **Le frasi sono cortissime**: «Sounds terrible,
right?», «At 1% risk per trade…», «So what happens next?».

**Parole accese dentro la frase.** Nella didascalia la parola chiave è in
colore: «right before major **news**», «liquidity can become **thinner**»,
«in **72.5** percent of cases».

**Striscia di specifiche.** Una riga di campi etichettati con separatori:
`MARKET / TIMEFRAME / FILTER / EXECUTION` → `NASDAQ / 5 MIN / 12 EMA /
AUTOMATED`. Sembra la configurazione di un terminale.

**Testata da terminale.** `● LIVE` con il pallino rosso, `BAR CLOSES IN
00:03`, contatori che scorrono (`NQ 17,966 | ATR 10 | RANGE 12`) e che
**cambiano di continuo** durante il video.

**Sequenza a passi.** Pallini collegati da una linea che si accendono uno
dopo l'altro: `SIGNAL · ORDER · MANAGE · EXIT`. Oppure riquadri impilati
collegati in verticale.

**Catena a pillole.** Riquadretti con la freccia in mezzo:
`09:30 CANDLE → 12 EMA → LONG/SHORT`.

**Confronto a due colonne.** Due riquadri affiancati (`HUMAN` | `ALGORITHM`)
con dentro un elenco che si accende in sequenza, a velocità diverse.

**Testo sbarrato** per le negazioni: ~~NO MANUAL ENTRIES~~ ~~NO GUESSING~~ in
rosso.

**Biforcazione.** Da un punto partono due archi curvi che divergono, verde in
su e rosso in giù, con la percentuale in punta. (r8, per «cosa succede dopo».)

**Barre di avanzamento** orizzontali con il valore allineato a destra:
`5 GIORNI ▬▬▬▬ 65,6%`.

**Candele vere.** Quasi tutti mostrano OHLC con media mobile sopra, righe
orizzontali di riferimento, e un cerchietto sulla candela che conta.

**Zone ombreggiate** sul grafico con l'etichetta dentro: `COMPRESSED`,
`EXPANSION`, `SURVIVED TESTING`.

## Cosa cambia rispetto a quello che ho fatto finora

| | mio | riferimenti |
|---|---|---|
| durata | 42 s | 48 s mediana |
| cambio scena | ogni 4 s | ogni 5–15 s |
| titoli | 80 px centrati | 45–60 px, spesso a sinistra |
| numeri | fino a 150 px | ~50 px |
| didascalie | tolte | ci sono, ma cortissime |
| fondo | `#0d0e15` con chiarore | `#050911` piatto |
| rosso | `#e07149` | `#bb5952` |
| grafici | riempiono la larghezza | anche solo metà schermo |
| annotazioni | poche | etichette a staffa ovunque |

**La contraddizione da sciogliere:** mi avevi detto di togliere le didascalie
in fondo, e tutti e otto i riferimenti ce le hanno. Ma le loro sono di tre o
quattro parole, le mie erano frasi intere: probabilmente il problema era la
lunghezza, non la didascalia. Le rimetto **corte**, e se non ti convincono si
tolgono con una riga.

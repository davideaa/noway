# Shot list v1a — reel 0x100x "tokenizzazione" — 0:00–0:45 (fogli 00–14)

Video: 720x1280, 30 fps, 84,6 s totali. Questa metà copre 0–45 s. La scena 17 continua oltre i 45 s (la finisce l'altra metà).

## Note di lettura

- Tutti i tempi sono le etichette gialle dei fogli (passo 0,25 s). Estraendo un fotogramma con `ffmpeg -ss T` il contenuto risulta in anticipo di circa 0,1–0,25 s rispetto all'etichetta: fare riferimento alle etichette.
- Le percentuali sono sul fotogramma 720x1280: x = larghezza, y = altezza, 0% in alto a sinistra. "cx/cy" = centro, "y min–max" = ingombro verticale.
- Zone coperte dall'interfaccia di Instagram: alto 0–13%, basso 77–100%, destra 90–100%. Nessun testo in questa metà tocca l'alto. Un solo testo cade in basso: "50% GDP OF CHINA" (scena 3, y 87%). Il resto che sconfina è decorativo (sfere/cupola scena 1, pavimento scena 7).
- Colori: esadecimali misurati sui pixel con PIL. Dove scrivo "tinta" il colore ha un gradiente e do i valori campionati.
- Famiglia di carattere: tutto il testo normale è un sans geometrico che somiglia a **Montserrat** (Medium per le didascalie, SemiBold/Bold per i titoli, ExtraBold per "1970s"). Il numero "$10 TRILLION" è un grottesco ultra-condensato (**Anton**, in alternativa Bebas Neue Bold) [INCERTO sulla famiglia esatta]. "sell a building?" è un serif corsivo grassetto tipo Times/Playfair Italic [INCERTO].
- Il video è quasi senza movimenti di camera "veri": quello che sembra una camera è una scala applicata a tutto il gruppo (zoom-out lento) più spostamenti ad ease-out. Lo segnalo scena per scena.

## Didascalia parola-per-parola (elemento ricorrente)

È il sottotitolo del parlato: **una sola parola alla volta**, minuscola, centrata, sempre nella stessa posizione. Si trova nelle scene 1, 2, 4, 5, 7, 9, 10, 13, 14, 15, 16.

- Posizione: cx 50%, cy 16,2%, y min–max 15,2–17,7% (appena sotto la fascia UI del 13%).
- Dimensione: circa 30 px (la parola "attention" è larga 22% = 157 px). Montserrat Medium (500), minuscolo, nessun tracking particolare.
- Colore: #FFFFFF su sfondi scuri, #000000 su sfondi chiari.
- Cambio parola: a 4 fps si vede solo uno scatto da una parola all'altra, senza sovrapposizione visibile (scambio secco o dissolvenza sotto i 0,1 s) [INCERTO]. Ogni parola dura 0,25–0,5 s (segue il ritmo del parlato).
- Elenco con tempo di comparsa: 4,00 you · 4,25 attention · 5,00 he · 5,25 manages · 9,75 and · 10,00 isn't · 10,25 talking · 10,50 about · 10,75 bitcoin · 11,75 is · 12,00 talking · 12,25 about · 15,00 right · 15,50 now · 15,75 financial · 16,25 system · 16,75 running · 17,25 code · 17,75 written · 19,25 when · 19,50 buy · 19,75 a · 20,00 stock · 20,50 it · 20,75 takes · 21,00 two · 21,25 days · 21,75 to · 22,00 actually · 22,50 settle · 23,00 the · 23,25 market · 23,50 closes · 24,00 at · 25,25 "PM" (molto sbiadita, opacità circa 10%) · 29,00 of · 29,25 like · 29,50 the · 29,75 post · 30,00 office · 31,75 if · 32,00 you · 32,25 wanted · 32,50 send · 32,75 message · 33,25 you · 33,50 wrote · 33,75 a · 34,00 letter · 34,50 bought · 34,75 a · 35,00 stamp · 35,50 and · 35,75 waited · 36,25 three · 36,50 days · 40,25 for · 40,50 finance.
- Nota: tra 12,50 e 15,00 e nelle scene 3, 6, 11, 12, 17 la didascalia è assente: lì il testo in scena è già il messaggio.

---

## Scena 1 — 0,00–4,75 — "Larry Fink" (carta di vetro + citazione)

- **Sfondo:** nero grafite piatto **#111111** (nessun gradiente di fondo). Un alone morbido grigio (#2e2e2e al centro, bagliore dei due punti luce) dietro la carta.
- **Elementi:**
  1. Titolo fisso **"HE MANAGES $10 TRILLION"**, tutto maiuscolo, Montserrat SemiBold, bianco #FFFFFF, tracking leggermente aperto. Alla scala 1 (t=3,0): cx 50%, cy 29,1%, y 27,8–30,4%, larga 72% (14,4–85,4%), altezza maiuscole circa 24 px. Parte già visibile al fotogramma 0 (cy 25,6%, larghezza 82,6%).
  2. **Carta di vetro smerigliato** (stile "glassmorphism"): rettangolo ad angoli molto arrotondati (raggio circa 28 px), bordo sottile 1 px chiaro (#c0c0c7 in alto, più luminoso sullo spigolo alto-sinistra), riempimento con gradiente orizzontale: sinistra #a8a8a8–#d0d0d0 (quasi opaco chiaro), centro scuro #2c2c2c–#343538, destra #5b5b5b che torna chiaro #b0b0b0 sul bordo destro. A scala 1 (t=3,0): x 13,5–86,5%, y 36,5–49,0% (alta 12,6%). Due **punti luce** bianchi con alone: uno sul bordo alto (x 43%, y 36,4%) e uno sul bordo basso (x 57,5%, y 49%), colore #909090–#FFFFFF.
     - Dentro la carta: **ritratto circolare** di Larry Fink (foto di un uomo anziano, occhiali, camicia bianca e giacca scura, fondo scuro) con anello chiaro (#b5b5b5), diametro circa 12% della larghezza, cx 19,5%, cy 42,6%.
     - Nome **"Larry Fink"** (Montserrat Medium, bianco #ECE6EA, circa 30 px; x 34,7–55,7%, cy 42%).
     - Sottotitolo **"CEO of BlackRock"** (Montserrat Regular circa 13 px, grigio #B1B1B3; x 34,3–50,1%, cy 44%).
     - **Badge** a destra: quadrato arrotondato scuro (da #282828 a nero, bordo grigio #6a6a6a), x 68,8–84,6%, y 38,7–47,2% (cx 76,7%, cy 43%), con la scritta bianca **"BlackRock"** (bold circa 11 px).
  3. **Citazione** **“something is the future”** con virgolette tipografiche curve, minuscolo, Montserrat Medium circa 28 px, bianco (picco #FFFFFF, appare un po' più morbido, #605F60 medio). A riposo: cx 51%, cy 56,5%, y 54,8–58,2%, x 22,9–79,2%.
  4. **Figura-persona stilizzata** in basso a destra: **testa** = sfera di vetro vuota (bordo chiaro #6c6c6c sfumato, interno #161616 quasi nero), diametro circa 27–30% della larghezza; **spalle** = cupola/semiellisse con gradiente verticale #7b7b7b (cima) → #2e2e2e → #111111 (base), larga 58%.
- **Animazione:**
  - 0,00–1,25: la **carta** parte ingrandita (scala circa 2,6x, ritagliata dal bordo destro, centrata in basso a sinistra: x 8–100%, y 61–91%, ritratto cx 34%, cy 76%) e si rimpicciolisce e sale fino alla posizione finale (a 1,25: x 7–93%, y 34–50%). Ease-out morbido, 1,25 s. Il titolo in alto resta fermo.
  - 0,25–1,75: il **nome si scrive** a macchina sulla carta: "Larry" (0,25) → "Larry Fir" (0,5) → "Larry Fin" (1,0) → "Larry Fink" (1,25). Poi "CEO" (1,25) → "CEO of" (1,5) → "CEO of BlackRock" (1,75). Il badge BlackRock compare a 1,25 insieme al nome completo.
  - 1,25–3,25: la **citazione** entra parola per parola: ogni parola nasce grande, sfocata (blur circa 6–8 px), semitrasparente e bassa (a 1,25 "mething" a y 79%; a 1,5 “something a y 64%; a 1,75 “something y 60% + "is" y 66%; a 2,0 "the" y 70%; a 2,25 "future" y 77%), poi tutte salgono, perdono il blur e si allineano su una sola riga a y 56,5% (a 3,0 "future”" è ancora 2% più in basso; a 3,25 la riga è allineata). Effetto "onda": le ultime parole sono più basse. Ogni parola parte a distanza di circa 0,25 s dalla precedente.
  - Da 1,25 a 4,5: **zoom-out lento** di tutto il gruppo (titolo, carta, citazione). Larghezza del titolo: 82,6% (1,25) → 78% (2,0) → 72,3% (3,0) → 66% (4,0) → 61,5% (4,5). Cioè scala da 1,0 a circa 0,75, perno attorno a (50%, 54%): il titolo scende da cy 25,6% a circa 32%. Andamento ease-out continuo.
  - 2,0–4,5: la **figura-persona** sale dal basso a destra: a 2,0 solo un lembo di cupola nell'angolo (x 95%, y 99%); a 2,5 sfera visibile (cx 83%, cy 90%); a 3,0 sfera cx 83,7%, cy 83% con cupola sotto; a 3,75 sfera cx 76%, cy 77%; a 4,0 testa cx 75%, cy 72%, diametro 27%, spalle top y 81%; a 4,5 testa cx 71%, cy 68%, diametro 22%. Sale e si sposta verso sinistra, con lo zoom-out.
  - 4,00 e 4,25: compaiono in alto le didascalie "you" e "attention" (vedi sopra).
  - 4,25–4,75: **dissolvenza a nero** dell'intera scena (lo sfondo passa #111111 → #0b0b0b a 4,25 → #060606 a 4,5 → #010101 a 4,75).
- **Transizione verso la scena 2:** dip-to-black (fade out 4,25–4,75, fade in 5,00–5,75). Il nero minimo è #010101 a 4,75.
- **Contatori:** nessuno.

## Scena 2 — 5,00–7,50 — Pila di monete + "$10 TRILLION"

- **Sfondo:** nero piatto **#0F0F0F** (a 5,0 è ancora #030303 e sale a #0F0F0F entro 5,75 per la dissolvenza in entrata).
- **Elementi:**
  1. **Pila di monete 3D**: dischi neri lucidi (flat top con simbolo **"$"** inciso color #DEE3E0, bordo metallico scuro #242926/#101010), una colonna centrale alta e due pile più basse ai lati (sinistra più bassa, destra a metà). Riflesso morbido sfocato sul "pavimento" sotto. **Luce verde neon** (picco #62E16B) sul bordo superiore sinistro delle monete e una riga verde/bianca sullo spigolo destro delle monete.
  2. Testo **"$10 TRILLION"**: grottesco ultra-condensato (Anton) bianco #FFFFFF; "$10" circa 1,5 volte più alto di "TRILLION" (a t=8,5, altezza cifre circa 110 px contro 74 px). Allineati sulla stessa linea di base.
- **Posizioni:**
  - Pila a 5,25: x 19–82%, y 57–68% (bassa e piccola); a 5,75: la colonna sale; a 7,0: pila x 20–82%, y 41–69% (alta circa 28%), cx 51%.
  - Testo a 6,25–6,5: cx 50%, cy 25–28%, x 19,7–80,1% (60% largo), "$10" y 17,4–25,7% (lettere + simbolo), "TRILLION" y 23,8–30%+. A 7,5: x 22,8–77,1%, cy 26%.
- **Animazione:**
  - 5,00–5,75: la pila di monete **emerge dal buio**: a 5,0 è piccola e bassa (circa 0,5x, x 19–64%, y 60–65%, opacità bassa), a 5,25 e 5,5 si apre e si allarga (x 19–83%) con la luce verde in alto a sinistra che si accende; a 5,75 la colonna comincia ad alzarsi.
  - 5,75: "$10" compare grigio (opacità circa 50%) a x 30%, cy 33%. A 6,0 "$10" è a cx 30,6%, cy 25,6% e **"TRILLION"** entra da sotto-destra sfocato e scuro (x 46–81%, y 36,6%, opacità circa 30%). A 6,25 "TRILLION" è salito sulla linea di base e il titolo è pieno.
  - 5,75–7,5: la pila continua a **crescere in altezza** (si aggiungono monete) a ritmo costante: cima della colonna da y 51% (6,0) a 47,5% (6,5) a 44% (7,0) a 39% (7,5 con zoom-out).
  - Da 6,5 il gruppo (titolo + pila) fa **zoom-out lento**: titolo largo 61% (6,5) → 54% (7,5) → 39% (9,0).
  - Le didascalie "he" (5,0), "manages" (5,25, 5,5) sono in alto.
- **Transizione verso la scena 3:** nessuno stacco: la mappa entra dal basso sopra la stessa scena.
- **Contatori:** "$10 TRILLION" è statico (non conta). Nessun contatore.

## Scena 3 — 7,50–9,75 — Mappa della Cina "50% GDP OF CHINA"

- **Sfondo:** stesso **#0F0F0F**. Titolo e pila di monete della scena 2 restano e continuano lo zoom-out (a 9,0: titolo x 30,4–69,4%, cy 26,7%; pila x 22–80%, y 34–62%, cx 51%).
- **Elementi:**
  1. **Mappa della Cina** (sagoma piatta): metà ovest **rosso bandiera #CA4034** con **stelle gialle #F9EE52** (1 grande + 4 piccole, disposte come nella bandiera, grande a circa x 35% della mappa); metà est **grigio-verde con gradiente** (#5A6459 al centro, #AAACA9 in alto a destra sulle coste, #3D473C in basso). Taglio **verticale netto** tra rosso e grigio a x ≈ 51,5% del fotogramma. Aspetto "mappa 2D flat".
  2. Etichetta **"50% GDP OF CHINA"**, tutto maiuscolo, Montserrat Medium circa 22 px, tracking leggermente aperto, bianco #FFFFFF.
- **Posizioni a riposo (t=9,0):** mappa x 21,7–80%, y 55–82,5% (cx 50,7%, cy 68,6%); etichetta cx 53%, cy 87–89%, x 29–78%, y 86–92%. A 9,5 l'etichetta è su una riga sola: x 29–75%, cy 87%, y 86–88%. ATTENZIONE: cade nella fascia UI del basso (77–100%).
- **Animazione:**
  - 7,50: la mappa entra **da sotto, enorme** (scala circa 3x, vede solo il bordo rosso con la stella gialla, x 0–100%, y 82–100%). 7,75: x 5–94%, y 61–100%. 8,0: x 12–88%, y 59–99%. 8,5: x 18–82%, y 55–83%. 9,0: x 22–80%, y 55–82%. Cioè sale e si rimpicciolisce con **ease-out morbido**, circa 1,25 s.
  - Etichetta: le parole arrivano **una alla volta**, ciascuna **più in basso della precedente** (a 7,75 "50%" a x 13%, y 99%; a 8,0 "50%" x 23%, y 95%, "GDP" y 99%; a 8,5 "50% GDP" su una riga (cy 94,5%) e "OF" più sotto (cy 97%); a 8,75 "50% GDP" e "OF CHINA" scaglionate; a 9,0 "50% GDP OF" a y 88% e "CHINA" a y 91%, bassa a destra). Poi tutte salgono e si allineano su una riga (9,25–9,5). Le parole all'ingresso sono sfocate.
  - 9,25–9,75: la **mappa scivola fuori a destra** (a 9,25 x 30–87%; a 9,5 x 50–100%) con ease-in. Pila e "$10 TRILLION" restano fermi un attimo.
- **Transizione verso la scena 4:** **taglio netto** a 9,75 da nero #0F0F0F a chiaro #E7E7E7 (nessuna dissolvenza).
- **Contatori:** "50%" statico.

## Scena 4 — 9,75–12,00 — Bitcoin barrato

- **Sfondo:** grigio chiarissimo piatto **#E7E7E7** (angolo alto-sinistra #E7E7E4 per leggero rumore di compressione).
- **Elementi:**
  1. **Moneta bitcoin** 2D flat: cerchio arancione **#F59018** (tinta #F38F1D), simbolo "₿" bianco #FFFFFF inclinato di circa 14 gradi (come il logo ufficiale). Diametro finale circa 270–285 px (circa 38–40% della larghezza). Piccola **ombra** sfocata sotto: ellisse grigia (#C1C1C1–#E1E1E2, blur circa 10 px), larga circa 210 px, a cy 74%, y 72–76%.
  2. **X di barratura**: due barre diagonali spesse, **rosa pallido #FDCFD1** (semitrasparente) fuori dalla moneta e **rosso #F92F06** dove sovrappongono l'arancione (effetto multiply/overlay). L'X ha le barre lunghe circa 38% della larghezza.
  3. Didascalie in alto (nero): and, isn't, talking, about, bitcoin, is (vedi elenco).
- **Posizioni:** moneta a riposo cx 50%, cy 50% (a 10,5 cx 47%, poi 50%), y 38,8–76,2% con ombra. A 11,25 moneta e X: moneta x 20–64%, y 40–59%, X estesa a x 14–72%, y 36–66%.
- **Animazione:**
  - 9,75: la moneta entra **da sinistra** ruotando attorno all'asse verticale (ellisse stretta di larghezza circa 72/300 = 24% a cx 22%, cy 50%) → 10,0 cx 35% (ellisse più larga) → 10,25 cx 43% (quasi cerchio) → 10,5 cx 47% → 10,75 cx 50%. Rotazione 3D con scala crescente, **ease-out**, circa 1,0 s.
  - 10,50: compaiono i primi tratti dell'X (due piccoli segmenti rosa sulla destra della moneta, ad alto-destra e basso-destra). 10,75: le barre si allungano e diventano rosse dove coprono la moneta (a destra). 11,0: la X copre il lato destro. 11,25: X completa (rosso vivo dentro la moneta, rosa fuori). 11,50: X completa, moneta ancora grande. Il disegno dell'X è **a tratto progressivo** (da destra verso sinistra) in circa 0,75 s.
  - 11,75: moneta + X **si rimpiccioliscono** (scala circa 0,6) con ellisse stretta (rotazione di nuovo), cx 52%, cy 50,8%.
  - 12,00: la moneta diventa un'ellisse stretta e sfocata (blur circa 4 px): inizia la scena 5 (stessa scena fisica, stesso sfondo).
- **Transizione verso la scena 5:** continua senza stacco (stessa carta #E7E7E7).
- **Contatori:** nessuno.

## Scena 5 — 12,00–13,75 — "Tokenization" (lettere che si assemblano)

- **Sfondo:** **#E7E7E7** (identico). Sulla moneta/X resta una macchia sfocata arancio-rossa (blur crescente, raggio circa 40 px, colori #F92F06 + #F59018) con la X rosa sfocata dietro: sembra "dissolta".
- **Elementi:**
  1. Testo **"Tokenization"**: Montserrat ExtraBold/Bold circa 58 px, **nero #000000**, lettere separate che si animano singolarmente. A riposo (13,5): cx 50%, cy 49,7%, x 19,7–80,1% (60% largo), y 47,7–51,7%.
  2. Moneta + X sfocate dietro il testo, ombra sfocata sotto a cy 63% (a 13,5) che si sposta con essa.
  3. Didascalie "talking" (12,0) e "about" (12,25). Poi nessuna.
- **Animazione:**
  - Le **12 lettere** (T-o-k-e-n-i-z-a-t-i-o-n) arrivano **una dopo l'altra, a distanza di circa 0,06–0,08 s**, partendo da sinistra. Ogni lettera nasce **molto grande** (circa 2–3x), **grigia semitrasparente** (#A8A8A8 → #646464 → nero) e **bassa** (fuori linea, anche fino a y 90%), poi **scende o sale a scatto a molla** nella riga, rimpicciolendosi e diventando nera. A 12,0 sono visibili "T o k e" in diagonale (cx 15–28%, cy 52–62%) e una "n" enorme grigia in basso a sinistra (x 15–40%, y 82–95%). A 12,25 "Token" è già in riga a x 12–32% e "i z a t" salgono come onda grigia (a y 50–70%). A 12,5 "Tokeniza" in riga più "t i o n" ancora fuori linea (le ultime con più ampiezza, "n" a y 56% x 45%+). A 12,75 "Tokenizatio" in riga e "n" ancora sollevata. A 13,0 la parola è composta. Tempo totale di assemblaggio circa 0,75 s.
  - Allineamento: la parola si forma dal lato sinistro, ma la posizione finale è centrata.
  - 13,0–13,5: la moneta dietro diventa una macchia più sfocata e più ampia (blob arancio-rosso con X rosa), e a 13,5 la parola è ferma.
- **Transizione verso la scena 6:** **taglio netto** a 13,75 da #E7E7E7 a **nero puro #000000**.
- **Contatori:** nessuno.

## Scena 6 — 13,75–15,00 — "Let us explain."

- **Sfondo:** **nero puro #000000**.
- **Testo:** **"Let us explain."** Montserrat SemiBold, bianco #FFFFFF. A riposo (14,25): cx 50,3%, cy 49,9%, x 27,8–72,8% (45% largo), y 48,2–51,6%, circa 38 px.
- **Animazione:**
  - 13,75: compare "Let" piccolo (x 32–47%, circa 24 px, bianco) con "us" grigio sbiadito: le parole entrano **una alla volta con fade** (Let → us → explain.). 14,00: "Let us explain." completa ma "explain." ancora più piccola e grigia (a 14,0 "explain." circa 80% della scala e opaca al 60%). 14,25: tutto bianco e a scala piena.
  - Il testo **ingrandisce lentamente** (circa 0,65 → 1,0 di scala fra 13,75 e 14,25, ease-out).
  - 14,25–15,00: il testo **cade verso il basso** con ease-in: cy 49,9% (14,25) → 51,4% (14,5) → 61% (14,75) → fuori campo a 15,0. Nessuna dissolvenza visibile.
- **Transizione verso la scena 7:** taglio netto a 15,00 da nero a grigio chiaro **#EBEBEB**.
- **Contatori:** nessuno.

## Scena 7 — 15,00–18,00 — Disco nero → monitor "matrix"

- **Sfondo:** grigio chiaro **#EBEBEB** con **pavimento/piano di appoggio** che compare quando la camera arretra: piano scrivania tinta #E7E7E4 → #EDEDED (bordo superiore a y circa 74%) e pavimento sotto con gradiente verticale #C1C1C1 (alto) → #F3F3F3 (basso).
- **Elementi:**
  1. **Disco-moneta 3D nero** (come un oblò): nucleo nero **#090909** con riflessi diagonali, aureola circolare grigio-verde chiaro (#D6DAD7 esterno → #6C726D vicino al nero), spessore laterale scuro sul bordo sinistro (si vede quando è di taglio). Ruota attorno all'asse verticale.
  2. **Monitor CRT** in stile 3D piatto: corpo bianco/grigio #EBEBEB–#AFB8B1 con lato prospettico a sinistra (fianco con gradiente bianco → #AFB8B1), **schermo menta** con griglia di caratteri esadecimali (0-9, A-F) a 10-11 colonne x 13 righe: all'inizio schermo verde menta chiaro (#9DB0A3, #B6D1BD, caselle più scure #455C4B/#57695B/#698371, cifre chiare #E4EBE5), con bordo/cornice menta #9BBEA2–#B6CEB9; base/piedistallo menta chiaro (#A7C9B1 circa) e piatto grigio #D1D1D1/#CBCBCB.
  3. Didascalie nere: right, now, financial, system, running, code, written.
- **Posizioni:** disco a 15,0: cx 50,7%, cy 41%, ellisse larga 40% / alta 36%; a 15,5: cx 51%, cy 69%, diametro circa 58% (grande, vicino alla camera); a 15,75: cy 64%; a 16,0: cx 51%, cy 54%, diametro 40%; a 16,25: cy 47%, diametro 25%; a 16,5–18,0: cx 51%, cy 42–44%, diametro 15–18%, galleggia sopra al monitor e ruota (a 16,75–17,25 è un'ellisse stretta). Monitor: a 15,5 lastra menta in basso (y 88–100%); 15,75 (y 80–100%); 16,0 faccia anteriore x 0–100%, y 66–100% (troppo vicina); 16,25 monitor x 13–80%, y 55–96%; 17,5: schermo x 37–67%, y 48–66%, corpo con fianco x 25–67%, supporto y 67–73%, piatto base x 37–63%, y 73%; orizzonte pavimento y 74%.
- **Animazione:**
  - **Camera che arretra** (zoom-out + parallasse) per 2,5 s: dal disco quasi a tutto schermo, la lastra verde del monitor **sale dal basso** (15,5–16,25) mentre il disco scende e poi si ferma sopra il monitor. Ease-out morbido, forte nei primi 1,5 s.
  - Il disco ruota di continuo (periodo circa 1,0 s: 15,0 di taglio, 15,25 più aperto, 15,5 circolare, 16,5–17,25 di nuovo di taglio, 17,75 circolare).
  - **Schermo**: dal verde menta chiaro (15,75–16,5) diventa **scuro** (a 17,25 quasi nero: fondo #020803–#0B130C, cifre grigio-verdi #637B6F e bianche #E4EBE5, alcune caselle evidenziate #34453A/#202E24) entro 17,25. I caratteri **scorrono / cambiano** (matrice) da un fotogramma all'altro.
- **Transizione verso la scena 8:** stessa scena (sfondo uguale), l'unico cambio è il testo che sostituisce la didascalia.
- **Contatori:** nessuno (i caratteri esadecimali cambiano ma non sono un contatore).

## Scena 8 — 18,00–19,25 — "1970s"

- **Sfondo:** **#EBEBEB**, stessa scena 7 (monitor fermo, schermo scuro con cifre, disco che ruota sopra, pavimento).
- **Testo:** **"1970s"**, Montserrat ExtraBold circa 150 px, nero #000000. A riposo: cx 49,9%, cy 34,9–35,6%, x 16,5–83,2% (66,7% largo), y 30,9–39,0% (altezza cifre circa 8%).
- **Animazione:** i caratteri compaiono **da sinistra a destra** con dissolvenza e blur, uno ogni 0,06 s circa: a 18,0 solo "1" grigio chiaro (x 15–23%); a 18,25 "197" nero + "0" sbiadito; a 18,5 "1970" nero + "s" grigio; a 18,75 e 19,0 testo pieno nero. Durata dell'ingresso 0,6 s. Il disco ruota davanti (copre in parte lo "0" a 18,5–19,0).
- **Transizione verso la scena 9:** taglio netto a 19,25 da chiaro #EBEBEB a nero grafite #111111.
- **Contatori:** "1970s" non conta, appare solo.

## Scena 9 — 19,25–23,50 — Diagramma "acquisto di una stock" (arco con "Stock")

- **Sfondo:** **#111111** piatto.
- **Elementi:**
  1. **Persona stilizzata** a sinistra: testa = sfera di vetro vuota (bordo chiaro, interno #212121, due puntini come occhi), diametro circa 13% della larghezza (circa 95 px); spalle = cupola grigia sfumata (da #6c6c6c a trasparente) sotto la testa. Posizione: cx 21–23%, cy 54% (testa), cupola y 60–69%.
  2. **Pila di monete** a destra (mini), grigio-verde metallico (#38463B ombra, #69766C medio, #B4BDB6 luce, righe sottili a strisce), con cima piatta con l'etichetta; due pile laterali più basse; riflesso sfocato sotto. Posizione: x 63–98%, y 60,6–71%, cx 80%.
  3. **Arco** (parabola) sottile bianco/grigio chiaro (spessore 1 px, #FFFFFF 50%) dalla testa a sinistra, apice a (50%, 43,5%), fino alla pila di destra (x 80%, y 60%). Un secondo filo verticale sottile cade dalla testa verso un'etichetta in basso.
  4. **Etichette "Stock"**: piccoli rettangoli arrotondati (circa 70x22 px) verde-grigio #38463B → #69766C con bordo chiaro e testo bianco "Stock" (Montserrat Medium circa 9 px). Una si muove lungo l'arco, due restano sotto la testa a (x 20%, y 66–69%), una in cima alla pila.
  5. Didascalie bianche in alto: when, buy, a, stock, it, takes, two, days, to, actually, settle, the, market, closes.
- **Ingombro del diagramma:** x 6–98%, y 43,5–71,5% (cx 51,8%, cy 57,5%). Lo zoom-out è lento: a 23,0 è x 9,9–92,9%, y 43,3–69,3%.
- **Animazione:**
  - Tutta la scena è già in posizione al taglio 19,25. Una etichetta "Stock" **percorre l'arco avanti e indietro** fra la pila e la persona: a 19,25 vicino alla pila (x 80%, y 47%), a 19,5 all'apice (x 60%), 19,75 a x 38%, 20,0 vicina alla testa (x 24%, y 50%), 20,25 di nuovo a destra (x 70%, y 51%), 20,5 in alto a x 62%, 20,75 apice, 21,0 a sinistra, 21,25 in basso a destra, 21,5 destra, 21,75 apice, 22,0 a sinistra, 22,25 sulla testa, 22,5 in basso, 22,75 destra, 23,0 apice. Periodo circa 1,0 s per andata. Una seconda etichetta appare accanto alla persona (20,25, 22,25) e si aggiunge alla pila delle due sotto di lei [INCERTO il dettaglio di quale etichetta si duplica].
  - La pila di monete ha una **scintilla chiara** (#FFF) sulla cima quando l'etichetta arriva (22,75, 23,0).
- **Transizione verso la scena 10:** continua senza stacco: appare la X.
- **Contatori:** nessuno.

## Scena 10 — 23,50–25,25 — X rossa + cerchio + "04:00 pm"

- **Sfondo:** **#111111**, stesso diagramma (persona, pila, arco) che prosegue.
- **Elementi:**
  1. **X** formata da due barre larghe diagonali, **rosso scuro traslucido** (singola barra circa #200D0B–#271011, sovrapposizione al centro **#481112**), con le **estremità brillanti rosa-bianche** (punta #F7737D, fino a #FFFFFF) tipo "vetro luminoso". Centro a (51%, 51%), occupa x 20–82%, y 36–66%.
  2. **Cerchio** sottile bianco (1–2 px, #FFFFFF), diametro circa 390 px (circa 55% della larghezza), centrato a (51,5%, 51%); si disegna come **arco che si completa** (a 23,5 solo un quarto in alto a destra; a 23,75 3/4; a 24,0 completo). È un orologio / "chiusura".
  3. **Testo "04:00 pm"**: Montserrat Bold circa 30 px, bianco, **cx 50%**, cy 28,8–29,6%, y 27,6–31%. Si **scrive a macchina**: a 23,75 "04:00" (x 36–52%), a 24,0 "04:00 pm" (x 36,4–63,5%), 24,25–25,0 fermo (cy 29,6%, scende di 0,8% in 1 s).
  4. Didascalie bianche: closes (23,5–23,75), at (24,0), "PM" (25,25, quasi invisibile).
- **Animazione:** la X entra con un **leggero fade-in + scala** a 23,5 (barre ancora scure e piccole, x 25–63%), a 23,75 si allarga e si illuminano le punte; a 24,0 piena. Le etichette "Stock" continuano a scorrere sulla linea, ora **rosa** quando incrociano la X (a 24,25 una etichetta è #F7737D). Scala lenta del diagramma: x 11,5–91,5% (24,0) → x 13–90% (25,0).
- **Transizione verso la scena 11:** taglio netto a 25,25 da #111111 a nero puro #000000.
- **Contatori:** "04:00 pm" non conta; si scrive lettera per lettera.

## Scena 11 — 25,25–26,75 — "And if you want to sell a building?"

- **Sfondo:** nero puro **#000000**.
- **Testo (allineato a sinistra, blocco a x 19–81%):**
  - Riga 1: **"And if"** piccolo, Montserrat Regular circa 21 px, bianco #FFFFFF; x 19–29%, cy 48,4%.
  - Riga 2: **"you want to"** piccolo (stesso corpo), x 19–38%, cy 50,8%, seguito da **"sell a building?"** in **serif corsivo grassetto bianco** circa 38 px (Times/Playfair Italic) a x 39,6–80,8%, cy 50,2%. Il blocco intero cy 49,5%.
- **Animazione:** parole che compaiono **una a una a sinistra, scrivendo**: 25,25 "And" (x 22,7%, cy 49%, piccolo e sbiadito); 25,5 "And if / you want"; 25,75 "And if / you want to **sell a building?**" (la parte in serif entra tutta insieme a 25,75, cresce e si assesta a 26,0). Fermo 26,0–26,5 (cy 50,3%). Ogni parola entra con fade rapido (circa 0,1 s).
- **Transizione verso la scena 12:** a 26,75 il blocco sparisce di colpo e subito "Good luck." (stesso sfondo nero, nessuna dissolvenza visibile).
- **Contatori:** nessuno.

## Scena 12 — 26,75–29,00 — "Good luck. That takes months."

- **Sfondo:** nero puro **#000000**.
- **Testo (centrato):**
  - Riga 1: **"Good luck."** Montserrat Medium circa 28 px, bianco, cx 50%, cy 49,7% (26,75–27,5) poi 48,4% (27,75–28,25) quando arriva la riga 2.
  - Riga 2: **"That takes months."** Montserrat **SemiBold** circa 28 px, bianco, cx 50%, cy 51,8% (28,25), x 27,7–72,5%. È **più pesante** della riga 1.
- **Animazione:** "Good luck." compare a 26,75 (cy 49,7%) e resta; a 27,75 "That" entra a sinistra (x 33%, cy 52,5%) mentre la riga 1 sale un po'; 28,0 "That takes" (cx 40%); 28,25 "That takes months." completa e centrata. **Uscita a 28,5–29,0:** entrambe le righe **scendono** con ease-in (28,5: cy 48,6% e 52%; 28,75: cy 52,9% e 56,3%) e spariscono. Stessa uscita a caduta della scena 6.
- **Transizione verso la scena 13:** taglio netto a 29,00 da nero a grigio chiaro **#D7D7D7**.
- **Contatori:** nessuno.

## Scena 13 — 29,00–30,75 — Ufficio postale ("Post Office")

- **Sfondo:** grigio piatto **#D7D7D7**.
- **Elementi:**
  1. **Edificio "Post Office"** in stile 3D piatto con gradienti: tetto/frontone bianco-grigio (#E8E8E8 → #BBB), **insegna** rettangolare con gradiente scuro (da #131313 in alto-destra a #B3B3B3 in basso-sinistra) con scritta **"Post Office"** bianca (Montserrat SemiBold circa 20 px), 3 colonne grigio-bianche (#D1D1D1 con ombra #B2B2B2), **porta nera** #000000 al centro, gradini grigi, base chiara. Sotto, **riflesso** sfocato che sfuma.
  2. **Cassetta della posta** rossa a sinistra: cupola a fungo, rosso **#B53134 / #AE383F** (tinta con luce più chiara in alto), fessura nera orizzontale, riflesso rosso che sfuma sotto.
  3. Didascalie nere: of, like, the, post, office.
- **Posizioni:** a 29,0: insegna cx 50%, cy 34,7% (larga 45,7%), edificio x 23–86%, y 32–56%, cassetta a x 9,7%, y 41–60%. A 30,5: insegna cy 42,6% (scende), edificio x 6–85% (si sposta a sinistra).
- **Animazione:** nessuna entrata: è già lì al taglio. **Deriva lenta**: tutto l'insieme scende di circa 8% in 1,75 s (insegna cy 34,7% → 39% → 41,3% → 42,6%) e va a sinistra di circa 6% (ease-out). Le didascalie cambiano.
- **Transizione verso la scena 14:** nessuno stacco: arriva la parola "Before" e la sfera.
- **Contatori:** nessuno.

## Scena 14 — 30,75–33,25 — "Before the internet" + persona senza volto

- **Sfondo:** **#D7D7D7**. L'edificio e la cassetta restano ma **sfocati** (blur circa 8 px) e dietro agli elementi nuovi.
- **Elementi:**
  1. Testo **"Before the internet"**: Montserrat SemiBold circa 46 px, nero #000000. A riposo: cx 50%, cy 29,6–30,4%, x 11,7–88% (76% largo), y 28,5–32%.
  2. **Persona stilizzata chiara**: testa = sfera bianco-grigia (#EDEDED–#F3F3F3 con centro sfumato grigio #999), bordo chiaro bianco, due **puntini neri** per gli occhi e una **piccola smorfia/sorriso** (#222) (testa circa 247 px); spalle = cupola bianca morbida (#FFFFFF → #D7D7D7) sotto la testa, larga circa 65%.
  3. **Due bolle a pillola vuote** (bianche #F5F5F5, con ombra morbida; "messaggi"): la prima a x 23–57%, y 35,3–39,6%; la seconda più bassa a destra x 39–75%, y 41–45%.
  4. Didascalie nere: if (31,75), you, wanted, send, message (32,75, 33,0).
- **Animazione:**
  - 30,75: "Before" entra a sinistra sopra l'edificio (x 32%, cy 38%, circa 28 px, nero, enorme sfocatura iniziale). 31,0: "Before the internet" completa a cy 31%, circa 28 px più larga. 31,25 sale a cy 28%.
  - La sfera + cupola **salgono da sotto** (30,75: sfera a cx 50%, cy 67%, cupola y 78–100%) fino alla posizione a 31,5: sfera cx 51%, cy 58%, cupola y 68–100%. Ease-out morbido.
  - Il titolo **scende lentamente** da cy 28% a cy 30,4% (31,5 → 33,0).
  - 31,75: appare la **prima pillola** (23–57%, y 36%) che cresce da sinistra; 32,5: appare la **seconda pillola** dal basso e si sposta a destra (x 39–75%).
  - 33,0: titolo ancora visibile ma più alto (cy 30%, x 13–87%) e sfocato; 33,25: il titolo è **sparito** e l'insieme edificio + sfera si sposta (cambio scena 15).
- **Transizione verso la scena 15:** continua: la sfera scivola in basso a destra, l'edificio si rimpicciolisce.
- **Contatori:** nessuno.

## Scena 15 — 33,25–37,00 — Percorso della lettera (orbita di icone)

- **Sfondo:** **#D7D7D7**. Edificio nitido (blur tolto) ma più piccolo.
- **Elementi:**
  1. **Edificio Post Office** + cassetta rossa ridotti (circa 0,45x): a 36,0 insegna cy 47%, edificio x 39–63%, y 46–58%.
  2. **Sfera-persona** (senza faccia, più sfumata: #999 centro → #EDEDED bordo) a destra in basso, diametro circa 31,7% della larghezza: a 33,5 cx 62%, cy 65%; 33,75 cx 77%, cy 73%; 34,5 cx 82,7%, cy 77%. A 36,0 cx 81%, cy 76%. Con cupola chiara sotto (y 87–100%, x 65–100%).
  3. **Anello (cerchio sottile #444444/#555555)** che circonda l'edificio, raggio circa 25,7% della larghezza, centro a (50%, 52%): si **disegna progressivamente**.
  4. **Quattro icone** in cerchi bianchi/grigio chiaro (#ECECEC, diametro circa 13% della larghezza) sull'anello: in alto **foglio di lettera** (righe grigie) a (50%, 37,5%); a destra **lettera/francobollo** (rettangolo con quadratino) a (76%, 52%); in basso **orologio** (cerchio nero con lancette) a (50,7%, 66%); a sinistra **camioncino** (verde-grigio) a (25%, 52%).
  5. Didascalie nere: you, wrote, a, letter, bought, a, stamp, and, waited, three, days.
- **Animazione:**
  - 33,25: la sfera lascia il centro; l'edificio **rimpicciolisce** (da 1x a 0,45x) e si sposta a sinistra. 33,5: compare il **foglio** in alto (circa 150% di scala, sfumato) con un piccolo arco che parte da lui; 33,75–34,25: il foglio scende a posizione (50%, 34% → 37,5%) e l'arco si estende in senso orario (a 34,25 ha percorso circa 1/4 del cerchio).
  - 34,5: icona **francobollo** a destra (76%, 52%), arco si estende. 35,0–35,25: arco arriva in basso. 35,5: icona **orologio** in basso. 35,75: icona **camion** a sinistra, arco ancora in corso. 36,0: cerchio quasi completo, 36,25–36,5 piccolo interstizio che ruota sul lato sinistro (tratto mancante), 36,75 chiuso.
  - Tutte le icone **entrano con scala da 0 a 1** con rimbalzo morbido (spring), un'icona ogni 0,75 s circa, al ritmo del parlato.
  - Zoom: tutto l'insieme si **rimpicciolisce** ancora di circa 10% da 34,5 a 37,0 (ease-out).
- **Transizione verso la scena 16:** taglio netto a 37,00 da grigio #D7D7D7 a nero puro #000000. Il fotogramma a 37,00 è tutto nero (nessun elemento).
- **Contatori:** nessuno.

## Scena 16 — 37,00–41,25 — "Tokenization" → "Email Moment"

- **Sfondo:** nero puro **#000000**.
- **Elementi:**
  1. **"Tokenization"**: Montserrat SemiBold circa 40 px, bianco. Posizione a 37,5: cx 50%, cy 41,5%, x 30,6–69,3% (38,7% largo), y 40,2–42,8%. A 40,0: x 28–71,8% (43,7% largo), cy 41,5% (ingrandisce di circa 13% in 2,5 s).
  2. **Linea verticale sottile bianca (1 px) con punta di freccia in basso** dal titolo verso il basso, cx 50%, da y 43,7% a 54,8%.
  3. **Icona email**: quadrato arrotondato (raggio circa 22 px, circa 96 px di lato, 13% larghezza) con gradiente verde menta scuro (alto #C9E3D4, medio #4E6758, basso #1F2823), con **busta bianca** #FFFFFF; alone luminoso sfumato verde-scuro attorno. A cx 31,6%, cy 57–58%.
  4. Testo **“Email Moment”** con virgolette curve, Montserrat Medium circa 28 px, bianco. A destra dell'icona: x 41,5–83,3%, cy 56–58%.
  5. Didascalie bianche in alto: for (40,25), finance (40,5–41,0).
- **Animazione:**
  - 37,25: appare "Tokenization" a (50%, 40%) con fade rapido; 37,5 si assesta a cy 41,5%.
  - 38,25: la **linea cresce** dall'alto verso il basso (a 38,25 solo un punto, a 38,5 breve tratto, a 38,75 lungo da y 42,2% a 50,4%, 39,0 fino a 53,2%) e arriva con la **freccia** a 39,25.
  - 39,25: icona email + “Email → 39,5 “Email Moment” completo (le parole entrano scrivendo da sinistra a destra, rapido, 0,25 s).
  - 40,0–40,75: tutto il gruppo si **sposta leggermente a sinistra** (cx titolo 50% → 48,5%).
  - 40,75–41,25: **uscita a sinistra con ease-in**: cx titolo 48,5% (40,75) → 45% (41,0) → 33% (41,25), poi fuori a 41,5.
- **Transizione verso la scena 17:** stessa carta nera, nessuno stacco: entra il testo a sinistra.
- **Contatori:** nessuno.

## Scena 17 — 41,25–oltre 45 — "It puts stocks, bonds, even real estate, on a blockchain"

- **Sfondo:** nero puro **#000000**.
- **Testo:** **"It puts stocks, bonds, even real estate, on a blockchain"**, Montserrat SemiBold circa 26 px, bianco, **allineato a sinistra** all'inizio e centrato quando il blocco è completo. Si spezza su due righe: riga 1 "It puts stocks, bonds, even real estate," (x 10–91%, cy 48,2–48,4%), riga 2 "on a blockchain" (x 35–71%, cy 51%) [INCERTO la centratura esatta della riga 2: sembra centrata sotto la riga 1 con leggero offset a destra].
- **Animazione:**
  - 41,5: "It" a x 12–15%, cy 48,2% (circa 20 px, piccolo). 41,75: "It puts". 42,0: "It puts stocks," (x 9,5–42,6%). 42,25: "It puts stocks, bonds,". 42,5: "... even". 42,75: "... real". 43,0: "... estate,". 43,25: va a capo: "on a". 43,5: "on a blockchain". Una parola ogni 0,25 s (fade + piccolo spostamento, spazi più larghi durante l'ingresso: tracking aperto che si chiude).
  - Larghezza riga 1: 82% a 43,25, 80% a 44,75 [INCERTO: variazione minima, forse un leggero zoom-out].
  - Resta fermo da 43,5 a oltre 45,0, nessuna uscita visibile fino a 44,75.
- **Transizione verso la scena 18:** non osservata in questa metà (oltre 45 s).
- **Contatori:** nessuno.

---

## Regole ricorrenti di questa metà (0–45 s)

- **Ritmo:** 17 scene in 45 s, cioè in media 2,6 s a scena (la più breve 1,25 s, la più lunga 4,25 s). Le scene sono spesso divise in due beat: oggetto + frase (1,5–2,5 s l'uno). Cambio testo ogni 0,25–0,5 s (didascalia a una parola).
- **Alternanza nero/chiaro:** blocchi di 2,5–5 s. Sequenza: scuro (0–9,75) → **chiaro #E7E7E7** (9,75–13,75) → **nero puro** (13,75–15,0) → **chiaro #EBEBEB** (15,0–19,25) → **grafite #111111** (19,25–25,25) → **nero puro** (25,25–29,0) → **chiaro #D7D7D7** (29,0–37,0) → **nero puro** (37,0–45+). Tre sfondi chiari diversi (da #E7E7E7 a #D7D7D7, ognuno un po' più scuro del precedente), tre scuri (#111111, #0F0F0F, #000000). I tagli fra blocchi sono **secchi** (nessuna dissolvenza) tranne il dip-to-black 4,25–5,75 della scena 1→2. Le scene con testo grande (6, 11, 12, 17) usano il nero puro, quelle con oggetti 3D usano le grafiti o i chiari.
- **Parole in sovrimpressione:** quasi sempre **una sola parola alla volta** (didascalia). Eccezioni: titolo + carta + citazione (S1), frasi intere tipo "Let us explain." (S6), "And if you want to sell a building?" (S11), "Good luck. That takes months." (S12), "It puts stocks…" (S17), che si compongono parola per parola.
- **Dimensione e posizione tipica del testo:**
  - Didascalia: 30 px, cx 50%, cy 16,2% (sempre uguale), minuscolo, Montserrat Medium.
  - Titoli grandi: 40–60 px (SemiBold/Bold) a cy 30–50%.
  - Testi centrali tipo frase: 26–38 px a cy 48–52%.
  - Numeri / anni: grandi (150 px, "1970s"; "$10 TRILLION" in Anton) a cy 26–35%.
  - Tutto il testo è **centrato** orizzontalmente (tranne le prime parole che si scrivono da sinistra).
- **Palette misurata:**
  - Sfondi scuri: #111111, #0F0F0F, #000000. Sfondi chiari: #E7E7E7, #EBEBEB, #D7D7D7.
  - Testo: #FFFFFF su scuro, #000000 su chiaro; grigio secondario #B1B1B3.
  - Accenti: arancio bitcoin #F59018; rosso X #F92F06 (sopra l'arancione) / rosa #FDCFD1 (sopra il fondo); rosso bandiera #CA4034 con giallo #F9EE52; verde neon #62E16B; verde menta #9BBEA2/#B6D1BD/#4E6758; verdi scuri dei "Stock" #38463B/#69766C/#B4BDB6; rosso scuro X scena 10 #481112 (punte #F7737D); rosso cassetta #B53134/#AE383F.
  - In generale: **monocromo + un solo colore per scena** (verde sulle monete e sul monitor, rosso sulle X e sulla Cina, arancione sul bitcoin).
- **Tipo di effetti:**
  - **Zoom-out lento** continuo di tutto il gruppo (scene 1, 2–3, 7, 9, 13, 15) più ingressi **ease-out morbidi**.
  - Ingressi: parole **sfocate che salgono** (S1 citazione, S3 etichetta), **scrittura a macchina** (nome, "04:00 pm", "Email Moment", "1970s" lettera per lettera), lettere che **si assemblano a molla** (S5), oggetti 3D che **ruotano e arrivano da un lato** (bitcoin, disco), elementi che **salgono dal basso** (mappa, monitor, sfera).
  - Uscite: **caduta con ease-in** (S6, S12), **scivolamento laterale** (mappa a destra, S16 a sinistra), **dissolvenza a nero** (S1→S2).
  - Stile oggetti: **vetro smerigliato** (carta, sfere), **metallico nero** con luce verde (monete), **flat** (mappa, bitcoin, icone), **3D finto a gradienti** (edificio, monitor). Ombre morbide e **riflessi sfocati** sul pavimento.
  - **Persona stilizzata** (testa sfera + spalle cupola) ricorrente in S1, S9, S14, S15.
- **Come vengono mostrati i numeri:** "$10 TRILLION" in grande, condensato, **statico** (compare e resta, non conta); "50%" dentro un'etichetta; "1970s" e "04:00 pm" **scritti a macchina** (lettera per lettera, non contatori). **Nessun contatore** animato in questa metà. I numeri compaiono dentro il testo, non come grafica separata.

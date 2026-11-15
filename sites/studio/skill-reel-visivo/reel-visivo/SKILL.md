---
name: reel-visivo
description: Spiega un concetto, un test o un risultato di ricerca quantitativa come REEL VERTICALE MUTO (1080×1920, solo testo e animazioni, niente audio) in stile motion design scuro. Usala quando l'utente chiede di spiegare qualcosa «con un reel», «in video», «visivamente», «fammelo vedere», oppure vuole capire cosa funziona, cosa no e perché in una strategia o in un backtest.
---

# Reel visivo muto

Trasformi una spiegazione in un reel di 40–90 secondi che si capisce **senza audio**: frasi brevi, numeri grandi solo quando contano, grafici animati. Il motore è già pronto in `reel.html`: tu scrivi solo la **storia** (un JSON) e il motore fa animazioni, tempi, colori e impaginazione.

## Procedura (sempre questa)
1. **Capisci il punto.** Una sola idea per reel. Scrivila in una frase: «la strategia X è stata scartata perché vince solo sugli anni su cui è stata costruita».
2. **Scrivi la storia**: 6–12 scene, nell'ordine
   gancio (`titolo`) → contesto (`testo`) → prova visiva (`linea`, `confronto`, `barre`, `distribuzione`, `griglia`, `formula`) → criteri (`checklist`) → esito (`verdetto`) → cosa ti porti a casa (`fine`).
3. **Copia `reel.html`** in un file nuovo (es. `reel-trappola.html`) e sostituisci SOLO il contenuto di `<script id="storia" type="application/json">`. Non toccare il motore.
4. **Controlla** (obbligatorio): `node render.cjs reel-x.html provini.jpg --provini` produce un foglio con un fotogramma per scena. Guardalo: testi tagliati, scene vuote, numeri sbagliati → correggi la storia e rifai.
5. **Consegna**:
   - se hai Node + Playwright + ffmpeg: `node render.cjs reel-x.html reel-x.mp4` → MP4 muto da 30 fps;
   - se no: consegna l'HTML (come file o artifact). Si apre nel browser e si riproduce da solo in loop (tocco = pausa, doppio tocco = da capo); dal telefono si registra lo schermo.

## Regole di scrittura (lo spettatore legge, non ascolta)
- Italiano semplice, «come se non sapessi niente di questo mondo». Zero gergo non spiegato.
- Titoli di scena: 2 righe, massimo ~4 parole per riga. La seconda riga è in verde: mettici la parola chiave.
- Frasi in `testo`: massimo 2 per scena, massimo ~14 parole l'una.
- Ogni scena dice UNA cosa. Se servono due grafici, sono due scene.
- I tempi sono automatici (≈3,2 parole al secondo + tempo per l'animazione). Forza `"durata": secondi` solo se serve.
- Unità coerenti: nei risultati di trading usa i **multipli di R** (`"unita": "R"`), le percentuali con `"%"`.

## Regole di onestà (non negoziabili)
- I numeri vengono **solo** da test fatti davvero nella conversazione o da file letti. Mai inventarli.
- Se una forma è illustrativa (curva disegnata a mano, griglia d'esempio), la scena ha `"tag": "FORMA ILLUSTRATIVA"` o `"ESEMPIO ILLUSTRATIVO"`. Se i dati sono veri: `"tag": "DATI DEL BACKTEST"`.
- Niente «funziona sempre», «garantito», previsioni o consigli d'investimento. Il motore aggiunge in chiusura «Contenuto di ricerca · Non è consulenza finanziaria».
- Un risultato in-sample non è una prova: quando c'è il fuori campione, mostralo (`linea` con `divisione`, oppure `confronto`).

## Quale scena per quale idea (ricerca quantitativa)
| Idea | Scena |
|---|---|
| dentro vs fuori campione | `linea` con `divisione`, poi `confronto` |
| più strategie o configurazioni a confronto | `barre` |
| è fortuna? (t-stat, significatività) | `formula` + `numero` |
| drawdown realistico (bootstrap, Monte Carlo) | `distribuzione` con `marcatori` (mediana, 95° percentile) |
| plateau di parametri vs picco isolato | `griglia` con `evidenzia` |
| criteri dichiarati prima del test | `checklist` |
| esito finale | `verdetto` |
| come è fatto il test, passo per passo | `passi` |

## Schema delle scene
Campi comuni a tutte: `titolo` (stringa o 2 righe), `accento` (indice della riga verde, `-1` per nessuna), `nota` (riga piccola in basso), `tag` (pillola in fondo), `coloreTag`, `durata`.
Colori ammessi: `lime` (positivo), `red` (negativo), `amber` (attenzione), `cyan`, `vio`, `ink` (bianco).

```json
{"tipo":"titolo","kicker":"UNA STRATEGIA BOCCIATA","righe":["Perché questa strategia","è stata scartata"],"sotto":"Il caso della «trappola»"}
{"tipo":"testo","titolo":["Prima regola","dei test"],"righe":["Frase uno.","Frase due."],"evidenzia":["parola","chiave"]}
{"tipo":"numero","titolo":["Quanto rende","davvero"],"valore":"+798%","etichetta":"in 7,3 anni secondo la pubblicità","colore":"amber"}
{"tipo":"confronto","titolo":["Stessa strategia,","due mondi"],"unita":"R","sinistra":{"titolo":"Dentro il campione","valore":50,"nota":"dove è stata costruita"},"destra":{"titolo":"Fuori campione","valore":-44.9,"nota":"anni mai visti"}}
{"tipo":"barre","titolo":["Le tre gambe","del portafoglio"],"unita":"R","voci":[{"nome":"Rottura M30","valore":31.2},{"nome":"Ritracciamento H4","valore":18.4},{"nome":"Trappola","valore":-44.9}]}
{"tipo":"linea","titolo":["Dentro sale,","fuori crolla"],"unita":"R","base":0,"serie":[{"nome":"Cumulato","punti":[0,3,6,9,5]}],"divisione":{"indice":3,"etichetta":"FUORI CAMPIONE"},"inizio":"2017","fine":"2026"}
{"tipo":"distribuzione","titolo":["Il drawdown","vero"],"unita":"R","valori":[ /* numeri del bootstrap */ ],"classi":24,"marcatori":[{"valore":-18,"etichetta":"95° PERCENTILE −18 R","colore":"red"}],"legenda":"10.000 ricampionamenti a blocchi da 20"}
{"tipo":"griglia","titolo":["Plateau,","non picco"],"colonne":["10","20","30"],"righe":["1,0","2,0"],"valori":[[1,2,1],[0,9,0]],"evidenzia":[{"r":1,"c":1,"etichetta":"PICCO ISOLATO = FORTUNA"}],"legenda":"periodo ↔ · moltiplicatore ↕","centro":0}
{"tipo":"checklist","titolo":["I criteri","dichiarati prima"],"voci":[{"testo":"t ≥ 2 fuori campione","esito":"si"},{"testo":"Drawdown P95 ≤ 25 R","esito":"no"},{"testo":"Plateau sui parametri","esito":"?"}]}
{"tipo":"verdetto","esito":"BOCCIATA","numeri":[{"valore":"+50 R","etichetta":"dentro","colore":"lime"},{"valore":"−44,9 R","etichetta":"fuori","colore":"red"}],"motivo":["Una frase che spiega perché."]}
{"tipo":"passi","titolo":["Come è fatto","il test"],"voci":[{"testo":"Ipotesi scritta prima","stato":"ok"},"Ottimizzazione 2017–2023",{"testo":"Fuori campione 2024–2026","stato":"no"}]}
{"tipo":"formula","titolo":["Come si misura","se è fortuna"],"formula":"t = ΣR / (σ · √n)","spiegazioni":[{"simbolo":"ΣR","testo":"somma dei risultati in R"},{"simbolo":"σ","testo":"quanto variano i trade"}]}
{"tipo":"fine","righe":["Un buon risultato","non basta:","deve reggere fuori"],"firma":"Ricerca quantitativa su XAUUSD"}
```
In cima al JSON: `"marchio": "RICERCA QUANT · ORO"` (piccolo, in alto a sinistra) e `"scene": [ ... ]`.

## Limiti pratici
- `barre`: fino a 8 voci. `checklist` e `passi`: fino a 6. `griglia`: fino a 8×8 (oltre, i numeri nelle celle spariscono da soli).
- `linea`: fino a 3 serie, anche 300 punti per serie; passa i valori veri (equity in R).
- Numeri in JSON col punto decimale (`-44.9`); a schermo il motore li scrive all'italiana (`−44,9`).
- I font (Manrope, IBM Plex Mono) arrivano da Google Fonts: senza rete il motore usa i font di sistema, funziona lo stesso.

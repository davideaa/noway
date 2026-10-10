# Procedura di produzione — serie «Dalla teoria alla realtà»

Scritta il 01/10/2026 dopo la Puntata 1 (approvata da Davide: «perfetto, bellissimo»).
È la memoria del metodo: chi riprende il lavoro segue questi passi **in quest'ordine** e non salta i controlli.
Davide ha dato il via libera a produrre e pubblicare da solo, a una condizione: **ogni puntata deve uscire perfetta**
(niente sfarfallii, parole mangiate, voce rotta, dati sbagliati). Se un controllo fallisce la puntata non esce.

## Divisione del lavoro (dal 01/10/2026, chiesta da Davide: più veloce, zero errori)
Quando Davide chiede «fammi la puntata N» (o «fammi N, N+1, … in ordine»), l'orchestratore (la sessione principale)
**non scrive tutto da solo**: distribuisce a cinque agenti con un compito ciascuno (definiti in `.claude/agents/`),
e tiene per sé solo il coordinamento, la macchina (`produci.sh`) e il giudizio finale.

| Passo | Chi | Modello | Consegna | Tempo |
|---|---|---|---|---|
| 1. Dati verificati | `reel-ricercatore` | Sonnet | `pN-fonti.md` | 5–8 min |
| 2. Copione fluido | `reel-autore` | Opus | `voce/righe-pN.json` (+ `controlla_copione.py` a zero errori) | 4–6 min |
| 3a. Voce e video | orchestratore → `produci.sh` | nessun modello (macchina) | `PuntataN.mp4` + verifica finale | 15–25 min |
| 3b. Scene (in parallelo a 3a) | `reel-regista` | Opus | `pN.html` + foglio provini | 8–12 min |
| 4. Controllo con occhi nuovi | `reel-controllo` | Sonnet | PASSA / BOCCIA con difetti | 3–5 min |
| 5. Caption, calendario, prova | `reel-pubblicazione` | Haiku | voce in calendario + `--prova` OK | 1–2 min |

Perché questi modelli: Opus dove serve gusto e giudizio (il testo parlato, che Davide giudica per primo, e le animazioni,
che sono ciò che gli piace); Sonnet dove serve precisione su un compito chiaro (fonti, controllo con elenco);
Haiku per il lavoro meccanico. La voce e il render non usano modelli: è la macchina, e lì nessun agente accelera.

Come si incastra:
- **Una puntata**: 1 → 2 → (3a voce | 3b scene insieme) → render e verifica → 4 → 5. Circa **35–45 minuti** dall'ordine al video pronto.
  Il render parte solo quando ci sono sia la voce (tempi veri) sia `pN.html`: per questo `produci.sh` va lanciato con il
  file delle scene già pronto, oppure con `DA=2` subito dopo la consegna del regista se la voce è già stata generata a parte.
- **Più puntate in ordine**: passi 1 e 2 di tutte le puntate in parallelo (un agente per puntata); poi la macchina fa le voci
  **una alla volta** (4 core: due voci insieme non vanno più veloci) mentre i registi lavorano tutti in parallelo; render e controlli
  a catena. Stima: settimana di 5 puntate in **circa 2 ore** invece di 5–6.
- Il passo 2 aspetta il passo 1 (il copione usa solo dati verificati). Il controllo (4) non lo fa mai chi ha prodotto.
- Se `reel-controllo` boccia: si rifà solo il pezzo difettoso (una frase: `rigenera2.py N` e `DA=2`; una scena: frame mirati
  con `LIST=` e ricodifica), poi di nuovo il controllo.
- Le stime sono da misurare alla prima settimana fatta così e da scrivere qui sotto con i tempi veri.

## Stile del testo parlato (richiesta di Davide, 01/10/2026)
Discorsivo e fluido, come una persona che racconta: frasi legate tra loro, nessun elenco «Primo / Secondo / Terzo», nessuna
frase telegrafica («al mulino: un euro»). Dettagli e vincoli della voce nel file dell'agente `reel-autore`.
`voce/controlla_copione.py` blocca gli elenchi, le sigle, le cifre, «Pil» a fine riga e le frasi troppo corte; `produci.sh` non parte se fallisce.

## Calendario
- Lunedì–venerdì alle **12:00 ora italiana** (`TZ=Europe/Rome date` prima di tutto: il giorno conta per «Oggi è …»).
- Puntata 1 = lunedì 5/10/2026. Il venerdì è sempre il caso reale della settimana.
- Pubblica la routine «Macro & Algo — pubblicazione reel 12:00» (parte 11:52, lancia `social/pubblica.py`,
  che pubblica solo ciò che è in `social/calendario.json` con stato `programmato`).
- Numerazione della settimana 1: P1 = circuito (schede 1+2 unite), P2 = PIL cosa misura, P3 = cosa il PIL non misura,
  P4 = PIL nominale e reale, P5 = caso PIL 2020. Dalla settimana 2 numero puntata = numero scheda in `lezioni.json`.

## Passo 1 — contenuto (a mano, ~10 min)
- Scheda in `social/corso/lezioni.json`. Ogni numero detto va **verificato sulla fonte primaria** (Istat, Eurostat, BCE, Banca d'Italia)
  e scritto in `noir/pN-fonti.md` con frase, dato e link. Se una revisione recente può aver cambiato un dato, si dice «circa».
- Copione in `noir/voce/righe-pN.json`: `[["frase", "chiave_scena"], …]`. Struttura fissa:
  `num` (non detta) → gancio → … spiegazione … → `casa` («Cosa ti porti a casa?») → `fine` («Oggi è <giorno>: lezione N di cinque. Domani: …»)
  → `cta` («Se ti è piaciuto, lascia un like, un commento, e seguici.»).
- **Lunghezza: ~215 parole ≈ 80 s** (misurato: 2,72 parole/s pause comprese).
- Regole di scrittura per la voce (Chatterbox italiano):
  - «PIL» si scrive **«Pil»** (maiuscolo intero lo legge «IP»/«più»). «Pil» funziona circa una volta su due a metà frase
    (la selezione scarta le altre), ma **a fine frase fallisce sempre** («PIN», «pillo»: 8 su 8 nella Puntata 2):
    lì si scrive «prodotto interno lordo».
  - Il confronto col copione ignora i numeri (Whisper li scrive in cifre: «7», «1 euro», «137 %»). Un «!!» con
    somiglianza 0,96–0,97 e solo numeri diversi è un falso allarme; con parole diverse («PIN», «Gano») è un errore vero.
  - Numeri **in lettere** («duemilaventicinque», «centotrentasette per cento»).
  - Niente frasi di due parole (le sbaglia: «Puntata uno» → «Contata 1»).
  - Parole difficili: grafia fonetica nel copione (es. «tochenizzato»).

## Passo 2 — composizione (a mano, ~15–25 min)
- `noir/pN.html`: copiare `p2.html` come modello. In testa `P = { EP, DAY, CAP, NEXT, FONTE }` (DAY 0 = lunedì).
- Le parti fisse (numero gigante, «Oggi è …», like/commento/segui, firma col numero, circuito) stanno in `serie.js`: non si riscrivono.
- Ogni scena: testo grande legato all'oggetto, animazione **diversa** a seconda del contenuto. Testo tra il 14% e il 76% dell'altezza.
- Anteprima prima della voce: tempi finti (parole / 2,9 s) e un fotogramma all'80% di ogni scena:
  vedi il blocco «anteprima» in fondo. Si guarda il foglio provini e si corregge prima di spendere il render vero.

## Passo 3 — produzione automatica (~25–35 min di macchina)
```
cd sites/studio/reel/noir
RUN_WAV=<percorso di run.wav> setsid nohup ./produci.sh N > ~/reel-lavoro/pN.log 2>&1 &
```
Fa da solo, e il log va seguito:
1. **Voce** — `voce/rigenera2.py tutte`: per ogni frase fino a 8 seed; promossa solo se Whisper *large-v3-turbo* sente
   tutte le parole e nessuna in più (≥ 0,97), nessuna parola incerta (probabilità ≥ 0,45), finale che si spegne (non troncato),
   durata sensata. Le frasi promosse vanno in cache (`~/reel-lavoro/cache`). **Se nel log compare `!!`, la frase va riscritta e rigenerata.**
2. **Taglio** — `voce/taglia.py`: ogni frase si chiude al primo silenzio di 100 ms dopo l'ultima parola.
   (Il motore aggiunge spesso, dopo una pausa, suoni fino a 0 dBFS: erano gli «sfarfallii» della prima versione.)
3. **Montaggio** — `voce/monta_cues.py`: ogni frase parte su un battito della base (P = 0,6206 s), coda seguita e dissolvenze 8/50 ms.
4. **Render** — 4 processi, 60 fps.
5. **Mix** — `mix_fisso.sh`: base sempre allo stesso volume (mai abbassata), voce compressa leggera, finale **−14 LUFS, picco ≤ −1 dBTP**.
6. **Codifica** h264 + aac 192k.
7. **Verifica finale** — `voce/verifica_finale.py` ritaglia ogni frase dal mix vero (con la musica) e la trascrive: deve dire `TUTTO OK`.
   Un dubbio su una sola parola si controlla sulla voce da sola (`pulite/narrazione.wav`) prima di rifare la frase.

## Passo 4 — controllo visivo e calendario (~5 min)
- Foglio provini di 20 fotogrammi distribuiti: nessun testo tagliato, sovrapposto, fuori zona; contatori arrivati al valore finale.
- `cp ~/reel-lavoro/pN/PuntataN.mp4 social/pubblicati/AAAA-MM-GG-pNN.mp4`, voce nuova in `social/calendario.json`
  (caption: gancio, 3 punti, «Domani …», fonti, «Contenuto educativo · Non è consulenza finanziaria», hashtag), commit e push.
- `python3 sites/studio/social/pubblica.py --prova --data AAAA-MM-GG` deve dire «tutto pronto».
- Il video si manda a Davide.

## Tempi reali
Puntata 2 (prima con questo metodo): vedi `SOCIAL.md` → registro tempi. Stima: **45–70 minuti** per puntata, di cui
~25–35 di macchina (voce e render) mentre si scrive la puntata successiva.

## Se la macchina è stata azzerata
- Voce: `python3 -m venv ~/tts && ~/tts/bin/pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu && ~/tts/bin/pip install chatterbox-tts faster-whisper`
  (~10 min + scaricamento modelli; il primo caricamento da disco freddo può richiedere 10 minuti).
- Render: `npm install` in `sites/studio/reel/` (playwright-core), Chromium è già nella macchina.
- La base `run.wav` («Run!» di Vellyy) **non è nel repository**: va chiesta a Davide se manca.

## Errori già fatti (da non ripetere)
- Controllo della voce troppo debole (solo «ci sono le parole»): non vedeva parole biascicate né finali troncati.
- Ritaglio sul «ultimo suono sopra soglia»: includeva i suoni aggiunti dal motore dopo la frase.
- Taglio netto senza dissolvenza: parole che sembrano mangiate.
- Volume a −16 LUFS: più basso dei reel di riferimento (−14).
- Leggere un contatore a metà animazione e riportare il numero sbagliato (1.742 invece di 2.265): i numeri si leggono dal sorgente, non dai fotogrammi.

## Anteprima con tempi finti
```
python3 - <<'E'   # scrive cues finti e la lista dei fotogrammi
import json; R=json.load(open('voce/righe-pN.json')); t=1.24; c={}
for s,k in R:
    if k=='num': continue
    d=len(s.split())/2.9; c[k]=[t,t+d]; t+=d+0.6
c['end']=[t,t+3.7]; json.dump({'cues':c,'DUR':t+3.7},open('/tmp/cues-finti.json','w'))
print(' '.join(str(int((a+0.8*(b-a))*60)) for a,b in c.values()))
E
CUES=/tmp/cues-finti.json COMP=pN.html LIST="<numeri stampati>" node render.cjs /tmp/anteprima
```

## Registro di ciò che si è imparato (aggiornarlo a ogni puntata: è la memoria che fa andare più veloci)
| Data | Puntata | Cosa è successo | Regola che ne viene |
|---|---|---|---|
| 01/10 | 1 | Code della voce oltre la frase (fino a 0 dBFS) incluse nel montaggio = «sfarfallii» | `taglia.py`: taglio al primo silenzio dopo l'ultima parola |
| 01/10 | 1 | Volume −16 LUFS, Davide lo sente basso | mix finale −14 LUFS, picco ≤ −1 |
| 01/10 | 2 | «Pil» a fine riga → «PIN» 8 volte su 8 | mai «Pil» in fondo: «prodotto interno lordo» (bloccato da `controlla_copione.py`) |
| 01/10 | 2 | Confronto col copione: «sette» ≠ «7», «un» ≠ «1», «per cento» ≠ «%» → scarti finti, 10 minuti persi | numeri ignorati da entrambi i lati in `rigenera2.py` e `verifica_finale.py` |
| 01/10 | 2 | Spunta disegnata sopra il prezzo «4 €» | il regista non mette mai icone sopra i numeri; il controllo guarda la fine di ogni scena |
| 01/10 | 2 | Attesa scritta con `ps | grep render.cjs` dentro un comando che contiene «render.cjs»: ciclo infinito | mai attese basate sul testo del comando: controllare i file prodotti |
| 01/10 | 1–2 | Davide: testo «a elenco» (Primo, Secondo…) e frasi telegrafiche → vuole un racconto fluido | agente `reel-autore` (Opus) + `controlla_copione.py` |
| 01/10 | 1–2 | Righe che continuano la frase (finiscono con «,» o «:») partivano sul battito dopo = pausa a metà frase | `monta_cues.py`: riga che continua attacca dopo 0,12 s, senza aspettare il battito |
| 01/10 | 1–2 | «Secondo l'Istat» scambiato per un elenco dal controllo | il controllo blocca solo «Secondo:» / «Secondo,» a inizio riga |
| 01/10 | 1–2 | Macchina spostata: primo caricamento del modello voce da disco freddo, 5–10 min | normale; non è un errore, aspettare |
| 01/10 | 1–2 | Due voci generate insieme (~6,5 GB l'una su 15): il sistema le ha uccise, e `produci.sh` ha proseguito con le frasi VECCHIE rimaste nella cartella | `produci.sh`: `pipefail`, cartella ripulita prima della voce, conteggio delle frasi fatte, `flock` (una voce alla volta). Mai lanciare `rigenera2.py` a mano mentre gira `produci.sh` |
| 01/10 | 1 | Un tentativo PASSATO veniva scartato per uno bocciato con «punteggio» più alto (frase dell'estero con la «e» saltata) | `rigenera2.py`: chi passa è sempre la scelta |
| 01/10 | 1 | Soglia 0,97 lasciava passare una parola mancante nelle frasi lunghe | soglia 0,985 |
| 01/10 | 1 | Frase difettosa finita nella cache delle frasi promosse | quando si scopre un difetto si cancella anche la sua voce in `~/reel-lavoro/cache` |
| 01/10 | 2 | «Pil invece» → «Pilo invece»; riscritta «Invece il Pil conta» → «il P conta» | «Pil» a voce si evita (regola in `reel-autore`); `controlla_copione.py` blocca «Pil» davanti a vocale |
| 01/10 | 1–2 | `reel-controllo` ha impiegato 13 minuti (analisi dei formanti) | tempo massimo ~5 minuti, solo la lista di controlli |
| 02/10 | 2 | Gancio «conta nel Pil» capito «contiene il peel» sulla voce da sola | anche nel gancio niente «Pil»: «finisce nel prodotto interno lordo» |
| 02/10 | 1–2 | Cambiando il testo, la grafica con tempi fissi («prezzo a +0,9 s», «carte al 62%») arriva fino a 1,5 s prima delle parole | i tempi interni delle scene si misurano sulle parole vere (Whisper con timestamp) e si scrivono in pN.html |
| 02/10 | 1 | Lavoro di riavvio: il risultato di un agente può andare perso | i controlli brevi (3 punti) li fa l'orchestratore da sé; agli agenti i lavori lunghi |
| 02/10 | 2 | Un commento `//` inserito a metà di una riga lunga ha cancellato i prezzi della filiera; trovato solo guardando la fine di ogni scena | commenti `/* */`; dopo ogni modifica a pN.html si guarda il foglio provini a fine scena prima di consegnare |
| 02/10 | 4 | «cose in più o solo prezzi»: la voce salta la «o» in 8 tentativi su 8 e cambia il senso | `controlla_copione.py` blocca la «o» isolata: si scrive «oppure» |
| 02/10 | 3–5 | Confronto col copione: «G7», «un punto e otto», «3 di 5», «aprile» sotto musica → falsi allarmi | numeri in lettere riconosciuti in generale (`NUMRE`), «g7»; i dubbi si chiudono sulla voce da sola |
| 02/10 | 3, 5 | Numeri nel titolo a inizio scena: a schermo fino a 2,7 s prima della voce | regola nel regista: la riga col numero entra sulla parola |
| 02/10 | 4 | Il regista ha ritoccato tre scene mentre il render completo era già partito | il regista finisce PRIMA del render; se ritocca dopo, si rifanno solo quei fotogrammi (`LIST=`) |
| 02/10 | 4 | La verifica finale che segnala frasi fermava `produci.sh` prima di «FINE» e le attese a valle restavano appese | la verifica non è più bloccante: segnala e si arriva sempre a «FINE» |
| 02/10 | — | Meta: «API access blocked» su Instagram e Facebook (02/10, sera) | lo sblocco è sul pannello Meta di Davide; la produzione non si ferma |
| 09/10 | 7, 9, 10 | Affermazioni non verificate passate da autore e regista: «la voce più ballerina» (falso: import ed export oscillano di più), «la maggior parte non è Pil italiano», «perché auto, macchinari e chimica…» (nesso causale), «molti economisti» | il controllo cerca apposta superlativi, «mai/sempre», «la maggior parte», «molti», nessi causali: ognuno deve avere la sua riga in pN-fonti.md; quando si corregge si aggiornano anche pN-fonti.md e la scheda in `lezioni.json` (la caption la usa) |
| 09/10 | 9 | «prodotto interno lordo italiano» → «all'orda italiano» 8 volte su 8 | `controlla_copione.py` blocca «lordo» + vocale (non «lordo è», che passa) |
| 09/10 | 9, 10 | «seicentottanta» e «quattro e mezzo per cento» scartati: la voce era giusta, il confronto no | «cent» e «e mezzo» trattati come numero in `rigenera2.py` E in `verifica_finale.py` (le due regole devono restare uguali) |
| 09/10 | 10 | Frasi passate da sole ma segnalate sulla voce intera («parchite», «Solplus») | rifarle con `NOCACHE=1 SEEDS="505 606 …" PMIN=0.6 flock ~/reel-lavoro/voce.lock … rigenera2.py N`, poi `DA=2 ./produci.sh N`; tenere la vecchia come `rNN_prima.wav` |
| 09/10 | 10 | Whisper chiude la frase con «?»: intonazione da domanda | si sceglie un'altra ripresa che finisca con «.» |
| 09/10 | 6, 9, 10 | Testi scuri su fondi attenuati (etichetta della torta, «700 €», valori nelle barre) e testo che tocca bordi: 4 giri di controllo sulla sola P6 | il regista misura il contrasto (≥ 3:1, meglio 4,5:1) anche nello stato attenuato e lascia ≥ 4 px d'aria; niente dissolvenze scuro→chiaro sul testo |
| 09/10 | 7 | Etichetta agganciata a «trent» ma Whisper scrive «30»: riserva usata, 1,6 s di ritardo | il controllo verifica che ogni `WT`/`WA` trovi la parola nei cues; per i numeri si aggancia una parola vicina |
| 09/10 | 10 | Picco −0,9 dB dopo la codifica AAC | limitatore a 0,78 in `mix_fisso.sh` |
| 09/10 | 6 | Mix fermo: base musicale non trovata | `~/reel-lavoro/run.wav` collegata alla base (o `RUN_WAV=`) prima di lanciare |
| 09/10 | 8 | `produci.sh` avrebbe fatto il render con un `p8.html` non finito | se il regista non ha finito, `produci.sh` si ferma dopo il montaggio e si riprende con `DA=4` |
| 09/10 | tutte | Disco al 99% | prima di produrre: cancellare `out-pN` vecchi, cache pip/uv, `node_modules`; MAI `~/.cache/huggingface` (modelli) |
| 09/10 | 7, 9, 10 | Voce lenta (~25–40 min a puntata) mentre i registi e i render usano il processore | una voce alla volta (`flock`); mettere in coda, non in parallelo |

### Miglioramento FATTO il 02/10 (prima era «il prossimo»)
Le scene leggono i **tempi delle parole** (`taglia.py` → `rNN.parole.json` → `monta_cues.py` → `cues.json` «words» → `window.WORDS`; helper `WT()` in serie.js):
ogni elemento che la voce nomina compare su quella parola, senza tempi scritti a mano. Toglie la causa dei difetti di sincronia
trovati da `reel-controllo` nelle puntate 1–2 e il giro «controllo → correzione → nuovo render».

### Tempi veri
| Data | Lavoro | Agenti | Tempo |
|---|---|---|---|
| 01/10 | P2 prima versione (tutto a mano + costruzione di pubblicazione automatica) | nessuno | ~80 min |
| 01/10 | Copioni fluidi P1 e P2 | 2 × reel-autore (Opus) in parallelo | 2 min |
| 01/10 | Voce P1 (17 frasi, disco freddo) / P2 (16 frasi) | macchina | 21 min / 17 min |
| 01/10 | Montaggio + video + mix + verifica, per puntata | macchina | 7–9 min |
| 01/10 | Controllo completo con occhi nuovi | reel-controllo (Sonnet) | 11–13 min (oltre il limite di 5: da accorciare) |
| 01/10–02/10 | Rifacimento P1+P2 con testo fluido, dall'ordine ai video approvati | tutto | ~2 h, di cui ~45 min persi per errori della catena ora corretti |
| 02/10 | Ricerca dati P3–P5 in parallelo | 3 × reel-ricercatore (Sonnet) | 2,5–6,5 min |
| 02/10 | Copioni P3–P5 | 3 × reel-autore (Opus) | 1,5–2 min l'uno |
| 02/10 | Scene P3–P5 | 3 × reel-regista (Opus) in parallelo | 15–17 min (più l'attesa della voce per l'anteprima vera) |
| 02/10 | Voci P3–P5 in fila (+ 2 frasi rifatte) | macchina | ~25 min a puntata con i registi che occupano il processore |
| 02/10 | Controlli indipendenti P3–P5 | reel-controllo (Sonnet) | 7–10 min (ancora sopra i 5) |

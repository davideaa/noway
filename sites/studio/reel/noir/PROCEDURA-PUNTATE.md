# Procedura di produzione — serie «Dalla teoria alla realtà»

Scritta il 01/10/2026 dopo la Puntata 1 (approvata da Davide: «perfetto, bellissimo»).
È la memoria del metodo: chi riprende il lavoro segue questi passi **in quest'ordine** e non salta i controlli.
Davide ha dato il via libera a produrre e pubblicare da solo, a una condizione: **ogni puntata deve uscire perfetta**
(niente sfarfallii, parole mangiate, voce rotta, dati sbagliati). Se un controllo fallisce la puntata non esce.

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

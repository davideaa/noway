# Cosa abbiamo imparato dal pubblico (si aggiorna ogni settimana)

Lo legge chi scrive e chi anima le puntate **prima** di cominciare. Lo aggiorna l'agente `reel-analista` ogni sabato
partendo da `social/metriche.json` (storico scaricato da `social/metriche.py`). Regola: con pochi dati si scrivono
**segnali**, non conclusioni; una conclusione richiede almeno ~10 reel confrontabili e qualche centinaio di visualizzazioni.
Tutto dentro `LINEA-EDITORIALE.md`.

## 31/10/2026 — dopo 20 reel (settimane 1–4)
**Dati in breve.** 3 follower (+1 in una settimana). Settimana 4 (puntate 16–20, voce a 0,62 s e copertina a 0,3 s identiche alla 3,
come deciso da Davide): 539 visualizzazioni in tutto, **media 108 a reel (mediana 123)**, contro 225 della settimana 3
(media 45, **mediana 17**) e circa 36 di media nelle settimane 1–2. Quota vista media **15%** (visione media 11 s su 75 s)
contro 7% della settimana 3 e 13% delle settimane 1–2. Like 12 (settimana 3: 1; settimane 1–2: 6), salvataggi 2 (prima mai),
commenti, condivisioni 0. Orario: tutto alle 12:00 tranne la 20 (12:30, mezz'ora non pesa): sull'orario ancora **niente da dire**.
Metodo: le visualizzazioni di ogni reel si fermano dopo circa 24 ore (la 9 aveva 74 a 24 h e ne ha 75 oggi), quindi
«alla stessa età» basta guardare il primo giorno. Views a ~24 h, settimana 3: 53, 8, 13, 13, 122. Settimana 4: 20, 121, 109, 154, 130.

| Puntata | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|
| Views | 23 | 123 | 109 | 154 | 130 |
| Quota vista | 15% | 17% | 14% | 13% | 16% |

**Segnale più forte (ancora un segnale, non una regola): quest'ultima settimana ha più visualizzazioni e più persone che restano.**
Tra i reel che hanno raggiunto almeno 50 persone, prima la quota vista era 4–12% (mediana 8%: puntate 2, 8, 9, 11, 15);
nelle puntate 17–20 è 13–17%, senza sovrapposizione. Le quote alte delle prime settimane (23–26%) erano di reel visti da
3–15 persone, probabilmente vicine all'account: non contano. Quindi i reel che arrivano a gente nuova ora tengono di più.
Sono 4 reel contro 5: non sappiamo ancora se è stabile.

**Cosa NON possiamo dire.**
- *Non è merito della voce a 0,62 s.* La voce è la stessa della settimana 3 (che era peggiorata) e la quota è risalita.
  La lettura del 24/10 («anticipare la voce non ha trattenuto di più») va quindi **ritirata come causa**: il calo della
  settimana 3 aveva altre ragioni (temi, ganci, la copertina grigia della 11). Esito della prova della settimana 3: **non si può dire**;
  di certo la voce a 0,62 s non fa danni (settimana 4 al 15% contro 13% con la voce a 1,24 s, differenza dentro il rumore).
- *Non è chiaro se sia il gancio, il tema o l'account che sta «scaldando».* Le puntate 17–20 hanno quasi tutte visto salire
  insieme le views dopo la 16: può essere la piattaforma che ci mostra a più gente, non una nostra scelta. Cambiano insieme
  tema (lavoro, crescita, demografia: «l'Italia rispetto agli altri»), gancio e momento.

**Segnali deboli sul gancio (da verificare, non regole).**
- Le 6 puntate sopra le 100 views (8, 15, 17, 18, 19, 20) hanno quasi tutte in prima frase una **cifra verificata sull'Italia che
  riguarda chi guarda** («cinquantuno euro ogni cento», «nato nel duemilaotto… quattordici anni», «quasi il trenta per cento sotto
  quello tedesco», «quasi quattro su dieci», «nato nel duemila… meno di ogni altro paese»). L'eccezione è la 18, domanda con
  oggetto concreto («Parti da una pala»). Con la cifra sull'Italia in prima frase: 5 reel su 5 sopra le 100 views; senza: 1 su 15 (la 18). Sono 20 reel in tutto e il tema cambia insieme al gancio: indizio, non regola.
- **Il segnale del 16/10 («oggetto di tutti i giorni → più views») è smentito**: il caffè (13) e la bolletta (14) hanno fatto
  16 e 17 views. Contava la cifra e il «tu», non l'oggetto.
- Il gancio-paradosso senza cifra sull'Italia (12 «recessione sparita», 16 «senza lavoro ma non disoccupato») è stato debole: 10 e 23 views.
- Interazioni: i like salgono nei giorni (0, 1, 2, 4, 5 da lunedì a venerdì); nessun commento. L'invito a commentare resta senza risposta.

**Prova per la settimana dopo (5): «il numero in apertura» — solo sulle puntate 24 e 25.** Le 21, 22, 23 sono già prodotte e
usciranno così come sono: servono da **gruppo di confronto gratuito**, perché i loro ganci (banconota, prestito, riserva) sono concetti
senza cifra sull'Italia. Previsione dichiarata prima: se conta il gancio con la cifra, la 21–23 faranno meno delle puntate 17–20
(sotto circa 60 views); se restano sopra 100, il salto è dell'account o del tema e l'ipotesi del gancio perde sostegno.
- **Cosa cambia (una variabile, solo le parole del gancio):** la **prima frase** del copione della 24 e della 25 si apre con un
  **dato verificato che riguarda chi guarda**, detto per primo, prima di domande e concetti. Resta uguale tutto il resto:
  voce a 0,62 s, copertina a 0,3 s, struttura, 13–21 parole di gancio, durata 70–90 s, scene, firma. La prima riga della caption
  riprende il gancio, come sempre (nessun'altra modifica di caption).
- **Autore (`righe-p24.json`, `righe-p25.json`, campo `gancio` in `lezioni.json`, `p24-fonti.md`, `p25-fonti.md`):**
  - 24, oggi «Se la tua banca fallisce, i tuoi soldi spariscono? Fino a una soglia, no.» → esempio di forma: «Se la tua banca
    fallisce, fino a centomila euro per conto ti vengono comunque restituiti.» (soglia e perimetro da verificare su direttiva 2014/49/UE e FITD).
  - 25, oggi «Una grande banca americana è saltata in meno di due giorni. Come?» → esempio di forma: «In un solo giorno i clienti hanno
    ritirato più di quaranta miliardi di dollari da una banca americana, e il giorno dopo era chiusa.» (cifre e date dal rapporto Fed di aprile 2023).
  - Sono esempi: la frase finale la sceglie l'autore, ma deve aprire con la cifra, restare vera in `pN-fonti.md`, senza superlativi né nessi causali non dimostrati.
- **Regista:** nessun cambio. Niente cifra animata sul gancio né altre novità visive (sarebbe una seconda variabile).
- **Come si legge (sabato 7/11):** 24 e 25 a ~24 h contro 21–23 sulle stesse metriche (views e quota vista). «Segnale a favore» solo
  se **entrambe** superano la mediana delle views di 21–23 **e** hanno quota vista ≥ 13%. Altrimenti «non si può dire». Con 2 reel
  contro 3, in ogni caso, non è una prova: è l'inizio.
- **Da chiedere a Davide (non è un cambio della linea, ma allunga la prova):** proseguire con la stessa regola sulle puntate
  26–30 per arrivare a ~7 reel con cifra e ~5 senza. Non tocca nulla di «Non si tocca»; serve solo il suo sì perché la settimana
  precedente aveva scelto di non cambiare nulla.

## 24/10/2026 — dopo 15 reel (settimane 1–3)
Dati: 2 follower; 15 reel. Visualizzazioni medie: settimane 1–2 circa 35 a reel, settimana 3 circa 42 (ma la 15 da sola ne ha 122 in meno di un giorno; senza la 15 la media scende a circa 22).
Like quasi a zero, nessun commento, condivisione o salvataggio.

**Esito della prova della settimana 3 (voce a 0,62 s invece di 1,24 s): non ha funzionato.** La quota vista media è scesa
dal 12% (settimane 1–2) al 6% (settimana 3): le persone restano in media 2–9 secondi invece di 5–17. Con 5 reel e poche
decine di visualizzazioni è un **segnale**, non una prova, e c'è un disturbo: la copertina della 11 è uscita grigia (corretta il 19/10).
Ma la direzione è chiara: anticipare la voce non ha trattenuto di più.

**Decisione di Davide (24/10): i dati sono troppo pochi per basarci un cambiamento: la settimana 4 (puntate 16–20, 26–30/10) si fa
identica alla settimana 3** (voce a 0,62 s, copertina a 0,3 s). Nessuna nuova prova; si riguarda con più reel.

## 16/10/2026 — dopo 10 reel (settimane 1–2)
Dati: 2 follower; 0–110 visualizzazioni a reel (totale circa 330); 1 like al massimo; 0 commenti, condivisioni, salvataggi.
Tutti alle 12:00 (la 7 per un guasto alle 15:02): sull'orario **non c'è niente da dire**.

**Segnale forte (vale su tutti e 10):** le persone guardano in media **5–17 secondi** di reel lunghi **72–83 secondi**,
cioè il 6–22%. Se ne vanno nei primi secondi: la leva principale sono i **primi 3 secondi**, non il resto.
Oggi la voce parte a 1,24 s, dopo il numero grande della puntata.

**Segnali deboli (da verificare, non regole):**
- I ganci con un oggetto di tutti i giorni hanno avuto più visualizzazioni: «Ospedali, scuole, pensioni…» (110),
  «Quando compri un telefono…» (74), «Il pane che compri…» (57). Più astratti: «Se i prezzi salgono del dieci…» (4),
  «Se un ponte crolla…» (1). Troppo pochi per una regola.
- Nessuna interazione: l'invito a commentare non funziona ancora; con 2 follower è normale.

**Prova della settimana 3 (una sola, così si misura):** la voce parte **a 0,62 s invece di 1,24 s** (un battito prima),
il numero grande della puntata resta, ma per 0,6 s invece di 1,2 s (`FIRST=0.6206` in `produci.sh`).
Si confronta la «quota vista» media della settimana 3 con quella delle settimane 1–2 (12%, media delle puntate 1–9).
Tutto il resto resta uguale.

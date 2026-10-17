# Cosa abbiamo imparato dal pubblico (si aggiorna ogni settimana)

Lo legge chi scrive e chi anima le puntate **prima** di cominciare. Lo aggiorna l'agente `reel-analista` ogni sabato
partendo da `social/metriche.json` (storico scaricato da `social/metriche.py`). Regola: con pochi dati si scrivono
**segnali**, non conclusioni; una conclusione richiede almeno ~10 reel confrontabili e qualche centinaio di visualizzazioni.
Tutto dentro `LINEA-EDITORIALE.md`.

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

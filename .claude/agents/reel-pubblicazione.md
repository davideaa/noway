---
name: reel-pubblicazione
description: Prepara l'uscita di una puntata «Dalla teoria alla realtà» già approvata da reel-controllo: scrive la caption, copia il video in social/pubblicati, aggiunge la voce a social/calendario.json e fa la prova di pubblicazione. Non pubblica mai davvero.
model: haiku
---

Prepari l'uscita di una puntata già approvata. Lavoro meccanico, da fare senza errori.

## Input
N, data di uscita (AAAA-MM-GG, ore 12:00), video `~/reel-lavoro/pN/PuntataN.mp4`, copione `noir/voce/righe-pN.json`,
fonti `noir/pN-fonti.md`, titolo della puntata N+1 in `social/corso/lezioni.json`. Modello di caption: la voce della puntata 2 in `social/calendario.json`.

## Cosa fai
1. Caption in italiano, stessa forma della puntata 2: gancio (la prima frase del copione) + emoji · «Puntata N di «Dalla teoria alla realtà»: …»
   · 3–4 punti con i dati (presi da pN-fonti.md) · «Domani, puntata N+1: …» (il venerdì: «Lunedì, puntata N+1: …»)
   · «Una puntata al giorno, dal lunedì al venerdì, alle 12:00.» · «Fonti: …» · «Contenuto educativo · Non è consulenza finanziaria.»
   · 8 hashtag italiani. La **prima riga deve essere diversa** da tutte quelle già in calendario (serve contro i doppioni).
2. `cp ~/reel-lavoro/pN/PuntataN.mp4 sites/studio/social/pubblicati/AAAA-MM-GG-pNN.mp4` e subito `cmp` tra i due file: devono essere
   IDENTICI. Mai ricodificare, ridimensionare o prendere altri file (Puntata 4: era finito in calendario un video orizzontale senza audio).
3. Voce in `social/calendario.json` (stessi campi della puntata 2, stato `programmato`, durata_s dal video). `thumb_offset` = il millisecondo in cui il numero grande della puntata è pieno e fermo: con la voce a 0,62 s (`FIRST` in `produci.sh`) è **300**; a 600 cade sul lampo del cambio scena e la copertina nella griglia del profilo esce grigia (puntata 11, 19/10). Prima di scriverlo estrai quel fotogramma (`ffmpeg -ss 0.30 -i video -frames:v 1 copertina.png`) e guardalo: numero bianco nitido su fondo scuro, niente grigio.
4. Commit di video + calendario sul ramo `claude/creazione-siti-web-u1dyzg` e push (righe finali del commit come i precedenti).
5. `python3 sites/studio/social/pubblica.py --prova --data AAAA-MM-GG` deve finire con «PROVA: tutto pronto, non pubblico.»

## Output
La caption e l'esito della prova. Se la prova fallisce, riporta l'errore esatto e fermati. Non lanciare mai pubblica.py senza --prova.

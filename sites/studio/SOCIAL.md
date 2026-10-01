# SOCIAL — account Instagram/TikTok «Macro & Algo»

Stato scritto il 01/10/2026. Leggere insieme a `STUDIO.md`.

## Decisioni di Davide
- Account Instagram: **@macro.algo.desk** (Business, 2FA attiva, Pagina Facebook collegata). Creato da lui.
- Lingua dei reel: **inglese** (pubblico italiano + inglese).
- Contenuti: Portfolio Algo Manager (il sito non è ancora online, quindi nessun link in bio) + macroeconomia
  (Fed, tassi, Hormuz, Trump…), 30–40 s, motion graphic come in `reel/`.
- Ritmo: **1–2 reel al giorno**, pubblicati solo tra le **10:00 e le 22:00 ora italiana**
  (la sessione resta attiva in quell'arco). Mai uno all'ora, mai spam.
- Prima prove, poi lui dice «parti». Fino ad allora non si pubblica nulla senza il suo ok.
- Costo zero: API ufficiali Meta gratuite. TikTok: l'API pubblica solo in privato finché l'app non è
  controllata da TikTok, quindi all'inizio su TikTok carica lui l'mp4 a mano.

## Regole
- Mai password o token in chat. Il token sta nelle variabili d'ambiente (`IG_ACCESS_TOKEN` (e `IG_USER_ID`)).
- Niente scraping né login con password: solo API ufficiali.
- Si studiano solo account indicati da lui (Business Discovery); si copia la **struttura**, non il contenuto.
- Riga fissa nei reel: «Backtest su dati storici · Trading ad alto rischio · Non è consulenza finanziaria».
  Niente promesse di rendimento né segnali. Le news si verificano prima di pubblicarle.
- Stesse regole di metodo della ricerca: si dichiara prima cosa si cambia, **una variabile per volta**,
  e quanti reel servono prima di concludere. Con pochi reel orari e design sono rumore.

## Segnali dell'algoritmo (dichiarati da Instagram, 2026)
Tempo di visione e rivisioni > condivisioni in DM (le «sends») > like; originalità premiata, repost penalizzati.
Gancio nei primi 2 secondi.

## Stato collegamento (01/10/2026)
- Token Instagram (Instagram API with Instagram Login) inserito da Davide come **credenziale dell'ambiente** («Aggiungi credenziale»,
  Bearer, sito consentito `graph.instagram.com`). Non è una variabile: il proxy aggiunge l'intestazione da solo, quindi si chiama
  `curl https://graph.instagram.com/v23.0/...` **senza token**. Il token non si vede mai.
- Provato: `GET /me` → `macro.algo.desk`, BUSINESS, 0 follower, 0 post. Lettura funziona.
- Per pubblicare serve un video su un URL pubblico (o upload a `rupload.facebook.com`, che andrebbe aggiunto ai siti consentiti).
- Scade dopo ~60 giorni: rinnovo con `graph.instagram.com/refresh_access_token`.

## Da fare
1. FATTO: app Meta «MacroAlgo Studio» (caso d'uso Instagram API with Instagram Login), tester accettato.
   IG user id 17841425810972500 (non segreto). Resta: Davide genera il token («Genera token») e lo mette in `IG_ACCESS_TOKEN`.
   Il token dura ~60 giorni, si rinnova con graph.instagram.com/refresh_access_token (basta il token, niente app secret).
   Per leggere account altrui (Business Discovery) servirà il percorso Facebook Login: da valutare dopo.
2. Test: lettura account → lettura di un account esterno → reel di prova pubblicato.
3. Davide manda screenshot di chi segue + 5–10 account modello → classifica per visualizzazioni/follower,
   scomposizione dei fotogrammi → documento di stile unico (lime `#c8fa72` su `#080b0e`, wormhole, iPhone 3D…).
4. Primo reel di prova in inglese (tema C: «cos'è un drawdown», senza numeri da verificare).

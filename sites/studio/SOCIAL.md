# SOCIAL — account Instagram/TikTok «Macro & Algo»

Stato scritto il 01/10/2026. Leggere insieme a `STUDIO.md`.

## Decisioni di Davide
- Account Instagram: **@macro.algo.desk** (Business, 2FA attiva, Pagina Facebook collegata). Creato da lui.
- Lingua dei reel: ~~inglese~~ → **italiano** dal 01/10/2026: serie educativa «Dalla teoria alla realtà» per universitari (vedi sotto).
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

## Studio account altrui — FUNZIONA (01/10/2026)
- Seconda credenziale: `FB_ACCESS_TOKEN` (Facebook Login, ~60 giorni, scade 30/11/2026), sito consentito `graph.facebook.com`.
  Permessi: instagram_basic, instagram_manage_insights, pages_show_list, pages_read_engagement.
  (`me/accounts` risulta vuoto ma non serve.) Il token lungo è finito in uno screenshot in chat: da revocare e rigenerare a lavoro finito.
- Chiamata che funziona (account Business/Creator pubblici), con id IG di Davide `17841425810972500`:
  `curl -G https://graph.facebook.com/v23.0/17841425810972500 --data-urlencode "fields=business_discovery.username(NOME){username,followers_count,media_count,media.limit(50){timestamp,media_product_type,view_count,like_count,comments_count,caption,permalink,thumbnail_url}}"`
- `view_count` c'è per i reel (include le visualizzazioni a pagamento). `media_url` del video NON viene restituito: niente fotogrammi dall'API,
  solo copertina (`thumbnail_url`). Per scomporre i video servono le registrazioni schermo di Davide.
- Non ci sono tempo di visione, condivisioni, salvataggi degli altri.

## Pubblicazioni
Registro in `sites/studio/social/registro.json` (serve per i recap: 24 h, 3 giorni, settimana, mese).
Primo reel: «Tokenization», 01/10/2026 15:58 ora italiana — https://www.instagram.com/reel/Dd9EfP1AaEO/
Pubblicazione: video committato in `social/pubblicati/` → URL raw GitHub (per commit) → `POST /media` (REELS, thumb_offset) → attesa FINISHED → `POST /media_publish`.

## Da fare
1. FATTO: app Meta «MacroAlgo Studio» (caso d'uso Instagram API with Instagram Login), tester accettato.
   IG user id 17841425810972500 (non segreto). Resta: Davide genera il token («Genera token») e lo mette in `IG_ACCESS_TOKEN`.
   Il token dura ~60 giorni, si rinnova con graph.instagram.com/refresh_access_token (basta il token, niente app secret).
   Per leggere account altrui (Business Discovery) servirà il percorso Facebook Login: da valutare dopo.
2. Test: lettura account → lettura di un account esterno → reel di prova pubblicato.
3. Davide manda screenshot di chi segue + 5–10 account modello → classifica per visualizzazioni/follower,
   scomposizione dei fotogrammi → documento di stile unico (lime `#c8fa72` su `#080b0e`, wormhole, iPhone 3D…).
4. Primo reel di prova in inglese (tema C: «cos'è un drawdown», senza numeri da verificare).

## Serie «Dalla teoria alla realtà» — stato al 01/10/2026 (via libera di Davide)
- Davide ha dato il via libera a produrre e pubblicare da solo, **a patto che ogni puntata esca perfetta**.
  Metodo e controlli: `reel/noir/PROCEDURA-PUNTATE.md` (va seguita alla lettera).
- Uscite: lunedì–venerdì alle **12:00 ora italiana**. Puntata 1 lunedì 05/10/2026, Puntata 2 martedì 06/10, e così via.
- Pubblicazione automatica: routine «Macro & Algo — pubblicazione reel 12:00» (`trig_01RW7ryeWBk55egkxLS9LhVk`),
  cron `CRON_TZ=Europe/Rome 52 11 * * 1-5`, apre ogni volta una sessione nuova che lancia `social/pubblica.py`.
  Lo script pubblica **solo** ciò che è in `social/calendario.json` con stato `programmato` per quel giorno, aspetta le 12:00,
  evita i doppioni (confronta la prima riga della caption con gli ultimi post) e aggiorna calendario e registro.
  Prova senza pubblicare: `python3 sites/studio/social/pubblica.py --prova --data AAAA-MM-GG`.
- Produzione: va fatta in una sessione che ha la voce installata (`~/tts`) e la base `run.wav`: la routine pubblica, non produce.
  Le puntate vanno quindi preparate in anticipo e messe in calendario.
- Profilo (da sistemare a mano da Davide): nome «Macro & Algo · Economia in 90 secondi», categoria Istruzione,
  bio in 3 righe (spiegazioni semplici con dati veri · una puntata al giorno alle 12:00 · inizia dalla puntata 1), post fissato = Puntata 1.
  Il reel inglese «Tokenization» va archiviato a mano (l'API non può archiviare).

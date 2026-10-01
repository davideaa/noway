# STUDIO — memoria unica per siti web e reel

Questa chat (e le prossime) servono solo a **siti web + reel**. Questo file è il riassunto di tutto ciò che
serve davvero, scritto il 01/10/2026 dopo il sito Portfolio Algo Manager e 2 serie di reel. Leggerlo
all'inizio basta: non serve rileggere le vecchie conversazioni né i documenti lunghi in `sites/portfolio/`.

---

## 1. Davide, e come lavorare con lui

- Scrive in italiano colloquiale, spesso da vocale, con refusi: va letto per il senso. Vuole spiegazioni semplici.
- Ha buon occhio e spesso ha ragione: i suoi riscontri vanno presi alla lettera.
  - «Non mi piace X» vuol dire togliere X, non attenuarlo.
  - «Tienila uguale» vuol dire che quella parte non va toccata.
- Vuole **vedere**, non leggere:
  - per i siti, un'anteprima animata e fluida (non foto);
  - per i reel, il video.
- Mandare l'anteprima appena c'è.
- Se il lavoro dura più di qualche minuto, dare un aggiornamento breve ogni tanto: si spazientisce col silenzio.
- Alla consegna:
  - elenco breve di cosa è cambiato;
  - cosa non è stato verificato;
  - poi chiedere cosa cambiare.

## 2. Regole fisse

1. **Onestà sui numeri.**
   - Niente promesse di rendimento.
   - I numeri brutti non si ammorbidiscono: per esempio USDJPY fuori campione rende meno della metà, e lo si dice.
   - Si usano solo i numeri esatti del sito (`sites/portfolio/data/`).
   - In ogni reel o pagina resta visibile la riga «Backtest su dati storici · Trading ad alto rischio · Non è consulenza finanziaria».
   - Accanto agli scenari va scritto «non è una promessa».
2. **Anteprime:**
   - il link dell'artifact Claude, https://claude.ai/artifact/2dEfLUnR1YFKRGPeWFCWN1, da aggiornare con lo stesso indirizzo (`scripts/anteprima_claude.py`);
   - **mai più Netlify** (detto da Davide);
   - githack non autorizzato.
3. **Video:** `SendUserFile` ha un limite di 30 MB. I reel vanno consegnati sotto ~29 MB, con codifica a 2 passate (`monta.sh`).
4. **Musica:** la manda lui (mp4/m4a, anche con WeTransfer: l'API v4 `/transfers/{id}/download` restituisce il `direct_link`). Non consigliare siti che scaricano da YouTube.
5. **Niente offuscamento o cifratura del codice** per impedire di copiarlo: è stato bloccato una volta e non si ripropone. Il repo `davideaa/noway` è **pubblico**; gliel'ho detto, deve renderlo privato lui.
6. **Codice di terzi:** non copiare codice di shaders.com, horizonx, vividsites ecc. Si osserva la pagina renderizzata e si ricostruisce da zero.
7. **Ricerca sull'oro:** non toccare `mt5/`, `tools/`, `docs/`, `report/` né il `CLAUDE.md` della radice.
8. **Git:**
   - branch `claude/creazione-siti-web-u1dyzg`;
   - commit con `Co-Authored-By` e `Claude-Session` come chiede il sistema.
   - Davide ha detto «fermati» al controllo delle PR: non riattivarlo da solo.

---

## 3. Siti web — il metodo che ha funzionato

**Stack:** `sites/nuovo-sito.sh <nome>` crea un progetto con Next.js 16 (export statico), Tailwind 4, Framer Motion, three / @react-three/fiber, ShaderGradient e shadcn.

Prima di scrivere codice Next, leggere `node_modules/next/dist/docs/`: è una versione con API cambiate.

**Team di agenti** (`.claude/agents/`):

| Fase | Agente | Produce |
|---|---|---|
| 1 | art-director | `DESIGN.md` |
| 2 | ux-designer | `UX.md` |
| 2 | copywriter | `COPY.md` |
| 3 | motion-designer | `MOTION.md` |
| 4 | frontend-developer | il sito |
| 5 | qa-performance | controlli; poi l'art-director approva |

Per lavori piccoli si fa direttamente, senza il giro completo.

**Lo stile che piace a Davide: «scroll cinematografico»**
- Un film d'apertura che **parte da solo**, dura circa 10–11 s ed è veloce (non lento come uno scroll).
- Entrata in un **wormhole o tunnel**: lui lo vuole sempre.
- Alla fine un solo pulsante, «Esplora il portfolio →». Al clic si **entra dentro il pianeta o logo**, poi compare il sito vero, partendo dall'alto e non dal fondo.
- Barra in alto sottile.
- Riga del rischio fissa in basso, discreta.
- Logo: il simbolo con la Terra dietro, come sfera 3D che gira piano. Va anche nei Contatti, sulla destra: visibile solo in quella sezione e trascinabile.
- **Cursore fluido** sulle pagine dopo il film:
  - fumo, «come lo svapo»: nuvoloso, non liquido e non a riccioli;
  - raggio piccolo;
  - scia breve che sparisce in fretta;
  - colori lime/verde del sito.
- Dati interattivi:
  - strategie con colore proprio (oro dorato `#e8b04a`, Nasdaq `#5b9dff`, USDJPY `#a78bfa`, portafoglio lime `#c8fa72`);
  - per ogni strategia: grafici dentro/fuori campione, discese, rolling;
  - **simulatore Monte Carlo** interattivo: limite di discesa scelto dall'utente con «?» che spiega, ventaglio 5–95% con mediana, confronto con benchmark (Nasdaq-100 e S&P 500), scenari, spiegazione «risultati approssimativi».

**La regola d'oro dei film (dal prompt BRAND NEW DAY che ha dato Davide)**
- Ogni valore della scena è una **funzione pura di un solo numero `p`** (0→1). Niente stato, molle o inseguimenti dentro la scena.
- Riavvolgendo si torna allo stesso identico fotogramma.
- Niente "sezioni": una sola scena e una telecamera che la attraversa.
- Palette a tre livelli: primitivi, ruoli, bind. I due accenti non condividono mai un fotogramma.
- Le linee luminose vanno in additivo; le linee sottili si fanno "grasse" (in WebGL `linewidth` non funziona).

**Lezioni sui telefoni (costate giorni)**
- iPhone e Safari chiudono la pagina per memoria grafica.
  - Pochi layer compositi: niente `will-change` diffuso; transform 2D su touch; niente `backdrop-filter` su touch.
  - Al clic sul CTA del film, navigazione piena, così si libera il WebGL.
- Il film sul telefono:
  - livello di qualità «media» di default;
  - si scende di livello solo se misurato sotto i 48 fps;
  - mai partire in «lite»: Davide lo trova lento.
- Il pianeta e gli effetti partono solo quando la sezione è in vista (IntersectionObserver).

**Comandi del sito** (`cd sites/portfolio`):

| Comando | Cosa fa |
|---|---|
| `npm run dev` | sviluppo locale |
| `npm run export` | crea `out-export` |
| `python3 scripts/anteprima_claude.py` | anteprima Claude |
| `python3 scripts/offline.py` | cartella e zip offline da mandare agli amici (font dentro il CSS, link relativi) |

**Token del sito:**
- fondo `#080b0e`;
- superfici `#10151a` / `#151c22`;
- testo `#f1f4ee`;
- testo secondario `#939fa9`;
- accento unico lime `#c8fa72` (testo sopra il lime: `#15200c`);
- font Manrope (titoli, 800) e IBM Plex Mono (etichette maiuscole).

**Riferimenti per siti**
- Analisi completa: `sites/portfolio/RIFERIMENTI.md`, sezione 6 «dieci effetti come prompt-specifica».
- **shaders.com:** editor nell'hero, chip che scorrono in marquee lentissimi, luce che corre sui filetti, hover di 150 ms, canvas renderizzati a bassa risoluzione e ingranditi (trucco di costo).
- **horizonx.so:** cursore che piega un campo di traiettorie, titoli che vanno a fuoco lettera per lettera, frangia spettrale sui passaggi, carte con alone del proprio colore.
- **vividsites.app:** cursore anello + punto, bottone con riflesso di luce e leggero magnetismo, navigazione che diventa pillola di vetro.
- **skillry.dev/ai-videos/opus-5-5?category=motion:** motion video fatti in Canvas, SVG o GSAP. Spunti: testo cinetico, alternanza chiaro/scuro, annotazioni "a pennarello" che si disegnano, colpi sonori sincronizzati, diorami 3D, simulazioni di app.

---

## 4. Reel — il motore in `sites/studio/reel/`

**Cos'è:** una pagina HTML 1080×1920 (`comp.html`) con `window.render(t)` come **funzione pura del tempo**. `render.cjs` scatta ogni fotogramma a 60 fps con Chromium e `monta.sh` mette insieme video, effetti e musica. È deterministico: niente registrazioni dello schermo che scattano e niente fotogrammi persi.

**Preparazione** (una volta per sessione):

```
cd sites/studio/reel && npm i                      # playwright-core (Chromium è in /opt/pw-browsers)
python3 -m venv ~/rv && ~/rv/bin/pip install numpy imageio-ffmpeg   # ffmpeg con x264
```

**Flusso di un reel nuovo:**
1. `~/rv/bin/python battiti.py canzone.m4a`: BPM, griglia `t(k)`, energia per battuta. I drop sono i salti verso l'alto, le pause i cali.
2. Scegliere da quale battito parte il reel (circa 6 s prima del primo drop è perfetto), poi scrivere la sceneggiatura copiando `esempi/reel2-alquimia.py`. In `add(n0, n1, tipo, …)` i tempi sono **in battiti del reel**: ogni taglio cade su un battito.
3. `python3 esempi/mio.py` scrive `scene.json`. Poi provini: `LIST="300 1200 2400" node render.cjs prova`, guardarli e correggere.
4. `PY=~/rv/bin/python ./monta.sh canzone.m4a INIZIO_S Reel.mp4`. Circa 4 minuti per 58 s. Esce sotto i 29 MB; se no, abbassare i kbps.
5. Controllare un foglio di provini dal video finito, poi `SendUserFile`.

**Tipi di scena** (componenti in `comp.html`, `grafiche*.js`):

| Gruppo | Tipi |
|---|---|
| Telefono | `phone` (iPhone 3D con home vera, app, tocco, apertura app, ologramma con sfera; chiavi Catmull-Rom `keys`, `tap`, `open`, `holo`, `inn`), `worm` (wormhole) |
| Testo | `words` (parole che sbattono; `*evidenza*`, `#rosso#`, `inv:1` fondo lime), `type` (scrittura lettera per lettera), `count` |
| Dati | `candles`, `city` (mesi in 3D), `isoos` (pannello dentro/fuori campione con tocco sulla pillola), `isoos3`, `under` (discese), `gauge` (rischio 0,5/1/2%), `burst` (500 futuri), `slots` (scenari), `deck` (simulatore a carte), `water`, `race` (contro gli indici), `split3`, `fanc`, `cube`, `rain` (4.206 operazioni), `globe`, `scan` (linea del tempo), `flap` (tabellone), `term` (terminale), `slam` |
| Dal reel 1 | `cards`, `scen`, `dd`, `ddchart`, `form`, `fan`, `bench`, `risk`, `markets`, `timeline`, `months`, `search`, `hero`, `stats`, `trades` |
| Chiusure | `outro` (logo su base luminosa), `outro2` (logo con nome che gira in cerchio + «Esplora il portfolio») |
| Riprese vere | `tel`, `mac`: servono i fotogrammi di `estrai.py` da una registrazione |

Extra per ogni scena:
- `tr` (transizione): `flash` solo sui drop; `whip`, `zoom`, `rise`, `blur`, `punch`;
- `tap` / `taps` (manina con anello e bagliore);
- `drag`;
- `label`;
- `drop:1` (boom e riser automatici in `sfx.py`).

**Cosa piace e cosa no** (dalle sue correzioni)

Sì:
- **Tutto a tempo col BPM**: i tagli sui battiti e anche le animazioni interne (carte, lancette, barre) partono sui battiti o sui mezzi battiti.
- Frasi brevi e d'impatto da marketing, non spiegazioni («DATI, NON OPINIONI.», «3 STRATEGIE. 1 PORTAFOGLIO.», «PER CHI INVESTE CON LA TESTA.», «Tu scegli quanto rischiare.», «Più rischio. Più (potenziali) discese.»).
- Grafici **ricostruiti** e interattivi: dito che preme, mirino col valore, note a pennarello.
- Intro con iPhone 3D fluido; se ne parla più sotto.
- I 93 mesi che diventano le schede.
- L'ologramma.
- Il wormhole fino al drop.

No:
- **Scossoni a ogni battito** (tremolio, RGB split, lampi «boom boom boom»): tolti.
- **Screenshot dei grafici del sito**: «non si legge», vanno sempre ricostruiti.
- Barre nere sopra e sotto: sempre a tutto schermo.
- Pezzi della barra del film, «Riprendi», barra bassa.
- Scene ripetute.
- «Niente scatole nere», «Hai un dubbio? Scrivici».
- Numeri grandi che coprono il titolo.

Formato:
- 40–60 s, 1080×1920, 60 fps;
- testi tra y 250 e 1500, perché sopra e sotto c'è l'interfaccia di Instagram;
- riga del rischio a y 1530.

**L'intro iPhone (la sua preferita):**
1. Il telefono arriva girando e mostra prima il retro (titanio, piastra delle fotocamere).
2. Home in stile iOS: sfondo montagne, widget meteo blu e mappa, 4×4 icone senza nomi, pillola «Cerca», dock in vetro. Instagram compare fra le app.
3. Il dito tocca la nostra app, che si apre.
4. Il telefono si sdraia e proietta l'ologramma con sfera, logo, «PORTFOLIO / ALGO MANAGER».
5. Si entra nell'ologramma, poi wormhole, poi drop.

**Riferimenti video che ha mandato**, cosa prendere da ciascuno (i file non sono nel repo):

| # | Video | Da prendere |
|---|---|---|
| 1 | «Higgsfield supercomputer» | titolo fisso in alto e app in un riquadro arrotondato; tagli a ogni battito; interfaccia che si apre (menu, scelta della modalità); finale cinematografico. È lo stile della prima prova. |
| 2 | «Claude Code skill → launch videos» | logo e marchio che sbattono su fondi pieni (rosso, blu), pattern che riempiono lo schermo, liste che si spuntano, parole cinetiche giganti. |
| 3 | «One prompt… insane» | MacBook vero sul tavolo, telefono in 3D che fluttua sullo schermo, luce verde e blu. |
| 4 | «Google Drive / New» | interfaccia su fondo scuro: cartella che si apre, upload, spunta verde, barre di avanzamento, manina e cursore con bagliore. |
| 5 | «Blackbox / IDE» | finestre di codice, terminale, finestre in stile Windows: interfacce che si montano a scatti. |
| 6 | «Give AI your website» | pagina bianca con griglia di contenuti generati e numeri giganti «3x / 100x»; telefono finale. |
| 7 | «Blender + prompt» | interfaccia 3D con prompt e risultato cinematografico. |
| 8 | «Logo reveals» | logo che si compone da forme semplici (arco, cerchio) su monitor; rivelazioni eleganti. |
| 9 | **«Slate»** | iPhone 3D che entra dal blu e si vede l'app; zoom sul logo 3D; parole grandi su sfondo chiaro e scuro con sfocatura di movimento («yeah», «Balls», «DAMA»); chiusura col logo. **La base dell'intro iPhone.** |
| 10 | «motionthekx» | parole che compaiono una per volta su sfondo chiaro, profilo Instagram che si costruisce, chiusura su blu pieno. |

**Griglie delle canzoni usate**
- **X-COOL (Slowed):**
  - battiti `0,98 + 0,5186·k` (115,7 bpm);
  - drop a 6,166 s;
  - reel 1, prove 4–6: `esempi/reel1-xcool.json`.
- **MONTAGEM ALQUIMIA (Slowed):**
  - battiti `18,125 + 0,5455·k` (110 bpm);
  - drop della canzone ai battiti 14 e 78;
  - reel 2: parte da 19,7615 s, drop del reel a 6,0 s e 40,91 s, pausa 27,27–40,91 s, fine a 58,37 s.

**Codifica:** x264 a 2 passate, `-b:v 3700k` per circa 58 s, cioè 28–29 MB. Audio AAC 192k: musica + `sfx.wav` al 45%, `alimiter`.

---

## 5. Numeri verificati (portafoglio, dati del sito)

| Cosa | Valore |
|---|---|
| Operazioni | 4.206 in 93 mesi (2019-01 → 2026-09) |
| Mesi in cui tutte e tre sono andate in perdita | 6 |
| XAUUSD (oro) | 1.123 operazioni, discesa −24,5%, 14 perdite di fila, 42% vinte |
| Nasdaq | 1.626 operazioni, discesa −13,1%, 7 perdite di fila, 54% vinte |
| USDJPY | 1.457 operazioni, discesa −13,1%, 8 perdite di fila, 47% vinte |
| Discesa massima del backtest per rischio a operazione | 0,5% → −15,0% · 1% → −28,0% · 2% → −49,0% |
| Scenario prudente, 10.000 € a 5 anni | 20.852 / 35.317 / 66.198 € |
| Discesa dello scenario prudente | −14,1% tipica, −22,5% nel 95% dei casi |
| Indici reali su 5 anni, 10.000 € | Nasdaq-100 → 26.581 €, S&P 500 → 19.027 € |

Resa media per operazione, dentro → fuori campione:

| Strategia | Dentro | Fuori | Fuori campione da | Note |
|---|---|---|---|---|
| Oro | +0,11 R | +0,25 R | 2024-01 | migliora |
| Nasdaq | +0,09 R | +0,14 R | 2024-01 | migliora |
| USDJPY | +0,12 R | +0,06 R | 2023-01 | meno della metà; t fuori campione 1,48 |

## 6. Dove sta cosa

| Percorso | Contenuto |
|---|---|
| `sites/portfolio/` | il sito |
| `sites/portfolio/data/` | operazioni, strategie, derivati, benchmark |
| `sites/portfolio/RIFERIMENTI.md`, `DESIGN.md`, `MOTION.md`, `SPEC-FILM.md` | approfondimenti (solo se servono) |
| `sites/studio/reel/` | motore dei reel |
| `sites/studio/reel/dati/` | dati dei reel: curve, MC, storia, extra, globo, `dati2` (candele e mesi), `dati3` (dentro/fuori campione) |
| `sites/studio/reel/esempi/` | sceneggiature a tempo: il campionario per sincronizzare con la musica |

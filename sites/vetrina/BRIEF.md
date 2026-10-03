# BRIEF — Vetrina di Davide (v2)

Una sola pagina HTML, **offline** (si manda come file e si apre col doppio clic): il "curriculum digitale" di Davide,
web designer freelance. Serve a convincere un titolare (hotel, locale, farmacia, teatro…) a farsi rifare il sito.
Si costruisce con `python3 build.py` → `out/vetrina-davide.html` (e `--artifact` per l'anteprima su Claude).

## Chi è Davide (solo questi fatti, niente di inventato)
- 22 anni, laureato in Economia delle banche.
- Da tre anni lavora come freelance: siti web, web design, restyling, motion graphic (animazioni, reel, video),
  e collegamento dei siti a prenotazioni, ordini e logistica.
- Email PROVVISORIA: `ciao@davidestudio.it` (costante `EMAIL` in build.py, segnaposto `{{EMAIL}}` in pagina.html).
  **Mai** usare la gmail personale. Nessun telefono, nessun cognome, nessuna foto di Davide.
- Niente prezzi, niente numeri di clienti, recensioni o premi inventati.
- Lavori: 1 pronto (Cosmo Hotel Palace, hotel e centro congressi a Cinisello Balsamo, Milano). Altri 2 "in arrivo"
  (un locale per aperitivi; un terzo da decidere). I lavori sono **proposte di restyling su siti reali**, non commissioni: dirlo così.

## Cosa ha chiesto Davide (parole sue, in sintesi)
- Vetrina «molto più bella», professionale, pulita, **molto interattiva**: un'animazione d'apertura, animazioni allo
  scorrimento, «tutte le animazioni fighe». Testi scritti meglio.
- I lavori come riquadri che, passandoci sopra, «si alzano e si illuminano come i canali della Wii»: cliccati, si «entra dentro».
- Il prima/dopo di prima era **scattoso, laggava, mostrava solo 3 pagine**: deve mostrare **tutto il sito** (tutte le 11 pagine:
  anche ristoranti, wellness, galleria…) ed essere **fluido**. Tema e meccanica del confronto da reinventare: originale, interattivo.

## Direzione visiva (valida per entrambi gli agenti)
Metafora: **il prima è grigio, il dopo è a colori.** Tutto ciò che è "prima" usa un look da sito vecchio (grigio, Times,
link blu sottolineati, bordi grezzi); tutto ciò che è "dopo" è il marchio di Davide, curato e luminoso.
- Token (definirli in `:root`, pagina chiara per scelta + momenti scuri; niente tema scuro automatico):
  `--carta #F3F4F6` `--bianco #FFFFFF` `--inchiostro #0D0F12` `--testo #2D323A` `--tenue #5C6470` `--linea #D8DCE2`
  `--azzurro #2BB5E8` (selezione, "dopo", azioni) `--azzurro-profondo #0A6FA0` (testo azzurro su chiaro, AA)
  `--notte #0B0D10` `--notte-2 #15181D` (sezioni scure e cornice del confronto) `--grigio-prima #9AA0A8`.
- Caratteri (già incorporati dal build, non caricare altro): titoli **Bricolage Grotesque** (variabile 400–800, opsz),
  testo **Figtree** (400–600). Il "prima" usa `"Times New Roman", Times, serif`.
- Divieti: niente gradienti viola, niente emoji come decorazione, niente card tutte uguali in fila, niente testo grigio
  chiaro illeggibile, niente `backdrop-filter` su telefono, niente scroll-jacking (lo scorrimento resta nativo).
- Movimento: solo `transform` e `opacity`; `prefers-reduced-motion` → tutto visibile e fermo; la pagina è leggibile anche
  se un'animazione non parte (niente contenuto lasciato a opacità 0 in attesa di un observer: si parte visibili, poi GSAP
  anima "from").
- Telefono prima di tutto: 360–430 px perfetti, nessuno scroll orizzontale, tocchi ≥ 44 px.

## Librerie
`vendor/gsap.min.js` e `vendor/ScrollTrigger.min.js` (GSAP 3.13, licenza gratuita) sono già scaricati e il build li
incorpora prima degli script della pagina (globali `gsap`, `ScrollTrigger`). Se serve altro da GSAP (es. SplitText,
Flip, Observer, tutti gratuiti dal 2025) scaricarlo da cdnjs in `vendor/` con la stessa versione 3.13.0. Nient'altro.

## Contratto fra i due pezzi
- Dati: `window.VETRINA = { email, progetti: [ { id, nome, categoria, luogo, dominio, cambi[], pronto, anteprima:{prima,dopo} (data URI 16:10), …dati del confronto } ] }`.
  I progetti con `pronto:false` hanno solo `id, nome, categoria`.
- La pagina apre un lavoro con **`window.Confronto.apri(id, elementoDiPartenza)`** (l'elemento serve per l'animazione
  di ingresso dal riquadro). Il confronto, quando si chiude, rimette il focus sull'elemento e lancia
  `document.dispatchEvent(new CustomEvent('confronto:chiuso', {detail:{id}}))`.
- `{{CONFRONTO}}` in `src/pagina.html` è dove il build inserisce il markup di `src/confronto.html` (in fondo al body).
- Classi: la pagina usa prefisso libero; il confronto usa **solo** classi con prefisso `cf-` e id con prefisso `cf-`
  (niente collisioni di CSS).

## File e proprietari (non toccare i file degli altri)
| Agente | File |
|---|---|
| Pagina | `src/pagina.html`, `src/vetrina.css`, `src/vetrina.js`, `vendor/*` |
| Confronto | `src/confronto.html`, `src/confronto.css`, `src/confronto.js`, funzioni `sito_dopo()` e `dati_progetto()` in `build.py` |
| Coordinatore | il resto di `build.py`, `BRIEF.md`, commit |

Prove: copia o serve `out/` con `python3 -m http.server <porta>` (pagina: 3601, confronto: 3602), Playwright con
`require('/opt/node22/lib/node_modules/playwright')` e `executablePath: '/opt/pw-browsers/chromium'`; aprire anche il
file con `file://` e con la rete bloccata (`ctx.route(/^https?:/, r => r.abort())`): deve funzionare offline.
Non usare `pkill`. Non fare commit. Rispondere con un rapporto breve: cosa c'è, cosa non è verificato.

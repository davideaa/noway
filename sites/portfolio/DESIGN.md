# DESIGN — Portfolio di Davide (strategie algoritmiche)

Versione 0.1. Sono **valori iniziali, facili da cambiare**. L'occhio di Davide decide: si affina a tentativi.
Il brief vincola la struttura e i limiti (contrasti, peso, movimento). I numeri dentro i limiti si possono ritoccare.

Cosa è il sito: la vetrina del portafoglio di tre strategie algoritmiche (oro, nasdaq, USDJPY).
Non è un portfolio creativo generico. Fonte dello stile: l'artifact "Portafoglio, tre strategie" di Davide
(token letti dal suo blocco `<style>`). Nessun dato personale è inventato: dove manca, vedi "Da decidere".

## 1. Concetto (una frase)

Il visitatore non scorre una pagina: **entra**, scena dopo scena, in una sala di controllo silenziosa
dove ogni cifra di rendimento ha accanto il suo rischio.

## 2. Due direzioni considerate

| | A. Sala di controllo (RACCOMANDATA) | B. Ghiaccio strumentale |
|---|---|---|
| Base | fondo quasi nero verde-grigio, accento lime `#c8fa72`, gradiente verde scuro | stesso fondo, accento azzurro `#72baff`, gradiente blu notte |
| Pro | è già il linguaggio dell'artifact di Davide, coerente, lime molto leggibile (16,3:1 sul fondo) | più "freddo" e istituzionale |
| Contro | lime e oro (colore dell'oro-strategia) sono vicini per chi non distingue bene i colori: mai colore da solo, sempre anche il nome | l'azzurro è già il colore della strategia nasdaq: l'accento del sito si confonderebbe con i dati |

Raccomando **A**. B non è scartata per gusto ma perché ruberebbe un colore ai dati.

## 3. Token in UN solo posto

Regola: **la fonte unica è `:root` in `src/app/globals.css`**. Niente copie in altri file.
- I componenti usano le variabili CSS (`var(--acc)`), non esadecimali scritti a mano.
- Lo shader ha bisogno di stringhe JS: il componente hero le legge da `:root` con `getComputedStyle`
  (è un componente solo client, quindi si può). Niente seconda lista di colori.
- Cambiare l'accento o il fondo = cambiare una riga.

Il tema è **solo scuro** (come il riferimento, `color-scheme: dark`). Il `:root` chiaro attuale (oklch) va sostituito, non affiancato.

Mappatura shadcn (in `:root`, non in `.dark`): `--background=--bg`, `--foreground=--ink`, `--card=--surf`,
`--popover=--surf2`, `--primary=--acc`, `--primary-foreground=--acc-ink`, `--secondary/--muted=--surf2`,
`--muted-foreground=--mut`, `--accent=--acc2`, `--accent-foreground=--ink`, `--destructive=--bad`,
`--border=--line`, `--input=--line3`, `--ring=--acc`. Raggi: sovrascrivere `--radius-sm/md/lg` con 4/8/14 px.

Note di integrazione trovate nel progetto (non le ho toccate, non è il mio perimetro):
`globals.css` ha `--font-sans: var(--font-sans)` (riferimento a se stessa: non risolve);
`layout.tsx` usa ancora Geist, `lang="en"` e il titolo "Create Next App".

## 4. Palette

Tutti i rapporti sono calcolati con la formula WCAG 2.x (luminanza relativa). Soglie: testo normale 4,5:1, testo grande 3:1, bordi di controlli 3:1.

| Token | Valore | Ruolo | Contrasto |
|---|---|---|---|
| `--bg` | `#080b0e` | sfondo pagina | — |
| `--surf` | `#10151a` | carte, pannelli | — |
| `--surf2` | `#151c22` | pannello alto, campi | — |
| `--ink` | `#f1f4ee` | testo principale | 17,77 su bg · 16,53 su surf · 15,49 su surf2 |
| `--mut` | `#939fa9` | testo secondario, etichette | 7,30 su bg · 6,79 su surf · 6,37 su surf2 |
| `--mut2` | `#818e94` | seconda riga dei titoli (solo testo grande) | 5,85 su bg |
| `--acc` | `#c8fa72` | accento unico: link attivo, CTA, linee di segnale | 16,32 su bg · 15,18 su surf |
| `--acc-ink` | `#15200c` | testo sopra `--acc` | 13,97 |
| `--acc2` | `#1b2820` | fondo tenue verde (hover, callout) | ink 13,80 · mut 5,67 · acc 12,67 |
| `--acc-mid` | `#3c5727` | SOLO per gradiente e alone d'ambiente | non è un colore di testo |
| `--line` | `#252e34` | filetti decorativi | 1,43 su bg: solo decorazione |
| `--line2` | `#39454d` | filetti in evidenza | 2,00 su bg: solo decorazione |
| `--line3` | `#5f6e78` | **bordo di campi e controlli (NUOVO)** | 3,75 su bg · 3,49 su surf · 3,27 su surf2 |
| `--st-oro` | `#e5b966` | identità strategia ORO | 10,77 su bg · 9,39 su surf2 |
| `--st-nas` | `#72baff` | identità strategia NASDAQ | 9,57 su bg · 8,34 su surf2 |
| `--st-usdjpy` | `#b59aff` | identità strategia USDJPY (`--uj` nel riferimento) | 8,48 su bg · 7,40 su surf2 |
| `--ok` | `#c8fa72` | stato ok (uguale all'accento, come nel riferimento) | 16,32 su bg |
| `--warn` | `#efbd68` | avviso | 11,41 su bg |
| `--bad` | `#fa8c82` | errore, perdita, drawdown | 8,58 su bg · 7,48 su surf2 |

Regole di colore
- **Un solo accento (lime).** I tre colori strategia servono solo a identificare la loro strategia (punto, linea del grafico, cursore). Mai decorazione.
- Il colore non basta mai da solo: strategia = colore + nome scritto; stato = colore + icona/testo (`--ok` e `--acc` sono lo stesso colore).
- Lime mai come riempimento grande. Superfici grandi restano `bg/surf/surf2/acc2`.
- Bordi di input, checkbox, slider: `--line3` (il riferimento usa `--line2` a 2:1, non basta per i controlli).
- Il fondo dei testi lunghi è sempre una superficie piena, mai lo shader.

## 5. Tipografia

Due famiglie, come nel riferimento. **Le confermo**: Manrope (sans geometrica, leggibile, buona a pesi 500-600 con tracking stretto)
e IBM Plex Mono (numeri e sigle "da strumento"). Entrambe sono nella lista di `next/font/google` di questo progetto:
Manrope variabile (200-800), Plex Mono 400/500; sottoinsieme `latin` copre le lettere accentate italiane.
Caricarle con `next/font` (si scaricano in fase di build, nessuna chiamata a Google dal visitatore). Non ho potuto scaricare i file: il loro peso in kB è **non misurato**.

| Ruolo | Corpo | Peso | Interlinea | Tracking |
|---|---|---|---|---|
| Display (titolo hero) NUOVO | `clamp(2.5rem, 1.2rem + 6vw, 6rem)` (40-96 px) | 500 | 1,02 | -0,045em |
| Titolo scena | `clamp(30px, 4vw, 54px)` | 500 | 1,12 | -0,05em |
| H2 | 20 px | 600 | 1,3 | -0,035em |
| H3 / etichetta | 14 px, colore `--mut` | 500 | 1,4 | 0 |
| Corpo | 16 px | 400 | 1,6 | 0 |
| Corpo secondario | 14 px, `--mut` | 400 | 1,65 | 0 |
| Nota | 12 px | 400 | 1,6 | 0 |
| Eyebrow (mono, maiuscolo) | 12 px | 500 | 1,4 | +0,13em |
| Cifra XL | `clamp(32px, 4.2vw, 58px)` | 500 | 1,2 | -0,055em |
| Cifra L | `clamp(24px, 2.8vw, 40px)` | 500 | 1,3 | -0,04em |
| Cifra M (mono) | 17 px | 400-500 | 1,3 | 0 |

- Scala di soli 9 passi: 12, 14, 16, 20, 24 fissi + i 4 fluidi sopra. Il riferimento ne usa 22 diversi.
- **Minimo 12 px**, sempre. Il riferimento ha 26 dichiarazioni a 10-11 px (in parte corrette più avanti): non le copio.
- Cifre: `font-variant-numeric: tabular-nums`, formato italiano (`1.234,5`, `0,70%`), segno meno vero `−`.
- Firma dei titoli: due righe, la prima `--ink`, la seconda `--mut2` non corsiva ("Il capitale. / In movimento.").
- Paragrafi lunghi: massimo 68 caratteri di larghezza.

## 6. Griglia, spaziatura, raggi, linee, ombre

- Griglia: 12 colonne, gutter 24 px, contenuto largo al massimo 1440 px (il riferimento arriva a 1880: troppo per leggere).
- Breakpoint dal riferimento: 600 / 950 / 1200 / 1650.
- Rail laterale 88 px (70 px sotto 950; barra in basso alta 67 px sotto 600). Margine pagina: 36 (52 oltre 1650, 24 sotto 1200, 20 sotto 950, 16 sotto 600).
- Spaziatura, passi fissi: **4, 8, 12, 16, 24, 32, 48, 64, 96, 128** (`--sp-1` … `--sp-10`). Padding carta 24 (20 tablet, 16 telefono). Distanza tra scene 64 (48, 32).
- Raggi: **4** (etichette), **8** (bottoni, campi), **14** (carte, pannelli), cerchio 50%. Il riferimento ne ha 12 diversi (da 2 a 14).
- Linee: filetto 1 px `--line`. Callout con barra a sinistra 2 px `--acc`. Sul bordo alto del pannello principale un "filo di luce" 1 px, gradiente trasparente → lime → trasparente, tra il 20% e l'80% della larghezza.
- Ombre: **mai ombre grigie**. La profondità viene da aloni colorati con raggio negativo: pannello `0 25px 75px -55px #a8e55a66`, CTA `0 0 30px -12px #c8fa7266`, barra attiva del rail `0 0 15px #c8fa7280`. Sulle scene di strategia lo stesso alone col colore della strategia.
- Focus: `outline: 2px solid var(--acc); outline-offset: 5px` (16,3:1). Area di tocco minima 44 px.

## 7. Struttura a scene e navigazione

Una pagina lunga divisa in **scene** numerate (`01 — INGRESSO`, eyebrow mono con il numero in lime). L'ordine finale lo decide `UX.md`; io fisso lo stile. Ipotesi di lavoro:
Ingresso (hero) · Le tre strategie (una scena per ciascuna, col suo colore) · Rischio · Metodo · Contatti.

- **Rail di navigazione** (dal riferimento): sfondo `#0b0f12e8` con blur 20 px, bordo destro `--line`, icone lucide-react tratto 1,6 a 21 px, etichetta 12 px peso 600, colore `#91a0a9` (7,15:1). Voce attiva: lime + barra di 2 px a sinistra con alone. In fondo contatore mono `n / N` e filo verticale lime.
- Sotto 600 px il rail diventa barra in basso; marchio e contatore spariti.
- Marchio: le tre barre inclinate (skewY -12°) del riferimento come **segnaposto**: il logo lo decide Davide.
- **La scena 3D del sito è il grafico "Profondità"** dell'artifact (traiettorie in prospettiva) e il tasto "Immergiti" (pannello a tutto schermo). Non un oggetto 3D decorativo. Lo shader è solo atmosfera dell'hero.
- Sfondo delle scene interne: alone CSS `radial-gradient(ellipse at 73% 7%, #3c572712, transparent 50%)` (dal riferimento), tinto col colore strategia. Niente WebGL nelle scene interne.
- Contatto: email prevista **PORTFOLIOALGOMANAGER21@gmail.com** (indicata dal coordinatore, da confermare con Davide). In pagina in `IBM Plex Mono`, con link `mailto:` e tasto "copia". Le email non distinguono le maiuscole: la mostrerei in minuscolo perché più leggibile (da confermare).

## 8. ShaderGradient come sfondo dell'hero

### Cosa ho misurato
Prova reale di rendering (ShaderGradient 2.4.20, Chromium headless con rendering software, non una GPU vera).

1. `lightType="3d"` è solo una luce ambiente con intensità `brightness × π`. Il colore a schermo scala **linearmente** con `brightness`
   (con i colori del tuo test: 0,6 dà 0,60 della luminosità di 1,0). Nel punto più chiaro il colore mostrato è circa 85-95% dell'esadecimale a `brightness 1.0`.
2. Con `#1b2a4a / #c9a24b / #0b0b10` il giallo **non era saturo** in `3d` (0% di pixel a 250 o più): l'inquadratura è dominata dal `color2` (l'oro), il blu compare solo negli angoli e il nero quasi non si vede.
   Quindi "giallo" = `color2` domina + luce alta. Il "bruciato" che hai visto quasi certamente veniva da `lightType="env"` e/o `grain="on"` e/o `brightness 1.2` del preset (non so quali erano attivi: **non l'ho riprodotto**).
3. `lightType="env"` scarica un file HDR da un server esterno (`city.hdr`). Nel mio ambiente il download è fallito e l'errore ha lasciato la pagina senza canvas. In produzione sarebbe un rischio (server di terzi, rete lenta): **non usare `env`**.
4. `grain="on"`: nel mio ambiente l'immagine usciva quasi nera con puntini verdi. Può essere un limite del rendering software e non un difetto su GPU vera: **non verificato**. Per sicurezza `grain="off"` e grana fatta con un overlay CSS.

### Configurazione di partenza (quella misurata)
```tsx
<ShaderGradientCanvas pixelDensity={1} fov={45} pointerEvents="none" style={{position:"absolute", inset:0}}>
  <ShaderGradient
    control="props" type="plane" animate="on"
    lightType="3d" brightness={1.0} grain="off" reflection={0.1}
    color1="#1b2820"   // --acc2
    color2="#3c5727"   // --acc-mid  (domina l'inquadratura)
    color3="#080b0e"   // --bg       (angoli)
    uSpeed={0.2} uStrength={1.5} uDensity={1.2} uFrequency={0} uAmplitude={0}
    cAzimuthAngle={180} cPolarAngle={90} cDistance={3.6} cameraZoom={1}
    positionX={-1.4} positionY={0} positionZ={0}
    rotationX={0} rotationY={10} rotationZ={50}
  />
</ShaderGradientCanvas>
```
Aspetto: macchie morbide verde oliva scuro su nero, molto calme. **Il tono "tecnico" non lo dà il gradiente**: lo danno il rail, le etichette mono, i filetti. Se serve più carattere si può provare un reticolo CSS di linee a 1 px a bassa opacità sopra lo shader (proposta, non provata).

### Cosa regolare, in quest'ordine, se esce troppo chiaro o troppo giallo
1. `lightType` sempre `"3d"`.
2. `brightness`: è lineare, si cambia a passi di 0,1. Intervallo utile 0,7-1,0.
3. Scurire `color2`: è il colore che domina l'immagine.
4. `grain` spento.
5. Forma (`uStrength`, `uDensity`, `uSpeed`) cambia il disegno, non la luminosità.
Non provati: `type="sphere"`, `type="waterPlane"`, preset del pacchetto, transizione di colore tra scene.

### Limite di luminosità (per il testo sopra lo shader)
Pixel più chiaro misurato in 12 secondi di animazione, contrasto del testo:

| brightness | pixel più chiaro | `--ink` | `--acc` | `--mut` |
|---|---|---|---|---|
| 1,0 (desktop) | `#44642a` | 6,10 | 5,60 | **2,51 (non passa)** |
| 1,0 (telefono, 195×360) | `#3e5926` | 7,11 | 6,53 | 2,92 (non passa) |
| 1,2 | `#527731` | 4,68 (al limite) | 4,30 | 1,92 |
| 1,5 | `#65933d` | 3,26 (non passa) | 3,00 | 1,34 |

Regole: `brightness` massimo **1,0** e `color2` non più chiaro di `#3c5727`. Sopra lo shader **solo testo `--ink`**, 16 px o più.
Testo `--mut`, note e cifre piccole vanno su una superficie piena (`--surf`) o su uno sfumo verso `--bg`.
Se Davide vuole un gradiente più vivo, allora il testo va su uno sfumo. Campionamento limitato (6 istanti, due formati): il margine va ricontrollato con lo screenshot vero.

Sfumo di uscita: gli ultimi 25% dell'hero sfumano a `--bg`, così non c'è stacco con la scena successiva.
Lo shader è decorativo: `aria-hidden`, nessuna interazione.

### Fallback statico (stesso posto, stesso aspetto)
Un `<div>` con sfondo CSS al posto dello shader; è anche l'immagine mostrata mentre lo shader si carica (nessun salto di layout):
```css
background:
  radial-gradient(70% 90% at 30% 35%, #2f4521 0%, #1b2820 55%, #080b0e 100%);
```
Valori scelti sulla luminosità media misurata (`#27391d`-`#304622`), **non confrontati a occhio** con lo shader: da regolare.
Si usa quando: `prefers-reduced-motion`, niente WebGL, `Save-Data` attivo, l'utente preme "Pausa animazione", o lo shader gira sotto ~40 fps nei primi 60 fotogrammi.

## 9. Movimento (verso l'interno)

Richiesta di Davide: **entrare in profondità, lungo Z, non scivolare verso il basso.** Il riferimento ha due entrate:
`enter-scene` (opacità + `rotateX(9deg) scale(.93)`, nessuno spostamento: è quella giusta, si tiene)
e `reveal-card` (`translateY(70px)`, sale dal basso: è quella sbagliata, **non si copia**).
`MOTION.md` (motion-designer) sceglie la coreografia; qui ci sono i limiti e i valori di partenza.

| Token | Valore iniziale | Uso |
|---|---|---|
| `--ease` | `cubic-bezier(.2,.7,.2,1)` | **unico easing** del sito (dal riferimento) |
| `--dur-fast` | 200 ms | hover, pressione |
| `--dur-base` | 300 ms | colori, bordi |
| `--dur-enter` | 850 ms | comparsa di carte e blocchi |
| `--dur-scene` | 1200 ms | solo la prima scena e il pannello principale |
| `--dur-dialog` | 650 ms | "Immergiti" a tutto schermo |
| `--persp` | 1200px | prospettiva delle entrate |
| `--z-from` | -140px | punto di partenza in profondità (da provare) |
| `--rx-from` | 4deg | leggera inclinazione all'ingresso |

Entrata di un blocco: `opacity 0→1` + `perspective(var(--persp)) translateZ(var(--z-from)) rotateX(var(--rx-from))` → `none`. Nessun `translateY`.
Scaglionamento 60 ms tra fratelli, al massimo 5 (poi tutti insieme). Ogni blocco entra **una volta sola**.
Scroll: la scena che se ne va "si avvicina e sfuma" (scala 1→~1,08 e opacità →0 nell'ultimo quarto), la successiva arriva da dietro. Valori da rifinire, la direzione no.

Si anima solo `transform` e `opacity`. Mai `top/left/height/width/box-shadow` in animazione.

**Cosa NON si anima**
- Il testo dopo che è comparso: niente movimento, mai parallasse su paragrafi.
- Le cifre: **mai contatori che salgono da zero**. Un numero finanziario compare col valore vero (al massimo sfuma).
- Rail, focus, messaggi di errore, campi, il contatto.
- Lo scroll: **mai catturato** (no scroll-jacking, no scroll a scatti). La pagina scorre normalmente; il movimento è collegato alla posizione.
- Nessun elemento oltre lo shader e l'alone "calibra" (1 s, solo mentre carica) va in ciclo continuo.

**prefers-reduced-motion** (dal riferimento, esteso): nessuna animazione e nessuna transizione, `scroll-behavior: auto`,
contenuto subito visibile, shader sostituito dal fallback statico. Per Framer Motion prevedere `MotionConfig reducedMotion="user"`
(esiste nelle versioni che conosco; la 13 installata qui **non l'ho verificata**).
**Senza JavaScript il contenuto è visibile**: lo stato "nascosto" esiste solo se una riga inline nell'`<head>` aggiunge `.js-motion` prima del primo disegno (come nel riferimento) e solo se non c'è riduzione del movimento.
**Pausa animazione**: lo shader si muove per più di 5 secondi da solo, quindi serve un comando visibile per fermarlo (WCAG 2.2.2). Un tasto piccolo nel piede del rail o nel footer; attiva il fallback statico.
`will-change` solo durante l'animazione (nel riferimento il pannello principale lo tiene sempre: non lo copio).

## 10. Immagini, grafici, icone

- **Niente foto stock, niente illustrazioni figurative, niente emoji.** Le immagini del sito sono dati (grafici) e atmosfera (shader/alone).
- Grafici: canvas o SVG con questa palette. Linea della propria strategia 1,5-2 px nel suo colore; griglia `--line`; assi in mono 12 px `--mut`; tratteggio per il confronto (backtest vs mediana). Le serie sono sempre distinguibili anche senza colore (etichetta diretta).
- Dato di esempio o non ancora fornito: etichetta visibile "DATO DI ESEMPIO" o un trattino. **Mai in una versione pubblicata.**
- Icone: `lucide-react`, tratto 1,6, `currentColor`, mai piene.
- Foto o volto di Davide: solo se la fornisce lui (vedi domande). Trattamento: bianco e nero, bordo 1 px `--line2`, raggio 14.

## 11. Peso e telefoni

Misurato: ShaderGradient con three e react-three-fiber aggiunge **circa 293 kB gzip** (esbuild, minificato: 353 kB con React contro 60 kB di React solo). Con Next il numero può cambiare, l'ordine di grandezza no. È di gran lunga la voce più pesante del sito.

Budget (obiettivi miei, **da verificare da qa-performance**, non misurati):
- Lo shader vive in un chunk separato, caricato con `next/dynamic` (`ssr: false`) **dopo** il primo disegno, mai nel percorso critico.
- Prima schermata (HTML, CSS, font, JS iniziale, senza shader): obiettivo massimo 350 kB gzip.
- Font: massimo 2 famiglie, sottoinsieme `latin`, obiettivo sotto 100 kB in totale.
- Un solo canvas WebGL alla volta. Si monta quando l'hero è visibile e **si smonta** quando esce (`IntersectionObserver`).
- Telefono: `pixelDensity` di partenza 0,6-0,75 (sfondo morbido, il calo di nitidezza non si vede; valore da provare su un telefono vero). Desktop 1.
- Se sotto ~40 fps nei primi 60 fotogrammi: si passa al fallback statico e non si riprova.
- Framer Motion: valutare `LazyMotion` per ridurre il JS iniziale (da misurare).
- Su telefono nessun altro elemento in animazione continua oltre allo shader.

## 12. Tre cose da non fare MAI

1. **Mai un rendimento senza il suo rischio.** Ogni cifra di rendimento porta l'etichetta della sua natura (backtest, simulazione, reale), il periodo, e il drawdown alla stessa dimensione visiva. Niente verde trionfale sul solo guadagno, niente cifra grande isolata. Dato mancante: trattino, mai un numero di prova.
2. **Mai far scivolare i contenuti dal basso, né catturare lo scroll.** Si entra in profondità (Z). Nessun `translateY` di ingresso, nessun contatore che sale, nessuno scroll a scatti.
3. **Mai colori vivi su superfici grandi o dentro lo shader, mai testo piccolo sopra lo shader.** Il lime è un segnale (linea, punto, bottone). Lo shader resta sotto i limiti misurati (`brightness` ≤ 1,0, `color2` ≤ `#3c5727`) e non usa `env` né `grain`.

## 13. Cosa ho verificato e cosa no

Verificato
- Token del riferimento letti dal suo blocco di stile (colori, font, scale, raggi, animazioni, rail, `prefers-reduced-motion`).
- Tutti i contrasti della sezione 4 e 8, calcolati con script (WCAG 2.x).
- Rendering di ShaderGradient 2.4.20 in Chromium headless (rendering software) e lettura dei pixel: luce lineare, dominanza di `color2`, pixel più chiari nel tempo.
- Peso del chunk (esbuild minificato + gzip) e presenza di Manrope / Plex Mono in `next/font`.

NON verificato
- Aspetto e fluidità su GPU vere e su telefoni veri; il 40 fps e i valori di `pixelDensity` sono ipotesi.
- `lightType="env"` (solo il fallimento del download), `grain="on"` (uscita quasi nera: forse solo dell'ambiente di prova), `sphere`, `waterPlane`.
- Peso reale dei font; API di Framer Motion 13; il fallback CSS a confronto con lo shader; i valori 3D di `--z-from` e `--rx-from`.
- Strumenti: non ho usato `frontend-design` (non è tra le skill di questa sessione) né Figma, Adobe o Canva. Nessun file Figma collegato.

## 14. Da decidere con Davide

1. **Chi guarda il sito?** Investitori, clienti, datori di lavoro, altri trader? Cambia tono, quanto dettaglio mostrare e quali avvisi servono. Non l'ho ricevuto.
2. **Nome**: con che nome si presenta, persona o marchio? L'email dice "PortfolioAlgoManager": è un nome di marchio? E il logo: si tiene la marca a tre barre inclinate?
3. **Cosa offre il sito**: solo vetrina di ricerca, o anche contatto per gestione, copia dei segnali, consulenza? Il nome "manager" nell'email fa pensare alla seconda: in Italia un'attività del genere può avere obblighi di legge e avvisi obbligatori. Non è un mio campo: da far vedere a un professionista prima di pubblicare.
4. **Ruolo / sottotitolo** (una riga sotto il nome).
5. **Le tre strategie**: quali numeri si possono mostrare (rendimento, drawdown, periodo, numero di operazioni), se da backtest o reali, quali no. Posso riusare i numeri dell'artifact? Va mostrato il grafico "Profondità"?
6. **Progetti**: c'è altro oltre alle tre strategie (EA MT5, dossier PDF, ricerca)? Se sì, vanno in una scena o restano fuori?
7. **Contatti**: solo email? Telegram, LinkedIn, GitHub? Modulo di contatto o solo `mailto:`? Email in minuscolo va bene?
8. **Lingua**: solo italiano, o anche inglese? (`lang` e testi.)
9. **Riferimenti**: 2-3 siti che gli piacciono e **uno che detesta**. Finora l'unico riferimento è il suo artifact.
10. **Accento**: lime confermato? (l'alternativa azzurra è nella sezione 2.) Solo tema scuro va bene?
11. **Foto**: ci sarà una sua foto? Se no, il sito è solo dati e atmosfera.
12. **Livello di movimento**: cinematografico pieno anche su telefono, o statico su telefoni deboli? Il fallback automatico è la mia proposta.

## 15. Cosa NON copio dal riferimento

22 dimensioni di testo diverse e 12 raggi diversi (ridotti a 9 e 3); testi a 10-11 px; bordi dei controlli a 2:1 (`--line3` a 3:1);
ingresso dal basso `translateY(70px)`; `will-change` permanente; larghezza massima 1880 px; `--ok` uguale a `--acc` senza icona di supporto.

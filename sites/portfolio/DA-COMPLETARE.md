# DA COMPLETARE — cosa manca prima di pubblicare

Elenco di tutto quello che in `COPY.md` e' segnato `[DA COMPLETARE]` o `da confermare`, con cosa fa oggi il sito.
Nessun testo qui sotto e' mostrato ai visitatori. Regola seguita: dove manca il dato, il sito omette la parte oppure
mostra una nota sobria ("in preparazione"); non c'e' nessun numero inventato.

## 1. Bloccanti (COPY.md sez. 8, punti 1-4)

| # | Cosa manca | Cosa fa il sito adesso | Dove si cambia |
|---|---|---|---|
| 1 | **Cosa offre il sito** (solo vetrina, oppure gestione / segnali / consulenza). Cambia il testo e gli obblighi di legge | Nessun servizio dichiarato, come in COPY.md | `src/components/sections/Contatti.tsx`, `Avviso.tsx` |
| 2 | **Diciture obbligatorie del Paese del titolare** (avviso, privacy, cookie). Va visto con un professionista | Sesta voce dell'avviso omessa. Nessuna informativa privacy (con il solo `mailto` non c'e' modulo, ma servira' se si aggiunge un'analisi/cookie) | `src/components/sections/Avviso.tsx`, `src/components/site/SiteFooter.tsx` |
| 3 | **Titolare del sito** (nome o ragione sociale, Paese) e **nome definitivo** del progetto | "Titolare del sito" omesso. Il footer non ha "© anno e titolare". Nome provvisorio "Portfolio Algo Manager" in header, footer, metadata, JSON-LD | `src/lib/site.ts` (`SITE_NAME`), `Avviso.tsx`, `SiteFooter.tsx`, `public/og.svg` |
| 4 | **Formato dell'email**: maiuscole come scritto o minuscolo | Mostrata in minuscolo (`portfolioalgomanager21@gmail.com`); il `mailto:` ha l'indirizzo come in COPY.md | `src/lib/site.ts` (`EMAIL`, `EMAIL_SHOWN`) |

## 2. Dati che nei file non ci sono

| # | Cosa manca | Cosa fa il sito adesso |
|---|---|---|
| 5 | **Risultati live/demo**: se il demo e' iniziato, da quando, cosa si pubblica e con che cadenza | Fascia numeri dell'hero: la cifra "mesi di risultati in tempo reale" e' **omessa**. Scena Monitoraggio, "Cosa si pubblica": nota "In preparazione." La frase "Nessun risultato in tempo reale da mostrare. Il demo non e' ancora iniziato." **non** e' usata (COPY.md la vuole solo se confermata) |
| 6 | **Nasdaq, USDJPY e altri strumenti**: stato e dati misurati | Sotto-blocco "Su quali strumenti": "solo l'oro (XAUUSD)" + nota "Altri strumenti: in preparazione" (formula sobria; se non esistono strumenti in lavorazione, togliere la nota). I colori Nasdaq/USDJPY esistono nei token ma non sono usati |
| 7 | **Tempi di risposta alle email** | Omessi |
| 7b | **URL pubblico del sito** | Si imposta con la variabile `NEXT_PUBLIC_SITE_URL` (es. `https://esempio.it`) **al momento della build**. Senza: nessun canonical, `sitemap.xml` vuota, `robots.txt` senza riga Sitemap, JSON-LD senza `url`/`@id`, **nessun `og:image`** (Next scriverebbe `http://localhost:3000/og.png`: meglio niente che un indirizzo sbagliato) |
| 7c | **Immagine Open Graph**: `public/og.png` e' un render provvisorio (font di sistema, non Manrope) | Collegata a `og:image`/`twitter:image` solo quando `NEXT_PUBLIC_SITE_URL` e' impostata. Da rigenerare con le font vere |

## 3. Numeri da ricontrollare (COPY.md sez. 8, punti 8-14)

Sono mostrati come in COPY.md. Se Davide conferma un valore diverso, va cambiato nel file indicato.

| # | Numero / testo | Dubbio | File |
|---|---|---|---|
| 8 | **t = 2,61** del ritracciamento (scena Metodo, regola 1) | Calcolata con la deviazione standard 1,26 R (iniziale)? Se si', e' ottimistica di circa il 15% | `Metodo.tsx` |
| 9 | Per gamba su `.p`: 567 / 37,0% / 1,40 e 555 / 47,7% / 1,25 | Etichettati "previsto" in `docs/v1xau-verifica.md`: confermare che sono numeri di run | `Strategie.tsx` |
| 10 | Profit factor `.s` = 1,30 | `v1xau-verifica.md` dice 1,36 (con composto). Nel sito 1,30 (lotto fisso) | `Strategie.tsx` |
| 11 | Anni 2022 e 2024 "a vuoto" (675 operazioni, 9%) | Dato del portafoglio a tre gambe: vale anche per le due? | `Strategie.tsx` |
| 12 | **Percentuali annue 22% / 47%** (tabella "Annuo (backtest)", scena Metodo, regola 2) | COPY.md consiglia di mostrare solo R e profit factor, perche' una percentuale annua si legge come promessa anche se etichettata. **Decisione di Davide.** Nel sito la tabella e' presente, con etichetta "Backtest", rischio 1,05% e drawdown accanto, in dimensione uguale al resto (nessuna cifra grande). Si toglie cancellando il blocco `<TableScroll ...>` + `<RiskNote level="1.05" />` dentro il terzo punto della lista | `Metodo.tsx` |
| 13 | Scheda "Take profit fisso a 2,5R": 159 $ -> 1.795 $ | Viene da una versione precedente della strategia: confermare o togliere la scheda | `Scartate.tsx` |
| 14 | Regole del RITRACCIAMENTO | Nei file c'e' solo il caso rialzista ("prezzo sopra la media"): confermare che esiste il caso speculare, o riformulare | `Strategie.tsx` |

## 4. Scelte e cose non fatte

- **Fase 2 inglese** (COPY.md sez. 7): non costruita. Il sito e' solo italiano (`lang="it"`).
- **Grafico "Profondita'"** (MOTION.md atto 2): non costruito, perche' i dati e il codice stanno nell'artifact di Davide, che qui non c'e'. Al suo posto le tabelle di rischio e mercato hanno barre-dato semplici (larghezze statiche, con i numeri accanto).
- **"Rail" laterale** di DESIGN.md sez. 7: sostituito da una barra in alto (marchio, voci, contatore di scena, "Scrivi via email", filo di avanzamento). Motivo: COPY.md prevede un pulsante in barra e sul telefono la barra in basso avrebbe conteso lo spazio alla barra del rischio.
- **Icone di sezione** in `assets/icons/`: non usate, il sito usa `lucide-react` come da DESIGN.md sez. 10.
- **Menu su telefono senza JavaScript**: il pulsante "Menu" richiede JS. Il resto del sito funziona senza JS.
- **Informativa privacy / cookie**: il sito non usa analisi ne' cookie; se si aggiungono, serve.
- **Prodotto commerciale di partenza**: non nominato e nessun suo numero (COPY.md sez. 8, punto 15).

# COPY — Cosmo Hotel Palace

Versione 1 · italiano · 1 ottobre 2026
Fonti: `BRIEF.md` e le pagine del sito attuale (copie in `/tmp/cosmo-ref/`). Nessun'altra fonte.
Brand Voice e plugin SEO: non attivi in questa sessione. Coerenza e controlli SEO fatti a mano (lunghezze verificate con uno script).

**Legenda.** `[DA CONFERMARE: …]` = dato che il sito vecchio non dà. Accanto c'è un testo di ripiego onesto, che si può pubblicare senza dire il falso. Le parti tra `{graffe}` sono valori dinamici scelti dal codice.

---

## 0. Tono di voce

**Come parla il sito.** Come un receptionist di una famiglia che fa questo mestiere da sempre: cortese, preciso, senza inchini. Dice cosa c'è, dove, quanto. Dà del tu (il sito vecchio dà del tu nei pulsanti: «Prenota il tuo soggiorno»). Nelle sezioni Centro Congressi e Commerciale resta il tu, ma con frasi più asciutte.

**Regole pratiche**
- Frasi di 8–18 parole. Un'idea per frase.
- Prima il fatto, poi (se serve) l'aggettivo. «44 m², due ambienti» batte «spaziosa suite».
- Numeri solo se sono nel brief o sul sito vecchio. Se manca, `[DA CONFERMARE]`.
- I pulsanti dicono cosa succede: «Cerca disponibilità», «Chiama l'Ufficio Eventi», «Invia la richiesta».
- Le 3D si dichiarano per quello che sono: ricostruzioni illustrative.

**Parole da usare:** camera, suite, sala, hall, tram 31, a 2 km da Milano, senza barriere architettoniche, posti auto gratuiti, Centro Congressi, ufficio (Prenotazioni, Eventi, Commerciale), «alle porte di Milano».

**Parole da evitare:** oasi, esperienza indimenticabile/unica, magia, sogno, soluzioni innovative, a 360 gradi, il meglio, lusso, esclusivo (il sito vecchio lo usa: qui no), «tecnologia all'avanguardia» da sola (se lo si dice, si dice quale tecnologia: `[DA CONFERMARE: dotazioni tecniche delle sale]`), stelle e classificazioni, superlativi non dimostrabili (il più grande, il più amato).

**Cosa NON si scrive finché il cliente non conferma:** «4 stelle» (è nella meta description della home vecchia, ma il brief vieta le stelle), «migliori tariffe garantite» (claim del cliente, vedi 4.9), prezzi, «da €», orari di Grill e Lounge, check-in/check-out, colazione, animali ammessi.

---

## 1. Hero — La hall

**Eyebrow:** A 2 km da Milano
**h1:** Lo stile italiano dell'ospitalità, alle porte di Milano.
**Sottotitolo:** Cosmo Hotel Palace è un hotel e Centro Congressi a Cinisello Balsamo. Lo gestisce una famiglia italiana. Ha 201 camere e suite.
**Corpo (visibile sotto lo slider, 2 righe):** Fuori, un'architettura classica. Dentro, volumi ampi e luminosi, design contemporaneo. Entra nella hall e scorri.

**Pulsanti**
- Primario: **Cerca disponibilità** (apre la barra di prenotazione)
- Secondario: **Esplora l'hotel** (scorre alla scena successiva)

**Slider luce**
- Etichetta: `Ora del giorno`
- Valori: `Alba` · `Mattina` · `Pomeriggio` · `Sera`
- aria-label slider: `Ora del giorno nella hall: {valore}. Cambia la luce della scena.`
- Valore letto dallo screen reader: `{valore}`

**Alt / aria-label del diorama 3D**
- `role="img"` + aria-label: `Ricostruzione 3D della hall del Cosmo Hotel Palace: un grande lucernario sopra una scultura in tronco d'ulivo, vetrate e tende bianche. La luce cambia dall'alba alla sera.`
- Nota in piccolo sotto la scena: `Ricostruzione illustrativa, non una fotografia.`
- Istruzione scena (visibile, 1 riga): `Trascina per guardarti intorno.` Da tastiera: `Usa le frecce per ruotare la vista.`
- Pulsante di fermo: aria-label `Metti in pausa l'animazione` / `Riprendi l'animazione`
- Con `prefers-reduced-motion`: scena fissa e testo `Animazione ridotta. Usa lo slider per cambiare la luce.`

**Hotspot hall**
| Hotspot | Titolo | Didascalia |
|---|---|---|
| Lucernario | Il lucernario | La luce entra dall'alto e arriva fino in hall. |
| Tronco d'ulivo | Il tronco d'ulivo | Una scultura di tronco d'ulivo accoglie chi entra. |
| Vetrate | Le vetrate | Grandi vetrate: gli spazi sono luminosi anche nelle ore più grigie. |
| Tende | Le tende bianche | Tende bianche, toni neutri, nessun eccesso. |

aria-label di ogni hotspot: `{Titolo}: apri la didascalia`.

**Interruttore «come viaggi?»** (riordina la home)
- Etichetta: `Come viaggi?`
- Opzioni: `Per lavoro` · `Per piacere`
- Conferma (aria-live): `Home riordinata per un viaggio di {lavoro|piacere}.`
- Per lavoro: prima Centro Congressi, Suite con scrivania, come arrivare. Per piacere: prima camere, dintorni, wellness.

---

## 2. Perché sceglierci

**h2:** Sette cose vere, senza giri di parole.
**Sottotitolo:** Quello che trovi al Cosmo, in ordine di quanto ti serve quando arrivi.
**Corpo introduttivo:** Tocca una scheda per vedere dove si trova nell'hotel.

**Schede** (numero grande + riga + dettaglio al tocco)
| # | Numero/claim | Riga | Dettaglio al tocco |
|---|---|---|---|
| 1 | **2 km** da Milano | Alle porte della città. | Il tram 31 è a pochi passi. In poche fermate arriva alla metro M5, fermata Bignami. |
| 2 | **201** camere e suite | Classic, Family Room, Suite. | Stile contemporaneo, toni naturali, tessuti di pregio. |
| 3 | **900** posti per eventi | Il Centro Congressi su due piani. | 13 sale modulabili con pareti mobili, luce naturale, un team dedicato. `[DA CONFERMARE: numero sale, vedi Domande aperte]` |
| 4 | **200** posti auto gratuiti | E un'area riservata ai bus. | Il parcheggio è gratuito. `[DA CONFERMARE: serve prenotare il posto?]` |
| 5 | **Wi-Fi gratuito** | Nelle camere. | Connessione gratuita in tutte le tipologie di camera. |
| 6 | **Senza barriere** architettoniche | L'hotel è strutturato per essere accessibile. | `[DA CONFERMARE: camere e servizi attrezzati, ascensori, percorsi]` Per esigenze specifiche scrivi a info@cosmohotelpalace.it. |
| 7 | **Una famiglia** dietro l'hotel | Impresa familiare italiana. | Nasce dall'idea e dalla creatività di una famiglia che si dedica all'ospitalità. |

**CTA:** `Vedi le camere` · `Scopri il Centro Congressi`
**Alt dei piccoli diorami delle schede** (icone 3D/SVG): `Illustrazione: {tram che porta alla metro | edificio con due piani | auto in un parcheggio | segnale Wi-Fi | ingresso senza gradini | tavolo di famiglia}.`

---

## 3. Camere

**h2 (anche h1 della pagina /camere/):** Camere e suite
**Sottotitolo:** 201 camere, tre tipologie. Scegli quella che somiglia al tuo viaggio.
**Corpo:** Stile contemporaneo, toni naturali, dettagli curati. In ogni camera: Wi-Fi gratuito, TV satellitare (28 canali stranieri, Sky TV e Sky Sport), climatizzazione regolabile, set di cortesia, cassaforte e minibar. Il minibar si rifornisce al distributore self-service del piano. L'hotel è senza barriere architettoniche.
**Nota diorama (comune):** `Ricostruzione 3D illustrativa. Arredi e proporzioni sono indicativi: le misure in metri quadri sono quelle reali.`
**Comandi diorama (testo visibile):** `Trascina per ruotare · Pizzica per avvicinarti · Tocca i punti per i dettagli`
**Comandi da tastiera:** `Frecce per ruotare, + e − per lo zoom, Tab per passare da un punto all'altro.`

**Interruttori**
- Giorno/sera: `Giorno` · `Sera` (aria-label: `Luce della camera: {giorno|sera}`)
- Vista: `3D` · `Pianta` (aria-label: `Mostra la {camera in 3D|pianta in scala}`)

### 3.1 Chi sei? (consigliere)
**Titolo:** Chi viaggia?
**Sottotitolo:** Dicci chi sei, ti diciamo da dove cominciare.
**Opzioni e risposte**
- `Una coppia` → **Classic Double Room.** 22 m², letto matrimoniale da 160 cm, bagno con vasca o doccia.
- `Una famiglia` → **Family Room.** 44 m², due camere comunicanti con due bagni. Fino a 2 adulti e 2 bambini.
- `Lavoro` → **Suite.** Zona soggiorno con ampia scrivania, anche per piccole riunioni, e camera separata.
- `Quattro adulti` → **Suite.** Letto matrimoniale più divano letto: fino a 4 adulti.
- Frase di chiusura: `È un consiglio, non un obbligo. Sul motore di prenotazione vedi quello che c'è davvero libero nelle tue date.`
- Pulsante: `Vedi {nome camera}` · secondario `Confronta le tre`

### 3.2 Confronto affiancato
**Titolo:** Le tre camere a confronto
| | Classic Double | Family Room | Suite |
|---|---|---|---|
| Superficie | 22 m² | 44 m² | 44 m² |
| Letti | 1 matrimoniale da 160 cm | 1 matrimoniale + 2 singoli (in due camere) | 1 matrimoniale + divano letto |
| Ospiti | 2 adulti | 2 adulti + 2 bambini | 4 adulti, oppure 2 adulti + 2 bambini |
| Ambienti | 1 camera | 2 camere comunicanti | 2 ambienti, ingressi separati |
| Bagni | 1 (vasca o doccia) | 2 (vasca o doccia) | 2 separati (vasca o doccia) |
| Extra | — | Letto singolo extra o culla su richiesta | Coffee maker, accappatoio, pantofole, stirapantaloni |
Pulsante di riga: `Cerca {nome}`. Pulsante per tabella su telefono (scorrimento orizzontale): aria-label `Tabella di confronto: scorri per vedere tutte le camere`.

### 3.3 Classic Double Room
**h1 (pagina /camere/classic-double-room/):** Classic Double Room
**Sottotitolo:** 22 m² luminosi per due. Design moderno, nessun fronzolo.
**Corpo:** La camera doppia è luminosa e ariosa. Ha un letto matrimoniale da 160 cm e un bagno con vasca o doccia. Gli arredi sono in toni naturali e delicati. Il minibar si rifornisce di snack e bevande dal distributore self-service al piano.
**Scheda tecnica:** 22 m² · 1 letto matrimoniale · 2 adulti · Wi-Fi gratuito · TV satellitare (28 canali stranieri, Sky TV e Sky Sport) · climatizzazione regolabile · set di cortesia · cassaforte · minibar
**CTA:** `Cerca la Classic Double` · secondario `Chiedi all'Ufficio Prenotazioni`
**aria-label diorama:** `Ricostruzione 3D di una Classic Double Room da 22 metri quadri: letto matrimoniale con testiera imbottita, parquet in rovere, lampade a pieghe e una finestra. Trascina per ruotare la camera.`
**Pianta alt:** `Pianta in scala della Classic Double Room: 22 metri quadri, un letto matrimoniale da 160 centimetri e il bagno.`
**Hotspot**
| Punto | Titolo | Didascalia |
|---|---|---|
| Letto | Letto matrimoniale | 160 cm, testiera imbottita. |
| Bagno | Bagno | Con vasca o doccia, più un set di cortesia. |
| Finestra | Luce | Camera luminosa e ariosa, con tende bianche. |
| TV | TV satellitare | 28 canali stranieri, Sky TV e Sky Sport. |
| Minibar | Minibar | Lo rifornisci di snack e bevande dal distributore self-service al piano. |
| Cassaforte | Cassaforte | Per documenti e oggetti di valore. |
| Clima | Climatizzazione | Regolabile da te. |

### 3.4 Family Room
**h1 (pagina /camere/family-room/):** Family Room
**Sottotitolo:** Due camere comunicanti, 44 m², due bagni. Ognuno ha il suo spazio.
**Corpo:** La Family Room unisce due camere Classic comunicanti. Una ha il letto matrimoniale, l'altra due letti singoli. Ognuna ha il suo bagno, con vasca o doccia. Ospita 2 adulti e 2 bambini. Su richiesta si aggiunge un letto singolo extra o una culla.
**Scheda tecnica:** 44 m² · 2 camere comunicanti · 2 adulti e 2 bambini · letto singolo extra o culla su richiesta · Wi-Fi gratuito · TV satellitare · climatizzazione regolabile · set di cortesia · cassaforte · minibar
**CTA:** `Cerca la Family Room` · secondario `Chiedi una culla o un letto extra` (apre email a info@ con oggetto precompilato «Richiesta culla/letto extra»)
**aria-label diorama:** `Ricostruzione 3D di una Family Room da 44 metri quadri: due camere comunicanti, una con letto matrimoniale e una con due letti singoli. Trascina per ruotare.`
**Pianta alt:** `Pianta in scala della Family Room: 44 metri quadri, due camere comunicanti, ognuna con il proprio bagno.`
**Hotspot**
| Punto | Titolo | Didascalia |
|---|---|---|
| Porta comunicante | Porta tra le camere | Le due camere comunicano: i genitori restano vicini ai bambini. |
| Letto matrimoniale | Camera matrimoniale | Un letto matrimoniale. |
| Letti singoli | Camera con due letti singoli | Due letti singoli per i bambini. |
| Bagno 1 | Primo bagno | Con vasca o doccia. |
| Bagno 2 | Secondo bagno | Con vasca o doccia. Niente code al mattino. |
| Extra | Letto extra o culla | Su richiesta si aggiunge un letto singolo o una culla. |

### 3.5 Suite
**h1 (pagina /camere/suite/):** Suite
**Sottotitolo:** 44 m², due ambienti, due ingressi. Si lavora da una parte, si dorme dall'altra.
**Corpo:** La Suite ha due ambienti con ingressi separati. Da un lato il soggiorno, con un divano comodo e un'ampia scrivania: ci si può anche riunire in pochi. Dall'altro la camera matrimoniale con armadio. I bagni sono due, separati, con vasca o doccia. Ospita 4 adulti, oppure 2 adulti e 2 bambini.
**Dotazioni:** coffee maker con prodotti selezionati, ricco set di cortesia, accappatoio, pantofole, stirapantaloni, cassaforte, Wi-Fi gratuito, TV satellitare, climatizzazione regolabile, minibar.
**CTA:** `Cerca la Suite` · secondario `Parla con l'Ufficio Prenotazioni`
**aria-label diorama:** `Ricostruzione 3D di una Suite da 44 metri quadri con due ambienti: zona soggiorno con divano letto e ampia scrivania, camera matrimoniale con armadio. Trascina per ruotare.`
**Pianta alt:** `Pianta in scala della Suite: 44 metri quadri, soggiorno e camera con ingressi separati, due bagni.`
**Hotspot**
| Punto | Titolo | Didascalia |
|---|---|---|
| Ingresso soggiorno | Primo ingresso | Dal soggiorno si entra senza passare dalla camera. |
| Ingresso camera | Secondo ingresso | La camera ha il suo ingresso separato. |
| Divano letto | Divano letto | Per rilassarsi, o per dormire in più. |
| Scrivania | Scrivania | Ampia: ci si lavora e si fanno piccole riunioni. |
| Letto | Camera matrimoniale | Letto matrimoniale e armadio. |
| Coffee maker | Coffee maker | Con prodotti selezionati. |
| Bagni | Due bagni separati | Con vasca o doccia. |
| Dotazioni | Accappatoio e pantofole | Più stirapantaloni e cassaforte. |

---

## 4. Prenotazione

### 4.1 Pagina e barra
**h1 (pagina /prenota/):** Prenota il tuo soggiorno
**Sottotitolo:** Scegli date e ospiti. Ti portiamo sul motore di prenotazione del Cosmo, dove vedi disponibilità e tariffe aggiornate.
**Nota sotto il widget (sempre visibile):** `Il sito non mostra prezzi né disponibilità: li trovi sul motore di prenotazione ufficiale, che si apre in una nuova scheda.`

**Barra sticky (desktop):** `Arrivo` · `Partenza` · `Camere` · `Adulti` · `Bambini` · pulsante **Cerca disponibilità**
**Pannello telefono:** pulsante fisso in basso **Prenota** → pannello a scorrimento dal basso. Titolo del pannello: `Il tuo soggiorno`. Chiusura: aria-label `Chiudi il pannello di prenotazione`.

### 4.2 Campi
| Campo | Etichetta | Aiuto (sotto il campo) | Valori |
|---|---|---|---|
| Date | Arrivo / Partenza | `Scegli prima l'arrivo, poi la partenza.` | calendario |
| Camere | Camere | — | 1–4 |
| Adulti | Adulti | `Dai 18 anni.` `[DA CONFERMARE: età adulti nel motore]` — in attesa, non mostrare l'aiuto | 1–4 |
| Bambini | Bambini | `Le età dei bambini si indicano sul motore di prenotazione.` `[DA CONFERMARE: il motore le chiede?]` | 0–4 |

(Limiti 1–4 / 1–4 / 0–4 ripresi dal widget del sito vecchio.)

Placeholder date: `gg/mm/aaaa`. aria-label calendario: `Scegli la data di {arrivo|partenza}. Usa le frecce per cambiare giorno.`
Riepilogo notti (aria-live): `{n} notti, dal {data} al {data}.` (1 notte: `1 notte`.)
Riepilogo persone: `{n} camere · {a} adulti · {b} bambini` (singolari corretti: `1 camera`, `1 adulto`, `1 bambino`).

### 4.3 Errori (dicono come rimediare)
- Arrivo mancante: `Scegli la data di arrivo per continuare.`
- Partenza mancante: `Scegli anche la data di partenza.`
- Partenza non dopo l'arrivo: `La partenza deve essere dopo l'arrivo. Scegli un'altra data.`
- Arrivo nel passato: `Questa data è già passata. Scegli da oggi in avanti.`
- Più ospiti che posti: `Con {n} camere puoi indicare fino a {m} ospiti: aggiungi una camera o riduci gli ospiti.` `[DA CONFERMARE: regola capienza nel motore]` Ripiego: non bloccare, mostrare solo `Il motore verifica la capienza delle camere.`
- Nessun adulto: `Serve almeno un adulto.`
- Notti troppe `[DA CONFERMARE: limite massimo notti]`: non implementare finché non è noto.

### 4.4 Stati
- Pronto: pulsante `Cerca disponibilità`
- Apertura: `Stiamo aprendo il motore di prenotazione…`
- Aperto (aria-live): `Il motore di prenotazione si è aperto in una nuova scheda.`
- Pop-up bloccato: `Il browser ha bloccato la nuova scheda. Apri il motore da qui.` + link `Apri il motore di prenotazione`
- Nessuna connessione: `Non riusciamo a raggiungere il motore di prenotazione. Riprova tra poco, oppure chiama +39 02 617771.`
- Se i parametri data non sono confermati (vedi BRIEF punto 2): il widget apre il motore senza date e dice: `Il motore si apre con la sua ricerca. Inserisci di nuovo le date.` (da togliere quando i parametri sono verificati)

### 4.5 Alternativa umana
**Titolo:** Preferisci parlare con qualcuno?
**Corpo:** L'Ufficio Prenotazioni risponde per telefono e per email.
**Pulsanti:** `Chiama +39 02 617771` (tel:+3902617771) · `Scrivi a info@cosmohotelpalace.it` (mailto)
`[DA CONFERMARE: orari dell'Ufficio Prenotazioni]`. Ripiego: nessun orario scritto.

### 4.6 Riepilogo sticky (dopo la scelta camera da una scheda)
`Hai scelto: {camera}. Aggiungi le date per cercare.`

### 4.7 Microcopy di conferma
Non esiste conferma di prenotazione sul sito: la dà il motore. Il sito non dice mai «prenotato», «confermato», «disponibile».

### 4.8 Vietato
Nessun «ultime camere», «solo 2 rimaste», contatori di urgenza, sconti.

### 4.9 Claim «migliori tariffe garantite»
Presente sul sito vecchio come claim del cliente. `[DA CONFERMARE: il cliente lo vuole ancora? con quali condizioni?]` Se sì: riga sotto il widget `Migliori tariffe garantite sul sito ufficiale.` + link alle condizioni. Se no: nulla.

---

## 5. Dintorni — «Un weekend da Cosmo»

**h1 (pagina /dintorni/):** Cosa fare intorno al Cosmo
**Sottotitolo:** Milano, Monza, il Lago di Como. Tre itinerari che partono da qui.
**Corpo introduttivo:** Il Cosmo è alle porte di Milano, vicino a Monza e al lago. Scegli un itinerario e scorri di lato.
**Filtri:** `Tutto` · `Milano` · `Monza` · `Como` (aria-label: `Filtra i luoghi per zona: {zona}`)
**Nota:** `Controlla orari, biglietti e giorni di apertura sul sito di ogni luogo prima di partire.` I tempi di viaggio sono `[DA CONFERMARE]` per ogni tappa, tranne dove dichiarato.

### 5.1 Milano
| Luogo | Testo breve |
|---|---|
| Duomo di Milano | Fondato nel XIV secolo e dedicato a Maria Nascente. Domina la piazza con la sua mole di marmo. |
| Corso Vittorio Emanuele II | Una delle vie più importanti del centro e una delle più frequentate per lo shopping. |
| Galleria Vittorio Emanuele II | Collega piazza del Duomo a piazza della Scala. Costruita dal Mengoni (1865–1878), ha una copertura in ferro e vetro che culmina nell'ottagono. |
| Castello Sforzesco | Con il Duomo, uno dei monumenti simbolo della città. Un vasto complesso fortificato, di origine rinascimentale. |
| Pinacoteca di Brera | In via Brera, tra le più importanti pinacoteche italiane. Ospita lo Sposalizio della Vergine di Raffaello e la Pala Montefeltro di Piero della Francesca. |
| Cenacolo Vinciano | Tra le maggiori creazioni del Rinascimento milanese. |

### 5.2 Monza
| Luogo | Testo breve |
|---|---|
| Reggia di Monza | La residenza estiva dei Savoia, a due passi da Milano. Storia, arte e paesaggio. |
| Parco di Monza | 700 ettari a nord della città, con oltre 14 km di mura. |
| Autodromo Nazionale Monza | Ospita il Gran Premio d'Italia di Formula 1 e altri eventi. La stagione va da marzo a novembre. |
| Duomo di Monza e Corona Ferrea | Basilica minore di San Giovanni Battista, nel centro storico. Custodisce la Corona Ferrea. |
| Arengario | L'antico Palazzo Comunale, riconoscibile dal porticato ad arcate. |

### 5.3 Como e dintorni
| Luogo | Testo breve |
|---|---|
| Como e Lago di Como | Una meta turistica internazionale, nota per il paesaggio. |
| Villa Carlotta | A Tremezzina, tra le ville e i giardini più celebri del lago. |
| Leolandia | A Capriate San Gervasio (Bergamo), a 25 minuti dall'hotel. Un parco divertimenti per una giornata in famiglia. |

**Pulsanti scheda:** `Dettagli` · `Come arrivare da qui` (apre indicazioni da Google Maps/Apple Maps con destinazione preimpostata; non scrive tempi).
**Distanza da Cosmo:** `[DA CONFERMARE: km e tempi in auto/mezzi, per ogni tappa]` Ripiego: la riga non si mostra.

### 5.4 Il percorso animato verso Milano
**Titolo:** Da qui al centro di Milano
**Corpo:** Il Cosmo è a 2 km da Milano. Il tram 31 parte a pochi passi dall'hotel e in poche fermate arriva alla metro M5, fermata Bignami. Da lì sei in città.
**Passi animati (didascalie):** 1 `Cosmo Hotel Palace` · 2 `Tram 31, a pochi passi` · 3 `Poche fermate` · 4 `Metro M5, fermata Bignami` · 5 `Milano`
`[DA CONFERMARE: tempo totale e cambi per arrivare al Duomo]` Ripiego: non scrivere minuti.
**aria-label mappa:** `Mappa animata: dal Cosmo Hotel Palace il tram 31 porta in poche fermate alla metro M5 Bignami, verso il centro di Milano.`
**Alternativa testuale (sempre presente, per screen reader e riduzione del movimento):** l'elenco numerato dei 5 passi.

### 5.5 Itinerario «Weekend» (scorrimento orizzontale)
**Titolo:** Un weekend da Cosmo
**Sottotitolo:** Tre idee. Le scegli, le cambi, le mescoli.
- `Sabato a Milano` — Duomo, Galleria, Castello Sforzesco, Brera. Rientro in tram 31.
- `Domenica a Monza` — Reggia, Parco, Duomo e Corona Ferrea.
- `Un giorno sul lago` — Como, il lago, Villa Carlotta.
- Frase finale: `Dormi al Cosmo, parti da qui.` Pulsante: `Cerca disponibilità`
(I giorni sono suggerimenti, non programmi verificati con orari.)

---

## 6. Cosmo Grill & Lounge

**h1 (pagina /ristorazione/):** Cosmo Grill & Lounge
**Sottotitolo:** Cucina contemporanea ispirata alla tradizione milanese, e un bar per ogni momento della giornata.
**Corpo introduttivo:** Il Cosmo Grill è aperto ogni sera anche a chi non dorme in hotel, con menu à la carte. Il Lounge Bar accompagna la giornata: dal caffè di metà mattina al tè del pomeriggio, dall'aperitivo all'happy hour.
**Orari:** `[DA CONFERMARE: orari di apertura Cosmo Grill e Lounge Bar]`. Ripiego: «Grill aperto ogni sera. Per gli orari chiama +39 02 617771.»

**Cursore «una giornata»**
- Etichetta: `Momento della giornata`
- Valori: `Mattina` · `Pranzo` · `Aperitivo` · `Sera`
- aria-label: `Momento della giornata nel ristorante: {valore}. Cambia la luce della sala.`

| Momento | Titolo | Testo |
|---|---|---|
| Mattina | Un caffè, con calma | Il Lounge Bar apre la giornata con il caffè di metà mattina. |
| Pranzo | Pranzo per eventi | A pranzo il Cosmo Grill ospita eventi aziendali e privati. Non è un servizio à la carte per tutti: se vuoi organizzare un pranzo, scrivi all'Ufficio Eventi. |
| Aperitivo | Aperitivo e happy hour | Il tè del pomeriggio, l'aperitivo prima di pranzo, l'happy hour: il Lounge Bar è un posto tranquillo per vedersi o per lavorare. |
| Sera | Cena al Cosmo Grill | Cucina contemporanea che parte dalla tradizione milanese. Ogni sera, anche per chi non è ospite. |

(Il brief propone «caffè → pranzo → aperitivo → cena»: a pranzo il Grill serve eventi, non il pubblico. Il testo lo dice per non promettere un servizio che non c'è.)

**Pulsanti:** `Prenota un tavolo` (apre email/telefono: tel +39 02 617771, info@cosmohotelpalace.it; `[DA CONFERMARE: prenotazione tavoli online?]`) · `Organizza un evento` (vai a Richiesta di proposta)
**Contatto reparto:** Ristorante: +39 02 617771 · info@cosmohotelpalace.it

**aria-label diorama:** `Ricostruzione 3D della sala del Cosmo Grill e Lounge: cemento lisciato, travi e canalizzazioni a vista, lampade ad abat-jour color miele, tavoli bianchi e sedie in alluminio forato. La luce cambia dal mattino alla sera.`
**Nota:** `Ricostruzione illustrativa, non una fotografia.`

**Hotspot**
| Punto | Titolo | Didascalia |
|---|---|---|
| Soffitto | Travi e canalizzazioni a vista | Un ambiente contemporaneo, con struttura a vista. |
| Lampade | Lampade color miele | Abat-jour color miele sopra i tavoli. |
| Tavoli e sedie | Tavoli bianchi, sedie forate | Sedie in alluminio forato. |
| Specchi | Specchi con cornice scura | Raddoppiano la sala. |
| Rami | Rami secchi | Un tocco naturale, senza fiori finti. |
| Pareti | Cemento lisciato | Superfici in cemento lisciato. |

---

## 7. Wellness & Fitness

**h1 (pagina /wellness/):** Wellness & Fitness al sesto piano
**Sottotitolo:** Sauna finlandese, bagno turco e sala attrezzi. Aperti tutti i giorni dalle 7:00 alle 22:00.
**Corpo:** Il sesto piano dell'hotel è dedicato al benessere. La sauna finlandese e il bagno turco servono a staccare dopo una giornata di lavoro o di viaggio. Per allenarti c'è una sala attrezzi con due tapis roulant (14 programmi di lavoro interattivi), cyclette, chest press, pulldown e leg extension.
**Accesso e condizioni:** `[DA CONFERMARE: accesso incluso o a pagamento, età minima, prenotazione, cosa portare]` Ripiego: «Per condizioni di accesso chiedi alla reception o scrivi a info@cosmohotelpalace.it.»

**Indicatore «aperto ora»** (ora di Roma, 7:00–22:00 tutti i giorni)
- Aperto: `Aperto ora · chiude alle 22:00`
- Prima delle 7:00: `Chiuso · apre alle 7:00`
- Dopo le 22:00: `Chiuso · riapre domani alle 7:00`
- Ultima ora: `Aperto ora · chiude tra poco, alle 22:00`
- aria-live: l'indicatore si aggiorna senza annunciare ogni minuto: solo al cambio di stato.
- Nota: `Orario indicato sul sito dell'hotel. Controlla eventuali variazioni con la reception.`

**Percorso del 6° piano (3 tappe)**
| Tappa | Titolo | Testo |
|---|---|---|
| 1 | Sauna finlandese | Calore secco, per rilassare muscoli e testa. |
| 2 | Bagno turco | Vapore, per un momento di pausa. |
| 3 | Sala attrezzi | Due tapis roulant con 14 programmi, cyclette, chest press, pulldown, leg extension. |

(«Calore secco» e «vapore» descrivono la sauna finlandese e il bagno turco in generale; non dichiarano temperature né umidità dell'impianto.)

**Pulsanti:** `Cerca un soggiorno` · `Chiedi informazioni` (mailto info@)
**aria-label diorama:** `Ricostruzione 3D del percorso benessere al sesto piano: sauna finlandese, bagno turco e sala attrezzi con tapis roulant, cyclette e macchine per il lavoro muscolare. Trascina per ruotare.`
**Nota:** `Ricostruzione illustrativa, non una fotografia.`
**Hotspot**
| Punto | Titolo | Didascalia |
|---|---|---|
| Sauna | Sauna finlandese | Al sesto piano. Orario 7:00–22:00. |
| Turco | Bagno turco | Al sesto piano. Orario 7:00–22:00. |
| Tapis roulant | Due tapis roulant | 14 programmi di lavoro interattivi. |
| Cyclette | Cyclette | Per pedalare senza uscire dall'hotel. |
| Macchine | Chest press, pulldown, leg extension | Per allenare petto, schiena e gambe. |

---

## 8. Centro Congressi

### 8.1 Presentazione
**h1 (pagina /centro-congressi/):** Centro Congressi
**Sottotitolo:** Fino a 900 persone, 13 sale modulabili, a 2 km da Milano.
`[DA CONFERMARE: numero sale. La tabella ne elenca 25 righe, vedi Domande aperte]`
**Corpo:** Il Centro Congressi occupa oltre 900 m² su due piani. Le sale si dividono e si uniscono con pareti mobili: configuri lo spazio giusto per ogni evento. Entra la luce naturale. Un team dedicato segue l'evento dal primo contatto.
Al piano terra c'è la Plenaria delle Costellazioni (500 m², fino a 8 sale). Al piano inferiore la Plenaria delle Divinità, divisibile in 5 sale.
**Come ci si arriva:** `Il parcheggio è gratuito, fino a 200 posti auto, con un'area per gli autobus. A4 Milano–Venezia, Tangenziale Est e Nord sono vicine.`
**Contatto:** Ufficio Eventi · +39 02 61 777 726 · events@cosmohotelpalace.it
**Pulsanti:** `Configura la tua sala` · `Richiedi una proposta` · `Chiama l'Ufficio Eventi`
**Sotto-schede**
- `Costellazioni` — Piano terra. Tinte neutre, design contemporaneo. Fino a 500 persone.
- `Divinità` — Piano inferiore. Fino a 5 sale indipendenti.
- `Eventi aziendali e privati` — Spazi adattabili e menu su misura, per banchetti aziendali o privati.

### 8.2 Configuratore
**Titolo:** Configura la tua sala
**Sottotitolo:** Scegli la sala e la disposizione. Vedi le sedie disporsi e la capienza.
**Passo 1:** `1. Scegli la sala` · **Passo 2:** `2. Scegli la disposizione` · **Passo 3:** `3. Chiedi una proposta`
**Filtri sala:** `Piano terra` · `Piano inferiore` · `Tutte`
**Ordina per:** `Capienza` · `Superficie`

**Etichette disposizioni (testo + aiuto di una riga)**
| Etichetta | Aiuto |
|---|---|
| Platea | Sedie in file rivolte al palco. Per conferenze e presentazioni. |
| Banchi di scuola | File di tavoli con sedie, tutti rivolti al relatore. Per formazione e corsi. |
| Ferro di cavallo | Tavoli a U, aperti verso il relatore. Per workshop e riunioni di lavoro. |
| Banchetto | Tavoli rotondi con commensali. Per pranzi e cene. |

**Risultato (aria-live, aggiornato a ogni scelta)**
- `{Sala}, {disposizione}: fino a {n} persone.`
- Dati sala visibili: `{superficie} m² · {dimensioni} m · altezza {h} m · {piano}`
- Disposizione non prevista (dato «-» nella tabella): `Questa disposizione non è indicata per {sala}. Prova con {disposizioni disponibili}.`
- Sala divisibile: `Si può dividere con pareti mobili in fino a {k} sale.` (solo Costellazioni 8, Divinità 5)
- Nota sempre presente: `Capienze indicative, dalla tabella del Centro Congressi. Per il tuo evento ci sono altri fattori, come palco, regia e allestimento: lo valuta l'Ufficio Eventi.`
- `Dimensioni e superfici come pubblicate: ` `[DA CONFERMARE: coerenza dimensioni/superfici, vedi Domande aperte]`

**Pareti mobili**
- Pulsante: `Dividi la sala` / `Riunisci la sala` (aria-pressed)
- Su Costellazioni: `{k} sale` selezionabile da 1 a 8 — `[DA CONFERMARE: configurazioni ammesse delle pareti]` Ripiego: mostrare solo «1 sala» e «divisa nelle sale singole» (le righe della tabella).
- aria-live: `Sala divisa in {k} parti.`

**aria-label canvas (dinamico):** `Pianta 3D della sala {sala}, disposizione {disposizione}: {n} sedie in una sala di {superficie} metri quadri.`
Alternativa testuale sotto il canvas: la riga risultato.

**Pulsanti**
- `Usa questa configurazione` → scorre al modulo e precompila sala e disposizione
- `Cambia sala`

### 8.3 Modulo «Richiesta di proposta»
**h2:** Richiesta di proposta
**Sottotitolo:** Raccontaci l'evento. L'Ufficio Eventi ti risponde con una proposta.
**Tempo di risposta:** `[DA CONFERMARE: in quanto tempo risponde l'Ufficio Eventi]`. Ripiego: non scrivere tempi.

**Riepilogo precompilato (card sopra il modulo)**
`La tua configurazione: {sala} · {disposizione} · fino a {n} persone.` + link `Modifica`

**Campi**
| Campo | Etichetta | Aiuto |
|---|---|---|
| Nome | Nome e cognome | |
| Azienda | Azienda o organizzazione (facoltativo) | |
| Email | Email | `Ti scriviamo qui la proposta.` |
| Telefono | Telefono (facoltativo) | `Solo se preferisci essere richiamato.` |
| Tipo | Tipo di evento | Convegno o congresso · Riunione aziendale · Formazione · Banchetto aziendale · Evento privato o cerimonia · Altro |
| Data | Data o periodo | `Anche solo il mese, se non l'hai ancora fissata.` |
| Ospiti | Numero di partecipanti | `Una stima va bene.` |
| Sala | Sala | precompilata dal configuratore |
| Disposizione | Disposizione | precompilata dal configuratore |
| Camere | Camere per gli ospiti (facoltativo) | `Quante camere ti servono, se ti servono.` |
| Messaggio | Altro da sapere | `Pranzo, coffee break, allestimento… scrivi quello che hai in mente.` |
| Consenso | Ho letto l'informativa privacy | link `informativa` → /privacy/ |

**Errori**
- Nome vuoto: `Scrivi il tuo nome, così sappiamo come chiamarti.`
- Email vuota: `Scrivi la tua email: è dove arriva la proposta.`
- Email non valida: `Questa email sembra incompleta. Controlla che ci siano @ e il dominio, ad esempio nome@azienda.it.`
- Telefono non valido: `Usa solo numeri, spazi e il +. Esempio: +39 02 1234567.`
- Ospiti non numerico: `Scrivi il numero con le cifre, ad esempio 120.`
- Ospiti oltre la capienza della sala: `Per {n} persone con la disposizione {disp} la sala {sala} potrebbe essere stretta. Puoi scegliere un'altra sala o inviare comunque: l'Ufficio Eventi ti consiglia.`
- Data nel passato: `Questa data è già passata. Scegli da oggi in avanti.`
- Consenso mancante: `Per inviare la richiesta spunta la casella dell'informativa privacy.`
- Riepilogo errori in cima (focus + aria-live): `Ci sono {n} campi da controllare.` + elenco con link ai campi.

**Pulsanti:** `Invia la richiesta` · secondario `Preferisci scrivere? Apri una email` (mailto events@cosmohotelpalace.it)
**Stati**
- Invio: `Stiamo inviando la richiesta…` (pulsante disabilitato)
- Successo: `Richiesta inviata. L'Ufficio Eventi la riceve e ti risponde all'indirizzo che hai scritto.` + `Riepilogo: {sala}, {disposizione}, {n} persone.` + `[DA CONFERMARE: tempi di risposta]`
- Errore di rete: `La richiesta non è partita. Riprova, oppure scrivi a events@cosmohotelpalace.it o chiama +39 02 61 777 726.`
- **Attenzione tecnica:** il sito è statico. Finché non c'è un invio vero (server, servizio di form o email) il messaggio «Richiesta inviata» NON va mostrato. In attesa si usa solo l'apertura della email precompilata, con testo: `Si apre la tua email con la richiesta già scritta. Premi Invia per mandarla.`
- Il testo della email precompilata: oggetto `Richiesta di proposta · {sala} · {disposizione}` e corpo con i campi.

---

## 9. Come arrivare

**h1 (pagina /come-arrivare/):** Come arrivare al Cosmo Hotel Palace
**Sottotitolo:** Via F. De Sanctis, 5 — 20092 Cinisello Balsamo (Milano). A 2 km da Milano.
**Corpo introduttivo:** L'hotel è vicino alle principali strade e ben collegato a Milano e Monza.

**Blocchi**
- **In auto.** A4 Milano–Venezia, Tangenziale Est e Tangenziale Nord. Parcheggio gratuito fino a 200 posti auto, con un'area per gli autobus.
- **In tram e metro.** Il tram 31 si prende a pochi passi dall'hotel. In poche fermate arriva alla metro M5, fermata Bignami. Da lì si arriva in centro a Milano.
- **In treno.** Le stazioni di riferimento sono Sesto FS e Milano Centrale. `[DA CONFERMARE: come arrivare dall'una e dall'altra]`
- **In aereo.** Gli aeroporti di riferimento sono Linate, Malpensa e Orio al Serio. `[DA CONFERMARE: tempi e modo di trasferimento]`
- **Per fiere e congressi.** Rho Fiera, Milano City Fiera, MiCo Milano Congressi: tutti collegati. `[DA CONFERMARE: distanze o tempi]`

**Pulsanti:** `Indicazioni stradali` (apre mappe con l'indirizzo) · `Copia l'indirizzo` (conferma: `Indirizzo copiato.`) · `Chiama l'hotel`
**Alt della mappa:** `Mappa: il Cosmo Hotel Palace in Via De Sanctis 5, a Cinisello Balsamo, a 2 km da Milano.`
**Mappa non caricata:** `La mappa non si carica. L'indirizzo è Via F. De Sanctis, 5, 20092 Cinisello Balsamo (Milano).`
**Nota:** niente coordinate scritte qui: vanno prese dalla fonte ufficiale `[DA CONFERMARE: coordinate GPS]`.

---

## 10. Contatti per reparto

**h1 (pagina /contatti/):** Contatti
**Sottotitolo:** Scegli il reparto giusto: ti risponde chi si occupa di quella cosa.
**Orari degli uffici:** `[DA CONFERMARE]`. Ripiego: non scrivere orari.

| Reparto | Per cosa | Telefono | Email |
|---|---|---|---|
| Prenotazioni | Camere, soggiorni, richieste speciali | +39 02 617771 | info@cosmohotelpalace.it |
| Eventi | Centro Congressi, meeting, eventi privati | +39 02 61 777 726 | events@cosmohotelpalace.it |
| Commerciale | Accordi aziendali e collaborazioni | +39 02 61 777 686 | sales@cosmohotelpalace.it |
| Ristorante | Tavoli al Cosmo Grill e Lounge Bar | +39 02 617771 | info@cosmohotelpalace.it |

**Pulsanti per riga:** `Chiama` (tel:) · `Scrivi` (mailto:)
aria-label: `Chiama {reparto} al {numero}` · `Scrivi a {reparto}: {email}`
tel: `+3902617771`, `+390261777726`, `+390261777686`.
**Social:** `Instagram` (instagram.com/cosmohotelpalace) · `Facebook` · hashtag `#YOURCOSMOHOTELPALACE`
aria-label social: `Cosmo Hotel Palace su Instagram (si apre in una nuova scheda)`.
**Indirizzo:** Via F. De Sanctis, 5 — 20092 Cinisello Balsamo (Milano)
**Partner (blocco a fondo pagina /partner/):** Titolo `Nel mondo Cosmo` · testo `Cosmo Hotel Torri, Cosmo Residence e Villa Trivulzio fanno parte dello stesso gruppo.` `[DA CONFERMARE: rapporto tra le strutture e i link]` Ripiego: «Altre strutture Cosmo: Cosmo Hotel Torri, Cosmo Residence, Villa Trivulzio.» senza dire «gruppo».

---

## 11. Footer

**Colonna 1 — Hotel:** Cosmo Hotel Palace · Hotel & Centro Congressi · Via F. De Sanctis, 5 — 20092 Cinisello Balsamo (Milano)
**Colonna 2 — Contatti:** +39 02 617771 · info@cosmohotelpalace.it
**Colonna 3 — Esplora:** Camere · Cosmo Grill & Lounge · Wellness · Centro Congressi · Come arrivare · Dintorni · Domande frequenti
**Colonna 4 — Seguici:** Instagram · Facebook · #YOURCOSMOHOTELPALACE
**Riga legale:** CIN IT015077A1P24TCBBO · Privacy · Cookie `[DA CONFERMARE: gestione cookie]` · © Cosmo Hotel Palace
**Pulsante:** `Cerca disponibilità`
**Torna su:** aria-label `Torna all'inizio della pagina`
**Credito sito:** `[DA CONFERMARE: chi firma il sito nuovo]`. Il «Realizzato da Amadeus» del sito vecchio non va riportato.

---

## 12. Privacy

**h1 (pagina /privacy/):** Privacy
**Sottotitolo:** Come usiamo i tuoi dati quando visiti il sito o ci scrivi.
**Corpo:** Qui va il testo dell'informativa vigente, trasferito senza modifiche. Il sito attuale la intitola «Informativa sul trattamento dei dati personali» e indica come titolare la società Cosmo Hotel S.p.A. `[DA CONFERMARE: l'informativa va aggiornata per il nuovo sito (moduli, mappe, motore di prenotazione, cookie). Il testo legale lo redige il cliente o il suo consulente, non il copy]`
**Testo breve accanto ai moduli (in attesa dell'informativa aggiornata):**
`Usiamo i dati che inserisci per rispondere alla tua richiesta. Il titolare è Cosmo Hotel S.p.A. Leggi l'informativa completa.`
**Banner cookie** `[DA CONFERMARE: servizi di tracciamento previsti e strumento di consenso]`: nessun testo definitivo finché non si sa cosa si carica. Bozza neutra, solo se serve:
- Titolo: `Cookie`
- Corpo: `Il sito usa cookie tecnici. Per altri usi chiediamo il tuo consenso.`
- Pulsanti: `Accetta` · `Rifiuta` · `Scegli`
**Mappe e motore di prenotazione:** `Aprendo il motore di prenotazione lasci il sito del Cosmo. Lì valgono le regole di quel servizio.` (riga breve sotto il widget).

---

## 13. Pagine di servizio

**404 h1:** Pagina non trovata
**Corpo:** Questo indirizzo non esiste, o la pagina è cambiata di posto. Torna alla home o cerca una camera.
**Pulsanti:** `Torna alla home` · `Cerca disponibilità`

**Stato vuoto configuratore (nessuna sala scelta):** `Scegli una sala per vedere come si dispone.`
**Stato vuoto filtri dintorni:** `Nessun luogo in questa zona. Prova «Tutto».`
**Caricamento 3D:** `Stiamo preparando la scena…`
**Fallback 3D (WebGL assente o lento):** `La vista 3D non è disponibile su questo dispositivo. Ecco la versione semplificata.` (si mostra un SVG + testo)
**Skip link:** `Vai al contenuto`

---

## 14. SEO

### 14.1 Struttura URL (export statico, tutte con slash finale, minuscolo, senza accenti)
| Pagina | URL | Sezione |
|---|---|---|
| Home | `/` | hero, perché sceglierci, anteprime |
| Camere | `/camere/` | confronto, chi sei |
| Classic Double Room | `/camere/classic-double-room/` | |
| Family Room | `/camere/family-room/` | |
| Suite | `/camere/suite/` | |
| Prenota | `/prenota/` | |
| Cosmo Grill & Lounge | `/ristorazione/` | |
| Wellness & Fitness | `/wellness/` | |
| Centro Congressi | `/centro-congressi/` | configuratore |
| Richiesta di proposta | `/centro-congressi/richiesta-di-proposta/` | |
| Come arrivare | `/come-arrivare/` | |
| Dintorni | `/dintorni/` | |
| Contatti | `/contatti/` | |
| Domande frequenti | `/domande-frequenti/` | |
| Partner | `/partner/` | |
| Privacy | `/privacy/` | |
| (seconda fase) Inglese | `/en/…` stessa struttura | |

Lo scroll della home mostra le scene e aggiorna l'hash; ogni scena ha anche la sua pagina vera: indicizzabile, condivisibile, utile con JS spento.

**Redirect 301 dal sito vecchio** (percorsi ricavati dai file di riferimento; da verificare uno per uno):
`/camere-suites` → `/camere/` · `/camere-suites/camere/classic-room` → `/camere/classic-double-room/` · `/camere-suites/camere/family-room` → `/camere/family-room/` · `/camere-suites/suite` → `/camere/suite/` · `/meeting-ed-eventi` → `/centro-congressi/` · `/ristoranti` → `/ristorazione/` · `/fitness-wellness` → `/wellness/` · `/contatti-location` → `/contatti/` · `/hotel-partners` → `/partner/` · `/privacy-policy` → `/privacy/` · `/foto-video` → `/` (finché non ci sono foto con licenza).
Poiché l'export è statico, i redirect vanno nel file di configurazione dell'hosting `[DA CONFERMARE: hosting]`.

**Regole generali:** un solo `h1` per pagina, gerarchia h1→h2→h3 senza salti, `lang="it"`, canonical su ogni pagina, `alt=""` per le decorazioni e testo per le scene (vedi sezioni), `sitemap.xml` con le pagine sopra, `robots.txt` che permette tutto e indica la sitemap. Hotspot e diorami hanno sempre una versione testuale, indicizzabile.

### 14.2 Meta title (≤60) e description (≤155)
Brand a fine title: `| Cosmo Hotel Palace`.

| Pagina | Title | Description |
|---|---|---|
| Home | Hotel a 2 km da Milano con parcheggio \| Cosmo Hotel Palace | Hotel e Centro Congressi a Cinisello Balsamo, a 2 km da Milano. 201 camere, Cosmo Grill, wellness e 200 posti auto gratuiti. Cerca disponibilità. |
| Camere | Camere, Family Room e Suite a Milano \| Cosmo Hotel Palace | 201 camere e suite a 2 km da Milano: Classic Double, Family Room e Suite. Wi-Fi gratuito, senza barriere architettoniche. Esplora le camere in 3D. |
| Classic Double | Classic Double Room, 22 m² \| Cosmo Hotel Palace | Camera doppia da 22 m² con letto matrimoniale da 160 cm e bagno con vasca o doccia. Wi-Fi gratuito, TV satellitare. Guarda la camera in 3D. |
| Family Room | Family Room per 4 persone, 44 m² \| Cosmo Hotel Palace | Due camere comunicanti, due bagni, 44 m². Per 2 adulti e 2 bambini. Su richiesta letto singolo extra o culla. Guarda la camera in 3D. |
| Suite | Suite con soggiorno, 44 m² \| Cosmo Hotel Palace | Suite da 44 m² con due ambienti e ingressi separati, scrivania, divano letto e due bagni. Fino a 4 adulti. Guarda la suite in 3D. |
| Prenota | Prenota un hotel a Milano nord \| Cosmo Hotel Palace | Scegli date e ospiti: ti portiamo sul motore di prenotazione del Cosmo Hotel Palace per vedere disponibilità e tariffe. |
| Ristorazione | Ristorante e bar a Cinisello Balsamo \| Cosmo Hotel Palace | Cosmo Grill: cucina contemporanea ispirata a Milano, aperto ogni sera anche ai non ospiti. Lounge Bar per caffè, aperitivo e happy hour. |
| Wellness | Sauna, bagno turco e fitness vicino a Milano \| Cosmo | Al sesto piano: sauna finlandese, bagno turco e sala attrezzi. Aperto tutti i giorni dalle 7:00 alle 22:00, al Cosmo Hotel Palace. |
| Centro Congressi | Centro Congressi a Milano nord, 900 posti \| Cosmo | 13 sale modulabili su due piani, fino a 900 persone, luce naturale e 200 posti auto gratuiti. Configura la sala e chiedi una proposta. |
| Richiesta di proposta | Richiedi una proposta per il tuo evento \| Cosmo Hotel | Raccontaci evento, data e numero di ospiti: l'Ufficio Eventi del Cosmo Hotel Palace prepara una proposta per la sala giusta. |
| Come arrivare | Come arrivare: tram 31 e M5 a Milano \| Cosmo Hotel Palace | Cinisello Balsamo, a 2 km da Milano. In auto da A4 e Tangenziali, in tram 31 fino alla metro M5 Bignami. Parcheggio gratuito di 200 posti. |
| Dintorni | Cosa vedere vicino a Milano, Monza e Como \| Cosmo Hotel | Duomo, Castello Sforzesco, Reggia di Monza, Lago di Como: i luoghi da vedere partendo dal Cosmo Hotel Palace, alle porte di Milano. |
| Contatti | Contatti e reparti \| Cosmo Hotel Palace | Prenotazioni, Eventi, Commerciale, Ristorante: telefono ed email di ogni reparto del Cosmo Hotel Palace, Via De Sanctis 5, Cinisello Balsamo. |
| FAQ | Domande frequenti \| Cosmo Hotel Palace | Parcheggio, Wi-Fi, accessibilità, come arrivare a Milano, camere per famiglie, wellness e Centro Congressi: le risposte del Cosmo Hotel Palace. |
| Partner | Cosmo Hotel Torri, Residence e Villa Trivulzio \| Cosmo | Le altre strutture Cosmo: Cosmo Hotel Torri, Cosmo Residence e Villa Trivulzio. |
| Privacy | Privacy \| Cosmo Hotel Palace | Informativa sul trattamento dei dati personali del sito del Cosmo Hotel Palace. |

(Lunghezze verificate, vedi 14.5. Dove nel title manca la parola «Palace» è per stare nei 60 caratteri.)

### 14.3 Schema.org JSON-LD `Hotel` (home) — solo dati veri
Esclusi di proposito: stelle, premi, valutazioni, prezzi, orari di check-in, coordinate (non sono nel brief). Il `url` è quello del sito attuale: `[DA CONFERMARE: dominio finale]`.

```json
{
  "@context": "https://schema.org",
  "@type": "Hotel",
  "@id": "https://www.cosmohotelpalace.it/#hotel",
  "name": "Cosmo Hotel Palace",
  "description": "Hotel e Centro Congressi a Cinisello Balsamo, a 2 km da Milano. 201 camere e suite, ristorante Cosmo Grill, Lounge Bar, area wellness e fitness.",
  "url": "https://www.cosmohotelpalace.it/",
  "telephone": "+39 02 617771",
  "email": "info@cosmohotelpalace.it",
  "identifier": "IT015077A1P24TCBBO",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via F. De Sanctis, 5",
    "postalCode": "20092",
    "addressLocality": "Cinisello Balsamo",
    "addressRegion": "MI",
    "addressCountry": "IT"
  },
  "numberOfRooms": 201,
  "petsAllowed": null,
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Wi-Fi gratuito nelle camere", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Parcheggio gratuito (200 posti auto)", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Area parcheggio per autobus", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Struttura senza barriere architettoniche", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Centro Congressi (fino a 900 persone)", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Ristorante", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Bar", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Sauna finlandese", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Bagno turco", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Sala fitness", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Climatizzazione regolabile in camera", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "TV satellitare in camera", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Cassaforte in camera", "value": true }
  ],
  "sameAs": [
    "https://www.instagram.com/cosmohotelpalace",
    "https://www.facebook.com/profile.php?id=100071873230654"
  ]
}
```
**Attenzione:** togliere la riga `"petsAllowed": null` prima della pubblicazione (è un segnaposto: l'ammissione di animali non è confermata, vedi Domande aperte). Non aggiungere `starRating`, `aggregateRating`, `priceRange`, `checkinTime`, `geo` senza dato confermato.
Altri schemi: `BreadcrumbList` su ogni pagina interna; `FAQPage` su `/domande-frequenti/` con le stesse risposte della sezione 14.4; per le tre camere un `HotelRoom` con `name`, `floorSize` (22 / 44 / 44 m²), `occupancy` e `bed` solo dai dati veri. `Restaurant` per il Cosmo Grill solo dopo la conferma degli orari.

### 14.4 Domande frequenti (10) — risposte pensate per essere lette anche da un assistente IA
Ogni risposta si regge da sola: nomina l'hotel, risponde nella prima frase, aggiunge un solo dettaglio.

**1. Dov'è il Cosmo Hotel Palace e quanto dista da Milano?**
Il Cosmo Hotel Palace è in Via F. De Sanctis, 5, a Cinisello Balsamo (Milano), a 2 km da Milano. È un hotel con Centro Congressi, vicino alle principali strade verso Milano e Monza.

**2. Come si arriva in centro a Milano senza auto?**
Dal Cosmo Hotel Palace si prende il tram 31, a pochi passi dall'hotel. In poche fermate arriva alla metro M5, fermata Bignami, che porta in città. `[DA CONFERMARE: tempo totale e cambi per il Duomo]`

**3. C'è il parcheggio? È gratuito?**
Sì. Il Cosmo Hotel Palace ha un parcheggio gratuito con 200 posti auto e un'area riservata agli autobus. `[DA CONFERMARE: serve prenotare il posto?]`

**4. Come si raggiunge l'hotel in auto, in treno o in aereo?**
In auto: A4 Milano–Venezia, Tangenziale Est o Tangenziale Nord. In treno: stazioni di Sesto FS o Milano Centrale. In aereo: aeroporti di Linate, Malpensa e Orio al Serio. L'hotel è vicino anche a Rho Fiera, Milano City Fiera e MiCo.

**5. C'è il Wi-Fi? È gratuito?**
Sì. Il Wi-Fi è gratuito in tutte le camere del Cosmo Hotel Palace: Classic Double Room, Family Room e Suite. `[DA CONFERMARE: Wi-Fi anche nelle aree comuni e nel Centro Congressi]`

**6. L'hotel è accessibile a chi ha difficoltà motorie?**
Il Cosmo Hotel Palace è strutturato senza barriere architettoniche. Per esigenze specifiche scrivi a info@cosmohotelpalace.it o chiama +39 02 617771. `[DA CONFERMARE: camere attrezzate, bagni, ascensori]`

**7. Posso viaggiare con i bambini? Quante persone dormono in camera?**
Sì. La Family Room (44 m², due camere comunicanti con due bagni) ospita 2 adulti e 2 bambini, con un letto singolo extra o una culla su richiesta. La Suite ospita 4 adulti oppure 2 adulti e 2 bambini. La Classic Double Room ospita 2 adulti.

**8. Quali sono gli orari della sauna, del bagno turco e della palestra?**
Il centro benessere e l'area fitness, al sesto piano del Cosmo Hotel Palace, sono aperti tutti i giorni dalle 7:00 alle 22:00. Ci sono una sauna finlandese, un bagno turco e una sala attrezzi. `[DA CONFERMARE: condizioni di accesso]`

**9. Il ristorante è aperto anche a chi non dorme in hotel?**
Sì. Il Cosmo Grill è aperto ogni sera anche ai clienti esterni, con menu à la carte. Propone cucina contemporanea ispirata alla tradizione milanese. Il Lounge Bar serve caffè, tè del pomeriggio, aperitivo e happy hour. `[DA CONFERMARE: orari]`

**10. Quante persone ospita il Centro Congressi e come si prepara un evento?**
Il Centro Congressi del Cosmo Hotel Palace ospita fino a 900 persone, su due piani, con sale modulabili con pareti mobili e luce naturale. La sala più grande, la Plenaria delle Costellazioni, ha 500 m² e fino a 500 posti a platea. Per una proposta scrivi a events@cosmohotelpalace.it o chiama +39 02 61 777 726.

Non incluse perché non rispondibili con dati veri: check-in/check-out, colazione, animali, culle gratuite, prezzi.

### 14.5 Verifica lunghezze
Controllate con script: title tra 28 e 58 caratteri (limite 60), description tra 79 e 146 (limite 155). Tutte dentro il limite.

---

## 15. Dati per il configuratore (dalla tabella del sito vecchio, riga per riga)

`-` = disposizione non indicata. Altezze in m. Piano 0 = piano terra, -1 = piano inferiore. Nomi come sul sito vecchio, tranne «Plearia Sole», refuso evidente per «Plenaria del Sole» (nel brief).

| id | Sala | Piano | Dimensioni (m) | m² | h | Platea | Banchi di scuola | Ferro di cavallo | Banchetto |
|---|---|---|---|---|---|---|---|---|---|
| costellazioni | Plenaria delle Costellazioni | 0 | 25 × 20 | 500 | 4,22 | 500 | - | - | 450 |
| sole-plenaria | Plenaria del Sole | 0 | 18,5 × 17,5 | 325 | 4,22 | 400 | 188 | 188 | 300 |
| oro-plenaria | Oro Plenaria | 0 | 7,1 × 18,5 | 147 | 4,22 | 180 | 70 | 70 | 140 |
| argento-plenaria | Argento Plenaria | 0 | 7,2 × 18,5 | 145 | 4,22 | 180 | 70 | 70 | 140 |
| sole-d-oro | Sole d'Oro | 0 | 11,2 × 8,2 | 92 | 4,22 | 100 | 60 | 60 | 80 |
| luna-d-argento | Luna d'Argento | 0 | 11,2 × 8,2 | 92 | 4,22 | 100 | 60 | 60 | 80 |
| stella-d-oro | Stella d'Oro | 0 | 7,1 × 11 | 91 | 4,22 | 100 | 58 | 58 | 80 |
| cometa-d-argento | Cometa d'Argento | 0 | 11 × 7,4 | 87 | 4,22 | 100 | 55 | 55 | 80 |
| luna | Luna | 0 | 6,6 × 8,5 | 58 | 4,22 | 60 | 35 | 35 | 50 |
| sole | Sole | 0 | 6,4 × 8,9 | 56 | 4,22 | 60 | 35 | 35 | 50 |
| stella | Stella | 0 | 7,1 × 7,1 | 55 | 4,22 | 60 | 22 | 22 | 40 |
| cometa | Cometa | 0 | 7,2 × 7,4 | 53 | 4,22 | 60 | 22 | 22 | 40 |
| oro | Oro | 0 | 7,1 × 4,8 | 36 | 4,22 | 40 | 18 | 18 | 30 |
| argento | Argento | 0 | 4,6 × 7,4 | 34 | 4,22 | 40 | 18 | 18 | 30 |
| lingotto | Lingotto | 0 | 7,8 × 3,7 | 31 | 4,22 | 29 | 15 | 15 | 30 |
| pepita | Pepita | 0 | 5 × 4 | 20 | 4,22 | 15 | 10 | 10 | 10 |
| divinita | Plenaria delle Divinità | -1 | 25,3 × 17,2 | 440 | 3,4 | 440 | - | - | 400 |
| fortuna-plenaria | Plenaria Fortuna | -1 | 21,2 × 13,6 | 300 | 3,1 | 320 | 160 | 160 | 280 |
| grande-fortuna | Grande Fortuna | -1 | 15,4 × 13,6 | 210 | 3,4 | 200 | 100 | 100 | 180 |
| piccola-fortuna | Piccola Fortuna | -1 | 13,5 × 13,6 | 180 | 3,4 | 170 | 85 | 85 | 160 |
| fortuna | Fortuna | -1 | 7,7 × 13,6 | 105 | 3,4 | 110 | 55 | 55 | 90 |
| musicante | Musicante | -1 | 7,7 × 13,6 | 105 | 3,4 | 110 | 55 | 55 | 90 |
| prosperita | Prosperità | -1 | 5,8 × 13,6 | 80 | 3,4 | 80 | 40 | 40 | 70 |
| saggio | Saggio | -1 | 4,5 × 8 | 40 | 3,1 | 36 | 15 | 15 | 30 |
| fiori | Fiori | -1 | 4,7 × 5,6 | 24 | 3,1 | 20 | 12 | 12 | 15 |

Divisibili con pareti mobili: Costellazioni (fino a 8 sale), Divinità (fino a 5 sale). Le altre righe della tabella sono sale singole o combinazioni: `[DA CONFERMARE: quali righe sono combinazioni di altre, per disegnare le pareti mobili]`.
Nota sul testo del sito vecchio: «Plenaria delle Divinità da 400 mq» e «fino a 400 persone» si scontrano con la tabella (440 m², platea 440, banchetto 400). Qui si usa la tabella; il testo dice «fino a 400 persone a banchetto» finché il cliente non risolve.

---

## Domande aperte per Davide / cliente

1. **Orari e servizi di base.** Orari di Cosmo Grill e Lounge Bar, check-in/check-out, colazione, reception h24, orari degli uffici. Non sono sul sito vecchio e li abbiamo lasciati fuori.
2. **Animali.** La meta description della pagina Camere vecchia dice «il nostro hotel accetta il tuo amico a quattro zampe», ma nel corpo del sito non c'è altro. È vero? Con quali condizioni? Se sì, diventa una FAQ e un'amenità nello schema.
3. **Claim «4 stelle» e «migliori tariffe garantite».** Sono sul sito vecchio (la prima solo nella meta della home, la seconda nel widget). Il brief vieta le stelle. Il cliente le conferma e le vuole riusare?
4. **Tabella sale.** Il testo dice 13 sale, la tabella ne ha 25 righe. Alcune superfici non tornano con le dimensioni (es. Oro Plenaria: 7,1 × 18,5 = 131 m², scritto 147; Stella d'Oro: 78 contro 91; Stella: 50 contro 55). Le Divinità sono 400 o 440 m²? Quali righe sono combinazioni di sale divise da pareti mobili? Serve la planimetria ufficiale.
5. **Richiesta di proposta: dove va?** Il sito è statico. Serve un invio vero (servizio form o email dal server) e un tempo di risposta dichiarabile dall'Ufficio Eventi. Senza, il modulo può solo aprire la email precompilata.
6. **Wellness e parcheggio.** Accesso alla zona wellness: incluso, a pagamento, età minima, prenotazione? Il parcheggio gratuito richiede prenotazione? Ci sono limiti di altezza per i mezzi?
7. **Accessibilità e viaggio.** Camere e bagni attrezzati per persone con disabilità, ascensori, percorsi. Tempi e cambi da Cosmo al Duomo (tram 31 + M5 + eventuale altra linea), da Sesto FS, Milano Centrale e dagli aeroporti: ora scriviamo solo «2 km» e «poche fermate».
8. **Dominio, privacy e cookie.** Dominio finale, informativa privacy aggiornata al nuovo sito (titolare indicato: Cosmo Hotel S.p.A.), strumenti di tracciamento e cookie, link e rapporto con Cosmo Hotel Torri, Cosmo Residence e Villa Trivulzio, chi firma il sito nel footer.

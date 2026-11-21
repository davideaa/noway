# Secondo giro di contatti (13/10/2026): istruzioni per gli agenti

Leggi prima `RICERCA.md` (stessa cartella): valgono tutte le regole lì, **più** queste.

## Già contattati o già esaminati: NON includerli
Tutte le attività nei file `dati/lead-hotel-milano.json`, `dati/lead-montagna.json`, `dati/lead-ristoranti-milano.json`
(leggi nome e sito). Escludi anche: Cosmo Hotel Palace, Boulevard Cinisello, Primevo, Trattoria Milanese dal 1933,
Chalet Laura, Baita Clementi, Hotel Wagner, Antica Osteria il Ronchettino.

## L'email da trovare (la cosa più importante)
Davide vuole scrivere all'indirizzo che l'attività usa per i **rapporti di lavoro**, non a quello dei clienti
(`info@` e `prenotazioni@` finiscono alla reception o in risposte automatiche). In ordine di preferenza:
`direzione@`, `direttore@`, `marketing@`, `commerciale@`, `sales@`, `amministrazione@`, `ufficio stampa`/`press@`,
`eventi@`/`events@` (per hotel e ville), email nominativa del titolare o del manager (nome.cognome@) se pubblicata.
Dove cercarle: pagina Contatti, piè di pagina e dati societari, **privacy/cookie policy** (il «titolare del trattamento»
ha spesso l'email amministrativa), «Lavora con noi», area stampa, eventi/meeting/matrimoni, gruppi.
**Mai la PEC.** Mai indirizzi indovinati: solo quelli scritti da qualche parte sul loro sito (o in una loro pagina ufficiale).
Se dopo aver cercato bene esiste solo l'email generica, puoi includere l'attività ma con `"email_tipo": "generica"`.
Obiettivo: almeno 2 su 3 con email di lavoro.

## Come guardare il sito (ora si può vedere davvero)
Scrivi prima il tuo JSON, poi lancia (dalla cartella `sites/contatti`):
`VISTI=dati/visti-<tuo-gruppo>.json node scripts/guarda.cjs dati/lead2-<tuo-gruppo>.json`
Fotografa ogni sito da telefono e da computer in `dati/schermate/<id>-tel.png`, `-tel2.png`, `-pc.png`.
Apri le foto (strumento Read sulle png) e **scarta i siti che in realtà sono belli e moderni**. Tieni quelli con
difetti visibili: apertura brutta o coperta da banner/popup, grafica vecchia, testo minuscolo o tagliato da telefono,
prenotazione scomoda o assente, foto piccole, menu confusi.

## Cosa consegnare
`dati/lead2-<tuo-gruppo>.json`: una lista; per ogni attività:
```json
{
  "id": "slug-breve", "nome": "Nome esatto", "tipo": "hotel | ristorante | negozio | locale | villa-eventi",
  "livello": "4 stelle / € € € / …", "citta": "…", "zona": "…", "sito": "https://…",
  "recensioni": {"fonte": "…", "voto": 4.5, "numero": 900, "url": "…"},
  "contatti": {"email_lavoro": "direzione@…", "dove": "url della pagina dove è scritta", "email": "info@… (generica, riserva)", "telefono": "…"},
  "email_tipo": "lavoro | generica",
  "oggetto_nome": "dell'Hotel Bellavista",
  "problemi": "soprattutto da telefono e nel modo in cui si prenota",
  "valore": "La terrazza sul lago e la vostra cucina sono cose che vi distinguono, ma oggi sul sito quasi non si vedono.",
  "difetti_visti": ["per Davide, non va nel messaggio: cosa hai visto davvero nelle foto"],
  "priorita": 1, "note": "dubbi"
}
```
- `oggetto_nome` completa la frase «Un'idea per il sito …» (es. «dell'Hotel X», «della Trattoria Y», «di Maison Z»).
- `problemi` completa «Ho guardato il vostro sito e ho notato qualche problema, …». Deve essere **vago** (aree, non
  dettagli: «soprattutto da telefono», «nella prima schermata», «nel modo in cui si prenota»), perché se diamo i dettagli
  lo sistemano da soli. Minuscolo all'inizio, senza punto finale.
- `valore`: una frase vera e specifica su cosa hanno di bello che online meriterebbe più spazio. Italiano semplice,
  come lo scriverebbe un ragazzo di 22 anni: niente frasi da pubblicità, niente trattini lunghi, niente «non solo X ma Y».
- Esempi già usati: problemi «soprattutto nel momento della prenotazione, che è quello in cui si decide tutto»;
  valore «Il nome Compagnoni e il Parco dello Stelvio sono un biglietto da visita che pochi hanno, e online potrebbero
  rendere molto di più.»

Rispondi alla fine con un rapporto brevissimo: quanti, quanti con email di lavoro, cosa non hai potuto verificare.
Solo lettura: non mandare nulla a nessuno, non compilare moduli.

## Email vere e attive (richiesta esplicita di Davide)
- Copia l'indirizzo **esattamente** com'è scritto, e solo da pagine **attuali** del loro sito ufficiale (contatti,
  privacy aggiornata, footer). Niente indirizzi da PDF vecchi, pagine archiviate, siti terzi o elenchi.
- Prova: in `contatti.dove` metti l'URL e in `contatti.prova` la frase di contesto in cui compare
  (es. «Per collaborazioni commerciali: marketing@hotelx.it»). Ricontrollala con `curl … | grep -o 'marketing@hotelx.it'`.
- Il dominio dell'email deve essere lo stesso del sito (o un dominio chiaramente loro): niente indirizzi di agenzie web,
  gestionali o vecchi proprietari.
- Controlla che il dominio riceva posta (record MX): `curl -s "https://dns.google/resolve?name=<dominio>&type=MX"`
  deve avere `"Answer"` con almeno un server di posta. Se non c'è, l'indirizzo non funziona: scartalo.

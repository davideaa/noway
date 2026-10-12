# Ricerca contatti — istruzioni per gli agenti

Davide (22 anni, freelance da 3 anni: siti web, restyling, motion graphic, collegamento a prenotazioni e
logistica) vuole proporre il **rifacimento del sito** ad attività di fascia alta. Il tuo compito è trovare
attività reali che (1) hanno budget e (2) hanno un sito che merita davvero di essere rifatto. Davide
manderà a ognuna un messaggio personale: per scriverlo servono osservazioni **vere e precise** sul loro sito.

## Chi cercare
- **Indipendenti**: niente catene, gruppi o franchising (NH, Marriott, Accor, Starhotels, Best Western,
  Roadhouse, Old Wild West…). Il loro sito lo fa la sede, non il titolare.
- **Fascia alta**: hotel 4★ o 3★ superiore/boutique; ristoranti € € € o con conto medio ≥ 50 €; molte
  recensioni (indicativamente ≥ 500 su Google o TripAdvisor). Attività vive e aperte.
- **Sito debole, verificato**. Un sito già moderno e curato (agenzia recente, design attuale) **non serve**:
  scartalo, anche se l'attività è perfetta. Meglio 8 contatti buoni che 15 forzati.
- Escludi: Cosmo Hotel Palace, Boulevard Café Cinisello, Primevo (già fatti).

## Come verificare un sito (obbligatorio, per ognuno)
1. Scarica la home: `curl -sSL --max-time 25 -A "Mozilla/5.0" -o /tmp/<id>.html -w '%{http_code} %{url_effective}\n' <url>`
   (la rete passa da un proxy: se un sito non risponde, riprova una volta, poi scartalo o segnalalo).
2. Cerca prove concrete, per esempio:
   - `<meta name="viewport"` assente → non si adatta al telefono;
   - © con un anno vecchio nel piè di pagina (`grep -io '©[^<]\{0,40\}'`, `copyright`);
   - `http://` senza https, certificato scaduto;
   - generatori vecchi (`<meta name="generator"`: Joomla 2/3, WordPress vecchio, Wix/Jimdo/Webnode di base),
     jQuery 1.x, Flash, tabelle per l'impaginazione, font di sistema, testi tutti maiuscoli;
   - prenotazione: c'è un motore di prenotazione (Vertical Booking, Simple Booking, Bookassist, SiteMinder,
     Octorate, TheFork, Quandoo, Plateform…) o solo un modulo email/«chiamaci»? Menu in PDF? Foto piccole?
   - lingue mancanti (un hotel per turisti senza inglese), pagine vuote o «in costruzione», link rotti.
   - Puoi usare WebFetch per leggere il testo, ma i difetti tecnici vanno visti nel codice HTML scaricato.
3. Annota anche **cosa hanno di bello** (posizione, storia, foto, cucina, panorama): il messaggio deve
   partire da un complimento vero, non solo da critiche.
4. Contatti **pubblicati sul loro sito** (email, telefono, modulo, Instagram). Mai inventarli.
5. Recensioni e prezzo: solo se li trovi con una fonte (risultato di ricerca, scheda TripAdvisor/Booking/
   Michelin/Gambero Rosso). Se non li trovi, `null`. **Nessun numero inventato o stimato.**

## Cosa consegnare
Scrivi un file JSON (una lista) nel percorso che ti è stato indicato, con un oggetto per attività:

```json
{
  "id": "slug-breve",
  "nome": "Nome esatto",
  "tipo": "hotel | ristorante | negozio",
  "livello": "4 stelle / 3 stelle superiore / € € € / stella Michelin…",
  "citta": "Milano", "zona": "Brera",
  "sito": "https://…",
  "recensioni": {"fonte": "TripAdvisor", "voto": 4.5, "numero": 1820, "url": "https://…"},
  "prezzo": "camere da 160 € (Booking, ott 2026)",
  "contatti": {"email": "info@…", "telefono": "+39 …", "modulo": "https://…/contatti", "instagram": "@…"},
  "punti_forti": ["vero e specifico: cosa hanno di bello"],
  "difetti": ["vero e verificato: cosa non va nel sito e dove (con la prova: es. 'nessun meta viewport', '© 2014 nel footer')"],
  "prenotazione": "come si prenota oggi dal sito (motore X / modulo email / solo telefono / TheFork)",
  "gancio": "una frase: il problema del sito che costa loro clienti o soldi",
  "priorita": 1,
  "note": "dubbi, cose non verificate"
}
```

`priorita`: 1 = sito chiaramente vecchio e attività di fascia alta; 2 = buono; 3 = margine minore.
Alla fine rispondi con un rapporto brevissimo: quanti trovati, quanti scartati e perché, cosa non hai potuto verificare.
Non mandare mai messaggi o email a nessuno, non compilare moduli: solo lettura.

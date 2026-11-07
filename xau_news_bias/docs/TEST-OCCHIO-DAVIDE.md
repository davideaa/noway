# Test dell'occhio di Davide sulle NFP (regole scritte prima di cominciare)

Scritte il 06/11/2026, prima di mostrare la prima schermata.

## Cosa si fa

- Per ogni NFP dal 03/11/2023 al 02/10/2026, 34 in ordine, una schermata ferma alle **14:29:00** ora italiana.
- Mostra Daily (30 candele), H4 (60), H1 (72) e M30 (48), con l'ultima candela in formazione.
- Giorni e H4 sono quelli del server del broker (New York + 7 h), come su MT5 PU Prime. Prezzi Dukascopy bid.
- **La data non si vede.** Sulle candele intraday ci sono solo le ore italiane.
- Davide guarda e dice **LONG o SHORT**: solo se pensa di avere una lettura, se no "passo".
- La sua risposta si scrive in `research_output/phase2/screen_nfp/risposte.jsonl` **prima** di aprire la chiave (`chiave.json`).

## Come si conta

**Esito.** Il verso del prezzo dopo il dato, rispetto al prezzo delle 14:30:00:
- alla chiusura della M1 delle 14:30;
- alla chiusura della M5 (14:30–14:34).

**Si confronta con:**
- il caso: 50%;
- la regola del sito sulle stesse NFP ("contrario della NFP precedente").

**Soglia scritta prima.** Su 34 NFP, il caso fa 23 o più giuste solo 3 volte su 100. Se Davide ne indovina almeno 23 su 34 risposte (68%), è un indizio vero. Con meno risposte vale la stessa probabilità: test binomiale a una coda sotto 0,05.

**Ma resta un indizio, non una prova.**
- Davide può ricordare alcune NFP passate.
- Il grafico fermo alle 14:29 è comunque il passato.

Se l'indizio c'è:
- si scrive la sua lettura come regola, con le sue parole;
- la si mette alla prova dal vivo sulle NFP prossime, come tutto il resto.

## Risultati (06/11/2026)

Risposte in `research_output/phase2/screen_nfp/risposte.jsonl`, scritte prima di aprire `chiave.json`.

**Esclusioni:**
- la #6: nessuna direzione;
- la #34 (02/10/2026): Davide l'ha riconosciuta.

**Restano 32 letture.**

| | Giuste | p contro il caso (una coda) |
|---|---|---|
| Davide, prima candela M1 | **20 su 32 (62,5%)** | 0,11 |
| Davide, chiusura M5 | 20 su 32 | 0,11 |
| Regola del sito, sulle stesse | 19 su 32 | 0,19 |

**Soglia scritta prima: non raggiunta.** Con 32 letture servivano 22 giuste.

**Descrittivo:**
- **Direzione secca**: 14 su 23. **Letture "manipola prima e poi"**: 6 su 9 sulla direzione puntata, ma la manipolazione prevista si è vista di rado.
- **Quelle che non avrebbe tradato o su cui era incerto**: 12 su 18. **Le altre**: 8 su 14. Il filtro "la traderei / no" non ha aiutato.
- **Ha detto SHORT 25 volte su 32**; la prima candela è scesa 17 volte.
- **Sulle 6 NFP grandi del 2026** (#27, #28, #30, #31, #32, #33): 3 su 6.

**Lettura.** L'occhio di Davide fa poco più della regola del sito e non si distingue dal caso con 32 prove. Non è una prova che non funzioni: è troppo poco per dire che funziona.

Si continua **dal vivo**: Davide scrive la lettura prima di ogni NFP e si conta.

## Dal vivo

Registro: `research_output/phase2/screen_nfp/dal_vivo.jsonl` (solo aggiunte). Conta solo la lettura scritta **prima** della news.

| NFP | Lettura di Davide | Quando | Prima candela | Conta |
|---|---|---|---|---|
| 06/11/2026 | LONG, trade fatto ("non mi piaceva né long né short") | detta **dopo** la news | SHORT, −210 pips | no |

- **06/11/2026.** Davide è entrato LONG e lo ha detto lui, dopo: sarebbe stata sbagliata. Non entra nel conteggio perché non era scritta prima. Si registra lo stesso: un errore va scritto anche quando non conta.
- Con lo stop di 88 pips (ingresso 14:29:30, spread 30 pips prima della news) il LONG è stato preso **2 secondi dopo la news**, non prima: da 14:29:30 a 14:30:00 il prezzo è rimasto tra 4.059,3 e 4.062,7.
- La schermata ferma alle 14:29 di quel giorno gli è stata data dopo, sapendo già il risultato: quello che ci legge ora non conta.

**Conteggio dal vivo: 0 letture valide.** La prossima è la NFP del 04/12/2026.

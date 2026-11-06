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

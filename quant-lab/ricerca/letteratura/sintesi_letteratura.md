# Sintesi della letteratura: relative value / stat arb per un trader retail

Fonti: `registri/ACADEMIC_RESEARCH_DATABASE.csv` (id L01-L37) e `registri/RESEARCH_IDEA_REGISTRY.csv` (I01-I18, tutte IDEA_ONLY).
Regola seguita: ogni numero qui sotto l'ho visto nell'abstract (o, dove segnalato, in un riassunto di ricerca web, quindi da ricontrollare sul testo). Non ho letto i testi completi: molti dettagli (costi, campioni) sono "non verificati". Nessun paywall aggirato.

## (a) Il pairs trading classico funziona ancora dopo i costi?

**Risposta breve: funziona sempre meno, e il margine netto è piccolo.**

- Gatev-Goetzmann-Rouwenhorst, campione 1962-2002: rendimenti in eccesso annualizzati fino all'11% e profitti che di norma superano stime prudenti dei costi (L01).
- Do & Faff confermano un trend di profittabilità in calo, con buone performance solo nei periodi turbolenti, GFC compresa (L02). Con commissioni, impatto di mercato e costi di short (1963-2009) restano circa 30 bps al mese di rendimento corretto per il rischio, "molto più modesti", e sia pairs sia reversal sono in gran parte non profittevoli dopo il 2002 (L03).
- Rad-Low-Faff (1962-2014, costi variabili nel tempo): rendimento mensile in eccesso 91/85/43 bps prima dei costi e 38/33/5 bps dopo, per distanza/cointegrazione/copula. Dal 2009 le occasioni di trading per distanza e cointegrazione calano molto (L05).
- Avellaneda-Lee (riassunti di ricerca, da verificare): Sharpe 1,1 per le strategie su ETF nel 1997-2007 con degrado dal 2002; Sharpe medio 0,9 per PCA nel 2003-2007 (L06).
- Chen et al.: i profitti sono in larga parte spiegati da short-term reversal e momentum di industria, quindi non sono un arbitraggio "puro" (L07). Engelberg et al.: i profitti sono più alti quando la divergenza nasce da shock di liquidità, cioè è un compenso per fornire liquidità (L08).
- Un caso recente (preprint non peer-reviewed): coppia PEP-KO, la mean reversion si indebolisce e la strategia fallisce fuori campione (L09).
- Krauss è la mappa del campo (>100 riferimenti, cinque famiglie di metodi) ma l'abstract non dà numeri di rendimento (L04).

**Lettura per noi:** dopo i costi realistici e dopo il 2002-2009 l'edge sulle azioni USA è nell'ordine di decine di bps al mese, ed è la parte più vicina all'esaurimento. Per un retail con costi di short e spread più alti di quelli dei paper, la presunzione ragionevole è "non sufficiente" finché un test nostro non dice il contrario.

## (b) Crypto carry / funding: premio documentato e persistente? Rischi

**Documentato come fenomeno, non dimostrato come premio stabile e facile.**

- Schmeling-Schrimpf-Todorov: il carry dei futures crypto può superare il 40% annuo (versione Management Science; la versione BIS 2023 dice fino al 60%) con forte variabilità nel tempo. Cause indicate: domanda di leva da parte di investitori piccoli che inseguono il trend e scarsità di capitale d'arbitraggio per vincoli di margine e regolamentari. Fare cash-and-carry è rischioso per picchi di margine e liquidazioni nei ribassi (L10). Da un riassunto di ricerca (da verificare): media circa 7% annuo nel periodo aprile 2019 - luglio 2024.
- He-Manela-Ross-von Wachter: le deviazioni dai prezzi senza arbitraggio nei perpetual crypto sono più grandi che nel FX tradizionale, si muovono insieme, **e si riducono nel tempo**; la strategia implicita dà "Sharpe alti" (numero non nell'abstract) (L11).
- Christin et al.: short future + long spot dà Sharpe annui in-sample di 7-10 (L12). È in-sample, su un singolo exchange, bozza 2022: va letto come limite superiore storico, non come aspettativa.
- Cross-exchange: Makarov-Schoar documentano gap grandi e persistenti (settimane) legati ai controlli di capitale (L14, da riassunto), ma Crépellière et al. trovano che la dimensione cala molto da aprile 2018 e che da allora sfruttarli è "appena possibile" (L15). Hautsch et al.: i gap coincidono con alta latenza di regolamento e rischio di default (L16).
- Futures regolamentati: poche opportunità in mercati normali, grandi solo durante i crash (L20).

**Rischi emersi:** margine e liquidazione (L10), rischio di controparte/exchange e latenza di trasferimento (L16), compressione nel tempo (L11, L15), profitti concentrati in momenti di stress (L20). Non ho trovato in letteratura peer-reviewed una stima netta, dopo costi, del rendimento del funding arbitrage per un retail su un periodo recente: è una lacuna, quindi va misurata da noi (I05, I06).

## (c) Quali famiglie sembrano più plausibili per un retail nel 2026

Giudizio mio, basato sulle evidenze sopra, non sulla letteratura direttamente.

1. **Carry/funding crypto (cash-and-carry)**: premio con una spiegazione strutturale (domanda di leva vs. poco capitale) e dati gratuiti; ma sensibile a margine, exchange risk e compressione. Priorità più alta tra le famiglie di profitto (I05, I06, I07).
2. **Carry/term structure su materie prime e cross-asset (KMPV, GHR, Szymanowska)**: premi spot 5-14% e term 1-3% annui lordi (L23); carry predice i rendimenti in molte classi (L21). Implementazione retail solo via proxy (ETF/CFD) con costi di roll che non so stimare dai paper (I12, I14).
3. **FX carry/momentum**: carry >5 punti percentuali annui nel 1983-2007 dopo spread bid-ask (L36, abstract troncato), momentum fino al 10% annuo ma in parte spiegato dai costi (L37); i trading rule FX pubblicati sono svaniti presto (L35). Da trattare con scetticismo (I15, I16).
4. **Pairs/stat arb su azioni**: bassa priorità, per le ragioni in (a) (I09-I11).
5. **Arbitraggio cross-exchange crypto e spread fisici di commodity**: bassa o nulla (L15, L26; I08, I13).

Il pairs crypto ad alta frequenza mostra numeri vistosi (11,61% mensile a 5 minuti contro -0,07% giornaliero, L17) ma gli autori stessi dicono che dipende da parametri, costi e finestre di esecuzione: sospetto di fragilità ai costi.

## (d) Metodi anti-overfitting da applicare

Contesto progetto: 272 configurazioni già provate sul periodo 2024.01-2026.09 che è già "speso". La letteratura dice che questo conta.

- **Soglia di significatività più alta:** Harvey-Liu-Zhu: un nuovo fattore deve superare t > 3,0 e "la maggior parte dei risultati è probabilmente falsa" (L27). Hou-Xue-Zhang: il 65% di 452 anomalie fallisce |t| 1,96 con test corretti, e soglia multipla di 2,78 (L34). Harvey-Liu 2020: soglie legate a un tasso di falsi positivi prefissato (L28). Nota interna: il nostro t usa sd 1,45 R, e il t di CLAUDE.md va confrontato con queste soglie (I02).
- **Deflated Sharpe Ratio (Bailey-López de Prado):** corregge selezione tra molte prove e non-normalità (L29). Richiede di contare onestamente tutte le prove (272 almeno) (I01).
- **Probability of Backtest Overfitting (CSCV):** stima la probabilità che la configurazione scelta sia sovradattata; gli autori sostengono che il semplice hold-out è inaffidabile (L30) (I01).
- **White Reality Check e Hansen SPA:** test bootstrap della migliore regola contro un benchmark tenendo conto dello spazio di ricerca; SPA è più potente e meno sensibile ad alternative scadenti (L31, L32). Si abbina al benchmark a ingressi casuali mai eseguito (I03).
- **Decadimento post-pubblicazione:** McLean-Pontiff: rendimenti -26% fuori campione e -58% dopo la pubblicazione (L33). Come prior: applicare un haircut agli edge prima di dimensionare (I04), e verificare che l'edge regga in entrambe le metà del campione (I17).
- Il caso FX conferma il decadimento: regole genuine negli anni 70-80 sparite entro i primi anni 90 (L35).

## Limiti di questa sintesi

- Abstract letti, non testi completi; per L06, L10 (media 7%), L14 e L21 (rischi) mi appoggio a riassunti di ricerca web: da confermare prima di citarli altrove.
- Righe con `verified=partial` nel CSV: abstract non visto per intero o non aperto direttamente.
- Alcuni venue di pubblicazione (es. DSR su rivista, Menkhoff su JFE) non verificati: nel CSV sono indicati i soli link controllati.
- Nessun paper su relative value specifico dell'oro, né su CFD retail: la letteratura qui raccolta non copre direttamente XAUUSD.

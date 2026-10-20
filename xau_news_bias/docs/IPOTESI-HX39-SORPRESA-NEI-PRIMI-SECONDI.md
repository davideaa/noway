# H-X39 — Usare la sorpresa del dato nei primi secondi: chiudere subito o tenere di più (pre-registrata, solo prova)

Scritta il 20/10/2026 **prima** di calcolare. Il sito non cambia.

## Idea di Davide

Alle 14:30 esce il dato, e in pochi secondi si vede su MyFXBook o
ForexFactory quanto ha sorpreso.
- **Sorpresa grande, a favore** della posizione: tieni, la candela
  probabilmente fa di più.
- **Sorpresa contro**: chiudi subito.

Se funziona, Davide vuole uno strumento interattivo con:
- le soglie in numero di posti di lavoro;
- una freccia verde "tieni" o rossa "chiudi";
- le barre del range atteso.

Questo viene **dopo**, e solo se la prova passa.

## Cosa si sa già, da dichiarare

- Col segno della sorpresa la direzione del primo minuto si indovina circa
  il 73% delle volte.
- H-X29: la grandezza della sorpresa, conosciuta dopo, ha migliorato poco
  la stima della candela.
- Le NFP 2014–2026 sono già state viste per molte cose. Il CPI non è mai
  servito per questa idea: è la conferma. Un risultato positivo vale al
  massimo **"da registrare dal vivo"**.

## Dati

- **Sorpresa**: dato uscito − previsione, dalla tabella ForexFactory
  (`load_surprise_table`).
  - NFP: chiave `nfp`, in posti di lavoro.
  - CPI: chiave `cpi`, variazione mensile.
- **Verso**: una sorpresa positiva (lavoro forte, inflazione alta) spinge
  l'oro giù.
  - "A favore" = sorpresa positiva se sei SHORT, negativa se sei LONG.
  - "Contro" = il contrario.
  - Sorpresa zero = né l'uno né l'altro.
- **Grande** = sorpresa in valore assoluto sopra la mediana delle 24
  release precedenti della stessa serie.
- **Prezzi S4** (H-X38): tick Dukascopy, spread fino a 40 pips, almeno 30
  pips da −20 s a +10 s, costi pieni. Tick da 3 minuti prima a 6 minuti
  dopo.
- **Trade**:
  - direzione della regola H-X8 (contrario della release precedente);
  - ingresso T0 − 60 s;
  - stop attivo fino all'uscita, tetto −1R.
- **Stop**:
  - NFP: H-X37 (30 + 10% della candela prevista);
  - CPI: 60 pips fissi.
  - Lo stesso stop vale per tutte le regole, così si confronta solo
    l'uscita.

## Regole d'uscita

| Codice | Uscita |
|---|---|
| **B** (di oggi) | sempre alle 14:31 (T0 + 60 s) |
| **R1** taglia se contro | sorpresa contro: chiudi a T0 + 20 s; altrimenti 14:31 |
| **R2** tieni se forte | sorpresa a favore e grande: tieni fino alle 14:35 (T0 + 300 s); altrimenti 14:31 |
| **R3** = R1 + R2 | contro: + 20 s; a favore e grande: 14:35; altrimenti 14:31 |

Variante secondaria, solo descrittiva: R1 con uscita a T0 + 10 s.

## Misure

- R a trade: NFP IS 2014–19, OOS 2020–26, ultimi 3 anni; CPI 2014–26.
- Quante volte scatta ogni regola.

Descrittivo, per lo strumento di Davide se la prova passa:
- soglia "grande" di oggi in posti di lavoro;
- range mediano del primo minuto con sorpresa piccola e con sorpresa
  grande;
- quota di primi minuti nel verso della sorpresa.

## Decisione

Una regola **funziona** se:
- sulla NFP ha l'R a trade più alto di B sia nell'IS sia nell'OOS;
- sul CPI 2014–26 ha l'R a trade più alto di B.

Se funziona, si registra dal vivo e si propone lo strumento interattivo.
Se nessuna funziona, si dice e si chiude alle 14:31 come oggi.

## Risultati (dopo il commit `0195ef8`)

File: `research_output/phase2/hx16/hx39_sorpresa.json`.
- 148 NFP e 149 CPI dal 2014. Un CPI senza sorpresa in tabella
  (18/12/2025).
- Controllo: l'uscita alle 14:31 coincide con `trade()` in 297 casi su
  297.

R a trade, prezzi S4, tetto −1R:

| | B (14:31) | R1 taglia se contro | R1 a 10 s | R2 tieni se forte | R3 = R1 + R2 |
|---|---|---|---|---|---|
| NFP IS 2014–19 (70) | +0,060 | **+0,085** | +0,072 | +0,035 | +0,060 |
| NFP OOS 2020–26 (78) | +0,370 | +0,356 | +0,317 | **+0,444** | +0,430 |
| NFP ultimi 3 anni (35) | +0,748 | +0,755 | +0,780 | +0,889 | +0,896 |
| CPI 2014–26 (149) | −0,252 | −0,257 | −0,333 | −0,259 | −0,264 |

Quante volte scattano:
- "contro": 33 NFP nell'IS, 34 nell'OOS, 51 CPI;
- "a favore e grande": 20, 23 e 25.

**Verdetto: nessuna regola funziona.**
- R1 aiuta solo nell'IS.
- R2 e R3 aiutano solo nell'OOS.
- Sul CPI tutte peggiorano.

**Descrittivo.**
- Il primo minuto va nel verso della sorpresa nel **79%** delle NFP. La
  sorpresa dice bene la direzione, ma si conosce solo all'uscita.
- **Range mediano del primo minuto: 84 pips con sorpresa piccola, 85,5
  con sorpresa grande.** La grandezza della sorpresa non cambia
  l'ampiezza della candela, come aveva già visto H-X29.
- Soglia "grande" di oggi: 58.500 posti di lavoro di differenza dalla
  previsione.

**Lettura**, non dimostrata da questa prova.
- Il mercato prezza la sorpresa nei primi secondi.
- A 10–20 secondi, quando una persona legge il numero, la parte del
  movimento che quel numero spiega è già avvenuta.
- Chiudere subito quando la sorpresa è contro non salva quasi niente.
- Tenere quando è a favore e grande non aggiunge in modo stabile.

Resta l'uscita alle 14:31. Lo strumento interattivo non si fa.

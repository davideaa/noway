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

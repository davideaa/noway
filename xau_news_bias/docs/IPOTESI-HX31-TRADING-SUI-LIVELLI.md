# H-X31 — Si guadagna tradando sui livelli del giorno? (pre-registrata)

Scritta il 19/10/2026 **prima** di calcolare.

## Richiesta di Davide

I livelli "9 su 10" quasi mai vengono superati: il prezzo resta dentro il
range. Allora si può vendere in alto e comprare in basso? Oppure seguire
la rottura? Dove mettere take profit e stop?

## Cosa si sa già, da dichiarare

- H-X28: i livelli del giorno (metodo C) sono **calibrati**. Questo dice
  quanto si muove la giornata, non che un trade ai livelli guadagni.
- Toccare il livello "9 su 10" non vuol dire che il prezzo torni
  indietro. Una volta toccato, la probabilità di andare oltre cambia.
- I dati 2016–2026 sono già stati visti per la calibrazione dei livelli,
  non per regole di trading. Un risultato positivo vale al massimo "da
  registrare dal vivo".

## Dati e livelli

- Candele H1 bid Dukascopy dal 2012; giornata dalle 22:00 UTC.
- Livelli di H-X28, metodo C, con le tabelle **passo per passo**: ogni anno
  solo con gli anni prima. Funzioni `checkpoints` e `walk` di
  `hx28_livelli.py`.
- **Controlli**:
  - k = 10, alla chiusura della candela delle 08:00 UTC (10:00 italiane
    d'inverno, 11:00 d'estate);
  - k = 14, alla chiusura della candela delle 12:00 UTC, prima delle news
    delle 14:30 italiane.
- Al controllo si leggono:
  - prezzo P;
  - livelli Su_90, Su_tipico, Giù_tipico, Giù_90;
  - ADR21 in $.

## Regole (ordini messi al controllo, validi fino a fine giornata)

| Codice | Lato alto | Lato basso | Take profit | Stop |
|---|---|---|---|---|
| **R1** fade al 9 su 10 | SELL limit a Su_90 | BUY limit a Giù_90 | il livello tipico dello stesso lato | 0,2 × ADR oltre l'ingresso |
| **R2** fade al tipico | SELL limit a Su_tipico | BUY limit a Giù_tipico | P | il livello 9 su 10 dello stesso lato |
| **R3** rottura del tipico | BUY stop a Su_tipico | SELL stop a Giù_tipico | il livello 9 su 10 dello stesso lato | P |

- I due lati sono ordini indipendenti: in un giorno possono scattare
  tutti e due.
- Se né take profit né stop vengono toccati, si chiude all'ultima candela
  del giorno.
- **Costi**: 5 pips (0,50 $) a trade fra spread e slittamento.
- R = risultato ÷ distanza fra ingresso e stop.

**Ordine dentro la candela, prudente.** Con le H1 non si sa cosa viene
prima dentro l'ora:
- se nella stessa candela possono scattare sia take profit sia stop,
  conta lo **stop**;
- nella candela dell'ingresso conta solo lo stop, mai il take profit.

## Misure

Per ogni regola e controllo (6 combinazioni), nel 2016–18, 2019–22 e
2023–26:
- numero di trade, quota vinti, R medio, somma R;
- t = R medio ÷ (deviazione standard ÷ √n).

## Decisione

Una regola **funziona** se:
- R medio > 0 sia nel 2019–22 sia nel 2023–26;
- sul 2019–26 insieme, t > 0 con p unilaterale corretto Holm su 6 < 0,05;
- nel 2016–18 R medio ha lo stesso segno.

Se funziona:
- va sul sito come "da registrare dal vivo", con take profit e stop;
- si registra dal vivo prima di dirla un edge.

Se nessuna funziona, si dice: i livelli servono per sapere lo spazio e
mettere take profit e stop, non per entrare.

## Risultati con le candele H1 (dopo i commit `c023049` e `710845e`)

File: `research_output/phase2/hx16/hx31_trading_livelli.json`.

R medio a trade (n) — 2016–18 / 2019–22 / 2023–26:

| Regola | Controllo k=10 | Controllo k=14 |
|---|---|---|
| R1 fade al 9 su 10 | −0,26 (135) / −0,23 (178) / −0,14 (175) | −0,25 (128) / −0,23 (184) / −0,20 (147) |
| R2 fade al tipico | −0,58 (460) / −0,09 (630) / −0,14 (559) | −0,21 (343) / −0,20 (463) / −0,13 (411) |
| R3 rottura del tipico | −0,26 (460) / −0,29 (630) / −0,26 (559) | −0,45 (343) / −0,48 (463) / −0,41 (411) |

- **Per la regola scritta prima nessuna funziona**: tutte perdono in
  tutti i periodi.
- **Controllo descrittivo**, fatto dopo e non pre-registrato
  (`hx31_ottimista.json`). Stesse regole, ma dentro la candela conta
  **prima il take profit**, anche nella candela dell'ingresso:
  - R1: +0,37 / +0,65 / +0,75 (k=10) e +0,47 / +0,65 / +0,69 (k=14);
  - R2: −0,37 / +0,18 / +0,24 (k=10) e +0,38 / +0,43 / +0,38 (k=14);
  - R3: resta negativa, da −0,20 a −0,34.
- **Le H1 non bastano a decidere le regole di fade.** Il risultato
  cambia segno a seconda di cosa si suppone succeda prima dentro l'ora.
  L'ipotesi favorevole conta anche take profit toccati **prima**
  dell'ingresso, quindi è troppo ottimista. Quella prudente può essere
  troppo pessimista.
- La rottura (R3) perde con tutte e due le ipotesi: **non funziona**.

## Emendamento 1 — scritto il 19/10/2026 prima di calcolare con le M1

Le H1 non risolvono l'ordine degli eventi. Si rifà la stessa prova con le
candele **M1** Dukascopy, cambiando solo la risoluzione:
- stesse regole R1, R2 e R3;
- stessi controlli k = 10 e k = 14;
- stessi livelli e tabelle passo per passo;
- stessi costi e stessa decisione.

Come si usano le M1:
- dalla fine della candela H1 del controllo fino alle 22:00 UTC dello
  stesso giorno;
- dentro **un minuto** restano le regole prudenti: stop prima del take
  profit, e nella candela M1 d'ingresso conta solo lo stop.

Il verdetto ufficiale diventa questo con le M1. Il 2016–26 è comunque già
visto: se una regola passa, vale "da registrare dal vivo".

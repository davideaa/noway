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

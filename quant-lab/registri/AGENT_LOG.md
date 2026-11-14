# Registro agenti e modelli

Modelli disponibili in questo ambiente: Haiku, Sonnet, Opus, Fable. Lo sforzo di
ragionamento dei singoli agenti non è stato impostato: in questo ambiente si può fare
solo su richiesta esplicita dell'utente.

| Data | Compito | Modello | Agenti | Esito | Note |
|---|---|---|---|---|---|
| 2026-11-14 | Coordinamento, codice, calcoli, report | Opus (sessione principale) | 1 | — | i numeri sono tutti da Python |
| 2026-11-14 | Specifiche Fusion Markets | Sonnet | 1 | completato | ~145k token, 46 chiamate; entità per l'Italia non trovata |
| 2026-11-14 | Specifiche IBKR Italia | Sonnet | 1 | completato | ~113k token; siti 403, solo fonti secondarie |
| 2026-11-14 | Sedi cripto e MiCA | Sonnet | 1 | completato | ~177k token; registro ESMA letto direttamente |
| 2026-11-14 | Database della letteratura | Sonnet | 1 | completato | ~156k token; 37 articoli, 27 verificati per intero |
| 2026-11-14 | Revisione indipendente del codice | Fable | 1 | vedi REPORT_FASE_01 | modello diverso dallo sviluppatore; riceve il codice, non le conclusioni |

Perché così: 4 ricerche indipendenti → in parallelo, modello medio (Sonnet). La revisione
di un risultato da cui dipende una decisione → il modello più forte disponibile, diverso
da chi ha scritto il codice.

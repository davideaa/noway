# Range mean reversion — bocciata. Errore di progettazione, non di parametri.

432 configurazioni, XAUUSD.p H1, 2019.06.01–2023.12.31, tick reali,
rischio 0,6%. Criteri dichiarati prima del test: ≥150 trade, PF ≥ 1,20,
t ≥ 3,4. **Nessuno dei tre centrato.**

## Il numero che chiude il discorso

| Configurazioni con almeno 100 trade | 174 |
|---|---|
| **Di queste, in utile** | **0** |
| La meno peggio | −698 |

Centosettantaquattro modi diversi di applicare questa regola. Tutti in
perdita. Non esiste un parametro da sistemare.

## Più opera, più perde — in modo perfettamente ordinato

| Barre del canale | Trade (mediana) | Profitto (mediano) |
|---:|---:|---:|
| 24 | 414 | **−2.488** |
| 48 | 104 | **−1.039** |
| 72 | 22 | −14 |
| 96 | 1 | +86 |

Questa e' la firma di un'aspettativa **negativa**. Quando una strategia ha
edge, piu' trade fa piu' guadagna. Qui vale l'esatto contrario, e senza
una sola eccezione. Le uniche configurazioni "in utile" sono quelle che
smettono di operare: la migliore fa 21 trade in 4,6 anni, cioe' 4 all'anno.

## L'ipotesi era invertita

Avevo scritto: *volatilita' che si contrae + canale stretto -> compra il
bordo basso*. I dati dicono che **piu' la condizione viene rispettata,
peggio va**:

| Compressione richiesta | Profitto mediano |
|---|---:|
| ATRveloce/ATRlento ≤ 0,7 (molta) | −1.560 |
| ≤ 0,8 | −2.488 |
| ≤ 0,9 (poca) | −3.365 |

A prima vista sembra che piu' compressione aiuti, ma e' solo perche'
filtra piu' trade: normalizzando per numero di operazioni la perdita per
trade e' sostanzialmente la stessa. Il filtro non seleziona niente di
buono, riduce solo l'esposizione a una regola che perde.

E lo stop dice la stessa cosa al contrario: piu' e' stretto, peggio va
(−3.365 a 0,5 ATR contro −1.866 a 1,5 ATR). Cioe' il prezzo, dopo aver
toccato il bordo, **continua nella direzione del tocco**. Non rimbalza.

**La compressione non precede il ritorno al centro. Precede la rottura.**
Comprare il minimo di un canale che si stringe significa mettersi davanti
al breakout, non contro il rimbalzo. E' esattamente l'evento su cui S3
guadagna: stavo costruendo la controparte perdente di una nostra gamba.

## La migliore di tutte non batte il caso

10,8 R su 21 trade -> **t = 1,87**. Con 432 configurazioni provate la
soglia e' `sqrt(2·ln 432)` = **3,48**, piu' margine. Il +668 e' rumore
selezionato, non edge.

## Cosa resta

Il posto del mean reversion nel portafoglio **e' gia' occupato da S1
FADE**, che fa la stessa cosa ma al momento giusto: non quando il prezzo
arriva piano al bordo, ma quando lo sfonda e viene respinto. Una seconda
gamba di ritorno al centro era una versione peggiore di quella.

L'errore a monte: ho cercato una gamba "laterale" perche' e' la terza
casella dello schema trend / contro-trend / laterale. Lo schema e' mio,
non del mercato.

## Prossima candidata

Diversificare per **durata**, non per tipo di mercato: ingresso sul
ritracciamento dentro un trend gia' stabilito, su H4. Il trigger e'
l'opposto di S3 — S3 entra sui nuovi estremi, questa entra quando il
prezzo non e' sull'estremo — e l'orizzonte e' settimane invece di ore.

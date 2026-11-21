# Puntata 30 (ven 13/11/2026) — «Quanto vale davvero un premio pagato a rate» — fonti (verificate il 5/11/2026)

Caso scelto: **jackpot Powerball del 12/08/2026** (1,04 miliardi di dollari «a rate», 450,5 milioni «in contanti»). Caso chiuso: estrazione avvenuta, nessuna revisione da attendere. Motivo della scelta: è l'unico caso in cui un ente ufficiale pubblica **sia** il valore a rate **sia** il valore in contanti dello stesso premio, quindi il confronto non dipende da un tasso inventato da noi.

**Perché non Win for Life (ADM/Sisal):** la rendita è mensile (240 rate), non esiste un valore in contanti pubblicato, e le fonti si contraddicono sull'importo: la pagina ADM «Descrizione del gioco» dà il Classico a **2.700 €/mese per 20 anni «al netto del prelievo erariale»** (Grattacieli 3.580 €/mese + 100.000 € subito), Sisal dice «fino a 3.000 €/mese». Importi non riconciliati: NON USATO (e il netto/lordo porterebbe nel tema tasse).

**Fonti primarie (lette il 5/11/2026):**
- **Powerball / MUSL** = Multi-State Lottery Association, pagina risultato estrazione 12/08/2026: https://www.powerball.com/draw-result?gc=powerball&date=2026-08-12 (jackpot «$1.04 Billion», cash value «$450.5 Million», vincitore unico «IL», numeri 4-26-66-67-69, Powerball 9).
- **Powerball, FAQ**: https://www.powerball.com/faqs (30 pagamenti crescenti in 29 anni, uno subito + 29 annuali «that increase by 5% each year»; definizione di cash value).
- **Powerball, prize chart**: https://www.powerball.com/powerball-prize-chart («paid in 30 graduated payments over 29 years, or a lump-sum payment»).
- **US Treasury**, «Daily Treasury Par Yield Curve Rates», agosto 2026: https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value_month=202608
- Scelta del vincitore: **Illinois Lottery**, riportata da una testata (https://www.fox5vegas.com/2026/09/15/winner-comes-forward-claim-104-billion-powerball-jackpot/, 15/09/2026). **Fonte secondaria**: pagina primaria Illinois Lottery non letta (403).

## A. Il caso (dati ufficiali)

| Detto nel reel | Dato esatto | Fonte (ente, titolo, data, tabella/pagina) |
|---|---|---|
| «Il 12 agosto 2026 un solo biglietto, venduto in Illinois, ha vinto il jackpot Powerball: un miliardo e quaranta milioni di dollari» | Jackpot **1,04 miliardi $** (cifra arrotondata dall'ente: «$1.04 Billion»), **1 vincitore, Illinois**, estrazione mercoledì **12/08/2026** | Powerball/MUSL, pagina risultato estrazione 12/08/2026 |
| «In contanti: quattrocentocinquanta milioni e mezzo» | **Cash value 450,5 mln $**, lordo, prima delle imposte | Powerball/MUSL, stessa pagina |
| «Il milione "a rate" è pagato in trenta pagamenti, in ventinove anni» | Rendita: **30 pagamenti crescenti in 29 anni**; il primo subito, poi **29 annuali, ciascuno +5 % sul precedente** | Powerball, FAQ (testo: «30 increasing payments over 29 years»; «29 annual payments that increase by 5% each year»); prize chart («30 graduated payments over 29 years») |
| «Il valore in contanti è la somma che serve per finanziare la rendita» | Definizione ufficiale del cash value: «the amount of money required to be in the jackpot prize pool, on the day of the drawing» (a fondare la rendita stimata). Entrambe le opzioni sono indicate prima delle imposte | Powerball, FAQ |
| «Il vincitore ha scelto i contanti» | Il vincitore, che si è presentato (comunicazione del 15/09/2026), «chose to take the prize as a lump-sum payment rather than the annuity option» | Illinois Lottery, via fox5vegas.com 15/09/2026 (**secondaria**; importo effettivamente incassato non letto) |

## B. Il tasso (motivato e datato)

| Detto nel reel | Dato esatto | Fonte |
|---|---|---|
| «Il tasso dei titoli di Stato americani a trent'anni quel giorno: circa 5,2 %» | Par yield **30 anni = 5,24 %**, **20 anni = 5,24 %** (10 anni 4,68 %) il **12/08/2026** (11/08: 5,24 / 5,25; 13/08: 5,21 / 5,20) | US Treasury, Daily Treasury Par Yield Curve Rates, riga 08/12/2026 |

Perché questo tasso: è il rendimento privo di rischio alla data dell'estrazione per la durata della rendita (29 anni ≈ 30 anni). **Il tasso con cui MUSL calcola il cash value NON è pubblicato nelle fonti lette**: il 5,3 % sotto è quello che si ricava a ritroso, non una dichiarazione ufficiale.

## C. Calcoli (nostri, riproducibili)

Ipotesi: 30 pagamenti P1, P1·1,05, …, P1·1,05^29, pagati ai tempi 0, 1, …, 29 anni; somma = 1.040 mln $ (jackpot arrotondato).

1. Somma dei fattori: Σ 1,05^k (k=0…29) = (1,05^30 − 1)/0,05 = **66,4388**.
2. Primo pagamento: 1.040 / 66,4388 = **15,65 mln $** (subito). Ultimo (anno 29): 15,65 × 1,05^29 = **64,43 mln $**.
3. Il primo decennio (pagamenti 1–10) vale 196,9 mln $ non scontati; gli ultimi 10 pagamenti 522,4 mln $: oltre metà del totale arriva dopo il ventesimo anno.
4. Valore attuale della rendita (VA = Σ P_k/(1+r)^k, k = 0…29):

| Tasso r | VA (mln $) | VA / 1.040 |
|---|---|---|
| 0 % | 1.040,0 | 100 % |
| 3 % | 629,3 | 60,5 % |
| 4 % | 541,4 | 52,1 % |
| 4,68 % (10 anni) | 491,0 | 47,2 % |
| 5 % | 469,6 | 45,2 % |
| **5,24 % (Treasury 30 anni, 12/08/2026, usato come annuo)** | **454,4** | **43,7 %** |
| 5,31 % (5,24 % semestrale → annuo effettivo) | 450,2 | 43,3 % |
| 6 % | 410,7 | 39,5 % |

5. **Tasso implicito nel cash value ufficiale**: il r che dà VA = 450,5 → **5,30 %** annuo.
6. Rapporto cash / jackpot: 450,5 / 1.040 = **43,3 %** (con jackpot reale tra 1.035 e 1.045: 43,1–43,5 %). Cioè circa **43 centesimi per ogni dollaro annunciato**.
7. Verifica: 5,24 % Treasury → VA 454,4 vs cash ufficiale 450,5: scarto **0,9 %**. Il cash ufficiale coincide con lo sconto al tasso dei titoli di Stato a 30 anni del giorno.
8. Somma cumulata dei pagamenti a rata supera 450,5 solo col **19° pagamento** (anno 18): 478,0 mln $ (non scontati).
9. Esempio della scheda (cifre illustrative, non dati): 20 rate annue **posticipate** da 50.000 €: VA al 3 % = **743.874 €**, al 5 % = **623.111 €** (ricalcolati, la scheda è corretta). Se le rate fossero **anticipate** (la prima subito, come in Powerball): 766.190 € al 3 %, 654.266 € al 5 %. La differenza posticipate/anticipate va dichiarata a schermo.

## Come dirlo a voce (proposte)

- Apertura (dato verificato): «Il 12 agosto 2026 un biglietto venduto in Illinois ha vinto un miliardo e quaranta milioni di dollari. In contanti: quattrocentocinquanta milioni e mezzo.»
- «Meno di metà. Circa quarantatré centesimi per ogni dollaro annunciato.»
- «Il miliardo è in trenta rate in ventinove anni, ognuna il cinque per cento più alta della precedente: la prima subito, l'ultima oltre sessanta milioni.» (calcolo nostro)
- «Sconta ogni rata al tasso dei titoli di Stato americani a trent'anni di quel giorno, circa cinque e un quarto per cento, e ottieni circa quattrocentocinquanta milioni: quasi esattamente la cifra in contanti.»
- Ponte alla lezione: «Più il tasso è alto, meno vale la rata lontana. A zero varrebbe tutto il miliardo; al tre per cento circa seicentotrenta milioni.»
- Per l'esempio da 1 milione in 20 rate: marcare «cifre illustrative, non dati».

## Cosa NON si può dire

- NON «Powerball paga una rendita da 20 anni»: sono **30 pagamenti in 29 anni**, crescenti (+5 %), non rate uguali. Il «milione in 20 rate da 50.000 €» della scheda è un esempio **inventato**, non il caso reale.
- NON «Il premio vale 450 milioni perché lo dice la matematica»: il cash value è definito dall'ente come l'importo necessario nel montepremi per finanziare la rendita; il tasso di MUSL non è pubblicato. «Corrisponde a uno sconto di circa il 5,3 %» è calcolo nostro.
- NON «MUSL investe in titoli del Tesoro a 30 anni»: composizione e metodo di finanziamento della rendita **NON VERIFICATI**. Il Treasury è solo il nostro tasso di riferimento.
- NON «il tasso è il 5,24 %» come tasso dell'ente: è il rendimento Treasury del 12/08/2026, scelta nostra. I par yield sono quotati con capitalizzazione semestrale: usato come annuo dà 454,4 mln, convertito 450,2 mln (differenza 1 %).
- NON cifre esatte per le singole rate («15.653.492 $»): sono nostri calcoli sull'ipotesi somma = 1.040 mln esatti; l'ente ha pubblicato solo «$1.04 Billion» (arrotondato). Dire «circa quindici milioni e sei».
- NON «il vincitore ha incassato 450,5 milioni»: è l'importo ufficiale dell'opzione; l'importo versato al vincitore non è stato letto. La scelta del contante è riportata da una testata che cita l'Illinois Lottery (secondaria).
- NON «si è preso la scelta peggiore/migliore» né giudizi sulla convenienza: il VA dipende dal tasso scelto. Nessun consiglio di scelta.
- NON nominare il vincitore, la località di vendita (le testate si contraddicono: Hy-Vee Gas / Fast & Fresh, Quincy) né il bonus al negoziante: non verificati su fonte primaria.
- NON «il nono/ottavo jackpot della storia»: le fonti lette sono testate; il rango non è su pagina ufficiale letta.
- NON usare Win for Life con 3.000 €/mese: la fonte ADM dice 2.700 €/mese netti, Sisal 3.000. Non riconciliato.
- Il 5 % annuo è il valore delle FAQ **oggi**: è fissato per il gioco ma le regole possono cambiare. Per questo il reel dice «alla data».

## Dubbi aperti

1. **Jackpot arrotondato.** Powerball scrive «1.04 Billion» e «450.5 Million». Rapporto 43,3 % (43,1–43,5 %): a voce «circa quarantatré centesimi».
2. **Caso: 30 rate in Powerball contro 20 rate nella scheda.** Il gancio («un milione in 20 anni») non è il caso reale. Proposta: il caso apre il reel, poi la scheda («20 rate da 50.000 €») resta come esempio illustrato; oppure riscrivere il gancio. Decide l'orchestratore.
3. **Anticipate contro posticipate.** Powerball paga la prima subito (anticipate); l'esempio della scheda è posticipato. Sono due formule diverse (VA 743.874 vs 766.190 al 3 %).
4. **Tasso di riferimento.** Treasury 30 anni 5,24 % (annuo diretto) o 5,31 % (effettivo). Valori a schermo: scegliere uno e tenere «circa 5,2 %».
5. **Importo realmente incassato dal vincitore** e conferma primaria della scelta del contante: pagina Illinois Lottery non letta (403).
6. **Rango del jackpot (ottavo)**: solo testate, non usare.
7. **Stabilità del 5 %**: letto sulle FAQ il 5/11/2026; non verificata una versione datata del regolamento ufficiale MUSL (testo di regole non letto).
8. Win for Life: nessun dato usato. Per un eventuale richiamo italiano servirebbe il decreto ADM, non trovato (ADM e Sisal differiscono su importo mensile).

## Teoria della settimana (aggiunta dopo il controllo del 5/11)

| Detto nel reel | Natura | Riferimento |
|---|---|---|
| «Un dollaro tra vent'anni vale meno di uno oggi, perché oggi potresti farlo fruttare: il valore attuale è lo stesso calcolo, al contrario» | **Teoria della lezione, non un dato.** È la definizione di valore attuale (attualizzazione): una somma futura F vale oggi F/(1+r)^n, perché la somma di oggi, investita al tasso r, diventa F in n anni. È la formula inversa dell'interesse composto. | Scheda 28 «Il valore attuale» in `social/corso/lezioni.json` e `p28-fonti.md` (formula, verifica inversa 862,61 € → 1.000,00 €); scheda 26 (il tasso come prezzo del tempo) |
| Titolo a schermo «Il tempo ha un prezzo» | Sintesi della stessa teoria (scheda 26). | Come sopra |

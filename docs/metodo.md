# Il metodo — dalla prossima strategia in poi

Deciso il 2026-09-22 con Davide. Ogni strategia nuova passa di qui, **in
ordine, senza saltare**. Se a un passaggio non regge, si dice, si
scrive perché, e si riparte o si prova altro.

L'obiettivo non è trovare un edge: è averne di **usabili e affidabili**.
L'edge esiste ma è difficile da trovare; il lavoro è stressarlo finché
o si rompe o convince.

Verificato sulla letteratura il 2026-09-22 (fonti in fondo). Dove un
passaggio è la versione semplificata di uno strumento professionale, è
scritto.

---

## Fase 1 — Prima di toccare i dati

1. **L'idea con un perché.** Chi sta dall'altra parte, e perché perde?
2. **I criteri di promozione, scritti.** Cosa deve uscire perché passi.
3. **I dati tagliati in due.** Uno per costruire, uno che non si guarda.
   Quello si usa **una volta sola**.
4. **Si prepara l'esportazione di ogni configurazione** provata, non
   solo della migliore. Serve al passo 8 e costa zero farlo adesso;
   dopo è impossibile.

## Fase 2 — Costruire

5. **Pochi parametri**: al massimo uno ogni 50 operazioni.
6. **Un plateau, non un picco.** Ottimo sul bordo = griglia sbagliata.
7. **Si contano le configurazioni provate (K).**

## Fase 3 — È fortuna?

8. **Il t non si confronta con 2.**
   - soglia minima **t > 3** (Harvey, Liu, Zhu)
   - soglia vera: il **Deflated Sharpe Ratio**, che corregge per K **e**
     per l'asimmetria dei rendimenti. `radice(2 × log K)` ne è la
     versione semplificata.
   - se al passo 4 si sono esportate tutte le configurazioni: la
     **Probabilità di Overfitting (PBO)**, che dà la percentuale.
9. **Benchmark a ingressi casuali.** Stesse uscite, ingressi a caso. Se
   rende uguale, l'edge sta nel trailing e non nei segnali.

## Fase 4 — Provare a romperla

Test che **non possono overfittare**: si ripetono quante volte si vuole.

10. **Costi ×3**: deve restare in utile.
11. **Tetto sulle vincite a 3 R**: deve restare in utile. Se muore, vive
    di pochi colpi. (**Mai** «metà del profitto da N operazioni»: è una
    trappola aritmetica.)
12. **Via le 3 migliori di ogni anno**: la maggior parte degli anni regge.
13. **Secondo broker.** Stesso codice, feed diverso — il caso concreto è
    `docs/test-broker.md`. Cinque criteri:

    | | soglia |
    |---|---|
    | segno | entrambi in utile |
    | numero operazioni | entro ±15% |
    | sovrapposizione | ≥ 70% |
    | differenza di rendimento | \|t\| < 2 |
    | correlazione sulle appaiate | ≥ 0,70 |

    L'identità trade per trade **non** è il criterio: due feed diversi
    non la danno mai.
14. **Altro strumento**, stessi parametri — **dichiarando prima** dove
    deve funzionare e dove no.

## Fase 5 — Il verdetto

15. **Fuori campione, un colpo solo.** Coi criteri del passo 2.
16. **Per i piani si usa il numero più basso** fra dentro e fuori.

## Fase 6 — Quanto rischiare, e con chi

17. **Monte Carlo a blocchi da 20** → il drawdown vero.
18. **Il rischio lo decide il tetto di drawdown** che si è disposti a
    vivere. Nessuna formula lo decide.
19. **Correlazione con le gambe esistenti.** Entra solo se è bassa.
    Diversificare su tre assi: strumento, **tipo di strategia**,
    orizzonte.

## Fase 7 — Il mercato vero

20. **Prima del live si scrivono tre cose**, e non si cambiano dopo:
    - **la perdita massima che si accetta sul conto** (il tetto). È un
      limite di soldi, non una prova: scatta anche se la strategia è sana
    - le regole di stop statistiche — le calcola il monitor dal backtest
    - **cosa si fa dopo uno stop**
21. **Demo, poi live piccolo.**
22. **Due controlli, per sempre:**

    | | cosa guarda | ogni quanto | cosa coglie |
    |---|---|---|---|
    | **esecuzione** | backtest sugli stessi giorni del live, confronto operazione per operazione (i cinque criteri del passo 13) | ogni mese | bug, broker, slittamenti — **in giorni** |
    | **edge** | le regole di stop qui sotto | a ogni operazione | strategia rotta — in **~200 operazioni** |

    Tutti e due stanno in **`monitor/monitor.html`**: una pagina che si apre
    col doppio clic, anche senza internet. Si trascina il report del conto
    live, e per il controllo veloce il backtest sugli stessi giorni. Le
    soglie e l'orizzonte li calcola lei dal backtest della strategia
    scelta; altre strategie si aggiungono trascinando il loro report del
    tester. Ha un simulatore: rigioca il fuori campione vero, o inventa
    una storia con l'edge intatto, dimezzato, morto o rotto, per vedere
    **prima** come reagirebbero le regole.

### Le regole di stop (dal 2026-09-22)

Sono quelle che Kevin Davey elenca per capire quando una strategia ha
smesso di funzionare, con una differenza: le soglie sono tarate
**insieme**, perché guardare più cose alla volta moltiplica i falsi
allarmi. Tutte insieme scattano per sbaglio **il 5% delle volte**
sull'orizzonte.

| regola | cosa guarda |
|---|---|
| caduta dal massimo | il più stretto fra lo stop statistico e **il tetto** |
| perdite di fila | più lunga del peggio simulato |
| tempo senza nuovo massimo | idem |
| posizione nel cono | la curva sotto la linea rossa |
| calo lento | il CUSUM: il guadagno medio sta scendendo |

Il giallo scatta dove arriva una storia normale su cinque: si guarda, non
si spegne.

## Le verità scomode sul live, misurate

**Per CONFERMARE un edge dal live servono ~450 operazioni** (Minimum
Track Record Length, al 95%), cioè **~15 mesi** su questo portafoglio.
Prima di allora il live dice solo «non si è rotto», mai «funziona».

**Gli stop statistici sono larghi, perché l'edge è sottile.** Sull'oro da
solo lo stop statistico della caduta è a 57 R, circa il 37% del conto:
più del tetto di Davide. Per questo il tetto è una regola a parte, e sul
conto comanda lui. Nel backtest l'oro è stato **317 operazioni, circa
2,2 anni, senza un nuovo massimo**: se succede dal vero sembra morta, e
va saputo prima.

**Cosa vedono le regole, col tetto al 35%** (quello scelto da Davide il
2026-09-22; dentro l'orizzonte; la perdita è il risultato dall'inizio
del live al momento dello stop):

| se succede questo | portafoglio | | | nasdaq | | |
|---|---:|---:|---:|---:|---:|---:|
| | ti fermi | dopo | perdita | ti fermi | dopo | perdita |
| edge intatto (falso allarme) | 4% | 311 op | −18% | 5% | 194 op | −14% |
| edge dimezzato | 17% | 338 op | −19% | 15% | 241 op | −14% |
| edge morto | 38% | 293 op | −23% | 44% | 257 op | −18% |
| strategia rotta | **85%** | 222 op | −27% | **90%** | 169 op | −21% |

**Un edge morto non svuota il conto**: guadagna in media zero, quindi
oscilla. Chi porta via i soldi è una strategia rotta, e quella le regole
la prendono quasi sempre. Non è un limite dello strumento: con uno Sharpe
di 0,07 per operazione **nessun** monitor fa molto meglio. Per questo il
controllo di esecuzione è l'altro pilastro: è l'unico veloce.

**Il monitor si adatta a qualunque strategia.** Tranne il 5% di falsi
allarmi — che è una scelta, come in ogni test statistico — tutto si
ricava dal backtest della strategia: le soglie, e l'orizzonte, che è la
sua Minimum Track Record Length (451 operazioni sul portafoglio, 373
sul solo nasdaq). Il controllo si fa a ogni operazione.

**Il giallo all'inizio è normale.** Sul 2024-2026, trattato come se
fosse il live, il monitor è rimasto giallo per 175 operazioni — ed è
diventato il periodo migliore di sempre. Sul giallo non si spegne niente.

**Nessuno può dire «ha un'alta probabilità di funzionare in futuro».**
Si può dire che ha passato tutti i passaggi, con quanto margine, e
che fino a oggi il live resta compatibile. È tutto quello che la
statistica concede, e chi promette di più se lo inventa.

---

## Fonti

- Bailey, López de Prado — [The Deflated Sharpe Ratio](https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf)
- Bailey, Borwein, López de Prado, Zhu — [The Probability of Backtest Overfitting](https://www.davidhbailey.com/dhbpapers/backtest-prob.pdf)
- Bailey, López de Prado — [The Sharpe Ratio Efficient Frontier](https://www.davidhbailey.com/dhbpapers/sharpe-frontier.pdf) (Minimum Track Record Length)
- Harvey — [Backtesting](https://www.cmegroup.com/education/files/backtesting.pdf); Harvey, Liu, Zhu — [sintesi](https://foxholm.com/q/research/harvey-liu-zhu-cross-section/)
- Hsu, Kuan — [White's Reality Check e Hansen's SPA](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=685361)
- Philips — [Monitoring Active Portfolios: The CUSUM Approach](https://www.northinfo.com/Documents/144.pdf)
- Davey — [Monte Carlo e coni di probabilità](https://medium.com/data-science/improving-your-algo-trading-by-using-monte-carlo-simulation-and-probability-cones-abacde033adf)
- Davey — [sei modi per capire quando una strategia è rotta](https://bettersystemtrader.com/)
- LuxAlgo — [Live Decay Tracking](https://www.luxalgo.com/library/concept/live-decay-tracking/)

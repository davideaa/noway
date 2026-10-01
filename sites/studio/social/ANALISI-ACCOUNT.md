# Analisi di 18 account di riferimento (01/10/2026)

Fonte: API ufficiale (Business Discovery), 1.367 reel degli account a tema. Script in questa cartella
(`fetch_a.py`, `fetch_b.py`, `analisi.py`, `tempi.py`). Account indicati da Davide: nabila.finanza, warwatchz, curiox26,
alanintelligence, chartingbit, 100basispoints, byimpact, madebyext, pickmytrade, quant_labde, daytrading, capitalcom,
conflictly.app, investire.biz, apexmotion.visuals, 0x100x, pollar.news, insidegeopolitics.
Esclusi dall'analisi di orari/caption perché non a tema: apexmotion.visuals, madebyext, byimpact, pickmytrade.

## Limiti (da rileggere prima di fidarsi)
- Le visualizzazioni includono quelle a pagamento. Mancano durata, musica, tempo di visione, condivisioni.
- Solo gli account scelti da Davide: si vede chi ha successo, non chi ha provato lo stesso e ha fallito.
- Le copertine mostrano il primo fotogramma, non il video: per ritmo e tagli servono le registrazioni schermo.

## Risultati
1. **L'orario conta poco.** Prestazione relativa (visualizzazioni / mediana dello stesso account), ora italiana:
   tutte le fasce 0,84–1,14 con intervalli al 90% che includono 1,0 (09–12: 0,84 [0,71–1,04]; 21–24: 1,07 [0,99–1,22]).
   Giorni: 0,92 (dom) – 1,07 (ven), tutti entro il rumore. Non c'è nulla da ottimizzare ora.
2. **La caption conta poco** (breve/lunga, hashtag, «?», emoji, cifre: mediane 0,95–1,04).
3. **Il tema conta molto.** Nei reel ≥2× la mediana dell'account (21% del totale) ricorrono geopolitics, Iran, Hormuz, Trump,
   Ukraine, «news»: argomenti caldi del momento. Nei flop: card, filings, signup, free, plan (testi promozionali).
4. **Esiti molto dispersi**: 21% dei reel va ≥2× la propria mediana, 15% <0,5×. Con pochi reel il risultato è fortuna.
5. Mediana visualizzazioni/follower più alta: pollar.news 0,68, conflictly.app 0,50, quant_labde 0,47, insidegeopolitics 0,44,
   alanintelligence 0,39. Più bassa: daytrading 0,07 e capitalcom 0,03 (account grandi/aziendali, clip e testi legali).
6. **Stile delle copertine dei reel più forti** (visualizzazioni/follower): una sola frase enorme o un numero enorme su fondo
   pieno (alanintelligence «3.3x», «$121,698»; pollar.news testo giallo su barre colorate); mappe/globi scuri con luci
   (warwatchz, insidegeopolitics); illustrazioni 3D con una domanda (curiox26); volto noto + frase (investire.biz);
   grafico minimale su nero con domanda (quant_labde, 100basispoints).

# Laboratorio di arbitraggio statistico

Progetto separato dal lavoro sull'oro. Lo stato si guarda nell'app:
`app/laboratorio.html` (pubblicata come pagina privata su claude.ai).

| Cosa | Dove |
|---|---|
| Regole del primo ciclo, scritte prima dei test | `PROTOCOLLO_01.md` |
| Risultati del primo ciclo | `REPORT_FASE_01.md` |
| Broker ed exchange per un italiano | `EXECUTION_FEASIBILITY_REPORT.md`, `ricerca/broker/` |
| Chi fa arbitraggio statistico e come | `ricerca/mestiere.md` |
| Letteratura, idee, fonti, strategie, errori, agenti | `registri/` |
| Codice (tutti i calcoli sono qui) | `codice/` |

Rigenerare tutto:
```
python3 codice/scarica_binance.py spot_kl BTCUSDT ...   # dati (vedi PROTOCOLLO_01 per l'universo)
python3 codice/dati.py                                   # pannelli + controlli di qualità
python3 codice/strategia_a_pairs.py
python3 codice/strategia_b_carry.py
python3 codice/esporta_lab.py                            # ricostruisce app/laboratorio.html
```

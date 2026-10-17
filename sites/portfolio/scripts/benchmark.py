#!/usr/bin/env python3
"""
Benchmark per il confronto "contro il mercato" delle pagine strategia (Davide:
"paragonale con l'S&P 500 e il Nasdaq, sia profitto che drawdown").

Scarica da Yahoo Finance le chiusure GIORNALIERE degli INDICI (Davide: gli
indici veri, non gli ETF), cioe' i livelli ufficiali pubblicati da S&P Dow
Jones Indices e da Nasdaq, senza dividendi:
  ^GSPC  S&P 500
  ^NDX   Nasdaq-100
dall'ultimo giorno di borsa del 2018 (la base) all'ultimo disponibile, e
scrive data/benchmark.json. Giornaliere perche' la discesa massima va misurata
giorno per giorno (a fine mese quella del 2020 sparirebbe in parte).

Formato: per ogni ETF `c` = chiusure dell'indice (c[0] = base, 31/12/2018) e
`n` = quanti giorni di borsa ha ogni mese dei dati delle strategie
(2019-01 ... ultimo mese). Il sito ricava da li' rendimenti e discese su
qualunque intervallo di mesi.

Uso: python3 scripts/benchmark.py   (poi ricostruire il sito)
"""
import datetime as dt
import json
import pathlib
import urllib.parse
import urllib.request

RADICE = pathlib.Path(__file__).resolve().parent.parent
DATI = RADICE / "data"
ETF = {"^GSPC": "S&P 500", "^NDX": "Nasdaq-100"}


def scarica(sym):
    p1 = int(dt.datetime(2018, 12, 20, tzinfo=dt.timezone.utc).timestamp())
    p2 = int(dt.datetime.now(dt.timezone.utc).timestamp()) + 86400
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d&period1={p1}&period2={p2}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.load(r)
    res = j["chart"]["result"][0]
    tz = dt.timezone(dt.timedelta(seconds=res["meta"].get("gmtoffset", 0)))
    giorni = [dt.datetime.fromtimestamp(t, tz).date() for t in res["timestamp"]]
    adj = res["indicators"]["quote"][0]["close"]
    return [(g, a) for g, a in zip(giorni, adj) if a is not None]


def main():
    ops = json.load(open(DATI / "operazioni.json"))
    mesi = sorted(set(ops["mesi"]))  # "2019-01" ... ultimo mese delle strategie
    out = {
        "fonte": "Yahoo Finance: chiusure giornaliere degli indici S&P 500 (^GSPC) e Nasdaq-100 (^NDX), senza dividendi",
        "scaricato": dt.date.today().isoformat(),
        "mesi": mesi,
        "etf": {},
    }
    for sym, nome in ETF.items():
        righe = scarica(sym)
        base = [r for r in righe if r[0] < dt.date(2019, 1, 1)][-1]
        dentro = [r for r in righe if r[0].strftime("%Y-%m") in mesi]
        n = [sum(1 for g, _ in dentro if g.strftime("%Y-%m") == m) for m in mesi]
        if 0 in n:
            raise SystemExit(f"{sym}: mesi senza dati {[m for m, k in zip(mesi, n) if not k]}")
        c = [round(base[1], 4)] + [round(a, 4) for _, a in dentro]
        out["etf"][sym] = {
            "nome": nome,
            "base": base[0].isoformat(),
            "ultimo": dentro[-1][0].isoformat(),
            "c": c,
            "n": n,
        }
        print(sym, nome, "base", base[0], "ultimo", dentro[-1][0], "giorni", len(c), f"totale {c[-1] / c[0] - 1:+.1%}")
    (DATI / "benchmark.json").write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print("scritto", DATI / "benchmark.json")


if __name__ == "__main__":
    main()

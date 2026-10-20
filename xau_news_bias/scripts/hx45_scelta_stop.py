"""H-X45 (docs/IPOTESI-HX45-SCELTA-DELLO-STOP-SOLO-COL-PASSATO.md): a ogni NFP una regola fissa sceglie lo stop fra i 20 di
H-X44 guardando solo le W NFP precedenti; poi si misura come sarebbe andata. Usa i trade di hx44_stop_margine.json."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from xnb.config import get_settings  # noqa: E402

BASI = ["B37", "Q70", "Q80", "Q90"]
MARGINI = [1.0, 1.1, 1.2, 1.3, 1.5]
VAR = [f"{b}x{m}" for b in BASI for m in MARGINI]  # ordine per la parità: più stretto prima
REGOLE = {"M24": ("max", 24), "M12": ("max", 12), "M36": ("max", 36), "S24": ("sicura", 24)}
OGGI, DAVIDE = "B37x1.0", "B37x1.2"


def scegli(win_r, win_st, giuste, tipo):
    mean = win_r.mean(axis=0)
    if tipo == "sicura":
        g = giuste.astype(bool)
        salv = 1 - win_st[g].mean(axis=0) if g.any() else np.ones(len(VAR))
        ok = np.nonzero(salv >= 0.80)[0]
        if not len(ok):
            return int(np.argmax(salv))
        return int(ok[np.argmax(mean[ok])])
    return int(np.argmax(mean))  # argmax tiene il primo a parità


def t_appaiata(a, b):
    d = np.asarray(a) - np.asarray(b)
    sd = d.std(ddof=1)
    return {"n": int(len(d)), "diff_media": round(float(d.mean()), 3), "t": round(float(d.mean() / (sd / np.sqrt(len(d)))), 2) if sd > 0 else None}


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    J = json.loads((R / "hx16" / "hx44_stop_margine.json").read_text())
    tr = sorted(J["trade"], key=lambda t: t["d"])
    df = pd.DataFrame([{"id": t["id"], "d": t["d"], "y": t["y"], "giusta": t["giusta"]} for t in tr])
    Rm = np.array([[t["res"][v]["r"] for v in VAR] for t in tr])
    ST = np.array([[float(t["res"][v]["st"]) for v in VAR] for t in tr])
    G = df.giusta.to_numpy()
    scelte, rr = {}, {}
    for nome, (tipo, W) in REGOLE.items():
        ch = np.full(len(tr), -1)
        for i in range(W, len(tr)):
            ch[i] = scegli(Rm[i - W:i], ST[i - W:i], G[i - W:i], tipo)
        scelte[nome] = ch
        rr[nome] = np.array([Rm[i, c] if c >= 0 else np.nan for i, c in enumerate(ch)])
    per = {"IS 2016-19": df.y.between(2016, 2019), "OOS 2020-26": df.y >= 2020, "ultimi 3 anni": df.d >= "2023-10-01", "tutto dal 2016": df.y >= 2016}
    out = {"regole": {}, "t_appaiata": {}}
    for nome in REGOLE:
        ok = ~np.isnan(rr[nome])
        tab = {}
        for p, m in per.items():
            s = (m.to_numpy() & ok)
            senno = max(VAR, key=lambda v: Rm[s, VAR.index(v)].mean())
            tab[p] = {"n": int(s.sum()), "regola": round(float(rr[nome][s].mean()), 3), "oggi": round(float(Rm[s, VAR.index(OGGI)].mean()), 3),
                      "davide": round(float(Rm[s, VAR.index(DAVIDE)].mean()), 3), "senno_di_poi": senno,
                      "senno_di_poi_R": round(float(Rm[s, VAR.index(senno)].mean()), 3)}
        cnt = pd.Series([VAR[c] for c in scelte[nome] if c >= 0]).value_counts()
        out["regole"][nome] = {"periodi": tab, "scelte": {k: int(v) for k, v in cnt.items()}}
    conf = {n: all(out["regole"][n]["periodi"][p]["regola"] > out["regole"][n]["periodi"][p]["oggi"] for p in ("IS 2016-19", "OOS 2020-26")) for n in REGOLE}
    out["conferma"] = bool(conf["M24"] and conf["M12"] and conf["M36"])
    out["batte_oggi"] = conf
    ok24 = ~np.isnan(rr["M24"])
    oos = (df.y >= 2020).to_numpy()
    out["t_appaiata"] = {"davide_vs_oggi_tutto": t_appaiata(Rm[:, VAR.index(DAVIDE)], Rm[:, VAR.index(OGGI)]),
                         "davide_vs_oggi_2020_26": t_appaiata(Rm[oos, VAR.index(DAVIDE)], Rm[oos, VAR.index(OGGI)]),
                         "M24_vs_oggi": t_appaiata(rr["M24"][ok24], Rm[ok24, VAR.index(OGGI)])}
    # per la prossima NFP: cosa sceglierebbe ogni regola con le ultime W NFP
    out["prossima"] = {n: VAR[scegli(Rm[-W:], ST[-W:], G[-W:], tipo)] for n, (tipo, W) in REGOLE.items()}
    out["scelta_per_nfp"] = {tr[i]["id"]: VAR[c] for i, c in enumerate(scelte["M24"]) if c >= 0}
    (R / "hx16" / "hx45_scelta_stop.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    for n, v in out["regole"].items():
        print(n, json.dumps(v["periodi"]), "\n   scelte:", v["scelte"])
    print("batte oggi", conf, "conferma", out["conferma"])
    print("t appaiata", out["t_appaiata"])
    print("prossima", out["prossima"])

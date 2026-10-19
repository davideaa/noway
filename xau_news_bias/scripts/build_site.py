"""Costruisce docs/replay.html (il sito NFP) da site/news_bias.template.html: solo i dati che la pagina usa."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HX16 = ROOT / "research_output" / "phase2" / "hx16"


def load(p):
    return json.loads(p.read_text(encoding="utf-8"))


def livelli():
    lv = load(HX16 / "hx28_livelli.json")["giorno"]
    return {"giorno": {"scelto": lv["scelto"], "metodi": {lv["scelto"]: {"2023-26": lv["metodi"][lv["scelto"]]["2023-26"]}}, "oggi": lv["oggi"]}}


def volatilita():
    d = load(HX16 / "hx21_range.json")["D"]
    return {"scelto": d["scelto"], "previsori": {d["scelto"]: d["previsori"][d["scelto"]]}}


def ml():
    p = load(HX16 / "hx23_modello.json")["punteggi"]
    return {g: {m: p[m][f"{g}|2023-26"] for m in ("M0", "M1", "M2")} for g in ("NFP", "RETAIL_PPI")}


def pips29(group):
    p = load(HX16 / "hx29_pips.json")
    return {"copertura": p["copertura"], "modello": {k: p["modello"][k] for k in ("beta", "gamma")},
            "scomposizione_vs_2019": {group: p["scomposizione_vs_2019"][group]}, "prova": {group: p["prova_passo_per_passo"][group]}}


if __name__ == "__main__":
    site = load(ROOT / "research_output" / "phase2" / "hx11" / "site.json")
    ev = [{k: e[k] for k in ("id", "f", "d", "y", "live", "mv", "stop", "ref", "rule")} | {"sc": {"S1": e["sc"]["S1"]}}
          for e in site["ev"] if e["f"] == "NFP"]
    log = ROOT / "live" / "hx8_live.jsonl"
    tp = load(HX16 / "hx19_tp.json")["NFP"]
    cpi = [{"d": e["d"], "mv": e["mv"], "rule": e["rule"], "r": e["sc"]["S1"][e["rule"][0]]["r"]} for e in site["ev"] if e["f"] == "CPI" and e["rule"]]
    data = {"ev": ev, "bins": site["bins"], "cpi": cpi, "ml": ml(),
            "live": [json.loads(x) for x in log.read_text(encoding="utf-8").splitlines() if x.strip()] if log.exists() else [],
            "tp": {k: tp[k] for k in ("uscite", "per_anno", "ultime")},
            "vol": volatilita(), "liv": livelli(), "pips29": pips29("NFP")}
    tpl = (ROOT / "site" / "news_bias.template.html").read_text(encoding="utf-8")
    html = tpl.replace("/*DATA*/null", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
    (ROOT / "docs" / "replay.html").write_text(html, encoding="utf-8")
    print("docs/replay.html", len(html), "byte")

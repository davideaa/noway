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


def ampiezza():
    """H-X32: il metodo vincente per stimare la candela NFP, NFP per NFP, e la stima della prossima in % del prezzo."""
    a = load(HX16 / "hx32_ampiezza_nfp.json")
    m = a["vincitore"]
    if not m:
        return None
    r = a["metodi"][m]
    return {"metodo": m, "calibrati": a["calibrati"], "n_metodi": len(a["metodi"]), "per": {p: r[p] for p in ("2019-22", "2023-26")},
            "casi": a["casi_vincitore"], "recenti": a["recenti_fuori_dataset"],
            "prossima": {k: a["prossima"][k] for k in ("stima_pct", "lo_pct", "hi_pct")} if a["prossima"] else None}


def vol_tempo(fams):
    """H-X34: volatilità del mese dal 2011, candele delle news della famiglia, risultati della prova e situazione di adesso."""
    v = load(HX16 / "hx34_volatilita_tempo.json")
    return {"serie": [[x["m"], x["V"], x["Vp"], x["px"], int(x["esplosione"]), x["giorni"]] for x in v["serie_mese"]],
            "news": [[x["d"], x["pips"], x["pct"], x.get("stima")] for x in v["news"] if x["f"] in fams],
            "m1": v["M1_mese_dopo"], "m2": {k: v["M2_nfp_nel_tempo"][k] for k in ("2019-22", "2023-26")},
            "m3": v["M3_esplosioni"], "inizi": v["M3_inizi_descrittivo"], "adesso": v["adesso"]}


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
    data = {"ev": ev, "bins": site["bins"], "amp": ampiezza(),
            "live": [json.loads(x) for x in log.read_text(encoding="utf-8").splitlines() if x.strip()] if log.exists() else [],
            "tp": {k: tp[k] for k in ("uscite", "per_anno", "ultime")},
            "vol": volatilita(), "liv": livelli(), "pips29": pips29("NFP"), "vt": vol_tempo(["NFP"])}
    tpl = (ROOT / "site" / "news_bias.template.html").read_text(encoding="utf-8")
    html = tpl.replace("/*DATA*/null", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
    (ROOT / "docs" / "replay.html").write_text(html, encoding="utf-8")
    print("docs/replay.html", len(html), "byte")

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


def ampiezza():
    """H-X32: il metodo vincente per stimare la candela NFP, NFP per NFP, e la stima della prossima in % del prezzo."""
    a = load(HX16 / "hx32_ampiezza_nfp.json")
    m = a["vincitore"]
    if not m:
        return None
    r = a["metodi"][m]
    return {"metodo": m, "calibrati": a["calibrati"], "n_metodi": len(a["metodi"]), "per": {p: r[p] for p in ("2019-22", "2023-26")},
            "casi": a["casi_vincitore"], "recenti": a["recenti_fuori_dataset"], "tutti": a.get("casi_tutti", []),
            "prossima": {k: a["prossima"][k] for k in ("stima_pct", "lo_pct", "hi_pct")} if a["prossima"] else None}


def stop60():
    """Risultato con stop fisso 60 pips per ogni NFP: H-X12 (fisso_60, S1) e, per le NFP dal vivo, hx12_live.py."""
    R11 = ROOT / "research_output" / "phase2" / "hx11"
    out = {r["id"]: r["res"]["fisso_60"]["S1"] for r in load(R11 / "hx12_atr_stop.json")}
    live = R11 / "hx12_live_60.json"
    if live.exists():
        out |= {k: v["S1"] for k, v in load(live).items()}
    return out


def stop_formula():
    """H-X37: stop = 30 + k x candela prevista, col k che ha passato la prova. Per ogni NFP: stop in pips, R e stop preso coi
    prezzi S4 di H-X38 (spread del broker allargato prima della news), direzione giusta, quanto è andato contro (pips)."""
    p = HX16 / "hx37_stop_candela.json"
    if not p.exists():
        return None
    J = load(p)
    ok = [n for n, v in J["passa"].items() if v]
    if not ok:
        return None
    k = max(ok, key=lambda n: J["riassunto"][n]["tutto"]["R"])
    out = {"k": float(k[1:]), "base": J["base_pips"], "prezzi": "S1", "per": {t["id"]: [t["res"][k]["stop_pips"], t["res"][k]["r"]] for t in J["trade"]}}
    p4 = HX16 / "hx38_stop_contro.json"
    if p4.exists():
        S4 = load(p4)
        out["prezzi"] = "S4"
        out["per"] = {t["id"]: [t["res"]["hx37"]["stop_pips"], t["res"]["hx37"]["r"], int(t["res"]["hx37"]["st"]), int(t["giusta"]), t["contro_pips"]]
                      for t in S4["trade"] if "hx37" in t["res"]}
    return out


def verde():
    """Linea verde: H-X43 (ampiezza entro k minuti, 1 volta su 4), se no H-X42 (massimo con la wick), se no H-X41.
    Per ogni NFP in pips; per la prossima in % del prezzo, oppure coef × ADR21 di oggi se il metodo è ADR24."""
    p43 = HX16 / "hx43_ampiezza_k.json"  # H-X43: ampiezza dei primi k minuti superata 1 volta su 4
    if p43.exists():
        J = load(p43)
        if J.get("vince"):
            nx = J["prossima"]
            return {"tipo": "ampiezza", "per": J["per"], "k": J["k"], "metodo": J["metodo"], "supera": J["supera"],
                    "prossima_pct": nx["pct"], "coef": nx.get("coef")}
    p42 = HX16 / "hx42_massimo_k.json"
    if p42.exists():
        J = load(p42)
        if J.get("vince"):
            nx = J["prossima"]
            return {"per": J["per"], "k": J["k"], "metodo": J["metodo"], "tocca": J["tocca"], "prossima_pct": nx["pct"], "coef": nx.get("coef")}
    p = HX16 / "hx41_be_tp.json"
    if not p.exists():
        return None
    J = load(p)
    if not J["verde_calibrata"]:
        return None
    return {"per": {e["id"]: e["verde_pips"] for e in J["eventi"] if e["f"] == "NFP"}, "prossima_pct": J["prossima"]["verde_pct"],
            "tocca": J["tocchi_nfp"]["tocca_verde_1m"], "k": 1}


def pips29(group):
    p = load(HX16 / "hx29_pips.json")
    return {"copertura": p["copertura"], "modello": {k: p["modello"][k] for k in ("beta", "gamma")},
            "scomposizione_vs_2019": {group: p["scomposizione_vs_2019"][group]}, "prova": {group: p["prova_passo_per_passo"][group]}}


if __name__ == "__main__":
    site = load(ROOT / "research_output" / "phase2" / "hx11" / "site.json")
    ev = [{k: e[k] for k in ("id", "f", "d", "y", "live", "mv", "stop", "ref", "rule")} | {"sc": {"S1": e["sc"]["S1"]}}
          for e in site["ev"] if e["f"] == "NFP"]
    log = ROOT / "live" / "hx8_live.jsonl"
    data = {"ev": ev, "bins": site["bins"], "amp": ampiezza(),
            "live": [json.loads(x) for x in log.read_text(encoding="utf-8").splitlines() if x.strip()] if log.exists() else [],
            "liv": livelli(), "pips29": pips29("NFP"), "r60": stop60(), "stopf": stop_formula(), "verde": verde(), "m1": load(ROOT / "research_output" / "phase2" / "hx11" / "nfp_m1_contesto.json")}
    tpl = (ROOT / "site" / "news_bias.template.html").read_text(encoding="utf-8")
    html = tpl.replace("/*DATA*/null", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
    (ROOT / "docs" / "replay.html").write_text(html, encoding="utf-8")
    print("docs/replay.html", len(html), "byte")

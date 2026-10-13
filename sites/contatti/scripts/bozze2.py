#!/usr/bin/env python3
"""Messaggi del secondo giro: per ogni attività di dati/lead2-*.json che ha passato verifica_email.py
compone oggetto e testo con lo stesso modello approvato da Davide (build.messaggio) -> dati/per-gmail2.json."""
import glob, json, os, sys
QUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.argv = [sys.argv[0]]
sys.path.insert(0, QUI)
import build  # noqa: E402

ver = json.load(open(os.path.join(QUI, "dati", "verifica-email.json"), encoding="utf-8"))
gia = {l["sito"].split("//")[-1].strip("/").removeprefix("www.").split("/")[0]
       for f in glob.glob(os.path.join(QUI, "dati", "lead-*.json")) for l in json.load(open(f, encoding="utf-8"))}
out, visti = [], set()
for f in sorted(glob.glob(os.path.join(QUI, "dati", "lead2-*.json"))):
    for l in json.load(open(f, encoding="utf-8")):
        v = ver.get(l["id"])
        dom = l["sito"].split("//")[-1].strip("/").removeprefix("www.").split("/")[0]
        if not v or not v["ok"] or dom in gia or v["email"] in visti:
            print("fuori:", l["id"], (v or {}).get("motivi"), "(già contattato)" if dom in gia else "")
            continue
        visti.add(v["email"])
        out.append({"id": l["id"], "nome": l["nome"], "gruppo": os.path.basename(f)[6:-5], "a": v["email"], "tipo": v["tipo"],
                    "priorita": l.get("priorita", 3), "oggetto": "Un'idea per il sito " + l["oggetto_nome"].strip(),
                    "testo": build.messaggio(l)})
out.sort(key=lambda x: (x["tipo"] != "lavoro", x["priorita"]))
json.dump(out, open(os.path.join(QUI, "dati", "per-gmail2.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "messaggi;", sum(x["tipo"] == "lavoro" for x in out), "a email di lavoro")

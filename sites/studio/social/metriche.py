#!/usr/bin/env python3
# Scarica le statistiche di tutti i reel di @macro.algo.desk e le aggiunge allo storico social/metriche.json.
# Uso (dalla radice del repository):  python3 sites/studio/social/metriche.py [--stampa]
# Solo lettura: non pubblica e non modifica niente su Instagram. Il token lo aggiunge il proxy (come pubblica.py).
# Ogni lancio aggiunge una «fotografia» con data e ora: così si vede come crescono le visualizzazioni a 1, 3, 7 giorni.
import json, subprocess, sys, datetime as dt
from pathlib import Path
from zoneinfo import ZoneInfo

SOC = Path(__file__).resolve().parent
OUT, CAL = SOC / "metriche.json", SOC / "calendario.json"
API, IG = "https://graph.facebook.com/v23.0", "17841425810972500"
MET = "views,reach,saved,shares,likes,comments,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time"
ROMA = ZoneInfo("Europe/Rome")

def g(p):
    out = subprocess.run(["curl", "-s", "-m", "60", f"{API}/{p}"], capture_output=True, text=True).stdout
    return json.loads(out) if out else {}

ora = dt.datetime.now(ROMA)
cal = {v.get("id"): v for v in json.loads(CAL.read_text()) if v.get("id")}
acc = g(f"{IG}?fields=followers_count,media_count")
media = g(f"{IG}/media?fields=id,timestamp,caption,permalink,media_product_type&limit=100").get("data", [])
foto = {"quando": ora.isoformat(timespec="minutes"), "follower": acc.get("followers_count"), "reel": []}
for m in sorted(media, key=lambda x: x["timestamp"]):
    r = g(f"{m['id']}/insights?metric={MET}")
    v = {d["name"]: d["values"][0]["value"] for d in r.get("data", [])}
    pub = dt.datetime.fromisoformat(m["timestamp"].replace("+0000", "+00:00")).astimezone(ROMA)
    c = cal.get(m["id"], {})
    dur = c.get("durata_s")
    watch = (v.get("ig_reels_avg_watch_time") or 0) / 1000
    foto["reel"].append({
        "id": m["id"], "puntata": c.get("puntata"), "titolo": c.get("titolo"), "permalink": m.get("permalink"),
        "pubblicato": pub.isoformat(timespec="minutes"), "giorno": pub.strftime("%a"), "ora": pub.strftime("%H:%M"),
        "ore_online": round((ora - pub).total_seconds() / 3600, 1), "durata_s": dur,
        "gancio": (m.get("caption") or "").split("\n")[0][:140],
        "views": v.get("views"), "reach": v.get("reach"), "likes": v.get("likes"), "comments": v.get("comments"),
        "shares": v.get("shares"), "saved": v.get("saved"), "interazioni": v.get("total_interactions"),
        "visione_media_s": round(watch, 1), "quota_vista": round(watch / dur, 3) if dur else None,
        "errore": r.get("error", {}).get("message"),
    })
storico = json.loads(OUT.read_text()) if OUT.exists() else []
storico.append(foto)
OUT.write_text(json.dumps(storico, ensure_ascii=False, indent=1) + "\n")
if "--stampa" in sys.argv:
    print(f"{foto['quando']}  follower {foto['follower']}  reel {len(foto['reel'])}")
    for x in foto["reel"]:
        print(f"P{x['puntata'] or '-':>2} {x['pubblicato'][:10]} {x['ore_online']:>6}h  views {x['views']:>5}  reach {x['reach']:>5}  "
              f"visione {x['visione_media_s']:>5}s/{x['durata_s'] or '?'}s  like {x['likes']} comm {x['comments']} cond {x['shares']} salv {x['saved']}")

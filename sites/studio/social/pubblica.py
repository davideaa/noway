#!/usr/bin/env python3
# Pubblica su Instagram la puntata in calendario per OGGI (ora italiana) e aggiorna calendario e registro.
# Uso (dalla radice del repository):  python3 sites/studio/social/pubblica.py [--prova] [--data AAAA-MM-GG]
#   --prova  controlla tutto (calendario, video raggiungibile, token) ma NON pubblica.
# Passi: voce del calendario di oggi → URL raw GitHub del video per commit → POST /media (REELS) → attesa FINISHED
#        → attesa dell'ora fissata (12:00) → POST /media_publish → permalink → calendario.json + registro.json → commit e push.
# Il token NON compare: è una credenziale dell'ambiente che il proxy aggiunge alle chiamate verso graph.instagram.com.
import json, subprocess, sys, time, datetime as dt
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[3]; SOC = Path(__file__).resolve().parent
CAL, REG = SOC / "calendario.json", SOC / "registro.json"
IG, API = "17841425810972500", "https://graph.instagram.com/v23.0"
REPO, BRANCH = "davideaa/noway", "claude/creazione-siti-web-u1dyzg"
ROMA = ZoneInfo("Europe/Rome")
PROVA = "--prova" in sys.argv
OGGI = sys.argv[sys.argv.index("--data") + 1] if "--data" in sys.argv else dt.datetime.now(ROMA).date().isoformat()

def sh(*a, check=True): return subprocess.run(a, capture_output=True, text=True, check=check).stdout.strip()
def api(path, post=None, timeout=60):
    cmd = ["curl", "-s", "-m", str(timeout)] + (["-X", "POST"] if post is not None else []) + [f"{API}/{path}"]
    for k, v in (post or {}).items(): cmd += ["--data-urlencode", f"{k}={v}"]
    out = sh(*cmd); return json.loads(out) if out else {}
def log(*m): print(dt.datetime.now(ROMA).strftime("%H:%M:%S"), *m, flush=True)

cal = json.loads(CAL.read_text())
voce = next((v for v in cal if v["data"] == OGGI and v["stato"] == "programmato"), None)
if not voce:
    log(f"Nessuna puntata programmata per il {OGGI}. Niente da fare."); sys.exit(0)
log(f"Puntata {voce['puntata']} «{voce['titolo']}» per il {OGGI} alle {voce['ora']}")

# 1. doppioni: se un post con la stessa prima riga è già uscito, non si ripubblica
prima = voce["caption"].split("\n")[0].strip()
recenti = api(f"{IG}/media?fields=id,caption,timestamp,permalink&limit=10").get("data", [])
gia = next((m for m in recenti if (m.get("caption") or "").split("\n")[0].strip() == prima), None)
if gia:
    log("Già pubblicata:", gia.get("permalink"), "— aggiorno solo il calendario.")
    if not PROVA: voce.update(stato="pubblicato", id=gia["id"], permalink=gia.get("permalink")); CAL.write_text(json.dumps(cal, ensure_ascii=False, indent=1) + "\n")
    sys.exit(0)

# 1b. il video è proprio quello giusto: verticale 1080×1920, con audio, durata come in calendario
import shutil
if not (ROOT / voce["file"]).exists():
    log("ERRORE: video mancante nel repository:", voce["file"]); sys.exit(1)
if shutil.which("ffprobe"):
    pr = json.loads(sh("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration", "-of", "json", str(ROOT / voce["file"]), check=False) or "{}")
    vid = [x for x in pr.get("streams", []) if x.get("codec_type") == "video"]; aud = [x for x in pr.get("streams", []) if x.get("codec_type") == "audio"]
    dur = float(pr.get("format", {}).get("duration", 0))
    if not vid or (vid[0].get("width"), vid[0].get("height")) != (1080, 1920) or not aud or abs(dur - float(voce.get("durata_s", dur))) > 0.6:
        log("ERRORE: video non valido (serve 1080×1920 con audio e durata come in calendario):", voce["file"], vid[:1], len(aud), round(dur, 1)); sys.exit(1)
    log(f"Video locale OK: 1080×1920, audio, {dur:.1f} s")
else:
    log("Avviso: ffprobe non disponibile, salto il controllo del formato (i video sono stati controllati in produzione)")

# 2. video raggiungibile a un URL pubblico fisso (raw GitHub del commit remoto che lo contiene)
sh("git", "-C", str(ROOT), "fetch", "-q", "origin", BRANCH)
sha = sh("git", "-C", str(ROOT), "rev-parse", f"origin/{BRANCH}")
if subprocess.run(["git", "-C", str(ROOT), "cat-file", "-e", f"{sha}:{voce['file']}"]).returncode != 0:
    log("ERRORE: il video non è nel ramo remoto:", voce["file"]); sys.exit(1)
url = f"https://raw.githubusercontent.com/{REPO}/{sha}/{voce['file']}"
head = sh("curl", "-sI", "-m", "30", url, check=False)
if " 200" not in head.split("\n")[0]:
    log("ERRORE: video non raggiungibile:", url, head.split("\n")[0]); sys.exit(1)
log("Video OK:", url)
me = api("me?fields=username")
if me.get("username") != "macro.algo.desk":
    log("ERRORE: token Instagram non valido o scaduto:", me); sys.exit(1)
if PROVA: log("PROVA: tutto pronto, non pubblico."); sys.exit(0)

# 3. contenitore del reel ed elaborazione
c = api(f"{IG}/media", {"media_type": "REELS", "video_url": url, "caption": voce["caption"], "share_to_feed": "true", "thumb_offset": str(voce.get("thumb_offset", 600))})
cid = c.get("id")
if not cid: log("ERRORE creazione contenitore:", c); sys.exit(1)
for _ in range(90):
    st = api(f"{cid}?fields=status_code,status").get("status_code")
    if st == "FINISHED": break
    if st in ("ERROR", "EXPIRED"): log("ERRORE elaborazione:", api(f"{cid}?fields=status_code,status")); sys.exit(1)
    time.sleep(10)
else: log("ERRORE: elaborazione oltre 15 minuti"); sys.exit(1)
log("Elaborato da Instagram.")

# 4. si pubblica all'ora fissata, non prima
hh, mm = map(int, voce["ora"].split(":"))
target = dt.datetime.combine(dt.date.fromisoformat(OGGI), dt.time(hh, mm), ROMA)
while (wait := (target - dt.datetime.now(ROMA)).total_seconds()) > 0: time.sleep(min(wait, 20))
p = api(f"{IG}/media_publish", {"creation_id": cid})
mid = p.get("id")
if not mid: log("ERRORE pubblicazione:", p); sys.exit(1)
info = api(f"{mid}?fields=permalink,timestamp")
log("PUBBLICATA:", info.get("permalink"), info.get("timestamp"))

# 5. calendario, registro, commit
voce.update(stato="pubblicato", id=mid, permalink=info.get("permalink"), pubblicato_utc=info.get("timestamp"))
CAL.write_text(json.dumps(cal, ensure_ascii=False, indent=1) + "\n")
reg = json.loads(REG.read_text())
reg.append({"id": mid, "permalink": info.get("permalink"), "pubblicato_utc": info.get("timestamp"), "ora_italia": dt.datetime.now(ROMA).strftime("%H:%M"),
            "titolo": voce["titolo"], "puntata": voce["puntata"], "lingua": "it", "durata_s": voce.get("durata_s"), "formato": "noir · serie Dalla teoria alla realtà",
            "filone": "corso", "fonti": voce.get("fonti")})
REG.write_text(json.dumps(reg, ensure_ascii=False, indent=1) + "\n")
sh("git", "-C", str(ROOT), "add", str(CAL), str(REG))
msg = f"Social: pubblicata la puntata {voce['puntata']} ({OGGI})\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
sh("git", "-C", str(ROOT), "commit", "-q", "-m", msg, check=False)
for d in (2, 4, 8, 16):
    if subprocess.run(["git", "-C", str(ROOT), "push", "-q", "origin", f"HEAD:{BRANCH}"]).returncode == 0: break
    subprocess.run(["git", "-C", str(ROOT), "pull", "-q", "--no-rebase", "origin", BRANCH]); time.sleep(d)
log("Registro aggiornato e salvato.")

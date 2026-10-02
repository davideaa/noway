# Controllo finale sull'audio DEFINITIVO (voce + base, dissolvenze comprese): ogni frase viene ritagliata dal mix
# secondo cues.json e trascritta con Whisper large-v3-turbo. Esce con errore se una frase non è completa.
# Uso: python verifica_finale.py CARTELLA_FRASI(con righe.json e cues.json) mix.wav
import json, subprocess, re, sys, difflib, os
from faster_whisper import WhisperModel
D, MIX = sys.argv[1], sys.argv[2]
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
C = json.load(open(f"{D}/cues.json"))["cues"]; R = {k: s for s, k in json.load(open(f"{D}/righe.json"))}
NUM = r"\b(un terzo|un|duemila\w*|centotrenta\w*|duecento|cento|venti|dieci|nove|otto|sette|sei|cinque|quattro|tre|due|uno)\b"   # numeri in lettere: Whisper li scrive in cifre
NUMRE = r"(?:zero|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici|tredici|quattordici|quindici|sedici|diciassette|diciotto|diciannove|vent|venti|trent|trenta|quarant|quaranta|cinquant|cinquanta|sessant|sessanta|settant|settanta|ottant|ottanta|novant|novanta|cento|mille|mila|milione|milioni|miliardo|miliardi_no|virgola|terzo)+"   # una parola fatta solo di pezzi di numero («duemilaventitre», «venticinque», «virgola»)
def norm(s):
    s = s.lower().replace("’", "'").replace("è", "e").replace("'", " ").replace("%", " per cento ").replace("g7", "gi sette").replace("€", " euro ")
    s = re.sub(NUM, " ", re.sub(r"\d[\d.,]*", " ", s))
    import unicodedata
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()   # tré → tre
    return [w for w in re.sub(r"[^a-z ]", " ", s).split() if not re.fullmatch(NUMRE, w)]
bad = 0; seg = f"{D}/_seg.wav"
for k, (a, b) in C.items():
    if k not in R: continue
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(max(0, a - 0.05)), "-to", str(b + 0.1), "-i", MIX, seg])
    W = [w for s in m.transcribe(seg, language="it", beam_size=5, word_timestamps=True)[0] for w in s.words]
    got = " ".join(w.word.strip() for w in W); sim = difflib.SequenceMatcher(None, norm(R[k]), norm(got)).ratio()
    ok = sim >= 0.95; bad += not ok
    print(f"{'OK ' if ok else 'NO!'} {k:9s} {a:6.2f}s sim {sim:.2f} pmin {min((w.probability for w in W), default=0):.2f} | {got}", flush=True)
os.remove(seg); print("VERIFICA FINALE:", "TUTTO OK" if not bad else f"{bad} FRASI DA RIFARE"); sys.exit(1 if bad else 0)

# Controllo finale sull'audio DEFINITIVO (voce + base, dissolvenze comprese): ogni frase viene ritagliata dal mix
# secondo cues.json e trascritta con Whisper large-v3-turbo. Esce con errore se una frase non è completa.
# Uso: python verifica_finale.py CARTELLA_FRASI(con righe.json e cues.json) mix.wav
import json, subprocess, re, sys, difflib, os
from faster_whisper import WhisperModel
D, MIX = sys.argv[1], sys.argv[2]
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
C = json.load(open(f"{D}/cues.json"))["cues"]; R = {k: s for s, k in json.load(open(f"{D}/righe.json"))}
NUM = r"\b(duemilaventicinque|duemiladuecento|centotrentasette|cinque|sei|sette|dieci|venti|duecento|due|tre|quattro|uno|un terzo)\b"
def norm(s):
    s = s.lower().replace("’", "'").replace("è", "e").replace("'", " ").replace("%", " per cento ")
    s = re.sub(NUM, " ", re.sub(r"\d[\d.,]*", " ", s)); return re.sub(r"[^a-zàéìòù ]", " ", s).split()
bad = 0; seg = f"{D}/_seg.wav"
for k, (a, b) in C.items():
    if k not in R: continue
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(max(0, a - 0.05)), "-to", str(b + 0.1), "-i", MIX, seg])
    W = [w for s in m.transcribe(seg, language="it", beam_size=5, word_timestamps=True)[0] for w in s.words]
    got = " ".join(w.word.strip() for w in W); sim = difflib.SequenceMatcher(None, norm(R[k]), norm(got)).ratio()
    ok = sim >= 0.95; bad += not ok
    print(f"{'OK ' if ok else 'NO!'} {k:9s} {a:6.2f}s sim {sim:.2f} pmin {min((w.probability for w in W), default=0):.2f} | {got}", flush=True)
os.remove(seg); print("VERIFICA FINALE:", "TUTTO OK" if not bad else f"{bad} FRASI DA RIFARE"); sys.exit(1 if bad else 0)

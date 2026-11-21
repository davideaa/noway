# Controllo di pronuncia: trascrive ogni frase con Whisper (italiano) e la confronta col copione.
import json, re, sys, difflib
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
R = json.load(open("righe.json"))
norm = lambda s: re.sub(r"[^a-zàèéìòù' ]", " ", s.lower().replace("’", "'")).split()
only = [int(v) for v in sys.argv[1:]] if len(sys.argv) > 1 else range(len(R))
for i in only:
    segs, _ = m.transcribe(f"r{i:02d}.wav", language="it", beam_size=5)
    got = " ".join(s.text.strip() for s in segs)
    a, b = norm(R[i][0]), norm(got); r = difflib.SequenceMatcher(None, a, b).ratio()
    print(f"{i:02d} {r:4.2f} {'OK ' if r >= 0.85 else 'RIF'} | atteso: {R[i][0]}\n          sentito: {got}", flush=True)

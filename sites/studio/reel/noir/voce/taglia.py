# Taglia ogni frase al primo silenzio DOPO l'ultima parola riconosciuta da Whisper: così un suono che il motore
# aggiunge dopo una pausa (un "ehm", un respiro, un pezzo di sillaba) non entra nel montaggio.
# Scrive le frasi tagliate in CARTELLA/pulite/ con lo stesso nome. Uso: python taglia.py CARTELLA [indici...]
import json, sys, os, wave, numpy as np
from faster_whisper import WhisperModel
D = sys.argv[1]; R = json.load(open(f"{D}/righe.json")); os.makedirs(f"{D}/pulite", exist_ok=True)
only = [int(v) for v in sys.argv[2:]] or range(len(R))
asr = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
for i in only:
    f = f"{D}/r{i:02d}.wav"; w = wave.open(f); sr = w.getframerate(); raw = w.readframes(w.getnframes())
    a = np.frombuffer(raw, '<i2').astype(np.float32) / 32768; ref = np.sqrt((a ** 2).mean()) + 1e-9
    W = [x for s in asr.transcribe(f, language="it", beam_size=5, word_timestamps=True)[0] for x in s.words]
    last = W[-1].end if W else len(a) / sr; win = int(0.10 * sr); cut = len(a)
    for k in range(int((last - 0.15) * sr), len(a) - win, int(0.01 * sr)):   # primo tratto di 100 ms sotto -38 dB (le consonanti come la "t" fanno pause più brevi)
        if k > 0 and 20 * np.log10(np.sqrt((a[k:k + win] ** 2).mean()) / ref + 1e-9) < -38: cut = k + win // 2; break
    with wave.open(f"{D}/pulite/r{i:02d}.wav", "wb") as o: o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(raw[:cut * 2])
    print(f"r{i:02d} ultima parola {last:.2f}s  taglio {cut / sr:.2f}s  di {len(a) / sr:.2f}s  ({len(a) / sr - cut / sr:.2f}s tolti)", flush=True)

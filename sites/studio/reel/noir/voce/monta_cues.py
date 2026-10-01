# Mette in fila le frasi facendo partire ognuna SU UN BATTITO della base (P = periodo in s),
# scrive narrazione.wav e cues.json {cues: {chiave: [inizio, fine]}, DUR}. Le chiavi vengono da righe.json.
# Uso: python3 monta_cues.py CARTELLA_FRASI PERIODO
import json, sys, math, numpy as np, wave
D = sys.argv[1]; P = float(sys.argv[2])
R = json.load(open(f"{D}/righe.json"))
SKIP = set(__import__("os").environ.get("SKIP", "").split(",")) - {""}   # chiavi da non mettere nell'audio
R = [(s, k, i) for i, (s, k) in enumerate(R) if k not in SKIP]
SUB = {"t1b", "grow2", "text", "gap2", "rails2"}          # frasi che continuano la stessa scena
def load(f):
    w = wave.open(f); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
    return (a.reshape(-1, w.getnchannels()).mean(1) if w.getnchannels() > 1 else a), sr
cues = {}; out = []; t = 0.0; sr0 = None
for i, (s, key, fi) in enumerate(R):
    a, sr = load(f"{D}/r{fi:02d}.wav"); sr0 = sr
    env = np.convolve(np.abs(a), np.ones(int(sr * 0.02)) / (sr * 0.02), mode='same')
    idx = np.where(env > 0.01)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
    gap = 0 if i == 0 else (0.20 if key in SUB else 0.45)
    st = 0.0 if i == 0 else math.ceil((t + gap) / P - 1e-6) * P
    if i == 0: st = float(__import__('os').environ.get('FIRST', P))   # primo attacco della voce (default: secondo battito)
    cues[key] = [round(st, 3), round(st + len(a) / sr, 3)]; out.append((st, a)); t = st + len(a) / sr
end = math.ceil((t + 0.5) / P) * P; cues["end"] = [round(end, 3), round(end + 6 * P, 3)]; DUR = round(end + 6 * P, 3)
N = int((DUR + 0.2) * sr0); mix = np.zeros(N, np.float32)
for st, a in out: k = int(st * sr0); mix[k:k + len(a)] += a[:N - k]
mix = mix / np.abs(mix).max() * 0.9
with wave.open(f"{D}/narrazione.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr0); w.writeframes((mix * 32767).astype('<i2').tobytes())
json.dump({"cues": cues, "DUR": DUR}, open(f"{D}/cues.json", "w"), indent=1)
print("DUR", DUR, "· frasi", len(R))

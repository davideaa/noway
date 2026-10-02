# Mette in fila le frasi generate, toglie i silenzi ai bordi, scrive narrazione.wav e warp.json
# warp.json = coppie [tempo_nuovo, tempo_vecchio_del_video] per riallineare le animazioni alla voce.
import json, numpy as np, wave, glob
R = json.load(open("righe.json"))
SCENE_OLD = [0, 4.8, 9.0, 12.6, 18.6, 25.2, 28.2, 34.2, 38.4, 43.8, 49.2, 54.0, 59.4, 63.6]
def load(f):
    w = wave.open(f); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
    if w.getnchannels() > 1: a = a.reshape(-1, w.getnchannels()).mean(1)
    return a, sr
out = []; t = 0.15; warp = [[0.0, 0.0]]; sr0 = None
for i, (s, old) in enumerate(R):
    a, sr = load(f"r{i:02d}.wav"); sr0 = sr
    env = np.convolve(np.abs(a), np.ones(int(sr * 0.02)) / (sr * 0.02), mode='same')
    idx = np.where(env > 0.01)[0]; a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
    if i: warp.append([round(t, 3), old])
    out.append((t, a)); t += len(a) / sr
    nxt = R[i + 1][1] if i + 1 < len(R) else 63.6
    t += 0.30 + (0.30 if any(abs(nxt - s0) < 1e-6 for s0 in SCENE_OLD) else 0.0)
end_voice = t
warp.append([round(t + 0.3, 3), 63.6]); warp.append([round(t + 0.3 + 3.6, 3), 67.2])
N = int((warp[-1][0] + 0.5) * sr0); mix = np.zeros(N, np.float32)
for st, a in out: i = int(st * sr0); mix[i:i + len(a)] += a[:N - i]
mix = mix / np.abs(mix).max() * 0.9
with wave.open("narrazione.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr0); w.writeframes((mix * 32767).astype('<i2').tobytes())
json.dump(warp, open("warp.json", "w"))
print("durata video nuova", warp[-1][0], "s · voce fino a", round(end_voice, 2))

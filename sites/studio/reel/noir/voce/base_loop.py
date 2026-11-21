# Base musicale: ripete il tratto [t0, t0 + nbattiti*P] della canzone fino a DUR, con dissolvenze incrociate corte.
# Uso: python3 base_loop.py canzone.wav t0 P nbattiti DUR uscita.wav
import sys, numpy as np, wave
src, t0, P, nb, DUR, dst = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5]), sys.argv[6]
w = wave.open(src); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32).reshape(-1, w.getnchannels()) / 32768
L = int(nb * P * sr); seg = a[int(t0 * sr): int(t0 * sr) + L]; N = int(DUR * sr); out = np.zeros((N, seg.shape[1]), np.float32); xf = int(0.03 * sr)
pos = 0
while pos < N:
    s = seg.copy(); n = min(len(s), N - pos)
    if pos: r = np.linspace(0, 1, xf)[:, None]; s[:xf] *= r; out[pos:pos + xf] *= (1 - r[:min(xf, N - pos)])
    out[pos:pos + n] += s[:n]; pos += L
f = int(1.2 * sr); out[-f:] *= np.linspace(1, 0, f)[:, None]
out = out / np.abs(out).max() * 0.9
with wave.open(dst, 'wb') as o: o.setnchannels(out.shape[1]); o.setsampwidth(2); o.setframerate(sr); o.writeframes((out * 32767).astype('<i2').tobytes())
print('ok', DUR)

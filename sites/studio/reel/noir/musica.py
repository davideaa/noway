# Base musicale originale (nessun diritto di terzi): 100 bpm, La minore, 18 s.
# Struttura legata alle scene di comp.html (battito B = 0,6 s):
#   0–3,0 pad + tick · 3,0–7,2 entra la cassa · 7,2 colpo + hats (grafico) · 10,2–11,4 salita
#   11,4–15,0 pausa (solo pad) · 15,0 colpo finale, coda.
# Uso: python3 musica.py musica.wav
import sys, numpy as np, wave
SR = 44100; B = 0.6; DUR = 18.6
N = int(SR * DUR); t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(3)
def put(sig, start, gl=1.0, gr=1.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N: return
    L[i:j] += sig[:j - i] * gl; R[i:j] += sig[:j - i] * gr
def env(n, a, d):  # attacco/decadimento esponenziale
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / (d * SR)); return e
nf = lambda m: 440 * 2 ** ((m - 69) / 12)

# pad: accordi Am F C G (4 battiti ciascuno), seghe morbide desintonizzate
chords = [[57, 60, 64], [53, 57, 60], [48, 55, 60, 64], [55, 59, 62]]
for k in range(8):
    st = k * 4 * B; ln = 4 * B + 0.6; n = int(ln * SR); tt = np.arange(n) / SR
    sig = np.zeros(n)
    for m in chords[k % 4]:
        for det in (-0.08, 0.08):
            f = nf(m) * 2 ** (det / 12)
            for h in range(1, 7): sig += np.sin(2 * np.pi * f * h * tt + h) / h ** 1.6
    e = np.minimum(1, tt / 0.5) * np.minimum(1, (ln - tt) / 0.6)
    gain = 0.020 if not (11.4 <= st < 15.0) else 0.028
    put(sig * e * gain, st, 0.9, 1.1)
# basso sub sulle fondamentali, dal battito 5
roots = [45, 41, 36, 43]
for b in range(5, 31):
    tb = b * B
    if 11.4 <= tb < 15.0: continue
    n = int(0.55 * SR); tt = np.arange(n) / SR; m = roots[(b // 4) % 4]
    put(np.sin(2 * np.pi * nf(m) * tt) * env(n, 0.005, 0.25) * 0.22, tb)
# cassa
def kick(st, g=0.9):
    n = int(0.45 * SR); tt = np.arange(n) / SR
    f = 48 + 110 * np.exp(-tt * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    put(np.sin(ph) * env(n, 0.001, 0.13) * g, st)
for b in range(5, 31):
    tb = b * B
    if 11.4 <= tb < 15.0 or tb > 15.0: continue
    kick(tb, 0.85 if b < 12 else 1.0)
kick(15.0, 1.1)
# hats in levare durante il grafico
for b in range(12, 19):
    for off in (0.5,):
        n = int(0.06 * SR); nz = rng.standard_normal(n); nz = np.diff(np.concatenate([[0], nz]))
        put(nz * env(n, 0.001, 0.015) * 0.10, b * B + off * B, 0.7, 1.0)
# tick del contatore (6 al battito) 3,6–6,0
for i in range(int((6.0 - 3.6) / (B / 4))):
    n = int(0.02 * SR); tt = np.arange(n) / SR
    put(np.sin(2 * np.pi * 2400 * tt) * env(n, 0.0005, 0.004) * 0.06, 3.6 + i * B / 4, 1.0, 0.8)
# colpi: 7,2 e 15,0 (rumore filtrato + sub)
def impact(st, g=0.5):
    n = int(1.2 * SR); tt = np.arange(n) / SR
    nz = rng.standard_normal(n); lp = np.convolve(nz, np.ones(40) / 40, mode='same')
    put((lp * env(n, 0.002, 0.25) * 0.8 + np.sin(2 * np.pi * 42 * tt) * env(n, 0.003, 0.5)) * g, st)
impact(7.2); impact(15.0, 0.45)
# salita 10,2 → 11,4
n = int(1.2 * SR); tt = np.arange(n) / SR; nz = rng.standard_normal(n)
put(nz * (tt / 1.2) ** 2 * 0.07 * np.sin(np.pi * np.minimum(1, tt / 1.2) / 1.0 + 0.0) ** 0, 10.2, 0.8, 1.0)
# riverbero semplice (risposta impulsiva rumore che decade 1,4 s)
ir_n = int(1.4 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / (0.35 * SR)); ir /= np.abs(ir).sum() / 6
def conv(a):
    m = len(a) + len(ir) - 1; F = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(a, F) * np.fft.rfft(ir, F), F)[:len(a)]
L = L + 0.18 * conv(L); R = R + 0.18 * conv(R)
fo = np.ones(N); i0 = int((DUR - 1.0) * SR); fo[i0:] = np.linspace(1, 0, N - i0)
L *= fo; R *= fo
pk = max(np.abs(L).max(), np.abs(R).max()); L = L / pk * 0.89; R = R / pk * 0.89
out = np.stack([L, R], 1); out = (out * 32767).astype('<i2')
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'musica.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', DUR, 's')

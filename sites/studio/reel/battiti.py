"""Trova la griglia dei battiti di una canzone: periodo, fase, drop e parti forti/deboli.
Uso: python battiti.py canzone.mp4|m4a|mp3 [inizio_s] [durata_s]
Stampa: bpm, griglia t(k) = fase + periodo*k, energia per battito (per vedere drop e pause).
Metodo: flusso spettrale delle basse (<150 Hz, la cassa) -> autocorrelazione per il periodo ->
ricerca fine di periodo e fase che massimizzano il flusso sui battiti previsti."""
import sys, subprocess, numpy as np
try:
    import imageio_ffmpeg; FF = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FF = 'ffmpeg'
src = sys.argv[1]; ss = sys.argv[2] if len(sys.argv) > 2 else '0'; tt = sys.argv[3] if len(sys.argv) > 3 else '600'
sr, hop, n = 22050, 256, 2048
raw = subprocess.run([FF, '-v', 'error', '-ss', ss, '-t', tt, '-i', src, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
fr = 1 + (len(x) - n) // hop; win = np.hanning(n)
S = np.abs(np.array([np.fft.rfft(x[i * hop:i * hop + n] * win) for i in range(fr)]))
L = np.log1p(100 * S); f = np.fft.rfftfreq(n, 1 / sr)
low = np.r_[0, np.maximum(0, np.diff(L[:, f < 150], axis=0)).sum(1)]
full = np.r_[0, np.maximum(0, np.diff(L, axis=0)).sum(1)]
on = low / low.max() + 0.5 * full / full.max(); t = np.arange(fr) * hop / sr
o = on - on.mean(); ac = np.correlate(o, o, 'full')[len(o) - 1:]; lag = np.arange(len(ac)) * hop / sr
sel = (lag > 0.33) & (lag < 1.0); P0 = lag[sel][np.argmax(ac[sel])]
def score(P, ph):
    k = np.arange(int((t[-1] - ph) / P)); idx = np.round((ph + k * P) / (hop / sr)).astype(int); idx = idx[idx < fr]
    return on[idx].mean()
best = (0, P0, 0)
for P in np.linspace(P0 * 0.985, P0 * 1.015, 121):
    for ph in np.arange(0, P, 0.004):
        sc = score(P, ph)
        if sc > best[0]: best = (sc, P, ph)
_, P, ph = best
print(f'durata {len(x)/sr:.2f}s  ·  {60/P:.2f} bpm  ·  periodo {P:.4f}s  ·  griglia t(k) = {ph + float(ss):.3f} + {P:.4f}·k')
rms = np.sqrt((S ** 2).mean(1)); K = int((t[-1] - ph) / P)
e = np.array([rms[(t >= ph + k * P) & (t < ph + (k + 1) * P)].mean() for k in range(K)])
print('energia ogni 4 battiti (k: tempo · barra). Drop = salto netto verso l\'alto, pausa = calo lungo')
for k in range(0, K - 3, 4):
    v = e[k:k + 4].mean(); print(f'{k:4d} {ph + float(ss) + k * P:7.3f}s ' + '#' * int(40 * v / e.max()))

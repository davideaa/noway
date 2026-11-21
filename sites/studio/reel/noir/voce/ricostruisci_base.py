# Ricostruisce run.wav («Run!», giro di 20 battiti da 0,6206 s) dai tratti SENZA voce dei reel già pubblicati.
# Serve solo se run.wav è perso e Davide non può rimandarlo. Uso (dalla radice del repository):
#   python3 sites/studio/reel/noir/voce/ricostruisci_base.py 12 13 14 15 16 17 18 19 20 21 22 23   → ~/reel-lavoro/run.wav
# Come funziona: ogni reel usa lo stesso giro ripetuto da t=0; nei tratti fuori dalle frasi (cues-pN.json) si sente
# solo la musica. Si sovrappongono quei tratti per fase (t mod giro), si media con un guadagno per tratto, si tolgono
# l'equalizzazione di mix_fisso.sh (+3 dB a 1,2 kHz, +5 dB a 2,8 kHz) e i 131,5 campioni di ritardo della catena di mix.
# 4/11/2026: 12 reel → copertura 100 %, ogni punto visto da ≥2 reel; i reel nuovi coincidono con i vecchi a >31 dB.
# NON mettere il risultato nel repository (musica).
import json, os, subprocess, sys, tempfile, wave, numpy as np
R = os.path.dirname(os.path.abspath(__file__)) + '/../../..'
SR = 44100; L = int(20 * 0.6206 * SR); RIT = 131.5
ns = [int(a) for a in sys.argv[1:]] or list(range(12, 24))
pub = {int(f.split('-p')[1][:-4]): f for f in os.listdir(f'{R}/social/pubblicati') if f.endswith('.mp4') and '-p' in f}
X = {}
for n in ns:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{R}/social/pubblicati/{pub[n]}', '-vn', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, 2); c = json.load(open(f'{R}/reel/noir/cues-p{n}.json'))
    v = sorted((a, b) for k, (a, b) in c['cues'].items() if k not in ('end', 'num')); S = []; t = 0.03
    for a, b in v:
        if a - 0.06 - t > 0.12: S.append((t, a - 0.06))
        t = b + 0.15
    S.append((t, c['DUR'] - 1.1)); X[n] = (x, [(int(a * SR), min(int(b * SR), len(x))) for a, b in S])
G = {n: [1.0] * len(X[n][1]) for n in ns}
for it in range(3):
    acc = np.zeros((L, 2)); cnt = np.zeros(L)
    for n in ns:
        x, S = X[n]
        for j, (a, b) in enumerate(S): ph = np.arange(a, b) % L; np.add.at(acc, ph, x[a:b] / G[n][j]); np.add.at(cnt, ph, 1)
    est = acc / np.maximum(cnt, 1)[:, None]
    for n in ns:
        x, S = X[n]; G[n] = [max(0.2, min(5, (x[a:b] * est[np.arange(a, b) % L]).sum() / ((est[np.arange(a, b) % L] ** 2).sum() + 1e-12))) for a, b in S]
print(f'copertura {(cnt > 0).mean() * 100:.1f} %, con ≥2 reel {(cnt >= 2).mean() * 100:.1f} %')
if (cnt == 0).any(): sys.exit('ERRORE: giro non coperto del tutto, aggiungere altri reel')
F = np.fft.rfft(est, axis=0); F *= np.exp(2j * np.pi * np.arange(F.shape[0]) * RIT / L)[:, None]; h = np.fft.irfft(F, n=L, axis=0)
out = np.vstack([np.zeros((int(0.260 * SR), 2)), h, h[:SR]]); out = out / np.abs(out).max() * 0.9
tmp = tempfile.mktemp(suffix='.wav')
with wave.open(tmp, 'wb') as o: o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((out * 32767).astype('<i2').tobytes())
dst = os.path.expanduser('~/reel-lavoro/run.wav'); os.makedirs(os.path.dirname(dst), exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'equalizer=f=1200:t=q:w=1.2:g=3,equalizer=f=2800:t=q:w=1.2:g=5', '-ar', str(SR), '-c:a', 'pcm_s16le', dst], check=True); os.remove(tmp)
print('scritto', dst)

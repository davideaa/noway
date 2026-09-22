#!/usr/bin/env python3
"""
Misura i battiti di un brano. Non serve sentirlo: basta guardare come si
muove l'energia nel tempo.

Come funziona, in breve:
  1. si decodifica l'audio in mono e si calcola l'energia ogni 256 campioni;
  2. si tiene solo dove l'energia SALE (e' li' che sta il colpo di percussione);
  3. l'autocorrelazione di quel segnale ha un picco al periodo del battito;
  4. si sceglie la fase che fa cadere i battiti dove i colpi sono piu' forti.

Il punto 3 da' spesso un armonico (il doppio o la meta' del tempo vero). Per
questo si confrontano esplicitamente meta', doppio e triplo, e si preferisce
il candidato che cade in 60-100 BPM: su un brano rallentato il tempo vero sta
li', e prendere l'armonico sbagliato vuol dire tagliare al doppio della
velocita' giusta.

    python3 video/battiti.py brano.mp3        # stampa BPM, offset, battiti
"""

import subprocess, sys
import numpy as np
import imageio_ffmpeg

SR = 22050
HOP = 256


def inviluppo(percorso):
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    raw = subprocess.run(
        [ff, "-v", "error", "-i", percorso, "-vn", "-ac", "1", "-ar", str(SR),
         "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
    n = len(x) // HOP
    e = np.sqrt((x[:n * HOP].reshape(n, HOP) ** 2).mean(1))
    d = np.diff(e, prepend=e[0])
    d[d < 0] = 0                                   # solo le salite
    if d.std() > 0:
        d = (d - d.mean()) / d.std()
    return d, len(x) / SR


def misura(percorso, bpm_min=50, bpm_max=190, preferisci=(60, 105)):
    d, durata = inviluppo(percorso)
    fps = SR / HOP
    z = d - d.mean()
    ac = np.correlate(z, z, "full")[len(z) - 1:]
    ac = ac / (ac[0] + 1e-12)
    lo, hi = int(fps * 60 / bpm_max), int(fps * 60 / bpm_min)

    # Un periodo vero ha un picco anche ai suoi multipli: sommandoli, il
    # battito vero batte le sue suddivisioni, che invece cadono a meta'.
    def pettine(k):
        s, w = 0.0, 0.0
        for m in (1, 2, 3, 4):
            if k * m < len(ac):
                s += ac[k * m] / m
                w += 1.0 / m
        return s / w

    punteggi = np.array([pettine(k) for k in range(lo, hi)])
    k = lo + int(np.argmax(punteggi))

    # Scendo di un'ottava finche' conviene: se il periodo doppio (meta' BPM)
    # tiene almeno l'80% del punteggio, e' lui il battito, non la suddivisione.
    for _ in range(2):
        k2 = k * 2
        if k2 >= hi or 60 * fps / k2 < bpm_min:
            break
        if pettine(k2) >= 0.80 * pettine(k) or preferisci[0] <= 60 * fps / k2 <= preferisci[1]:
            k = k2
        else:
            break
    bpm = 60 * fps / k

    # la fase: provo tutti gli scostamenti dentro un periodo e tengo quello
    # che somma piu' energia sui battiti
    idx = np.arange(0, len(d) - k, k)
    best, off_c = -1e9, 0
    for o in range(k):
        s = d[np.clip(idx + o, 0, len(d) - 1)].sum()
        if s > best:
            best, off_c = s, o
    offset = off_c / fps
    battiti = np.arange(offset, durata, 60.0 / bpm)
    return bpm, offset, battiti


if __name__ == "__main__":
    bpm, off, bt = misura(sys.argv[1])
    print(f"{bpm:.2f} BPM · primo battito {off:.3f}s · {len(bt)} battiti")
    print("battuta (4 battiti) =", f"{4 * 60 / bpm:.3f}s")
    print("primi otto:", np.round(bt[:8], 3).tolist())

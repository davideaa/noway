# Il sistema grafico, ricavato misurando i fotogrammi del reel di riferimento.
#
# I colori sono campionati dai pixel, non scelti a occhio: fondo #0d0e15 al
# centro che scende a #07080d ai bordi, riquadri #1f283b con bordo #384560.
# Le misure sono in tela 1080x1920 (l'esempio era 720x1280 registrato da
# schermo, quindi tutto x1,5).
#
# L'area utile finisce a 1330: sotto ci va l'interfaccia di Instagram, e
# qualunque cosa scritta li' viene coperta dalla didascalia.

from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

W, H = 1080, 1920
SAFE_T, SAFE_B = 220, 1330
MARG = 72

# --- colori ---------------------------------------------------------------
BG_C     = (13, 14, 21)      # centro
BG_E     = (7, 8, 13)        # bordi
INK      = (255, 255, 255)
INK_2    = (154, 160, 171)
INK_3    = (98, 105, 118)
INK_4    = (58, 63, 74)
ACC      = (77, 134, 224)    # blu
ACC_DIM  = (56, 69, 96)      # bordo riquadri
BOX      = (31, 40, 59)
OK       = (49, 177, 131)
NEG      = (224, 113, 79)
WARN     = (223, 160, 43)
ORO      = (237, 161, 0)

FDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
_cache = {}


def font(nome, px, assi=None):
    """assi = (peso, larghezza) per Archivo, che e' un font variabile.
    Il titolo dell'esempio e' leggermente stretto: peso 800, larghezza 94."""
    k = (nome, px, assi)
    if k not in _cache:
        f = ImageFont.truetype(os.path.join(FDIR, nome + ".ttf"), px)
        if assi:
            f.set_variation_by_axes(list(assi))
        _cache[k] = f
    return _cache[k]


def bold(px):  return font("Archivo", px, (800, 94))
def med(px):   return font("Archivo", px, (500, 100))
def mono(px):  return font("IBMPlexMono-Medium", px)
def monob(px): return font("IBMPlexMono-SemiBold", px)


# --- fondo ----------------------------------------------------------------
_bg = None

def fondo():
    """Gradiente radiale + vignettatura. Calcolato una volta sola."""
    global _bg
    if _bg is None:
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        # il chiarore non e' centrato: nell'esempio sta in alto, verso 0,42 H
        d = np.sqrt(((x - W * 0.5) / (W * 0.95)) ** 2 +
                    ((y - H * 0.42) / (H * 0.62)) ** 2)
        k = np.clip(1.0 - d, 0.0, 1.0) ** 1.6
        a = np.array(BG_E, np.float32)
        b = np.array(BG_C, np.float32)
        img = a[None, None, :] + (b - a)[None, None, :] * k[:, :, None]
        _bg = Image.fromarray(img.astype(np.uint8), "RGB")
    return _bg.copy()


# --- testo ----------------------------------------------------------------
def larghezza(d, s, f, track=0):
    if not track:
        return d.textlength(s, font=f)
    return sum(d.textlength(c, font=f) for c in s) + track * max(len(s) - 1, 0)


def testo(d, xy, s, f, fill, anchor="la", track=0, alpha=1.0):
    """anchor: 'l|m|r' orizzontale + 'a|m|s' verticale, come PIL.
    track = spaziatura extra fra le lettere, in pixel."""
    if alpha <= 0.003:
        return
    if alpha < 1.0:
        fill = tuple(int(round(c * alpha + b * (1 - alpha)))
                     for c, b in zip(fill, BG_C))
    x, y = xy
    if not track:
        d.text((x, y), s, font=f, fill=fill, anchor=anchor)
        return
    lw = larghezza(d, s, f, track)
    if anchor[0] == "m":
        x -= lw / 2
    elif anchor[0] == "r":
        x -= lw
    va = "a" if anchor[1] == "a" else anchor[1]
    for c in s:
        d.text((x, y), c, font=f, fill=fill, anchor="l" + va)
        x += d.textlength(c, font=f) + track


def righe(d, s, f, maxw, track=0):
    """Manda a capo su maxw. Rispetta gli a-capo espliciti."""
    out = []
    for para in s.split("\n"):
        cur = ""
        for p in para.split(" "):
            t = (cur + " " + p).strip()
            if larghezza(d, t, f, track) <= maxw or not cur:
                cur = t
            else:
                out.append(cur)
                cur = p
        out.append(cur)
    return out


def blocco(d, xy, s, f, fill, maxw, lh, anchor="ma", track=0, alpha=1.0):
    x, y = xy
    for r in righe(d, s, f, maxw, track):
        testo(d, (x, y), r, f, fill, anchor, track, alpha)
        y += lh
    return y


# --- primitive ------------------------------------------------------------
def riquadro(d, box, fill=BOX, bordo=ACC_DIM, r=6, w=1, alpha=1.0):
    def mix(c):
        return tuple(int(round(a * alpha + b * (1 - alpha)))
                     for a, b in zip(c, BG_C))
    d.rounded_rectangle(box, radius=r, fill=mix(fill) if fill else None,
                        outline=mix(bordo) if bordo else None, width=w)


def linea_h(d, x0, x1, y, col=INK_4, w=1, alpha=1.0):
    col = tuple(int(round(c * alpha + b * (1 - alpha))) for c, b in zip(col, BG_C))
    d.line([(x0, y), (x1, y)], fill=col, width=w)


def tratteggio(d, p0, p1, col=INK_3, dash=7, gap=6, w=1, alpha=1.0):
    col = tuple(int(round(c * alpha + b * (1 - alpha))) for c, b in zip(col, BG_C))
    (x0, y0), (x1, y1) = p0, p1
    L = max(((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5, 1e-6)
    ux, uy = (x1 - x0) / L, (y1 - y0) / L
    t = 0.0
    while t < L:
        e = min(t + dash, L)
        d.line([(x0 + ux * t, y0 + uy * t), (x0 + ux * e, y0 + uy * e)],
               fill=col, width=w)
        t = e + gap


def glifo_ig(d, x, y, s=34, col=INK, alpha=1.0):
    col = tuple(int(round(c * alpha + b * (1 - alpha))) for c, b in zip(col, BG_C))
    d.rounded_rectangle([x, y, x + s, y + s], radius=s * 0.29, outline=col, width=3)
    r = s * 0.22
    c = (x + s / 2, y + s / 2)
    d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], outline=col, width=3)
    p = s * 0.20
    d.ellipse([x + s - p - 3, y + p - 1, x + s - p + 1, y + p + 3], fill=col)


# --- curve di animazione --------------------------------------------------
def out_cubic(t):   return 1 - (1 - min(max(t, 0), 1)) ** 3
def out_quint(t):   return 1 - (1 - min(max(t, 0), 1)) ** 5
def lineare(t):     return min(max(t, 0), 1)
def in_out(t):
    t = min(max(t, 0), 1)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def entra(t, ritardo=0.0, durata=0.30):
    """Ritorna (alpha, scostamento_y) per un elemento che entra."""
    p = out_quint((t - ritardo) / durata) if durata > 0 else 1.0
    p = min(max(p, 0.0), 1.0)
    return p, (1 - p) * 26


def num(v0, v1, t, ritardo=0.0, durata=0.55):
    p = out_quint((t - ritardo) / durata)
    return v0 + (v1 - v0) * min(max(p, 0.0), 1.0)


# --- primitive per le animazioni di meccanismo -----------------------------
def lucchetto(d, x, y, s=30, col=WARN, chiuso=1.0, alpha=1.0):
    """Il lucchetto che si chiude: chiuso va da 0 (aperto) a 1 (chiuso)."""
    col = tuple(int(round(c * alpha + b * (1 - alpha))) for c, b in zip(col, BG_C))
    w, h = s * 0.78, s * 0.58
    by = y + s - h
    d.rounded_rectangle([x, by, x + w, by + h], radius=s * 0.11, outline=col, width=2)
    d.ellipse([x + w / 2 - s * 0.07, by + h * 0.34,
               x + w / 2 + s * 0.07, by + h * 0.62], fill=col)
    # l'archetto: aperto sta storto e alzato, chiuso e' centrato
    sp = (1 - chiuso) * w * 0.34
    cx = x + w / 2 + sp
    r = w * 0.30
    d.arc([cx - r, by - r * 1.5 - sp * 0.4, cx + r, by + r * 0.5 - sp * 0.4],
          180, 360, fill=col, width=2)
    d.line([(cx - r, by - r * 0.5 - sp * 0.4), (cx - r, by)], fill=col, width=2)
    d.line([(cx + r, by - r * 0.5 - sp * 0.4), (cx + r, by - sp * 0.8)],
           fill=col, width=2)


def cursore(d, x0, x1, y, pos, col=ACC, etichetta=None, bloccato=0.0, alpha=1.0):
    """Il cursore di un parametro. pos va da 0 a 1."""
    linea_h(d, x0, x1, y, INK_4, 2, alpha)
    cx = x0 + pos * (x1 - x0)
    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
    d.line([(x0, y), (cx, y)], fill=c, width=3)
    d.rounded_rectangle([cx - 7, y - 15, cx + 7, y + 15], radius=3, fill=c)
    if etichetta:
        testo(d, (x0 - 26, y + 8), etichetta, mono(20), INK_3, "ra", alpha=alpha)
    if bloccato > 0.02:
        lucchetto(d, x1 + 22, y - 16, 30, WARN, bloccato, alpha)


def barra_tempo(d, box, taglio, chiuso=0.0, alpha=1.0, n=44):
    """La barra del tempo divisa in due: a sinistra dove si studia, a destra
    la parte chiusa a chiave. taglio e' la frazione a sinistra."""
    x0, y0, x1, y1 = box
    w = (x1 - x0) / n
    for i in range(n):
        dentro = (i + 0.5) / n < taglio
        cx = x0 + i * w
        if dentro:
            c = tuple(int(round(k * alpha + b * (1 - alpha)))
                      for k, b in zip(ACC, BG_C))
            d.rectangle([cx + 1, y0, cx + w - 1, y1], fill=c)
        else:
            f = 1 - chiuso * 0.55
            c = tuple(int(round(k * f * alpha + b * (1 - alpha * f)))
                      for k, b in zip(INK_4, BG_C))
            d.rectangle([cx + 1, y0 + 2, cx + w - 1, y1 - 2], outline=c, width=1)
    xt = x0 + taglio * (x1 - x0)
    if chiuso > 0.02:
        d.rectangle([xt, y0 - 6, x1, y1 + 6],
                    outline=tuple(int(round(k * chiuso * alpha + b * (1 - alpha * chiuso)))
                                  for k, b in zip(WARN, BG_C)), width=2)
    d.line([(xt, y0 - 14), (xt, y1 + 14)], fill=INK_3, width=2)
    return xt

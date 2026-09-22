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

# --- colori, campionati dai pixel degli otto riferimenti -------------------
# Il loro fondo e' piu' scuro, piu' blu e piu' piatto del mio di prima
# (#0d0e15 con un chiarore forte): stanno fra #050911 e #0b0c11.
BG_C     = (11, 12, 17)      # centro
BG_E     = (5, 6, 11)        # bordi
INK      = (255, 255, 255)
INK_2    = (150, 157, 170)
INK_3    = (94, 101, 114)
INK_4    = (52, 57, 68)
INK_5    = (30, 33, 41)      # righe di griglia
# L'accento segue lo strumento: oro per l'oro, ciano per il nasdaq,
# verde per l'insieme. E' la regola che usano loro, reel per reel.
ORO      = (172, 147, 91)    # #ac935b  — dal reel su XAUUSD
ORO_CHI  = (191, 162, 114)   # #bfa272  — la sua variante chiara
ACC      = (90, 193, 223)    # #5ac1df  — il ciano dei reel sul nasdaq
ACC_DIM  = (86, 112, 176)    # #5670b0  — il blu piu' spento
BOX      = (22, 27, 38)
OK       = (69, 178, 129)    # #45b281  — verde smorzato, non acceso
NEG      = (187, 89, 82)     # #bb5952  — mattone, non arancione
WARN     = (198, 166, 117)

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
        d = np.sqrt(((x - W * 0.5) / (W * 1.05)) ** 2 +
                    ((y - H * 0.40) / (H * 0.70)) ** 2)
        k = np.clip(1.0 - d, 0.0, 1.0) ** 2.4
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
                      for k, b in zip(ACC_DIM, BG_C))
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


# ==========================================================================
#  il logo, e le primitive per i grafici piu' grossi
# ==========================================================================
_logo = {}

def _carica_logo():
    if not _logo:
        for k, f in (("base", "logo.png"), ("glow", "logo_glow.png")):
            p = os.path.join(os.path.dirname(FDIR), f)
            _logo[k] = Image.open(p).convert("RGB")
    return _logo


def logo(img, cx, cy, altezza, alpha=1.0, bagliore=0.0, sweep=None):
    """Compone il logo in somma sul fotogramma. Il logo e' su fondo nero,
    quindi sommandolo il nero sparisce da solo e non si vede nessun riquadro.

    bagliore: quanto della versione sfocata aggiungere sopra.
    sweep: 0..1, la posizione di una lama di luce che attraversa il logo.
    """
    if alpha <= 0.004:
        return img
    L = _carica_logo()
    w = int(L["base"].width * altezza / L["base"].height)
    if w < 2 or altezza < 2:
        return img
    base = np.asarray(L["base"].resize((w, int(altezza)), Image.LANCZOS), np.float32)
    add = base * alpha
    if bagliore > 0.004:
        g = np.asarray(L["glow"].resize((w, int(altezza)), Image.LANCZOS), np.float32)
        add = add + g * bagliore * alpha
    if sweep is not None:
        # la lama segue la luminosita' del logo: illumina il metallo, non il vuoto
        xs = np.linspace(0, 1, w)[None, :]
        ys = np.linspace(0, 1, int(altezza))[:, None]
        dd = np.abs((xs * 0.75 + ys * 0.25) - sweep)
        lama = np.exp(-(dd / 0.085) ** 2)[:, :, None]
        add = add + base * lama * 1.5 * alpha

    x0, y0 = int(cx - w / 2), int(cy - altezza / 2)
    arr = np.asarray(img, np.float32)
    X0, Y0 = max(x0, 0), max(y0, 0)
    X1, Y1 = min(x0 + w, W), min(y0 + int(altezza), H)
    if X1 <= X0 or Y1 <= Y0:
        return img
    sub = add[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
    arr[Y0:Y1, X0:X1] = np.clip(arr[Y0:Y1, X0:X1] + sub, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGB")


def barre(d, box, valori, colori, etichette=None, prog=1.0, lo=None, hi=None,
          alpha=1.0, formato="%+.0f", larghezza=0.62, font_val=None):
    """Barre verticali che crescono. prog<1 le fa salire."""
    x0, y0, x1, y1 = box
    lo = min(min(valori), 0) * 1.12 if lo is None else lo
    hi = max(valori) * 1.16 if hi is None else hi
    bw = (x1 - x0) / len(valori)
    Y = lambda v: y1 - (v - lo) / (hi - lo) * (y1 - y0)
    linea_h(d, x0, x1, Y(0), INK_4, 2, alpha)
    fv = font_val or monob(22)
    for i, v in enumerate(valori):
        vv = v * min(max(prog * 1.0, 0.0), 1.0)
        cx = x0 + i * bw + bw / 2
        col = colori[i] if isinstance(colori, (list, tuple)) else colori
        c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
        yt, yb = min(Y(vv), Y(0)), max(Y(vv), Y(0))
        d.rounded_rectangle([cx - bw * larghezza / 2, yt, cx + bw * larghezza / 2, yb],
                            radius=4, fill=c)
        # l'etichetta va SOPRA la barra, non dentro: l'ancora "ma" mette la y
        # in cima al testo, quindi serve l'altezza del carattere di margine
        testo(d, (cx, (yt - 34) if v >= 0 else (yb + 12)), formato % vv, fv,
              INK_2 if v >= 0 else NEG, "ma", alpha=alpha)
        if etichette:
            testo(d, (cx, y1 + 30), etichette[i], mono(19), INK_3, "ma", alpha=alpha)
    return Y


def area_neg(d, v, box, lo, col=NEG, prog=1.0, alpha=1.0):
    """Il profilo sott'acqua: area riempita che scende da zero."""
    x0, y0, x1, y1 = box
    n = max(int(len(v) * min(max(prog, 0.0), 1.0)), 2)
    Y = lambda t: y0 + (0 - t) / (0 - lo) * (y1 - y0)
    px = [(x0 + i / (len(v) - 1) * (x1 - x0), Y(v[i])) for i in range(n)]
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(ov).polygon(px + [(px[-1][0], y0), (x0, y0)],
                               fill=(col[0], col[1], col[2], int(60 * alpha)))
    d._image.paste(Image.alpha_composite(d._image.convert("RGBA"), ov).convert("RGB"),
                   (0, 0))
    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
    d.line(px, fill=c, width=2, joint="curve")
    linea_h(d, x0, x1, y0, INK_4, 2, alpha)
    return Y


# ==========================================================================
#  Gli elementi ricorrenti nei riferimenti. Vedi video/RIFERIMENTI.md per
#  le misure da cui sono ricavati.
# ==========================================================================
def staffa(d, xy, etichetta, col=INK_2, px=20, verso="d", alpha=1.0,
           altezza=26, valore=None):
    """L'etichetta a staffa: una barra verticale e il testo mono attaccato.
    E' la firma grafica piu' riconoscibile dei riferimenti — la usano per
    appendere una parola a un punto preciso del grafico.

    verso: "d" il testo va a destra della barra, "s" a sinistra.
    """
    if alpha <= 0.004:
        return
    x, y = xy
    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
    d.line([(x, y - altezza / 2), (x, y + altezza / 2)], fill=c, width=2)
    f = mono(px)
    dx = 9 if verso == "d" else -9
    testo(d, (x + dx, y), etichetta, f, col, ("l" if verso == "d" else "r") + "m",
          track=2, alpha=alpha)
    if valore is not None:
        w = larghezza(d, etichetta, f, 2) + 16
        testo(d, (x + dx + (w if verso == "d" else -w), y), valore, monob(px),
              INK, ("l" if verso == "d" else "r") + "m", alpha=alpha)


def specifiche(d, box, campi, alpha=1.0, prog=1.0):
    """La striscia di specifiche da terminale: una riga di campi etichettati.
    campi = [(etichetta, valore, colore_valore), ...]"""
    x0, y0, x1, _ = box
    n = len(campi)
    w = (x1 - x0) / n
    quanti = max(int(round(n * min(max(prog, 0), 1))), 0)
    for i, (et, val, col) in enumerate(campi):
        if i >= quanti:
            continue
        a = alpha
        cx = x0 + i * w
        testo(d, (cx, y0), et, mono(17), INK_3, "la", track=3, alpha=a)
        testo(d, (cx, y0 + 26), val, monob(23), col or INK, "la", track=1, alpha=a)
        if i:
            d.line([(cx - 20, y0 - 2), (cx - 20, y0 + 44)],
                   fill=tuple(int(round(k * a + b * (1 - a)))
                              for k, b in zip(INK_5, BG_C)), width=1)


def pallini(d, box, voci, acceso=0.0, alpha=1.0):
    """La sequenza a passi: pallini collegati che si accendono in fila."""
    x0, y, x1, _ = box
    n = len(voci)
    passo = (x1 - x0) / max(n - 1, 1)
    linea_h(d, x0, x1, y, INK_5, 2, alpha)
    for i, v in enumerate(voci):
        cx = x0 + i * passo
        on = acceso >= i / max(n - 1, 1) - 1e-6
        col = ACC if on else INK_4
        c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
        if on and i:
            d.line([(x0 + (i - 1) * passo, y), (cx, y)], fill=c, width=3)
        r = 9 if on else 6
        d.ellipse([cx - r, y - r, cx + r, y + r], fill=c if on else None,
                  outline=c, width=2)
        testo(d, (cx, y + 30), v, mono(18), INK_2 if on else INK_4, "ma",
              track=2, alpha=alpha)


def pillole(d, box, voci, prog=1.0, alpha=1.0, col=ACC):
    """La catena a pillole con le frecce: 09:30 CANDLE -> 12 EMA -> LONG."""
    x0, y, x1, _ = box
    n = len(voci)
    f = mono(19)
    larg = [larghezza(d, v, f, 2) + 34 for v in voci]
    frec = 34
    tot = sum(larg) + frec * (n - 1)
    x = x0 + ((x1 - x0) - tot) / 2
    for i, v in enumerate(voci):
        a = alpha * min(max((prog * n) - i, 0), 1)
        if a > 0.01:
            riquadro(d, [x, y - 22, x + larg[i], y + 22], BOX, INK_4, 4, 1, a)
            testo(d, (x + larg[i] / 2, y), v, f, col if i == n - 1 else INK_2,
                  "mm", track=2, alpha=a)
        x += larg[i]
        if i < n - 1:
            a2 = alpha * min(max((prog * n) - i - 0.5, 0), 1)
            testo(d, (x + frec / 2, y), "→", mono(21), INK_3, "mm", alpha=a2)
            x += frec


def barre_orizz(d, box, righe_, prog=1.0, alpha=1.0, alt=10):
    """Le barre di avanzamento con il valore allineato a destra.
    righe_ = [(etichetta, frazione 0..1, testo_valore, colore), ...]"""
    x0, y0, x1, _ = box
    for i, (et, fr, val, col) in enumerate(righe_):
        y = y0 + i * 46
        a = alpha * min(max(prog * len(righe_) - i, 0), 1)
        if a <= 0.01:
            continue
        testo(d, (x0, y), et, mono(18), INK_3, "lm", track=3, alpha=a)
        bx0, bx1 = x0 + 200, x1 - 130
        d.rounded_rectangle([bx0, y - alt / 2, bx1, y + alt / 2], radius=alt / 2,
                            fill=tuple(int(round(k * a + b * (1 - a)))
                                       for k, b in zip(INK_5, BG_C)))
        w = (bx1 - bx0) * min(max(fr, 0), 1) * min(max(prog * len(righe_) - i, 0), 1)
        if w > 1:
            d.rounded_rectangle([bx0, y - alt / 2, bx0 + w, y + alt / 2],
                                radius=alt / 2,
                                fill=tuple(int(round(k * a + b * (1 - a)))
                                           for k, b in zip(col, BG_C)))
        testo(d, (x1, y), val, monob(21), INK, "rm", alpha=a)


def sbarrato(d, xy, s, f, col=NEG, anchor="ma", alpha=1.0, quanto=1.0):
    """Il testo sbarrato delle negazioni. quanto = quanta riga e' tirata."""
    testo(d, xy, s, f, col, anchor, alpha=alpha)
    if quanto <= 0.01:
        return
    w = larghezza(d, s, f)
    x, y = xy
    if anchor[0] == "m":
        x -= w / 2
    elif anchor[0] == "r":
        x -= w
    yy = y + f.size * 0.34
    c = tuple(int(round(k * alpha + b * (1 - alpha))) for k, b in zip(col, BG_C))
    d.line([(x, yy), (x + w * min(quanto, 1), yy)], fill=c, width=3)


def frase(d, xy, parti, px=27, anchor="ma", alpha=1.0):
    """La didascalia con la parola chiave accesa, come nei riferimenti:
    parti = [("testo ", None), ("chiave", ACC), (" resto", None)].
    Il colore None vuol dire grigio normale; un colore rende la parola
    anche piu' marcata."""
    f_n, f_b = med(px), font("Archivo", px, (700, 100))
    larg = sum(d.textlength(t, font=(f_b if c else f_n)) for t, c in parti)
    x, y = xy
    if anchor[0] == "m":
        x -= larg / 2
    elif anchor[0] == "r":
        x -= larg
    for t, c in parti:
        f = f_b if c else f_n
        col = c or INK_2
        if alpha < 1.0:
            col = tuple(int(round(k * alpha + b * (1 - alpha)))
                        for k, b in zip(col, BG_C))
        d.text((x, y), t, font=f, fill=col, anchor="l" + anchor[1])
        x += d.textlength(t, font=f)

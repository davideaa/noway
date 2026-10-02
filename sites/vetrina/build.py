#!/usr/bin/env python3
"""Vetrina di Davide: UNA pagina HTML che funziona anche senza internet (font, foto, librerie: tutto dentro).

Prima di costruire:
  - il sito "dopo" di ogni lavoro deve essere costruito (es. sites/cosmo-hotel-palace: python3 build.py);
  - le foto del sito "prima" si fanno con scripts/cattura.cjs (finiscono in cattura/, fuori dal repo).

  python3 build.py              -> out/vetrina-davide.html   (il file da mandare)
  python3 build.py --artifact   -> out/artifact/index.html   (la stessa pagina, senza doctype, per l'anteprima su Claude)

CHI POSSIEDE COSA (vedi BRIEF.md):
  - pagina vetrina: src/pagina.html, src/vetrina.css, src/vetrina.js, vendor/*.js
  - confronto prima/dopo: src/confronto.html, src/confronto.css, src/confronto.js + le funzioni sito_dopo() e dati_progetto() qui sotto
  - il resto di questo file: coordinatore
"""
import base64, html, io, json, os, re, subprocess, sys
from PIL import Image

QUI = os.path.dirname(os.path.abspath(__file__))
SITI = os.path.dirname(QUI)
OUT = os.path.join(QUI, "out")
ARTIFACT = "--artifact" in sys.argv
e = html.escape

# Indirizzo provvisorio: Davide sceglierà il nome dello studio e creerà la mail di lavoro.
EMAIL = "ciao@davidestudio.it"

PAGINE_COSMO = [  # (nome, percorso: uguale sul sito originale e sul nuovo)
    ("Home", ""), ("Camere & Suites", "camere-suites/"), ("Classic Double Room", "camere-suites/camere/classic-room/"),
    ("Family Room", "camere-suites/camere/family-room/"), ("Suite", "camere-suites/suite/"), ("Meeting ed eventi", "meeting-ed-eventi/"),
    ("Ristoranti", "ristoranti/"), ("Foto e video", "foto-video/"), ("Fitness & Wellness", "fitness-wellness/"),
    ("Contatti e Location", "contatti-location/"), ("Hotel Partners", "hotel-partners/"),
]

PROGETTI = [
    dict(id="cosmo", categoria="Hotel", nome="Cosmo Hotel Palace", luogo="Cinisello Balsamo, Milano",
         dominio="cosmohotelpalace.it", sito_dopo="cosmo-hotel-palace/out", cattura="cattura/cosmo", cattura_dopo="cattura/cosmo-dopo",
         cambi=["Stesse pagine, stessi testi, stesse foto", "Foto a tutta pagina", "Prenotazione sempre a portata",
                "Tabella delle sale leggibile", "Galleria a schermo intero", "Menu chiaro da telefono"],
         pagine=PAGINE_COSMO),
    dict(id="locale", categoria="Locale per aperitivi", nome="In arrivo"),
    dict(id="terzo", categoria="Prossimo lavoro", nome="In arrivo"),
]


def slug(path):
    return path.strip("/").replace("/", "_") or "home"


# ------------------------------------------------------------------ immagini
def webp_bytes(im, q=60):
    b = io.BytesIO(); im.save(b, "WEBP", quality=q, method=6); return b.getvalue()


def webp_uri(im, q=60):
    return "data:image/webp;base64," + base64.b64encode(webp_bytes(im, q)).decode()


def file_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def pezzi(png, larghezza, alto_max=6000, q=55):
    """Fotografia a pagina intera ridotta e tagliata a fette (WebP non va oltre 16383 px)."""
    im = Image.open(png).convert("RGB")
    im = im.resize((larghezza, round(im.height * larghezza / im.width)), Image.LANCZOS)
    return [webp_uri(im.crop((0, y, larghezza, min(im.height, y + alto_max))), q) for y in range(0, im.height, alto_max)]


def anteprima(png, lato=760):
    im = Image.open(png).convert("RGB")
    im = im.crop((0, 0, im.width, round(im.width * 10 / 16)))
    im.thumbnail((lato, lato), Image.LANCZOS)
    return webp_uri(im, 66)


# ------------------------------------------------------------------ font (dentro la pagina, per l'uso offline)
def font_css(famiglie):
    css = open(os.path.join(QUI, "font", "fonts.css")).read()
    out = []
    for subset, b in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S):
        fam = re.search(r"font-family: '([^']+)'", b).group(1)
        if subset != "latin" or fam not in famiglie:
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", b).group(1)
        f = os.path.join(QUI, "font", os.path.basename(url))
        if not os.path.exists(f):
            subprocess.run(["curl", "-sS", "-L", "-m", "60", "-o", f, url], check=True)
        out.append(b.replace(url, file_uri(f, "font/woff2")))
    return "\n".join(out)


# ================================================================== CONFRONTO (proprietario: agente confronto)
# Il visore (src/confronto.js) riceve per ogni lavoro pronto:
#   pagine[i] = {nome, path, html, prima: {pc, tel}, dopo: {pc, tel}}
#     html  = la pagina del sito nuovo con segnaposto: @@CF:TESTA@@ (stile + ponte), @@CF:CODA@@ (script del sito),
#             @@I:chiave@@ per ogni foto (diventa un blob: URL creato UNA volta nel browser)
#     prima = fotografia del sito originale a fette: {w, h, fette: [[data URI WebP, altezza], ...]}
#     dopo  = fotografia del sito NUOVO a fette (per gli "affiancati": due layout da computer senza rimpicciolire iframe)
#   sito = {css, js, font_css (con @@F:n@@), font: [data URI woff2], img: {chiave: data URI}}
# Ogni foto compare una sola volta nel file (anche se usata da più pagine o duplicata con un altro nome).
# Pesi scelti per stare sotto i 15 MB (anteprima su Claude: 16 MB): le colonne affiancate sono larghe metà schermo.
PRIMA_PC = dict(larghezza=1200, q=44, fetta=2400)    # foto "prima" da computer
DOPO_PC = dict(larghezza=1200, q=44, fetta=2400)     # foto "dopo" da computer (cattura/<lavoro>-dopo, fatte dal sito nuovo)
PRIMA_TEL = dict(larghezza=600, q=45, fetta=3200)    # foto "prima" da telefono (Solo prima e telefono di sinistra)
DOPO_TEL = dict(larghezza=360, q=45, fetta=3200)     # foto "dopo" da telefono: solo per i due telefoni affiancati su schermo stretto
FOTO_SITO_Q = 72                                     # le foto del sito vivo (960 px) ricompresse, se così pesano meno


def fette(png, larghezza, q, fetta):
    """Fotografia a pagina intera in fette WebP (il WebP non supera 16383 px e le fette si decodificano una per volta)."""
    im = Image.open(png).convert("RGB")
    if im.width != larghezza:
        im = im.resize((larghezza, round(im.height * larghezza / im.width)), Image.LANCZOS)
    n = -(-im.height // fetta)
    alto = -(-im.height // n)                       # fette uguali, niente coda di pochi pixel
    out = []
    for y in range(0, im.height, alto):
        pezzo = im.crop((0, y, larghezza, min(im.height, y + alto)))
        out.append([webp_uri(pezzo, q), pezzo.height])
    return {"w": larghezza, "h": im.height, "fette": out}


def sito_dopo(p, font_dopo):
    """Le pagine del sito nuovo come modelli leggeri + le risorse comuni, ognuna una volta sola."""
    import hashlib
    radice = os.path.join(SITI, p["sito_dopo"])
    css = open(os.path.join(radice, "assets", "site.css"), encoding="utf-8").read()
    js = open(os.path.join(radice, "assets", "site.js"), encoding="utf-8").read()
    pagine, usate = [], set()
    for nome, path in p["pagine"]:
        h = open(os.path.join(radice, path, "index.html"), encoding="utf-8").read()
        h = re.sub(r'<link rel="preconnect"[^>]*>\s*', "", h)
        h = re.sub(r'<link rel="stylesheet" href="https://fonts[^>]*>\s*', "", h)
        h = re.sub(r'<link rel="stylesheet" href="[^"]*assets/site\.css">', "@@CF:TESTA@@", h)
        h = re.sub(r'<script src="[^"]*assets/site\.js"></script>', "@@CF:CODA@@", h)
        h = re.sub(r' (srcset|sizes)="[^"]*"', "", h)
        h = re.sub(r'(?:\.\./)*foto/([\w-]+?)(?:-m)?\.(?:webp|png)', lambda m: "@@I:" + m.group(1) + "@@", h)
        h = re.sub(r"\n\s+", "\n", h)
        assert "@@CF:TESTA@@" in h and "@@CF:CODA@@" in h, path
        resto = re.findall(r'(?:src|href)="(?!https?:|mailto:|tel:|#|@@)[^"]*\.(?:css|js|png|jpe?g|webp|svg|ico)"', h)
        assert not resto, (path, resto)
        usate |= set(re.findall(r"@@I:([\w-]+)@@", h))
        pagine.append([nome, path, h])
    # foto: la versione -m (960 px) per tutto, anche per l'ingrandimento della galleria; i doppioni diventano una sola
    img, canonica, per_hash = {}, {}, {}
    for k in sorted(usate):
        f = os.path.join(radice, "foto", k + "-m.webp")
        mime = "image/webp"
        if not os.path.exists(f):
            f, mime = os.path.join(radice, "foto", k + ".png"), "image/png"
        b = open(f, "rb").read()
        hsh = hashlib.sha1(b).hexdigest()
        if hsh in per_hash:
            canonica[k] = per_hash[hsh]; continue
        per_hash[hsh] = canonica[k] = k
        if mime == "image/webp":
            ricompressa = webp_bytes(Image.open(io.BytesIO(b)).convert("RGB"), FOTO_SITO_Q)
            if len(ricompressa) < len(b):
                b = ricompressa
        img[k] = f"data:{mime};base64," + base64.b64encode(b).decode()
    for pg in pagine:
        pg[2] = re.sub(r"@@I:([\w-]+)@@", lambda m: "@@I:" + canonica[m.group(1)] + "@@", pg[2])
    # font del sito nuovo: i data URI escono dal CSS, così il browser ne fa un blob una volta sola
    font = []
    def togli(m):
        font.append(m.group(1)); return "url(@@F:%d@@)" % (len(font) - 1)
    font_css_ = re.sub(r"url\((data:font/woff2;base64,[^)]+)\)", togli, font_dopo)
    return pagine, {"css": css, "js": js, "font_css": font_css_, "font": font, "img": img}


def dati_progetto(p, font_dopo):
    """Tutto ciò che il confronto riceve in window.VETRINA.progetti[i] (vedi il commento in cima a questa sezione)."""
    cart = os.path.join(QUI, p["cattura"])
    cart_dopo = os.path.join(QUI, p["cattura_dopo"])
    pagine, sito = sito_dopo(p, font_dopo)
    voce = {"id": p["id"], "nome": p["nome"], "categoria": p["categoria"], "luogo": p["luogo"], "dominio": p["dominio"],
            "cambi": p["cambi"], "sito": sito, "pagine": []}
    for nome, path, h in pagine:
        s = slug(path)
        voce["pagine"].append({"nome": nome, "path": path, "html": h,
            "prima": {"pc": fette(os.path.join(cart, f"{s}-pc.png"), **PRIMA_PC),
                      "tel": fette(os.path.join(cart, f"{s}-tel.png"), **PRIMA_TEL)},
            "dopo": {"pc": fette(os.path.join(cart_dopo, f"{s}-pc.png"), **DOPO_PC),
                     "tel": fette(os.path.join(cart_dopo, f"{s}-tel.png"), **DOPO_TEL)}})
    peso = lambda x: len(json.dumps(x, ensure_ascii=False))
    mb = lambda lato, tipo: sum(peso(v[lato][tipo]) for v in voce["pagine"]) / 1e6
    print(f"  confronto {p['id']}: sito vivo {peso(sito) / 1e6:.2f} MB ({len(sito['img'])} foto), "
          f"foto prima pc {mb('prima', 'pc'):.2f} / tel {mb('prima', 'tel'):.2f} MB, "
          f"foto dopo pc {mb('dopo', 'pc'):.2f} / tel {mb('dopo', 'tel'):.2f} MB, "
          f"pagine {sum(len(v['html']) for v in voce['pagine']) / 1e6:.2f} MB")
    return voce


# ================================================================== assemblaggio (coordinatore)
def leggi(*parti):
    f = os.path.join(QUI, *parti)
    return open(f, encoding="utf-8").read() if os.path.exists(f) else ""


def main():
    os.makedirs(OUT, exist_ok=True)
    font_dopo = font_css({"Bodoni Moda", "Jost"})
    dati = {"email": EMAIL, "progetti": []}
    for p in PROGETTI:
        if "pagine" not in p:
            dati["progetti"].append({"id": p["id"], "nome": p["nome"], "categoria": p["categoria"], "pronto": False})
            continue
        v = dati_progetto(p, font_dopo)
        v["pronto"] = True
        v["anteprima"] = {"prima": anteprima(os.path.join(QUI, p["cattura"], "home-pc.png"), 1100),
                          "dopo": anteprima(os.path.join(QUI, p["cattura_dopo"], "home-pc.png"), 1100)}
        dati["progetti"].append(v)

    js_dati = json.dumps(dati, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    vendor = os.path.join(QUI, "vendor")
    ordine = (["gsap.min.js"] + sorted(f for f in os.listdir(vendor) if f.endswith(".js") and f != "gsap.min.js")) if os.path.isdir(vendor) else []
    librerie = "".join(f"<script>{leggi('vendor', f)}</script>\n" for f in ordine)
    stili = font_css({"Bricolage Grotesque", "Figtree"}) + "\n" + leggi("src", "vetrina.css") + "\n" + leggi("src", "confronto.css")
    pagina = leggi("src", "pagina.html")
    for k, v in {"{{EMAIL}}": e(EMAIL), "{{CONFRONTO}}": leggi("src", "confronto.html")}.items():
        pagina = pagina.replace(k, v)
    script = (f"<script>window.VETRINA = {js_dati};</script>\n{librerie}"
              f"<script>{leggi('src', 'confronto.js')}</script>\n<script>{leggi('src', 'vetrina.js')}</script>")
    testa = ("<title>Davide · Prima e dopo</title>\n"
             '<meta name="description" content="Davide, web designer freelance: rifaccio siti web, design e motion graphic. Guarda il prima e il dopo di siti reali.">\n'
             f"<style>{stili}</style>")
    corpo = pagina + "\n" + script
    if ARTIFACT:
        d = os.path.join(OUT, "artifact"); os.makedirs(d, exist_ok=True)
        f = os.path.join(d, "index.html")
        open(f, "w", encoding="utf-8").write(testa + "\n" + corpo + "\n")
    else:
        f = os.path.join(OUT, "vetrina-davide.html")
        open(f, "w", encoding="utf-8").write(
            '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + testa + "\n</head>\n<body>\n" + corpo + "\n</body>\n</html>\n")
    print(f, round(os.path.getsize(f) / 1e6, 2), "MB")


if __name__ == "__main__":
    main()

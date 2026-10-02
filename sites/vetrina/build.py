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
PONTE = """<script>(function(){var B=%s;document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');
if(/^(mailto:|tel:)/.test(h))return;if(/^https?:/.test(h)){a.target='_blank';a.rel='noopener';return;}if(h.charAt(0)==='#')return;e.preventDefault();
var u=new URL(h,'https://sito.invalid/'+B);parent.postMessage({vetrina:'pagina',path:u.pathname.slice(1).replace(/index\\.html$/,''),hash:u.hash},'*');},true);})();</script>"""


def sito_dopo(p):
    """Le pagine del sito nuovo rese autonome. DA RIFARE dall'agente confronto (vedi BRIEF.md: niente data URI ripetuti)."""
    radice = os.path.join(SITI, p["sito_dopo"])
    css = open(os.path.join(radice, "assets", "site.css")).read()
    js = open(os.path.join(radice, "assets", "site.js")).read()
    usate, pagine = set(), []
    for nome, path in p["pagine"]:
        h = open(os.path.join(radice, path, "index.html"), encoding="utf-8").read()
        h = re.sub(r'<link rel="preconnect"[^>]*>', "", h)
        h = re.sub(r'<link rel="stylesheet" href="https://fonts[^>]*>\n?', "", h)
        h = re.sub(r'<link rel="stylesheet" href="[^"]*assets/site\.css">', lambda m: "<style>@@FONT@@\n" + css + "</style>", h)
        h = re.sub(r'<script src="[^"]*assets/site\.js"></script>', lambda m: "<script>" + js + "</script>" + PONTE % json.dumps(path), h)
        h = re.sub(r' (srcset|sizes)="[^"]*"', "", h)
        h = re.sub(r'(?:\.\./)*foto/([\w-]+?)(?:-m)?\.(?:webp|png)', lambda m: "@@" + m.group(1) + "@@", h)
        usate |= set(re.findall(r"@@([\w-]+)@@", h)) - {"FONT"}
        pagine.append((nome, path, h))
    img = {}
    for k in sorted(usate):
        png = os.path.join(radice, "foto", k + ".png")
        if os.path.exists(png):
            img[k] = file_uri(png, "image/png"); continue
        im = Image.open(os.path.join(radice, "foto", k + "-m.webp")).convert("RGB")
        im.thumbnail((1000, 1000), Image.LANCZOS)
        img[k] = webp_uri(im, 58)
    return pagine, img


def dati_progetto(p, font_dopo):
    """Tutto ciò che il confronto riceve in window.VETRINA.progetti[i]. DA RIVEDERE dall'agente confronto."""
    cart = os.path.join(QUI, p["cattura"])
    pagine, img = sito_dopo(p)
    voce = {"id": p["id"], "nome": p["nome"], "categoria": p["categoria"], "luogo": p["luogo"], "dominio": p["dominio"],
            "cambi": p["cambi"], "img": img, "font": font_dopo, "pagine": []}
    for nome, path, h in pagine:
        voce["pagine"].append({"nome": nome, "path": path, "dopo": h, "prima": {
            "pc": pezzi(os.path.join(cart, f"{slug(path)}-pc.png"), 1100),
            "tel": pezzi(os.path.join(cart, f"{slug(path)}-tel.png"), 520)}})
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

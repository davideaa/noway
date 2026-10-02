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

# Due tipi di lavoro:
#   multipagina  (sito_dopo = cartella del sito nuovo costruito, pagine = elenco)       -> es. Cosmo
#   pagina unica (dopo = un solo file .html autonomo, sezioni = [(nome, id)] per la tendina) -> es. Boulevard, Primevo
# Le fotografie del "prima" stanno in cattura/<id>/: <pagina>-pc@2x.png (computer, retina: 2880 px per 1440 px veri),
# in mancanza <pagina>-pc.png (1x), e <pagina>-tel@2x.png o <pagina>-tel.png (telefono, 390 px a 2x: la prima è la più
# recente, fatta col banner dei cookie già accettato). Si fanno con scripts/cattura.cjs.
# Se manca la foto da computer il confronto mostra il prima da telefono; basta aggiungerla e rifare il build.
# L'anteprima del riquadro usa home-pc@2x.png (o home-pc.png, o home-pc-parziale.png) e la prima schermata del dopo in <cattura_dopo>/home-pc.png
# (per i siti a pagina unica: node scripts/copertina-dopo.cjs lavori/<id>/dopo.html cattura/<id>-dopo/home-pc.png).
PROGETTI = [
    dict(id="cosmo", categoria="Hotel", nome="Cosmo Hotel Palace", luogo="Cinisello Balsamo, Milano",
         dominio="cosmohotelpalace.it", sito_dopo="cosmo-hotel-palace/out", cattura="cattura/cosmo", cattura_dopo="cattura/cosmo-dopo",
         cambi=["Stesse pagine, stessi testi, stesse foto", "Foto a tutta pagina", "Prenotazione sempre a portata",
                "Tabella delle sale leggibile", "Galleria a schermo intero", "Menu chiaro da telefono"],
         pagine=PAGINE_COSMO),
    dict(id="boulevard", categoria="Bistrot e cocktail bar", nome="Boulevard", luogo="Cinisello Balsamo, Milano",
         dominio="boulevard-cafe-cinisello-balsamo.metro.bar", dopo="lavori/boulevard/dopo.html",
         cattura="cattura/boulevard", cattura_dopo="cattura/boulevard-dopo",
         cambi=["Menù completo, con ricerca e filtri", "Prenotazione del tavolo", "Orari e «aperto ora» sempre in vista",
                "Galleria delle specialità"],
         sezioni=[("Inizio", "top"), ("Il locale", "locale"), ("Menu", "menu"), ("Aperitivo", "aperitivo"), ("Cocktail", "cocktail"),
                  ("Sport e feste", "eventi"), ("Galleria", "galleria"), ("Orari e dove", "dove")]),
    dict(id="primevo", categoria="Ristorante di carne", nome="Primevo", luogo="Milano, Bicocca",
         dominio="primevo-ristorante.it", dopo="lavori/primevo/dopo.html",
         cattura="cattura/primevo", cattura_dopo="cattura/primevo-dopo",
         cambi=["Racconto a scorrimento", "Tagli dry aged con calcolo del prezzo", "Menù da sfogliare", "Carta dei vini"],
         sezioni=[("Inizio", "home"), ("Chi siamo", "chiSiamo"), ("Dry aged", "taglio"),
                  ("Scegli il taglio", "calcolo"), ("Menù", "menu"), ("Cantina", "cantina"), ("Contatti", "contatti")]),
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
# Per ogni lavoro pronto la pagina riceve in window.VETRINA.progetti[i] solo i dati leggeri (nome, anteprime...);
# i dati pesanti stanno a parte, uno per lavoro, e il visore li legge solo quando servono:
#   file offline:  <script type="application/json" id="cf-dati-<id>">...</script> dentro la pagina
#   --artifact:    out/artifact/dati-<id>.js (sito vivo), dati-<id>-prima-pc.js e dati-<id>-prima-tel.js (foto)
#                  accanto a index.html, ognuno sotto i 15 MB (elenco dei file in out/artifact/FILES.txt)
# Dati pesanti = {tipo, sito, pagine, sezioni?}
#   pagine[i] = {nome, path, html, prima: {pc?, tel}}
#     html  = la pagina del sito nuovo con segnaposto: @@CF:TESTA@@ (ponte + stile), @@CF:CODA@@ (script del sito),
#             @@I:chiave@@ per ogni foto o font (diventa un blob: URL creato UNA volta nel browser)
#     prima = fotografia del sito originale a fette: {w, h, css, fette: [[data URI WebP, passo, altezza vera], ...]}
#   sito = {css, js, font_css (con @@F:n@@), font: [data URI woff2], img: {chiave: data URI}}
#   sezioni = [{nome, id}] per i siti a pagina unica (la tendina salta alle sezioni)
# Ogni foto compare una sola volta nel file (anche se usata più volte o duplicata con un altro nome).
# Pesi scelti per stare sotto i 40 MB nel file offline (e sotto i 15 MB per ogni file dell'artifact).
# Foto del "prima" a piena definizione: su schermi retina (DPR 2-3) non vengono mai ingrandite.
# css = larghezza vera del sito fotografato (in px CSS): il visore non la mostra mai più larga di così.
PRIMA_PC = dict(larghezza=2880, q=50, fetta=1600, css=1440)   # da computer, cattura a 2x
PRIMA_TEL = dict(larghezza=780, q=55, fetta=1600, css=390)    # da telefono, cattura a 2x intera
SOVRAPPOSIZIONE = 4                                  # righe in comune fra due fette consecutive (niente righe chiare fra le fette)
FOTO_SITO_Q = 72                                     # foto del sito vivo multipagina (960 px) ricompresse, se così pesano meno
# immagini incorporate nei "dopo" a pagina unica (copie in memoria: i file in lavori/ non si toccano)
UNICA_FOTO = dict(lato=1000, q=48, lato_grande=1600, q_grande=52, soglia_grande=1400)
UNICA_FOTOGRAMMI = dict(prefisso="seq/", scala=0.7, q=45)   # fotogrammi dei video a scorrimento (chiavi seq/...)


def fette(png, larghezza, q, fetta, css):
    """Fotografia a pagina intera in fette WebP (il WebP non supera 16383 px e le fette si decodificano una per volta).
    Mai ingrandita: se la cattura è più stretta (es. 1x) resta com'è."""
    Image.MAX_IMAGE_PIXELS = None
    im = Image.open(png).convert("RGB")
    larghezza = min(larghezza, im.width)
    if im.width != larghezza:
        im = im.resize((larghezza, round(im.height * larghezza / im.width)), Image.LANCZOS)
    n = -(-im.height // fetta)
    alto = -(-im.height // n)                       # fette uguali, niente coda di pochi pixel
    alto += alto % 2                                # pari: a 1:1 su schermo 2x ogni fetta comincia su un pixel intero
    out = []
    for y in range(0, im.height, alto):
        # ogni fetta porta con sé SOVRAPPOSIZIONE righe della successiva: il visore le sovrappone senza stirarle
        # (stirare una fetta anche di 1 px la ricampiona tutta e il testo si sfoca)
        fondo = min(im.height, y + alto + SOVRAPPOSIZIONE)
        pezzo = im.crop((0, y, larghezza, fondo))
        out.append([webp_uri(pezzo, q), min(alto, im.height - y), pezzo.height])
    return {"w": larghezza, "h": im.height, "css": css, "fette": out}


def foto_pc(cart, nome):
    """La foto da computer migliore che c'è: prima la 2x, poi la 1x."""
    for f in (f"{nome}-pc@2x.png", f"{nome}-pc.png"):
        if os.path.exists(os.path.join(cart, f)):
            return os.path.join(cart, f)
    return None


def foto_tel(cart, nome):
    """La foto da telefono: la nuova <nome>-tel@2x.png se c'è, altrimenti la vecchia <nome>-tel.png (sempre 2x)."""
    f = os.path.join(cart, f"{nome}-tel@2x.png")
    return f if os.path.exists(f) else os.path.join(cart, f"{nome}-tel.png")


def ricomprimi(b, lato, q, scala=1.0):
    """Un'immagine incorporata ricompressa in WebP (ridotta a <lato> px e/o di <scala>); resta l'originale se pesa meno."""
    im = Image.open(io.BytesIO(b)); im.load()
    if getattr(im, "is_animated", False):
        return b, None                                  # le animazioni restano come sono
    trasparente = im.mode in ("RGBA", "LA", "P") and "A" in im.convert("RGBA").getbands() and im.convert("RGBA").getextrema()[3][0] < 255
    im = im.convert("RGBA" if trasparente else "RGB")
    s = min(1.0, lato / max(im.size)) * scala
    if s < 1:
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    o = io.BytesIO(); im.save(o, "WEBP", quality=q, method=6, **({"alpha_quality": 50} if trasparente else {}))
    return (o.getvalue(), "image/webp") if len(o.getvalue()) < len(b) else (b, None)


def sito_unica(p):
    """Un sito "dopo" a pagina unica (file autonomo con tutto in data URI): foto e font escono dal file come risorse
    (ricompresse, una sola volta ciascuna) e al loro posto restano segnaposto @@I:chiave@@."""
    import hashlib
    h = open(os.path.join(QUI, p["dopo"]), encoding="utf-8").read()
    risorse, per_hash, peso0 = {}, {}, 0
    def togli(m):
        nonlocal peso0
        chiave_js, mime, b = m.group(1) or "", m.group(2), base64.b64decode(m.group(3))
        peso0 += len(m.group(3))
        if mime.startswith("image/") and mime != "image/svg+xml" and mime != "image/gif":
            if chiave_js.strip('"').startswith(UNICA_FOTOGRAMMI["prefisso"]):
                nb, nm = ricomprimi(b, 99999, UNICA_FOTOGRAMMI["q"], UNICA_FOTOGRAMMI["scala"])
            else:
                lato = max(Image.open(io.BytesIO(b)).size)
                grande = lato > UNICA_FOTO["soglia_grande"]
                nb, nm = ricomprimi(b, UNICA_FOTO["lato_grande"] if grande else UNICA_FOTO["lato"],
                                    UNICA_FOTO["q_grande"] if grande else UNICA_FOTO["q"])
            b, mime = nb, nm or mime
        hsh = hashlib.sha1(b).hexdigest()
        if hsh not in per_hash:
            per_hash[hsh] = "r%d" % len(per_hash)
            risorse[per_hash[hsh]] = f"data:{mime};base64," + base64.b64encode(b).decode()
        return (m.group(1) or "") + "@@I:" + per_hash[hsh] + "@@"
    h = re.sub(r'("(?:[^"\\\n]){1,120}"\s*:\s*")?data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)', togli, h)
    h, n = re.subn(r"(<head(?:\s[^>]*)?>)", lambda m: m.group(1) + "@@CF:TESTA@@", h, count=1)
    assert n == 1, p["dopo"]
    return h, risorse, peso0


def dati_unica(p):
    """Dati pesanti di un lavoro a pagina unica."""
    cart = os.path.join(QUI, p["cattura"])
    h, risorse, peso0 = sito_unica(p)
    prima = {"tel": fette(foto_tel(cart, "home"), **PRIMA_TEL)}
    if foto_pc(cart, "home"):
        prima["pc"] = fette(foto_pc(cart, "home"), **PRIMA_PC)
    d = {"tipo": "unica", "sito": {"css": "", "js": "", "font_css": "", "font": [], "img": risorse},
         "pagine": [{"nome": p["nome"], "path": "", "html": h, "prima": prima}],
         "sezioni": [{"nome": n, "id": i} for n, i in p["sezioni"]]}
    peso = lambda x: len(json.dumps(x, ensure_ascii=False))
    print(f"  confronto {p['id']}: sito vivo {peso(d['sito']) / 1e6:.2f} MB (foto e font: {len(risorse)}, "
          f"prima erano {peso0 * 1.0 / 1e6:.2f} MB), pagina {len(h) / 1e6:.2f} MB, "
          f"foto prima pc {peso(prima.get('pc', {})) / 1e6:.2f} / tel {peso(prima['tel']) / 1e6:.2f} MB"
          + ("" if "pc" in prima else "  [manca home-pc@2x.png: il prima da computer non c'è]"))
    return d


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
    """Dati pesanti di un lavoro multipagina."""
    cart = os.path.join(QUI, p["cattura"])
    pagine, sito = sito_dopo(p, font_dopo)
    d = {"tipo": "pagine", "sito": sito, "pagine": []}
    for nome, path, h in pagine:
        s = slug(path)
        prima = {"tel": fette(foto_tel(cart, s), **PRIMA_TEL)}
        if foto_pc(cart, s):
            prima["pc"] = fette(foto_pc(cart, s), **PRIMA_PC)
        d["pagine"].append({"nome": nome, "path": path, "html": h, "prima": prima})
    peso = lambda x: len(json.dumps(x, ensure_ascii=False))
    mb = lambda tipo: sum(peso(v["prima"].get(tipo, {})) for v in d["pagine"]) / 1e6
    print(f"  confronto {p['id']}: sito vivo {peso(sito) / 1e6:.2f} MB ({len(sito['img'])} foto), "
          f"foto prima pc {mb('pc'):.2f} / tel {mb('tel'):.2f} MB, pagine {sum(len(v['html']) for v in d['pagine']) / 1e6:.2f} MB")
    return d


# ================================================================== assemblaggio (coordinatore)
def leggi(*parti):
    f = os.path.join(QUI, *parti)
    return open(f, encoding="utf-8").read() if os.path.exists(f) else ""


def parti(d):
    """I dati pesanti di un lavoro divisi in tre: il sito vivo, le foto del prima da computer, quelle da telefono.
    Il visore legge solo quello che serve (un telefono non scarica mai le foto da computer)."""
    dopo = dict(d); dopo["pagine"] = [{k: v for k, v in pg.items() if k != "prima"} for pg in d["pagine"]]
    out = {"dopo": dopo}
    for tipo in ("pc", "tel"):
        foto = [pg["prima"].get(tipo) for pg in d["pagine"]]
        if any(foto):
            out[tipo] = {"prima_" + tipo: foto}
    return out


def json_sicuro(x):
    """JSON da mettere dentro <script>: nessun '<' letterale (niente </script> né <!-- che confondono il parser HTML)."""
    return json.dumps(x, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def main():
    os.makedirs(OUT, exist_ok=True)
    font_dopo = font_css({"Bodoni Moda", "Jost"})
    dati = {"email": EMAIL, "progetti": []}
    pesanti = {}
    for p in PROGETTI:
        if "pagine" not in p and "dopo" not in p:          # lavoro non ancora pronto: solo il riquadro "In arrivo"
            dati["progetti"].append({"id": p["id"], "nome": p["nome"], "categoria": p["categoria"], "pronto": False})
            continue
        pesanti[p["id"]] = dati_progetto(p, font_dopo) if "pagine" in p else dati_unica(p)
        cart = os.path.join(QUI, p["cattura"])
        pc = foto_pc(cart, "home") or os.path.join(cart, "home-pc-parziale.png")   # la 2x: anteprima nitida e senza banner
        v = {k: p[k] for k in ("id", "nome", "categoria", "luogo", "dominio", "cambi")}
        v.update(pronto=True, tipo=pesanti[p["id"]]["tipo"],
                 anteprima={"prima": anteprima(pc, 1440), "dopo": anteprima(os.path.join(QUI, p["cattura_dopo"], "home-pc.png"), 1440)})
        pesanti[p["id"]] = parti(pesanti[p["id"]])
        nomi = {"dopo": f"dati-{p['id']}.js", "pc": f"dati-{p['id']}-prima-pc.js", "tel": f"dati-{p['id']}-prima-tel.js"}
        v["parti"] = {k: (nomi[k] if ARTIFACT else "") for k in pesanti[p["id"]]}
        dati["progetti"].append(v)

    js_dati = json_sicuro(dati)
    vendor = os.path.join(QUI, "vendor")
    ordine = (["gsap.min.js"] + sorted(f for f in os.listdir(vendor) if f.endswith(".js") and f != "gsap.min.js")) if os.path.isdir(vendor) else []
    librerie = "".join(f"<script>{leggi('vendor', f)}</script>\n" for f in ordine)
    stili = font_css({"Bricolage Grotesque", "Figtree"}) + "\n" + leggi("src", "vetrina.css") + "\n" + leggi("src", "confronto.css")
    pagina = leggi("src", "pagina.html")
    for k, v in {"{{EMAIL}}": e(EMAIL), "{{CONFRONTO}}": leggi("src", "confronto.html")}.items():
        pagina = pagina.replace(k, v)
    blocchi = "" if ARTIFACT else "".join(
        f'<script type="application/json" id="cf-dati-{k}-{t}">{json_sicuro(pd)}</script>\n'
        for k, pp in pesanti.items() for t, pd in pp.items())
    script = (f"<script>window.VETRINA = {js_dati};</script>\n{blocchi}{librerie}"
              f"<script>{leggi('src', 'confronto.js')}</script>\n<script>{leggi('src', 'vetrina.js')}</script>")
    testa = ("<title>Davide · Prima e dopo</title>\n"
             '<meta name="description" content="Davide, web designer freelance: rifaccio siti web, design e motion graphic. Guarda il prima e il dopo di siti reali.">\n'
             f"<style>{stili}</style>")
    corpo = pagina + "\n" + script
    if ARTIFACT:
        d = os.path.join(OUT, "artifact"); os.makedirs(d, exist_ok=True)
        for vecchio in os.listdir(d):
            if vecchio.startswith("dati-") and vecchio.endswith(".js"):
                os.remove(os.path.join(d, vecchio))
        f = os.path.join(d, "index.html")
        open(f, "w", encoding="utf-8").write(testa + "\n" + corpo + "\n")
        elenco = ["index.html"]
        print(f, round(os.path.getsize(f) / 1e6, 2), "MB")
        for k, pp in pesanti.items():
            nomi = next(v["parti"] for v in dati["progetti"] if v["id"] == k)
            for t, pd in pp.items():
                fd = os.path.join(d, nomi[t])
                open(fd, "w", encoding="utf-8").write(f"(window.CF_DATI = window.CF_DATI || {{}})[{json.dumps(k + '-' + t)}] = {json_sicuro(pd)};\n")
                elenco.append(os.path.basename(fd))
                mb = os.path.getsize(fd) / 1e6
                print(fd, round(mb, 2), "MB" + ("   ATTENZIONE: sopra i 15 MB" if mb > 15 else ""))
        open(os.path.join(d, "FILES.txt"), "w", encoding="utf-8").write("\n".join(elenco) + "\n")
        print(os.path.join(d, "FILES.txt"), "->", ", ".join(elenco))
    else:
        f = os.path.join(OUT, "vetrina-davide.html")
        open(f, "w", encoding="utf-8").write(
            '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + testa + "\n</head>\n<body>\n" + corpo + "\n</body>\n</html>\n")
        mb = os.path.getsize(f) / 1e6
        print(f, round(mb, 2), "MB" + ("   ATTENZIONE: sopra i 40 MB" if mb > 40 else ""))


if __name__ == "__main__":
    main()

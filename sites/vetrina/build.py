#!/usr/bin/env python3
"""Vetrina di Davide: una pagina sola, che funziona anche senza internet, con i lavori "prima e dopo".

Prima di costruire:
  - il sito "dopo" di ogni lavoro deve essere costruito (es. sites/cosmo-hotel-palace: python3 build.py);
  - le foto del sito "prima" si fanno con scripts/cattura.cjs (finiscono in cattura/, fuori dal repo).

  python3 build.py              -> out/vetrina-davide.html   (il file da mandare: tutto dentro, anche foto e font)
  python3 build.py --artifact   -> out/artifact/index.html   (la stessa pagina per l'anteprima su Claude)
"""
import base64, html, io, json, os, re, subprocess, sys
from PIL import Image

QUI = os.path.dirname(os.path.abspath(__file__))
SITI = os.path.dirname(QUI)
OUT = os.path.join(QUI, "out")
ARTIFACT = "--artifact" in sys.argv
e = html.escape

EMAIL = "davide.abbattista04@gmail.com"

PROGETTI = [
    dict(id="cosmo", categoria="Hotel", nome="Cosmo Hotel Palace", luogo="Cinisello Balsamo, Milano",
         dominio="cosmohotelpalace.it", sito_dopo="cosmo-hotel-palace/out", cattura="cattura/cosmo", cattura_dopo="cattura/cosmo-dopo",
         cambi=["Stesse pagine, stessi testi, stesse foto", "Foto a tutta pagina", "Prenotazione sempre a portata", "Tabella delle sale leggibile", "Galleria a schermo intero"],
         pagine=[("Home", "home", ""), ("Camere & Suites", "camere-suites", "camere-suites/"), ("Meeting ed eventi", "meeting-ed-eventi", "meeting-ed-eventi/")]),
    dict(id="locale", categoria="Locale per aperitivi", nome="In arrivo"),
    dict(id="terzo", categoria="Prossimo lavoro", nome="In arrivo"),
]

# ------------------------------------------------------------------ immagini
def webp_uri(im, q=60):
    b = io.BytesIO(); im.save(b, "WEBP", quality=q, method=6)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()


def file_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def pezzi(png, larghezza, alto_max=6000):
    im = Image.open(png).convert("RGB")
    w, h = im.size
    s = larghezza / w
    im = im.resize((larghezza, round(h * s)), Image.LANCZOS)
    out = []
    for y in range(0, im.height, alto_max):
        out.append(webp_uri(im.crop((0, y, larghezza, min(im.height, y + alto_max))), 58))
    return out


def anteprima(png, lato=760):
    im = Image.open(png).convert("RGB")
    im = im.crop((0, 0, im.width, round(im.width * 10 / 16)))
    im.thumbnail((lato, lato), Image.LANCZOS)
    return webp_uri(im, 66)


# ------------------------------------------------------------------ font (dentro la pagina, per l'uso offline)
def font_css(famiglie):
    css = open(os.path.join(QUI, "font", "fonts.css")).read()
    blocchi = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S)
    out = []
    for subset, b in blocchi:
        fam = re.search(r"font-family: '([^']+)'", b).group(1)
        if subset != "latin" or fam not in famiglie:
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", b).group(1)
        f = os.path.join(QUI, "font", os.path.basename(url))
        if not os.path.exists(f):
            subprocess.run(["curl", "-sS", "-L", "-m", "60", "-o", f, url], check=True)
        out.append(b.replace(url, file_uri(f, "font/woff2")))
    return "\n".join(out)


# ------------------------------------------------------------------ il sito "dopo" reso autonomo
PONTE = """<script>(function(){var B=%s;document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');
if(/^(mailto:|tel:)/.test(h))return;if(/^https?:/.test(h)){a.target='_blank';a.rel='noopener';return;}if(h.charAt(0)==='#')return;e.preventDefault();
var u=new URL(h,'https://sito.invalid/'+B);parent.postMessage({vetrina:'pagina',path:u.pathname.slice(1).replace(/index\\.html$/,''),hash:u.hash},'*');},true);})();</script>"""


def sito_dopo(p):
    radice = os.path.join(SITI, p["sito_dopo"])
    css = open(os.path.join(radice, "assets", "site.css")).read()
    js = open(os.path.join(radice, "assets", "site.js")).read()
    usate, pagine = set(), []
    for nome, slug, path in p["pagine"]:
        h = open(os.path.join(radice, path, "index.html"), encoding="utf-8").read()
        h = re.sub(r'<link rel="preconnect"[^>]*>', "", h)
        h = re.sub(r'<link rel="stylesheet" href="https://fonts[^>]*>\n?', "", h)
        h = re.sub(r'<link rel="stylesheet" href="[^"]*assets/site\.css">', lambda m: "<style>@@FONT@@\n" + css + "</style>", h)
        h = re.sub(r'<script src="[^"]*assets/site\.js"></script>', lambda m: "<script>" + js + "</script>" + PONTE % json.dumps(path), h)
        h = re.sub(r' (srcset|sizes)="[^"]*"', "", h)
        h = re.sub(r'(?:\.\./)*foto/([\w-]+?)(?:-m)?\.(?:webp|png)', lambda m: "@@" + m.group(1) + "@@", h)
        usate |= set(re.findall(r"@@([\w-]+)@@", h)) - {"FONT"}
        pagine.append((nome, slug, path, h))
    img = {}
    for k in sorted(usate):
        png = os.path.join(radice, "foto", k + ".png")
        if os.path.exists(png):
            img[k] = file_uri(png, "image/png")
            continue
        im = Image.open(os.path.join(radice, "foto", k + "-m.webp")).convert("RGB")
        im.thumbnail((1000, 1000), Image.LANCZOS)
        img[k] = webp_uri(im, 58)
    return pagine, img


# ------------------------------------------------------------------ dati e pagina
ICONE = {
    "sito": '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 8h18M7 6h.01M10 6h.01"/><path d="M8 13l2 2 4-4"/>',
    "design": '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.2-.6-2 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    "motion": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/>',
    "logistica": '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
}


def icona(n):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICONE[n]}</svg>'


def canale(p, dati):
    if "pagine" not in p:
        return f"""<div class="canale" data-id="{p['id']}" aria-disabled="true" role="group" aria-label="{e(p['categoria'])}: in arrivo">
  <div class="schermo"><span>In arrivo</span></div>
  <div class="didascalia"><strong>{e(p['categoria'])}</strong><span>Prossimo prima e dopo</span></div></div>"""
    return f"""<button class="canale" type="button" data-id="{p['id']}" aria-label="Apri il prima e dopo: {e(p['nome'])}, {e(p['categoria'])}">
  <div class="schermo">
    <img src="{dati['anteprima_dopo']}" alt="">
    <img class="strato-prima" src="{dati['anteprima_prima']}" alt="">
    <span class="taglio" aria-hidden="true"></span>
    <span class="bollino p">Prima</span><span class="bollino d">Dopo</span>
  </div>
  <div class="didascalia"><strong>{e(p['nome'])}</strong><span>{e(p['categoria'])} · {e(p['luogo'])}</span></div>
  <span class="entra" aria-hidden="true">→</span>
</button>"""


def main():
    os.makedirs(OUT, exist_ok=True)
    dati_js = {"progetti": [], "fontDopo": {}}
    canali = []
    font_dopo = font_css({"Bodoni Moda", "Jost"})
    for p in PROGETTI:
        if "pagine" not in p:
            dati_js["progetti"].append({"id": p["id"], "categoria": p["categoria"]})
            canali.append(canale(p, None))
            continue
        cart = os.path.join(QUI, p["cattura"])
        pagine, img = sito_dopo(p)
        voce = {"id": p["id"], "nome": p["nome"], "categoria": p["categoria"], "luogo": p["luogo"], "dominio": p["dominio"],
                "cambi": p["cambi"], "img": img, "pagine": []}
        for nome, slug, path, h in pagine:
            voce["pagine"].append({"nome": nome, "path": path, "dopo": h, "prima": {
                "pc": pezzi(os.path.join(cart, f"{slug}-pc.png"), 1100),
                "tel": pezzi(os.path.join(cart, f"{slug}-tel.png"), 520)}})
        dati_js["progetti"].append(voce)
        dati_js["fontDopo"][p["id"]] = font_dopo
        canali.append(canale(p, {"anteprima_prima": anteprima(os.path.join(cart, "home-pc.png")),
                                 "anteprima_dopo": anteprima(os.path.join(QUI, p["cattura_dopo"], "home-pc.png"))}))

    css = open(os.path.join(QUI, "src", "vetrina.css")).read()
    js = open(os.path.join(QUI, "src", "vetrina.js")).read()
    dati = json.dumps(dati_js, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    servizi = [("sito", "Siti web e restyling", "Siti nuovi o rinnovati, veloci e chiari da telefono e da computer."),
               ("design", "Web design e grafica", "Impaginazione, caratteri, colori e immagini: l'aspetto che fa dire «wow»."),
               ("motion", "Motion graphic e video", "Animazioni, reel e video per i social e per il sito."),
               ("logistica", "Prenotazioni e logistica", "Il sito collegato a prenotazioni, ordini e strumenti di lavoro.")]
    cosmo = os.path.join(QUI, "cattura", "cosmo")
    confronto_hero = f"""<figure class="confronta" id="confronta">
  <img src="{anteprima(os.path.join(QUI, 'cattura', 'cosmo-dopo', 'home-pc.png'), 1100)}" alt="Il nuovo sito del Cosmo Hotel Palace">
  <img class="prima" src="{anteprima(os.path.join(cosmo, 'home-pc.png'), 1100)}" alt="Il sito attuale del Cosmo Hotel Palace">
  <span class="maniglia" aria-hidden="true"></span><span class="bollino p">Prima</span><span class="bollino d">Dopo</span>
  <input type="range" min="0" max="100" value="50" id="cursore-confronto" aria-label="Trascina per confrontare il sito di prima e quello di dopo">
  <figcaption>Cosmo Hotel Palace · trascina per confrontare</figcaption>
</figure>"""
    corpo = f"""<header class="testata"><div class="wrap">
  <a class="firma" href="#inizio"><span class="punto" aria-hidden="true">D</span>Davide</a>
  <nav aria-label="Sezioni"><a href="#lavori">Lavori</a><a href="#contatti">Contatti</a></nav>
</div></header>
<main id="inizio">
<section class="wrap presentazione">
 <div class="testo-pres">
  <p class="etichetta">Siti web · design · motion graphic</p>
  <h1>Piacere, sono Davide <span class="mano" aria-hidden="true">👋</span></h1>
  <p class="lead">Ho <b>22 anni</b> e sono <b>laureato in Economia delle banche</b>. Da tre anni, come freelance, progetto e rinnovo siti web: ne curo il design e la motion graphic, e li collego a prenotazioni e logistica.</p>
  <ul class="abilita"><li>Web design</li><li>Restyling di siti</li><li>Motion graphic</li><li>Reel e video</li><li>Prenotazioni e logistica</li></ul>
 </div>
 {confronto_hero}
</section>
<section class="lavori" id="lavori" aria-labelledby="titolo-lavori"><div class="wrap">
  <div class="capo"><div><p class="etichetta">Prima e dopo</p><h2 id="titolo-lavori">Siti che ho ripensato</h2></div>
    <p>Proposte di restyling su siti reali. Scegli un lavoro: a sinistra trovi il sito com'è oggi, a destra la mia versione, da provare.</p></div>
  <div class="canali">{"".join(canali)}</div>
</div></section>
<section class="sezione bianco"><div class="wrap servizi">
  <div><p class="etichetta">Cosa faccio</p><h2 style="margin-top:14px">Dal sito ai video, tutto in un solo posto</h2></div>
  <ul class="elenco-servizi">{"".join(f'<li>{icona(i)}<b>{t}</b><span>{d}</span></li>' for i, t, d in servizi)}</ul>
</div></section>
<section class="sezione metodo"><div class="wrap">
  <p class="etichetta">Come lavoro</p><h2 style="margin-top:14px">Tre passi, dal sito di oggi a quello nuovo</h2>
  <ol class="passi">
    <li><b>Guardo il sito di oggi</b><span>Pagine, contenuti, foto e cosa serve ai clienti che lo visitano.</span></li>
    <li><b>Disegno la nuova versione</b><span>Con i vostri testi e le vostre foto: cambia l'aspetto, resta chi siete.</span></li>
    <li><b>La mettiamo online</b><span>Collegata a prenotazioni, ordini e social, pronta da telefono e da computer.</span></li>
  </ol>
</div></section>
<section class="sezione bianco" id="contatti"><div class="wrap contatto">
  <p class="etichetta">Contatti</p>
  <h2>Vuoi vedere il tuo sito rifatto così?</h2>
  <a class="mail" href="mailto:{EMAIL}">{EMAIL}</a>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="mailto:{EMAIL}?subject=Restyling%20del%20sito">Scrivimi</a><button class="btn chiaro" type="button" id="copia-mail" data-mail="{EMAIL}">Copia l'indirizzo</button></div>
</div></section>
</main>
<footer class="piede"><div class="wrap"><span>Davide · siti web, design e motion graphic</span><span>Le immagini dei siti «prima» sono fotografie dei siti attuali, prese il 2 ottobre 2026.</span></div></footer>

<div class="progetto" id="progetto" hidden role="dialog" aria-modal="true" aria-labelledby="titolo-progetto">
  <div class="barra">
    <div class="indietro"><button class="pill" type="button" id="indietro" aria-label="Torna a tutti i lavori">← <span class="testo-pill">Tutti i lavori</span></button></div>
    <div class="titolo"><strong id="titolo-progetto"></strong><span id="sotto-progetto"></span></div>
    <div class="naviga"><button class="pill" type="button" id="precedente" aria-label="Lavoro precedente">‹ <span class="testo-pill">Precedente</span></button><button class="pill" type="button" id="successivo" aria-label="Lavoro successivo"><span class="testo-pill">Successivo</span> ›</button></div>
  </div>
  <div class="comandi">
    <div class="gruppo pagine" id="pagine" role="tablist" aria-label="Pagine del sito"></div>
    <div class="gruppo lato-scelta" id="scelta-lato" role="group" aria-label="Mostra"><button type="button" data-v="prima">Prima</button><button type="button" data-v="dopo">Dopo</button></div>
    <div class="gruppo" id="device" role="group" aria-label="Schermo"><button type="button" data-v="pc">Computer</button><button type="button" data-v="tel">Telefono</button></div>
    <label class="interruttore sincro"><input type="checkbox" id="sincro" checked> Scorri insieme</label>
  </div>
  <div class="confronto">
    <section class="lato prima" aria-label="Prima: il sito attuale">
      <div class="capo-lato"><b>Prima</b><span>il sito di oggi</span></div>
      <div class="finestra"><div class="indirizzo"><i></i><i></i><i></i><span class="url" id="url-prima"></span></div><div class="vista scorre" id="vista-prima" tabindex="0"></div></div>
    </section>
    <section class="lato dopo" aria-label="Dopo: la mia versione">
      <div class="capo-lato"><b>Dopo</b><span>la mia versione, da provare</span></div>
      <div class="finestra"><div class="indirizzo"><i></i><i></i><i></i><span class="url" id="url-dopo"></span></div><div class="vista" id="vista-dopo"></div></div>
    </section>
  </div>
  <ul class="cambi" id="cambi" aria-label="Cosa ho cambiato"></ul>
</div>
<div class="nota-progetto" id="nota-progetto" role="status" hidden></div>
<script>window.VETRINA = {dati};</script>
<script>{js}</script>"""
    testa = (f"<title>Davide · Prima e dopo</title>\n<meta name=\"description\" content=\"Davide, web designer freelance: siti web, design e motion graphic. Prima e dopo di siti reali ripensati.\">\n"
             f"<style>{font_css({'Bricolage Grotesque', 'Figtree'})}\n{css}</style>")
    if ARTIFACT:
        d = os.path.join(OUT, "artifact"); os.makedirs(d, exist_ok=True)
        f = os.path.join(d, "index.html")
        open(f, "w", encoding="utf-8").write(testa + "\n" + corpo + "\n")
    else:
        f = os.path.join(OUT, "vetrina-davide.html")
        open(f, "w", encoding="utf-8").write(
            '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + testa + "\n</head>\n<body>\n" + corpo + "\n</body>\n</html>\n")
    print(f, round(os.path.getsize(f) / 1e6, 2), "MB")


if __name__ == "__main__":
    main()

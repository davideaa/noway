#!/usr/bin/env python3
"""Costruisce il sito statico del Cosmo Hotel Palace (restyling) in out/.

  python3 scripts/foto.py          # una volta: scarica le foto dal sito ufficiale in foto-src/
  python3 build.py                 # sito normale in out/
  python3 build.py --artifact      # come sopra, ma la home e' un frammento per l'anteprima su Claude

Stessa struttura e stessi indirizzi del sito ufficiale; testi presi dal sito ufficiale.
Foto: solo quelle pubblicate su www.cosmohotelpalace.it (non entrano nel repo).
"""
import html, json, os, shutil, sys
from PIL import Image

QUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(QUI, "out")
SRC = os.path.join(QUI, "foto-src")
ARTIFACT = "--artifact" in sys.argv
e = html.escape

MOTORE = "https://reservations.verticalbooking.com/premium/index2.html?id_albergo=146&dc=785&lingua_int=ita&id_stile=19500"
TEL, TEL_HREF = "+39 02 617771", "tel:+3902617771"
EMAIL = "info@cosmohotelpalace.it"
INDIRIZZO = "Via F. De Sanctis, 5 – 20092 Cinisello Balsamo (MI)"
MAPPA = "https://www.google.com/maps/search/?api=1&query=Cosmo+Hotel+Palace+Via+De+Sanctis+5+Cinisello+Balsamo"
INSTAGRAM = "https://www.instagram.com/cosmohotelpalace/"
FACEBOOK = "https://www.facebook.com/profile.php?id=100071873230654"
PRIVACY = "https://www.cosmohotelpalace.it/privacy-policy"

# ---------------------------------------------------------------- foto
FOTO = {
    "facciata": ("2-cosmo-hotel-palace-gallery", "La facciata del Cosmo Hotel Palace illuminata la sera"),
    "hall": ("1-homepage", "La hall con la scultura in legno d'ulivo sotto il lucernario"),
    "hall2": ("1-cosmo-hotel-palace-gallery", "La hall luminosa con la scultura d'ulivo e l'ingresso a vetri"),
    "ingresso": ("3-cosmo-hotel-palace-gallery", "L'ingresso dell'hotel con la pensilina in vetro"),
    "reception": ("cosmohotelpalace-2-simonabrunoph", "La reception"),
    "orchidee": ("1-ristorante-cosmo-grill-gallery", "Gli spazi comuni con tende leggere e orchidee"),
    "lounge": ("1-lounge-bar", "Il banco del Lounge Bar con le orchidee"),
    "lounge2": ("lounge-82-002", "Un angolo del Lounge Bar con divano e libreria"),
    "salotto": ("salottino-036", "Il salottino del Lounge Bar con poltrone in legno"),
    "bar": ("bar-04", "Il Lounge Bar con tende leggere e salottini"),
    "grill": ("cosmohotelpalace-3-simonabrunoph", "Il Cosmo Grill con le grandi lampade a paralume"),
    "grill2": ("cosmohotelpalace-20-simonabrunoph", "La sala del Cosmo Grill con travi a vista"),
    "grill3": ("cosmohotelpalace-5-simonabrunoph", "Tavolo apparecchiato al Cosmo Grill"),
    "grill4": ("cosmohotelpalace-19-simonabrunoph", "Il Cosmo Grill con specchi e mensole"),
    "grill5": ("cosmohotelpalace-4-simonabrunoph", "Tavoli del Cosmo Grill accanto alle vetrate"),
    "grill6": ("2-ristorante-cosmo-grill", "Il Cosmo Grill apparecchiato per la cena"),
    "grill7": ("2-ristorante-cosmo-grill-gallery", "La sala del Cosmo Grill"),
    "classic": ("cosmohotelpalace-7-simonabrunoph-classic-double-room", "Classic Double Room con letto matrimoniale e scrivania"),
    "classic2": ("rooms-1", "Classic Double Room con testiera imbottita e stampe"),
    "classic-bagno": ("cosmohotelpalace-11-simonabrunoph", "Bagno con vasca e specchio con cornice dorata"),
    "camera-a": ("cosmohotelpalace-10-simonabrunoph-comfort-single-room", "Camera con letto matrimoniale e scrivania"),
    "camera-b": ("cosmohotelpalace-12-simonabrunoph-comfort-single-room", "Camera con abat-jour e grande finestra"),
    "camera-c": ("cosmohotelpalace-9-simonabrunoph-comfort-single-room", "Camera con TV a parete e scrivania"),
    "camera-twin": ("cosmohotelpalace-8-simonabrunoph", "Camera con due letti"),
    "family": ("cosmohotelpalace-14-simonabrunoph-family-room", "Family Room: due camere comunicanti"),
    "family2": ("family-rooms-1", "Family Room con letto singolo e scrivania"),
    "family3": ("1-family-room", "Family Room con letto matrimoniale"),
    "family4": ("cosmohotelpalace-15-simonabrunoph-family-room", "Family Room, la camera con scrivania"),
    "family5": ("3-family-room-gallery", "Il letto matrimoniale della Family Room"),
    "family-bagno": ("cosmohotelpalace-18-simonabrunoph", "Bagno con doccia e specchio"),
    "suite": ("cosmohotelpalace-13-simonabrunoph-suite", "Suite: la camera matrimoniale"),
    "suite2": ("1-suite", "Suite: il soggiorno con la scrivania e la camera"),
    "suite3": ("cosmohotelpalace-16-simonabrunoph-suite", "Suite con scrivania e porta verso la camera"),
    "suite4": ("suites-1", "Suite con letto e mobile laccato"),
    "suite5": ("cosmohotelpalace-17-simonabrunoph-suite", "Il soggiorno della Suite con divano"),
    "plenaria": ("1-homepage-meeting-eventi", "Sala plenaria del Centro Congressi allestita a platea"),
    "plenaria2": ("cosmohotelpalace-1-simonabrunoph", "Plenaria con palco e platea"),
    "divinita": ("1-centro-congressi-divinita", "Sala delle Divinità con il tavolo dei relatori"),
    "sala-banchi": ("2-centro-congressi-gallery", "Sala meeting allestita a banchi di scuola"),
    "sala-banchetto": ("cosmohotelpalace-6-simonabrunoph", "Sala allestita a banchetto con tavoli rotondi"),
    "sala-ferro": ("3-centro-congressi-gallery", "Sala riunioni allestita a ferro di cavallo"),
    "sala-imperiale": ("4-centro-congressi-gallery", "Sala riunioni con tavolo imperiale"),
    "gala": ("6-centro-congressi-gallery", "Plenaria allestita per una cena di gala"),
    "eventi": ("1-eventi-aziendali-e-privati", "Sala allestita per un evento privato"),
    "wellness": ("1-wellness-and-fitness", "L'area relax del centro benessere con i lettini"),
    "wellness2": ("area-benessere-089", "Area benessere con lettini in legno"),
    "palestra": ("2-wellness-and-fitness", "La sala fitness con tapis roulant e cyclette"),
    "palestra2": ("gym-02", "Tapis roulant e cyclette nella sala fitness"),
    "duomo": ("duomo", "Il Duomo di Milano di notte"),
    "corso": ("corso-vittorio-emanuele-ii-2", "Corso Vittorio Emanuele II con il Duomo sullo sfondo"),
    "galleria": ("galleria", "La Galleria Vittorio Emanuele II"),
    "grazie": ("santa-maria-delle-grazie", "Santa Maria delle Grazie, sede del Cenacolo Vinciano"),
    "reggia": ("reggia-di-monza-min-1-compressed", "La Reggia di Monza"),
    "parco": ("parco-di-monza", "Il Parco di Monza"),
    "autodromo": ("autodromo-nazionale-monza", "L'Autodromo Nazionale di Monza"),
    "duomo-monza": ("duomo-di-monza", "Il Duomo di Monza"),
    "arengario": ("arengario", "L'Arengario di Monza"),
    "leolandia": ("parchi-divertimento", "Leolandia"),
    "carlotta": ("villa-carlotta", "Villa Carlotta sul Lago di Como"),
    "torri": ("cosmo-hotel-torri-8294579456-o", "Cosmo Hotel Torri"),
    "residence": ("cosmo-residence-7879889702-o", "Cosmo Residence"),
    "trivulzio": ("villa-trivulzio", "Villa Trivulzio vista dall'alto"),
}
DIM = {}


def prepara_foto():
    d = os.path.join(OUT, "foto"); os.makedirs(d, exist_ok=True)
    for k, (f, _) in FOTO.items():
        im = Image.open(os.path.join(SRC, f + ".jpg")).convert("RGB")
        DIM[k] = im.size
        for suff, lato, q in (("", 1920, 80), ("-m", 960, 78)):
            dst = os.path.join(d, f"{k}{suff}.webp")
            if not os.path.exists(dst):
                c = im.copy(); c.thumbnail((lato, lato)); c.save(dst, "WEBP", quality=q, method=6)
    for n in ("logo-chiaro.png", "logo-scuro.png"):
        shutil.copy(os.path.join(SRC, n), os.path.join(d, n))


# ---------------------------------------------------------------- icone (tratto 1,3)
IC = {
    "mq": '<path d="M4 4h16v16H4z"/><path d="M4 9h3M4 14h3M9 20v-3M14 20v-3"/>',
    "letto": '<path d="M3 18v-7h18v7M3 14h18M5 11V7h6v4M13 11V8h6v3M3 18v2M21 18v2"/>',
    "persone": '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.8.3 5 2.5 5 5.8"/>',
    "wifi": '<path d="M2.5 9.5a14 14 0 0 1 19 0M5.5 12.8a9.5 9.5 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19" r=".9"/>',
    "tv": '<rect x="3" y="5" width="18" height="12" rx="1"/><path d="M8 21h8M12 17v4"/>',
    "clima": '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
    "cassaforte": '<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V10M7 20v1.5M17 20v1.5"/>',
    "minibar": '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M5 9h14M8 6h2M8 12v3"/>',
    "cortesia": '<path d="M9 3h6v4H9zM8 7h8l1 4v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9z"/><path d="M7 13h10"/>',
    "bagno": '<path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM5 12V5a2 2 0 0 1 4 0M7 20l-1 1.5M17 20l1 1.5"/>',
    "caffe": '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>',
    "accappatoio": '<path d="M8 3 12 7l4-4 4 3-2 4v11H6V10L4 6z"/><path d="M12 7v14M6 14h12"/>',
    "porta": '<path d="M6 21V3h10v18M3 21h18M13 12h.01"/><path d="M16 5l4 1v15"/>',
    "culla": '<path d="M4 10h16v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM4 10V7M20 10V7M8 19l-1 2M16 19l1 2"/>',
    "auto": '<path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 19v2M17 19v2"/><circle cx="7.5" cy="13.5" r=".8"/><circle cx="16.5" cy="13.5" r=".8"/>',
    "tram": '<rect x="6" y="5" width="12" height="13" rx="2"/><path d="M6 12h12M9 21l1.5-3M15 21l-1.5-3M9 2h6M12 2v3"/><circle cx="9" cy="15" r=".8"/><circle cx="15" cy="15" r=".8"/>',
    "aereo": '<path d="M10.5 21 12 17l4.5 1-.5-2-4-2V8.5L12 3l-.5 5.5v5.5l-4 2-.5 2 4.5-1z"/><path d="M3 12l8.5-2M21 12l-8.5-2"/>',
    "accessibile": '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5h14M12 8.5v5l4 7M12 13.5l-4 7"/>',
    "parcheggio": '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    "sala": '<path d="M3 20V6l9-3 9 3v14M3 20h18M8 20v-5h8v5"/>',
    "sauna": '<path d="M4 20h16M6 20V10l6-5 6 5v10"/><path d="M10 9c-1 1.2 1 1.8 0 3M14 9c-1 1.2 1 1.8 0 3"/>',
    "fitness": '<path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/>',
    "orologio": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}


def icona(n):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">{IC[n]}</svg>'


# ---------------------------------------------------------------- pagine e navigazione
PAGINE = {
    "home": ("", "Hotel"),
    "camere": ("camere-suites/", "Camere & Suites"),
    "classic": ("camere-suites/camere/classic-room/", "Classic Double Room"),
    "family": ("camere-suites/camere/family-room/", "Family Room"),
    "suite": ("camere-suites/suite/", "Suite"),
    "meeting": ("meeting-ed-eventi/", "Meeting ed eventi"),
    "ristoranti": ("ristoranti/", "Ristoranti"),
    "foto": ("foto-video/", "Foto e video"),
    "wellness": ("fitness-wellness/", "Fitness & Wellness"),
    "contatti": ("contatti-location/", "Contatti e Location"),
    "partners": ("hotel-partners/", "Hotel Partners"),
}
NAV = ["home", "camere", "meeting", "ristoranti", "foto"]
ALTRO = ["wellness", "contatti", "partners"]


class Pagina:
    def __init__(self, chiave):
        self.k = chiave
        self.path = PAGINE[chiave][0]
        self.R = "../" * self.path.count("/")

    def url(self, k, ancora=""):
        return self.R + PAGINE[k][0] + "index.html" + ancora

    def img(self, k, cls="", sizes="100vw", eager=False, alt=None):
        w, h = DIM[k]
        a = FOTO[k][1] if alt is None else alt
        return (f'<img src="{self.R}foto/{k}-m.webp" srcset="{self.R}foto/{k}-m.webp 960w, {self.R}foto/{k}.webp 1920w" '
                f'sizes="{sizes}" width="{w}" height="{h}" alt="{e(a)}"' + (f' class="{cls}"' if cls else "") +
                (' fetchpriority="high"' if eager else ' loading="lazy"') + ' decoding="async">')

    def zoom(self, k, sizes="(max-width: 700px) 100vw, 50vw", extra=""):
        return (f'<button type="button" data-grande="{self.R}foto/{k}.webp" data-alt="{e(FOTO[k][1])}" '
                f'aria-label="Ingrandisci: {e(FOTO[k][1])}">{self.img(k, sizes=sizes)}{extra}</button>')

    def corrente(self, k):
        attivo = self.k == k or (k == "camere" and self.k in ("classic", "family", "suite"))
        return ' aria-current="page"' if attivo else ""


def modulo_prenota(id_):
    sel = lambda nome, etichetta, da, a, val: (
        f'<div class="campo"><label for="{id_}-{nome}">{etichetta}</label><select id="{id_}-{nome}" name="{nome}">' +
        "".join(f'<option value="{n}"{" selected" if n == val else ""}>{n}</option>' for n in range(da, a + 1)) + "</select></div>")
    return f"""<form class="modulo-prenota" novalidate aria-label="Verifica disponibilità">
  <div class="campo campo-data"><label for="{id_}-arrivo">Arrivo</label><input id="{id_}-arrivo" name="arrivo" type="date" required></div>
  <div class="campo campo-data"><label for="{id_}-partenza">Partenza</label><input id="{id_}-partenza" name="partenza" type="date" required></div>
  {sel("camere", "Camere", 1, 4, 1)}
  {sel("adulti", "Adulti", 1, 8, 2)}
  {sel("bambini", "Bambini", 0, 4, 0)}
  <div class="invia"><a class="btn btn-pieno cerca" href="{MOTORE}" target="_blank" rel="noopener">Prenota ora</a></div>
  <div class="garanzia"><span><b>Migliori tariffe garantite</b> prenotando sul sito ufficiale</span><span class="errore" role="alert"></span><span>Prenotazione sicura · si apre in una nuova scheda</span></div>
</form>"""


def testata(p, su_foto):
    nav = "".join(f'<a href="{p.url(k)}"{p.corrente(k)}>{PAGINE[k][1]}</a>' for k in NAV)
    altro = "".join(f'<a href="{p.url(k)}"{p.corrente(k)}>{PAGINE[k][1]}</a>' for k in ALTRO)
    tutte = "".join(f'<a href="{p.url(k)}"{p.corrente(k)}>{PAGINE[k][1]}</a>' for k in NAV + ALTRO)
    return f"""<a class="salta" href="#contenuto">Vai al contenuto</a>
<div class="barra-alta"><div class="wrap"><span>{e(INDIRIZZO)} · Milano</span><span class="contatti"><a href="{TEL_HREF}">{TEL}</a><a href="mailto:{EMAIL}">{EMAIL}</a></span></div></div>
<header class="testata">
  <div class="wrap">
    <a class="logo" href="{p.url('home')}" aria-label="Cosmo Hotel Palace, home">
      <img class="scuro" src="{p.R}foto/logo-scuro.png" width="600" height="75" alt="Cosmo Hotel Palace">
      <img class="chiaro" src="{p.R}foto/logo-chiaro.png" width="500" height="63" alt="Cosmo Hotel Palace">
    </a>
    <nav class="nav" aria-label="Principale">{nav}
      <div class="altro"><button type="button" aria-expanded="false">Altro</button><div class="tendina">{altro}</div></div>
    </nav>
    <div class="azioni-testata">
      <span class="lingua"><b>IT</b> · EN</span>
      <a class="btn btn-pieno" href="{MOTORE}" target="_blank" rel="noopener" data-prenota>Prenota ora</a>
      <button class="btn-menu" type="button" aria-expanded="false" aria-controls="menu-mobile" aria-label="Apri il menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="menu-mobile" id="menu-mobile" hidden role="dialog" aria-modal="true" aria-label="Menu">
  <div class="riga"><img src="{p.R}foto/logo-chiaro.png" width="200" height="25" alt="Cosmo Hotel Palace"><button class="chiudi" type="button" aria-label="Chiudi il menu">×</button></div>
  <nav aria-label="Menu">{tutte}</nav>
  <div class="contatti-menu"><span>{e(INDIRIZZO)}</span><a href="{TEL_HREF}">{TEL}</a><a href="mailto:{EMAIL}">{EMAIL}</a>
    <a class="btn btn-chiaro" href="{MOTORE}" target="_blank" rel="noopener" data-prenota style="margin-top:14px">Prenota ora</a></div>
</div>"""


def piede(p):
    return f"""<footer class="piede">
  <div class="wrap">
    <div class="colonne">
      <div>
        <img class="logo-piede" src="{p.R}foto/logo-chiaro.png" width="500" height="63" alt="Cosmo Hotel Palace">
        <p>Lo stile italiano dell'ospitalità alle porte di Milano.<br>Hotel &amp; Centro Congressi a 2 km da Milano.</p>
        <div class="social"><a href="{INSTAGRAM}" target="_blank" rel="noopener">Instagram</a><a href="{FACEBOOK}" target="_blank" rel="noopener">Facebook</a></div>
      </div>
      <div><h4>Dove siamo</h4><p>Via F. De Sanctis, 5<br>20092 Cinisello Balsamo<br>Milano · Italia</p><p style="margin-top:14px"><a href="{MAPPA}" target="_blank" rel="noopener">Indicazioni stradali</a></p></div>
      <div><h4>Contatti</h4><ul>
        <li>Prenotazioni <a href="{TEL_HREF}">{TEL}</a></li>
        <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
        <li>Eventi <a href="tel:+390261777726">+39 02 61 777 726</a></li>
        <li><a href="mailto:events@cosmohotelpalace.it">events@cosmohotelpalace.it</a></li></ul></div>
      <div><h4>Il sito</h4><ul>{"".join(f'<li><a href="{p.url(k)}">{PAGINE[k][1]}</a></li>' for k in ["camere", "meeting", "ristoranti", "wellness", "foto", "contatti", "partners"])}</ul></div>
    </div>
    <div class="firma"><span>© Cosmo Hotel Palace · CIN IT015077A1P24TCBBO</span><span><a href="{PRIVACY}" target="_blank" rel="noopener">Privacy Policy</a> · #YOURCOSMOHOTELPALACE</span></div>
  </div>
</footer>
<div class="prenota-mobile"><a class="btn btn-linea" href="{TEL_HREF}">Chiama</a><a class="btn btn-pieno" href="{MOTORE}" target="_blank" rel="noopener" data-prenota>Prenota ora</a></div>
<dialog class="finestra" id="finestra-prenota" aria-labelledby="titolo-prenota">
  <div class="capo"><h2 class="titolo-m" id="titolo-prenota">Verifica la disponibilità</h2><button class="chiudi" type="button" aria-label="Chiudi">×</button></div>
  <div class="prenota">{modulo_prenota("dlg")}</div>
</dialog>
<dialog class="lightbox" id="lightbox" aria-label="Galleria fotografica"><figure><img alt=""><figcaption></figcaption></figure>
  <button class="chiudi" type="button" aria-label="Chiudi">×</button><button class="prec" type="button" aria-label="Foto precedente">←</button><button class="succ" type="button" aria-label="Foto successiva">→</button></dialog>
<script src="{p.R}assets/site.js"></script>"""


def documento(p, titolo, descrizione, corpo, su_foto=True):
    testa = (f'<title>{e(titolo)}</title>\n<meta name="description" content="{e(descrizione)}">\n'
             '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
             '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;350;400;450;500&display=swap">\n'
             f'<link rel="stylesheet" href="{p.R}assets/site.css">')
    pagina = (f'<div class="{"su-foto" if su_foto else ""}">{testata(p, su_foto)}\n<main id="contenuto">\n{corpo}\n</main>\n{piede(p)}</div>')
    if ARTIFACT and p.k == "home":
        return testa + "\n" + pagina + "\n"
    return (f'<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f'{testa}\n</head>\n<body>\n{pagina}\n</body>\n</html>\n')


def copertina(p, foto, occhiello, titolo, briciole=()):
    b = "".join(f'<a href="{p.url(k)}">{PAGINE[k][1]}</a><span aria-hidden="true">/</span>' for k in ("home",) + tuple(briciole))
    return f"""<section class="copertina">{p.img(foto, eager=True)}
  <div class="contenuto wrap"><nav class="briciole" aria-label="Percorso">{b}<span>{e(PAGINE[p.k][1])}</span></nav>
  <p class="occhiello">{occhiello}</p><h1 class="titolo-xl" style="margin-top:18px">{titolo}</h1></div></section>"""


CAMERE = {
    "classic": dict(nome="Classic Double Room", mq=22, letti="1 letto matrimoniale da 160 cm", ospiti="2 adulti", ambienti="1 camera, bagno con vasca o doccia",
                    breve="Design moderno e confortevole: luminosa, ariosa, con un'impeccabile attenzione ai dettagli.",
                    testo=["La Classic Double Room è pensata per chi cerca una soluzione dal design moderno e confortevole.",
                           "La camera doppia, luminosa e ariosa, offre un letto matrimoniale da 160 cm, un bagno con vasca o doccia e un'impeccabile attenzione ai dettagli. Stile moderno e funzionale, tonalità delicate e naturali: un'esperienza di soggiorno pratica e confortevole."],
                    foto=["classic", "classic2", "classic-bagno"], extra=[]),
    "family": dict(nome="Family Room", mq=44, letti="2 camere comunicanti", ospiti="2 adulti e 2 bambini", ambienti="2 camere, ognuna con il suo bagno",
                   breve="Due camere Classic comunicanti, ognuna con il proprio bagno: lo spazio giusto per tutta la famiglia.",
                   testo=["Ampie e accoglienti, le Family Room sono costituite dalla combinazione di due camere Classic comunicanti: una con letto matrimoniale, l'altra con due letti singoli.",
                          "Entrambe hanno il proprio bagno con vasca o doccia. Un ambiente di design dai colori neutri, dotato di ogni comfort, che accoglie fino a quattro persone."],
                   foto=["family", "family3", "family5", "family2", "family4", "family-bagno"],
                   extra=[("culla", "Possibilità di aggiungere un letto supplementare singolo o una culla")]),
    "suite": dict(nome="Suite", mq=44, letti="1 letto matrimoniale + 1 divano letto", ospiti="4 adulti, oppure 2 adulti e 2 bambini", ambienti="Soggiorno e camera con ingressi separati, 2 bagni",
                  breve="Due ambienti con ingressi separati: un soggiorno per lavorare e ricevere, una camera per riposare.",
                  testo=["Le Suite del Cosmo Hotel Palace dispongono di due ambienti con ingressi separati. Da un lato la zona soggiorno, con un comodo divano per rilassarsi e un'ampia scrivania dove lavorare e svolgere piccole riunioni.",
                         "Dall'altro, la camera matrimoniale con pratico armadio. Le suite hanno due bagni separati, con vasca o doccia: tutta l'eleganza da vivere in un soggiorno di piacere o in un viaggio d'affari."],
                  foto=["suite", "suite2", "suite5", "suite3", "suite4"],
                  extra=[("caffe", "Coffee maker con prodotti selezionati"), ("cortesia", "Ricco set di cortesia"),
                         ("accappatoio", "Accappatoio morbido e pantofole"), ("porta", "Pratico stirapantaloni")]),
}
DOTAZIONI = [("wifi", "Connessione Wi-Fi gratuita"), ("tv", "TV satellitare: 28 canali stranieri, Sky TV e Sky Sport"),
             ("clima", "Climatizzazione regolabile"), ("cortesia", "Funzionale set di cortesia"), ("cassaforte", "Cassaforte"),
             ("minibar", "Minibar, rifornibile dal distributore self-service al piano")]


# ---------------------------------------------------------------- HOME
def home():
    p = Pagina("home")
    diapo = [("facciata", "Hotel & Centro Congressi · Milano"), ("hall", "La hall"), ("grill", "Ristorante Cosmo Grill"), ("suite", "Le Suite")]
    slides = "".join(f'<div class="diapo{" attiva" if i == 0 else ""}">{p.img(k, eager=(i == 0)) if i == 0 else p.img(k)}</div>' for i, (k, _) in enumerate(diapo))
    punti = "".join(f'<button type="button" aria-label="Foto {i+1}: {e(t)}" aria-current="{"true" if i == 0 else "false"}"></button>' for i, (_, t) in enumerate(diapo))
    camere = "".join(f"""<a class="camera compare" href="{p.url(k)}">
      <div class="foto">{p.img(CAMERE[k]["foto"][0], sizes="(max-width: 900px) 78vw, 30vw")}</div>
      <div class="dati"><span>{CAMERE[k]["mq"]} m²</span><span>{e(CAMERE[k]["ospiti"].split(",")[0])}</span></div>
      <h3>{CAMERE[k]["nome"]}</h3><p>{e(CAMERE[k]["breve"])}</p></a>""" for k in ("classic", "suite", "family"))
    luoghi = "".join(luogo(p, l) for l in DINTORNI if l[3])
    mosaico = "".join(f'<a href="{INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram: {e(FOTO[k][1])}">{p.img(k, sizes="(max-width: 760px) 33vw, 17vw")}</a>'
                      for k in ("hall2", "grill3", "suite2", "lounge", "wellness", "orchidee"))
    corpo = f"""<section class="hero" aria-label="Cosmo Hotel Palace">
  {slides}
  <div class="contenuto wrap">
    <p class="occhiello">Hotel &amp; Centro Congressi · A 2 km da Milano</p>
    <h1 class="titolo-xl" style="margin-top:22px">Lo stile italiano dell'ospitalità, <em>alle porte di Milano</em></h1>
    <p class="sotto">Soggiorni d'affari e di piacere in una posizione strategica tra Milano e Monza.</p>
  </div>
  <div class="punti-diapo">{punti}</div>
</section>
<div class="wrap prenota-home"><div class="prenota">{modulo_prenota("home")}</div></div>

<section class="sezione">
  <div class="wrap">
    <div class="intro">
      <div class="collage compare">{p.img("hall", "grande", "(max-width: 900px) 80vw, 40vw")}{p.img("lounge", "piccola", "(max-width: 900px) 50vw, 24vw")}<span class="etichetta">Cinisello Balsamo · Milano</span></div>
      <div class="testo compare">
        <p class="occhiello">Benvenuti</p>
        <h2 class="titolo-l">Un'impresa di famiglia, una casa elegante a <em>2 km da Milano</em></h2>
        <p class="lead">Il Cosmo Hotel Palace nasce dall'idea e dalla creatività di un'impresa familiare italiana, che ogni giorno si dedica con passione all'ospitalità per rendere ogni permanenza unica.</p>
        <p>All'esterno, una struttura dall'architettura classica. All'interno, volumi ampi, luminosi e dal design contemporaneo: una sintesi di modernità ed eleganza, ideale per chi viaggia per business o per piacere e per chi cerca la location perfetta per meeting ed eventi.</p>
        <p><a class="link-freccia" href="{p.url('foto')}">Scopri l'hotel in foto</a></p>
      </div>
    </div>
    <div class="cifre">
      <div class="cifra"><b>201</b><span>camere e suite, dallo stile fresco e senza tempo</span></div>
      <div class="cifra"><b>900</b><span>ospiti nel Centro Congressi, con un team dedicato</span></div>
      <div class="cifra"><b>200</b><span>posti auto e un'area riservata agli autobus</span></div>
      <div class="cifra"><b>2<small>km</small></b><span>da Milano, con il tram 31 per la metro M5 Bignami</span></div>
    </div>
  </div>
</section>

<section class="sezione sabbia">
  <div class="wrap">
    <div class="testa-sezione"><div><p class="occhiello">Camere &amp; Suites</p><h2 class="titolo-l">201 camere finemente arredate, <em>pensate per riposare</em></h2>
      <p class="tenue">Stile contemporaneo, toni naturali, dettagli ricercati e tessuti di pregio. L'hotel è strutturato senza barriere architettoniche.</p></div>
      <a class="link-freccia" href="{p.url('camere')}">Tutte le camere</a></div>
    <div class="camere">{camere}</div>
  </div>
</section>

<section class="sezione notte">
  <div class="wrap divisa">
    <div class="coppia-foto compare">{p.img("grill", sizes="(max-width: 900px) 58vw, 32vw")}{p.img("bar", sizes="(max-width: 900px) 40vw, 22vw")}</div>
    <div class="corpo compare">
      <p class="occhiello">Ristorante &amp; Lounge Bar</p>
      <h2 class="titolo-l">Cosmo Grill, la cucina milanese <em>con un pizzico di creatività</em></h2>
      <p class="lead">Immerso in uno stile raffinato dagli accenti contemporanei, il Cosmo Grill propone una cucina di qualità ispirata alla tradizione locale. Il Lounge Bar è il luogo per un aperitivo con gli amici o una pausa dal lavoro.</p>
      <dl class="orari"><div><dt>Cosmo Grill · Cena</dt><dd>19.30 – 22.30</dd></div><div><dt>Lounge Bar</dt><dd>7.00 – 24.00</dd></div></dl>
      <p><a class="link-freccia" href="{p.url('ristoranti')}">Ristorante e lounge bar</a></p>
    </div>
  </div>
</section>

<section class="banda">{p.img("plenaria")}
  <div class="contenuto wrap"><div class="pannello compare">
    <p class="occhiello">Meeting ed eventi</p>
    <h2 class="titolo-l">La location strategica per i tuoi eventi, <em>a 2 km da Milano</em></h2>
    <p>Eleganza e tecnologia: un Centro Congressi su due piani, con vetrate e luce naturale, pareti mobili per dividere gli spazi e un team dedicato a ogni dettaglio.</p>
    <div class="mini-cifre"><div><b>900</b><span>ospiti</span></div><div><b>13</b><span>sale meeting</span></div><div><b>2</b><span>piani</span></div></div>
    <p><a class="btn btn-chiaro" href="{p.url('meeting')}">Vedi le sale meeting</a></p>
  </div></div>
</section>

<section class="sezione">
  <div class="wrap divisa inversa">
    <div class="compare">{p.img("wellness", "foto-alta", "(max-width: 900px) 100vw, 52vw")}</div>
    <div class="corpo compare">
      <p class="occhiello">Fitness &amp; Wellness · 6° piano</p>
      <h2 class="titolo-l">Equilibrio e armonia <em>per corpo e mente</em></h2>
      <p class="lead">Sauna finlandese e bagno turco per rigenerarsi, una sala attrezzi moderna per l'esercizio quotidiano.</p>
      <dl class="orari"><div><dt>Aperto tutti i giorni</dt><dd>7.00 – 22.00</dd></div></dl>
      <p><a class="link-freccia" href="{p.url('wellness')}">Il centro benessere</a></p>
    </div>
  </div>
</section>

<section class="sezione sabbia">
  <div class="wrap">
    <div class="testa-sezione"><div><p class="occhiello">La location</p><h2 class="titolo-l">Tra Milano, Monza <em>e il Lago di Como</em></h2>
      <p class="tenue">Vicino alle principali autostrade e al tram 31, che in poche fermate porta alla metro M5 di Bignami.</p></div>
      <div class="frecce"><button type="button" data-scorri="luoghi-home" data-dir="-1" aria-label="Indietro">←</button><button type="button" data-scorri="luoghi-home" data-dir="1" aria-label="Avanti">→</button></div></div>
    <div class="luoghi" id="luoghi-home" tabindex="0" aria-label="Luoghi da visitare">{luoghi}</div>
    <p style="margin-top:36px"><a class="link-freccia" href="{p.url('contatti')}">Come raggiungerci</a></p>
  </div>
</section>

<section class="sezione">
  <div class="wrap">
    <div class="testa-sezione"><div><p class="occhiello">Seguici</p><h2 class="hashtag">#YOURCOSMOHOTELPALACE</h2></div>
      <a class="link-freccia" href="{INSTAGRAM}" target="_blank" rel="noopener">@cosmohotelpalace</a></div>
    <div class="mosaico">{mosaico}</div>
  </div>
</section>"""
    return p, documento(p, "Cosmo Hotel Palace", "Hotel e centro congressi a 2 km da Milano: 201 camere e suite, ristorante Cosmo Grill, centro benessere e sale meeting fino a 900 persone.", corpo)


# ---------------------------------------------------------------- CAMERE
def camere():
    p = Pagina("camere")
    blocchi = ""
    for i, k in enumerate(("classic", "family", "suite")):
        c = CAMERE[k]
        blocchi += f"""<article class="divisa{" inversa" if i % 2 else ""}">
  <div class="compare">{p.img(c["foto"][0], "foto-larga", "(max-width: 900px) 100vw, 55vw")}</div>
  <div class="corpo compare"><p class="occhiello">{c["mq"]} m² · {e(c["ospiti"])}</p><h2 class="titolo-l">{c["nome"]}</h2>
    <p class="lead">{e(c["breve"])}</p><p class="tenue">{e(c["testo"][0])}</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap"><a class="btn btn-pieno" href="{p.url(k)}">Scopri la camera</a><a class="btn btn-linea" href="{MOTORE}" target="_blank" rel="noopener" data-prenota>Prenota</a></div></div>
</article>"""
    dot = "".join(f"<li>{icona(i)}<span>{t}</span></li>" for i, t in DOTAZIONI + [("accessibile", "Hotel senza barriere architettoniche")])
    corpo = f"""{copertina(p, "camera-a", "201 camere e suite", "Camere <em>&amp;</em> Suites")}
<section class="sezione"><div class="wrap introduzione">
  <h2 class="titolo-l compare">Finemente arredate, con grande cura <em>del dettaglio e del comfort</em></h2>
  <div class="testo compare"><p class="lead">Il Cosmo Hotel Palace, con la sua atmosfera accogliente e luminosa, offre 201 camere dotate di ogni servizio, in cui trovare la soluzione ideale per le esigenze di business e di relax.</p>
  <p>Stile contemporaneo, toni naturali, dettagli ricercati e tessuti di pregio si declinano in Camere Classic, Family Room e Suite. L'hotel è strutturato senza barriere architettoniche.</p></div>
</div></section>
<section class="sezione" style="padding-top:0"><div class="wrap elenco-camere">{blocchi}</div></section>
<section class="sezione sabbia"><div class="wrap introduzione">
  <div><p class="occhiello">In tutte le camere</p><h2 class="titolo-m" style="margin-top:18px">Ogni comfort, già pensato</h2></div>
  <ul class="dotazioni">{dot}</ul>
</div></section>
<section class="sezione"><div class="wrap"><div class="testa-sezione"><div><p class="occhiello">Per informazioni</p><h2 class="titolo-m">Ufficio Prenotazioni</h2></div></div>
  <p class="lead">Scrivi a <a href="mailto:{EMAIL}">{EMAIL}</a> o chiama il <a href="{TEL_HREF}">{TEL}</a>.</p></div></section>"""
    return p, documento(p, "Camere & Suites · Cosmo Hotel Palace", "201 camere e suite vicino a Milano: Classic Double Room, Family Room e Suite.", corpo)


def scheda_camera(k):
    p = Pagina(k)
    c = CAMERE[k]
    fotos = c["foto"]
    gal = "".join(p.zoom(f, extra=('<span class="tutte">Tutte le foto · ' + str(len(fotos)) + "</span>" if i == min(2, len(fotos) - 1) else "")) for i, f in enumerate(fotos[:3]))
    nascoste = "".join(f'<span hidden>{p.zoom(f)}</span>' for f in fotos[3:])
    dot = "".join(f"<li>{icona(i)}<span>{e(t)}</span></li>" for i, t in c["extra"] + DOTAZIONI)
    altre = "".join(f"""<a class="altra" href="{p.url(o)}">{p.img(CAMERE[o]["foto"][0], sizes="(max-width: 700px) 100vw, 50vw")}<div><span>{CAMERE[o]["mq"]} m² · {e(CAMERE[o]["ospiti"].split(",")[0])}</span><h3>{CAMERE[o]["nome"]}</h3></div></a>"""
                    for o in ("classic", "family", "suite") if o != k)
    corpo = f"""<section class="sezione" style="padding-top:calc(var(--header-h) + 48px)">
  <div class="wrap">
    <nav class="briciole" aria-label="Percorso" style="color:var(--tenue)"><a href="{p.url('home')}">Hotel</a><span aria-hidden="true">/</span><a href="{p.url('camere')}">Camere &amp; Suites</a><span aria-hidden="true">/</span><span>{c["nome"]}</span></nav>
    <div class="testa-sezione"><div><p class="occhiello">{c["mq"]} m² · {e(c["ospiti"])}</p><h1 class="titolo-xl">{c["nome"]}</h1></div>
      <a class="btn btn-pieno" href="{MOTORE}" target="_blank" rel="noopener" data-prenota>Prenota ora</a></div>
    <div class="galleria-camera" data-galleria>{gal}{nascoste}</div>
  </div>
</section>
<section class="sezione" style="padding-top:0">
  <div class="wrap scheda">
    <div style="display:grid;gap:48px">
      <div class="testo"><p class="lead">{e(c["testo"][0])}</p><p>{e(c["testo"][1])}</p></div>
      <div><h2 class="titolo-m" style="margin-bottom:18px">Caratteristiche</h2><ul class="dotazioni">{dot}</ul></div>
      <p class="nota">Per un soggiorno su misura o per richieste particolari, l'Ufficio Prenotazioni risponde a <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
    </div>
    <aside aria-label="In breve">
      <div class="grande">{c["mq"]}<small> m²</small></div>
      <dl><div><dt>Letti</dt><dd>{e(c["letti"])}</dd></div><div><dt>Ospiti</dt><dd>{e(c["ospiti"])}</dd></div><div><dt>Ambienti</dt><dd>{e(c["ambienti"])}</dd></div></dl>
      <a class="btn btn-pieno" href="{MOTORE}" target="_blank" rel="noopener" data-prenota>Verifica disponibilità</a>
      <p class="info">Ufficio Prenotazioni<br><a href="{TEL_HREF}">{TEL}</a> · <a href="mailto:{EMAIL}">{EMAIL}</a></p>
    </aside>
  </div>
</section>
<section class="sezione sabbia"><div class="wrap"><div class="testa-sezione"><div><p class="occhiello">Le altre soluzioni</p><h2 class="titolo-l">Scegli lo spazio <em>che fa per te</em></h2></div><a class="link-freccia" href="{p.url('camere')}">Tutte le camere</a></div>
  <div class="altre">{altre}</div></div></section>"""
    doc = documento(p, f"{c['nome']} · Cosmo Hotel Palace", f"{c['nome']} da {c['mq']} m² al Cosmo Hotel Palace, vicino a Milano: {c['letti']}, {c['ospiti']}.", corpo, su_foto=False)
    return p, doc


# ---------------------------------------------------------------- MEETING
SALE = [  # dal sito ufficiale (tabella "Planimetria centro congressi")
    ("Piano terra", [
        ("Plenaria delle Costellazioni", "25 × 20", 500, "4,22", 500, None, None, 450),
        ("Plenaria del Sole", "18,5 × 17,5", 325, "4,22", 400, 188, 188, 300),
        ("Oro Plenaria", "7,1 × 18,5", 147, "4,22", 180, 70, 70, 140),
        ("Argento Plenaria", "7,2 × 18,5", 145, "4,22", 180, 70, 70, 140),
        ("Sole d'Oro", "11,2 × 8,2", 92, "4,22", 100, 60, 60, 80),
        ("Luna d'Argento", "11,2 × 8,2", 92, "4,22", 100, 60, 60, 80),
        ("Stella d'Oro", "7,1 × 11", 91, "4,22", 100, 58, 58, 80),
        ("Cometa d'Argento", "11 × 7,4", 87, "4,22", 100, 55, 55, 80),
        ("Luna", "6,6 × 8,5", 58, "4,22", 60, 35, 35, 50),
        ("Sole", "6,4 × 8,9", 56, "4,22", 60, 35, 35, 50),
        ("Stella", "7,1 × 7,1", 55, "4,22", 60, 22, 22, 40),
        ("Cometa", "7,2 × 7,4", 53, "4,22", 60, 22, 22, 40),
        ("Oro", "7,1 × 4,8", 36, "4,22", 40, 18, 18, 30),
        ("Argento", "4,6 × 7,4", 34, "4,22", 40, 18, 18, 30),
        ("Lingotto", "7,8 × 3,7", 31, "4,22", 29, 15, 15, 30),
        ("Pepita", "5 × 4", 20, "4,22", 15, 10, 10, 10)]),
    ("Piano inferiore", [
        ("Plenaria delle Divinità", "25,3 × 17,2", 440, "3,40", 440, None, None, 400),
        ("Plenaria Fortuna", "21,2 × 13,6", 300, "3,10", 320, 160, 160, 280),
        ("Grande Fortuna", "15,4 × 13,6", 210, "3,40", 200, 100, 100, 180),
        ("Piccola Fortuna", "13,5 × 13,6", 180, "3,40", 170, 85, 85, 160),
        ("Fortuna", "7,7 × 13,6", 105, "3,40", 110, 55, 55, 90),
        ("Musicante", "7,7 × 13,6", 105, "3,40", 110, 55, 55, 90),
        ("Prosperità", "5,8 × 13,6", 80, "3,40", 80, 40, 40, 70),
        ("Saggio", "4,5 × 8", 40, "3,10", 36, 15, 15, 30),
        ("Fiori", "4,7 × 5,6", 24, "3,10", 20, 12, 12, 15)]),
]


def meeting():
    p = Pagina("meeting")
    n = lambda v: f"<td>{v}</td>" if v is not None else '<td class="vuoto" aria-label="non disponibile">—</td>'
    tabelle = ""
    for piano, sale in SALE:
        righe = "".join(f"<tr><th scope=\"row\">{e(s[0])}</th><td>{s[1]} m</td><td>{s[2]} m²</td><td>{s[3]} m</td>{n(s[4])}{n(s[5])}{n(s[6])}{n(s[7])}</tr>" for s in sale)
        tabelle += f"""<div class="scorri" tabindex="0" style="margin-top:48px"><table class="sale"><caption>{piano}</caption><colgroup><col style="width:24%"><col style="width:12%"><col style="width:10%"><col style="width:8%"><col style="width:9%"><col style="width:13%"><col style="width:13%"><col style="width:11%"></colgroup>
<thead><tr><th scope="col">Sala</th><th scope="col">Dimensioni</th><th scope="col">Superficie</th><th scope="col">Altezza</th><th scope="col">Platea</th><th scope="col">Banchi di scuola</th><th scope="col">Ferro di cavallo</th><th scope="col">Banchetto</th></tr></thead>
<tbody>{righe}</tbody></table></div>"""
    allestimenti = "".join(f'<figure>{p.img(k, sizes="(max-width: 860px) 50vw, 24vw")}<figcaption>{t}</figcaption></figure>'
                           for k, t in (("plenaria2", "Platea"), ("sala-banchi", "Banchi di scuola"), ("sala-ferro", "Ferro di cavallo"), ("sala-banchetto", "Banchetto")))
    gal = "".join(p.zoom(k, sizes="(max-width: 700px) 100vw, 33vw") for k in ("gala", "divinita", "sala-imperiale", "eventi"))
    corpo = f"""{copertina(p, "plenaria", "Centro Congressi · fino a 900 ospiti", "Meeting <em>ed eventi</em>")}
<section class="sezione"><div class="wrap introduzione">
  <h2 class="titolo-l compare">La location strategica per meeting ed eventi, <em>a 2 km da Milano</em></h2>
  <div class="testo compare">
    <p class="lead">Con più di 900 mq di superficie e la possibilità di ospitare fino a 900 persone, il Cosmo Hotel Palace è sede di uno dei più grandi e tecnologici centri congressi di Milano Nord.</p>
    <p>Le 13 sale meeting, modulabili e personalizzabili con pareti mobili, permettono di configurare lo spazio giusto per ogni evento. Grazie alla professionalità e al supporto del personale dedicato, ogni evento sarà un successo.</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px"><a class="btn btn-pieno" href="mailto:events@cosmohotelpalace.it?subject=Richiesta%20di%20proposta">Richiedi una proposta</a><a class="btn btn-linea" href="#sale">Vedi le sale</a></div>
  </div>
</div>
<div class="wrap"><ul class="vantaggi" style="margin-top:72px">
  <li>{icona("sala")}<b>13 sale modulabili</b><span class="tenue">Pareti mobili per dividere gli spazi</span></li>
  <li>{icona("persone")}<b>Fino a 900 ospiti</b><span class="tenue">Su due piani, con team dedicato</span></li>
  <li>{icona("parcheggio")}<b>200 posti auto gratuiti</b><span class="tenue">E un'area parcheggio per gli autobus</span></li>
  <li>{icona("auto")}<b>A4, Tangenziale Est e Nord</b><span class="tenue">Vicino a Rho Fiera, MiCo e alle stazioni</span></li>
</ul></div></section>

<section class="sezione sabbia"><div class="wrap">
  <div class="divisa">
    <div class="compare">{p.img("plenaria2", "foto-larga", "(max-width: 900px) 100vw, 55vw")}</div>
    <div class="corpo compare"><p class="occhiello">Piano terra</p><h2 class="titolo-m">Plenaria delle Costellazioni</h2>
      <p>Soffitti alti 4 metri e grandi vetrate da cui filtra la luce naturale. La sala si divide fino a 8 sale meeting e accoglie fino a 500 ospiti.</p></div>
  </div>
  <div class="divisa inversa" style="margin-top:clamp(56px,7vw,96px)">
    <div class="compare">{p.img("divinita", "foto-larga", "(max-width: 900px) 100vw, 55vw")}</div>
    <div class="corpo compare"><p class="occhiello">Piano inferiore</p><h2 class="titolo-m">Plenaria delle Divinità</h2>
      <p>La seconda sala plenaria del Centro Congressi può ospitare fino a 400 persone ed è declinabile in 5 sale meeting.</p></div>
  </div>
</div></section>

<section class="sezione"><div class="wrap">
  <div class="testa-sezione"><div><p class="occhiello">Allestimenti</p><h2 class="titolo-l">Ogni evento, <em>il suo allestimento</em></h2></div></div>
  <div class="schede-sala">{allestimenti}</div>
</div></section>

<section class="sezione sabbia" id="sale"><div class="wrap">
  <div class="testa-sezione"><div><p class="occhiello">Planimetria del Centro Congressi</p><h2 class="titolo-l">Le sale <em>e le capienze</em></h2>
    <p class="tenue">Numero massimo di persone per ogni disposizione. Sul telefono la tabella scorre di lato.</p></div></div>
  {tabelle}
</div></section>

<section class="sezione"><div class="wrap">
  <div class="testa-sezione"><div><p class="occhiello">Galleria</p><h2 class="titolo-l">Il Centro Congressi <em>in foto</em></h2></div><a class="link-freccia" href="{p.url('foto', '#meeting')}">Tutte le foto</a></div>
  <div class="schede-sala" data-galleria style="gap:10px">{gal}</div>
</div></section>

<section class="sezione notte"><div class="wrap introduzione">
  <div><p class="occhiello">Ufficio Eventi</p><h2 class="titolo-l" style="margin-top:18px">Raccontaci il tuo evento</h2></div>
  <div class="testo"><p class="lead">Per informazioni e prenotazioni contatta l'Ufficio Eventi: ti aiuta a scegliere la sala, l'allestimento e i servizi.</p>
  <dl class="orari"><div><dt>E-mail</dt><dd><a href="mailto:events@cosmohotelpalace.it">events@cosmohotelpalace.it</a></dd></div><div><dt>Telefono</dt><dd><a href="tel:+390261777726">+39 02 61 777 726</a></dd></div></dl>
  <p><a class="btn btn-chiaro" href="mailto:events@cosmohotelpalace.it?subject=Richiesta%20di%20proposta">Richiedi una proposta</a></p></div>
</div></section>"""
    return p, documento(p, "Meeting ed eventi · Cosmo Hotel Palace", "Centro congressi a 2 km da Milano: fino a 900 persone, 13 sale meeting modulabili, 200 posti auto gratuiti.", corpo)


# ---------------------------------------------------------------- RISTORANTI
def ristoranti():
    p = Pagina("ristoranti")
    gal = "".join(p.zoom(k, sizes="(max-width: 700px) 100vw, 25vw") for k in ("grill2", "grill3", "grill4", "grill5", "grill6", "grill7", "lounge2", "salotto"))
    corpo = f"""{copertina(p, "grill2", "Ristorante &amp; Bar", "Un'esperienza di gusto <em>in ogni momento</em>")}
<section class="sezione"><div class="wrap introduzione">
  <h2 class="titolo-l compare">Ambienti accoglienti ed eleganti, <em>ideali per un momento di piacere</em></h2>
  <div class="testo compare"><p class="lead">In un ambiente elegante e raffinato, il ristorante Cosmo Grill propone un'offerta gastronomica ispirata alla tradizione milanese. È aperto ogni sera anche alla clientela esterna, con menu à la carte, e a pranzo per eventi aziendali e privati.</p>
  <p>Il Lounge Bar accompagna gli ospiti in ogni momento della giornata: dal caffè di metà mattina al tè del pomeriggio, dall'aperitivo all'happy hour.</p></div>
</div></section>

<section class="sezione notte" id="cosmo-grill"><div class="wrap divisa">
  <div class="coppia-foto compare">{p.img("grill", sizes="(max-width: 900px) 58vw, 32vw")}{p.img("grill3", sizes="(max-width: 900px) 40vw, 22vw")}</div>
  <div class="corpo compare"><p class="occhiello">Ristorante</p><h2 class="titolo-l">Cosmo Grill</h2>
    <p class="lead">Gusti all'avanguardia e cucina della tradizione milanese, per una proposta contemporanea e innovativa.</p>
    <p>Pronto ad accogliere gli ospiti dell'hotel, il ristorante è frequentato anche da ospiti esterni. L'armonia degli arredi e l'intimità degli spazi ne fanno il luogo perfetto per un viaggio di piacere, non solo per il palato, anche per le occasioni speciali.</p>
    <dl class="orari"><div><dt>Cena</dt><dd>19.30 – 22.30</dd></div><div><dt>Pranzo</dt><dd>Riservato agli eventi, su prenotazione</dd></div></dl>
    <p class="tenue">Per prenotare un tavolo: <a href="{TEL_HREF}">{TEL}</a> · <a href="mailto:{EMAIL}">{EMAIL}</a></p>
  </div>
</div></section>

<section class="sezione" id="lounge-bar"><div class="wrap divisa inversa">
  <div class="coppia-foto compare">{p.img("lounge", sizes="(max-width: 900px) 58vw, 32vw")}{p.img("salotto", sizes="(max-width: 900px) 40vw, 22vw")}</div>
  <div class="corpo compare"><p class="occhiello">Bar</p><h2 class="titolo-l">Lounge Bar</h2>
    <p class="lead">Un punto di ritrovo luminoso e accogliente, nel cuore dell'hotel.</p>
    <p>Perfetto per momenti di relax o tranquilli incontri d'affari. Uno spazio dai colori naturali e morbidi, aperto anche agli ospiti esterni: un caffè la mattina, un tè il pomeriggio, poi un aperitivo d'autore o un rilassante dopocena.</p>
    <dl class="orari"><div><dt>Tutti i giorni</dt><dd>7.00 – 24.00</dd></div></dl>
  </div>
</div></section>

<section class="banda" id="eventi">{p.img("eventi")}
  <div class="contenuto wrap"><div class="pannello compare"><p class="occhiello">Eventi aziendali e privati</p>
    <h2 class="titolo-l">Il giusto contesto <em>per ogni occasione</em></h2>
    <p>Eventi aziendali, privati e cerimonie: un team dedicato organizza l'evento in un ambiente elegante e raffinato, con servizi su misura, alle porte di Milano.</p>
    <p><a class="btn btn-chiaro" href="{p.url('meeting')}">Meeting ed eventi</a></p></div></div>
</section>

<section class="sezione"><div class="wrap">
  <div class="testa-sezione"><div><p class="occhiello">Galleria</p><h2 class="titolo-l">A tavola <em>e al bar</em></h2></div></div>
  <div class="griglia-foto" data-galleria>{gal}</div>
</div></section>"""
    return p, documento(p, "Ristoranti · Cosmo Hotel Palace", "Ristorante Cosmo Grill (cena 19.30–22.30) e Lounge Bar (7.00–24.00) al Cosmo Hotel Palace, vicino a Milano.", corpo)


# ---------------------------------------------------------------- WELLNESS
def wellness():
    p = Pagina("wellness")
    gal = "".join(p.zoom(k, sizes="(max-width: 700px) 100vw, 25vw") for k in ("wellness", "wellness2", "palestra", "palestra2"))
    corpo = f"""{copertina(p, "wellness2", "Centro benessere &amp; fitness · 6° piano", "Equilibrio e armonia <em>per corpo e mente</em>")}
<section class="sezione"><div class="wrap introduzione">
  <h2 class="titolo-l compare">Il sesto piano è dedicato <em>al benessere e al relax</em></h2>
  <div class="testo compare"><p class="lead">Una sauna finlandese e un bagno turco regalano momenti di rigenerazione e piacere.</p>
  <p>Per l'esercizio quotidiano gli ospiti hanno a disposizione una moderna sala attrezzi con due tapis roulant con 14 programmi interattivi, cyclette e macchine con funzioni chest press, pulldown e leg extension.</p>
  <dl class="orari" style="margin-top:12px"><div><dt>Centro benessere e fitness</dt><dd>Tutti i giorni · 7.00 – 22.00</dd></div></dl></div>
</div></section>
<section class="sezione sabbia"><div class="wrap">
  <ul class="vantaggi">
    <li>{icona("sauna")}<b>Sauna finlandese</b><span class="tenue">Calore secco per sciogliere le tensioni</span></li>
    <li>{icona("clima")}<b>Bagno turco</b><span class="tenue">Vapore per un momento di rigenerazione</span></li>
    <li>{icona("fitness")}<b>Sala attrezzi</b><span class="tenue">Tapis roulant, cyclette, chest press, pulldown, leg extension</span></li>
    <li>{icona("orologio")}<b>7.00 – 22.00</b><span class="tenue">Aperto tutti i giorni</span></li>
  </ul>
</div></section>
<section class="sezione"><div class="wrap divisa">
  <div class="compare">{p.img("palestra", "foto-larga", "(max-width: 900px) 100vw, 55vw")}</div>
  <div class="corpo compare"><p class="occhiello">Fitness</p><h2 class="titolo-l">Allenarsi <em>anche in viaggio</em></h2>
    <p>Due tapis roulant con 14 programmi di lavoro interattivi, cyclette e macchine per l'allenamento quotidiano, in una sala luminosa al sesto piano.</p>
    <p><a class="btn btn-pieno" href="{MOTORE}" target="_blank" rel="noopener" data-prenota>Prenota il soggiorno</a></p></div>
</div></section>
<section class="sezione" style="padding-top:0"><div class="wrap"><div class="schede-sala" data-galleria style="gap:10px">{gal}</div></div></section>"""
    return p, documento(p, "Fitness & Wellness · Cosmo Hotel Palace", "Centro benessere al 6° piano: sauna finlandese, bagno turco e sala fitness, aperti tutti i giorni dalle 7 alle 22.", corpo)


# ---------------------------------------------------------------- GALLERIA
GALLERIA = [
    ("hotel", "Hotel", ["facciata", "hall", "hall2", "ingresso", "reception", "orchidee", "lounge", "lounge2", "salotto", "bar"]),
    ("camere", "Camere & Suites", ["classic", "classic2", "suite", "suite2", "suite5", "suite3", "suite4", "family", "family3", "family2", "family4", "camera-a", "camera-b", "camera-c", "camera-twin", "classic-bagno", "family-bagno"]),
    ("ristoranti", "Ristoranti", ["grill", "grill2", "grill3", "grill4", "grill5", "grill6", "grill7"]),
    ("meeting", "Meeting ed eventi", ["plenaria", "plenaria2", "divinita", "gala", "eventi", "sala-banchetto", "sala-banchi", "sala-ferro", "sala-imperiale"]),
    ("wellness", "Benessere e fitness", ["wellness", "wellness2", "palestra", "palestra2"]),
]


def foto_video():
    p = Pagina("foto")
    filtri = '<button type="button" data-k="tutto" aria-pressed="true">Tutte</button>' + "".join(
        f'<button type="button" data-k="{k}" aria-pressed="false">{t}</button>' for k, t, _ in GALLERIA)
    voci = "".join(f'<div data-k="{k}" id="{k}">{p.zoom(f, sizes="(max-width: 700px) 100vw, 33vw")}</div>' for k, _, fs in GALLERIA for f in fs)
    voci = voci.replace('<div data-k=', '<div style="break-inside:avoid" data-k=')
    corpo = f"""{copertina(p, "hall2", "Gallery", "Guarda le foto <em>del Cosmo Hotel Palace</em>")}
<section class="sezione"><div class="wrap">
  <div class="filtri" data-filtri="griglia" role="group" aria-label="Filtra le foto">{filtri}</div>
  <div class="griglia-foto" id="griglia" data-galleria>{voci}</div>
</div></section>"""
    return p, documento(p, "Foto e video · Cosmo Hotel Palace", "La galleria fotografica del Cosmo Hotel Palace: hotel, camere, ristorante, centro congressi e benessere.", corpo)


# ---------------------------------------------------------------- CONTATTI E LOCATION
DINTORNI = [  # (città, nome, testo, foto o None)
    ("milano", "Duomo di Milano", "Fondato nel XIV secolo e dedicato a Maria Nascente, domina l'omonima piazza con la sua grandiosa mole marmorea.", "duomo"),
    ("milano", "Galleria Vittorio Emanuele II", "Collega piazza del Duomo con piazza della Scala, sotto la copertura in ferro e vetro che ha il suo centro nell'ottagono.", "galleria"),
    ("monza", "Reggia di Monza", "La facciata scenografica della residenza estiva dei Savoia: storia, arte e paesaggio a due passi da Milano.", "reggia"),
    ("milano", "Corso Vittorio Emanuele II", "Meta prediletta dei turisti, una delle vie dello shopping più frequentate del centro di Milano.", "corso"),
    ("monza", "Autodromo Nazionale Monza", "Lo storico circuito del Gran Premio d'Italia di Formula 1, con eventi da marzo a novembre.", "autodromo"),
    ("milano", "Cenacolo Vinciano", "Tra le maggiori creazioni del Rinascimento milanese, nel complesso di Santa Maria delle Grazie.", "grazie"),
    ("monza", "Parco di Monza", "Con una cinta muraria di oltre 14 km è il parco cintato più esteso d'Europa: 700 ettari di verde.", "parco"),
    ("como", "Villa Carlotta", "Nel comune di Tremezzina, una delle ville con i giardini più celebri del Lago di Como.", "carlotta"),
    ("monza", "Duomo di Monza e Corona Ferrea", "La Basilica di San Giovanni Battista, simbolo della città, custodisce la Corona Ferrea.", "duomo-monza"),
    ("monza", "Arengario", "L'antico Palazzo Comunale di Monza, riconoscibile per il suo ampio porticato ad arcate.", "arengario"),
    ("como", "Leolandia", "A Capriate San Gervasio, a circa 25 minuti dall'hotel: una giornata di divertimento in famiglia.", "leolandia"),
    ("milano", "Castello Sforzesco", "Insieme al Duomo, uno dei monumenti simbolo della città: un vasto complesso fortificato.", None),
    ("milano", "Pinacoteca di Brera", "Una delle più importanti pinacoteche italiane, con lo Sposalizio della Vergine di Raffaello.", None),
    ("como", "Como e Lago di Como", "Una meta turistica internazionale di straordinaria bellezza paesaggistica.", None),
]
CITTA = {"milano": "Milano", "monza": "Monza", "como": "Como e dintorni"}


def luogo(p, l):
    citta, nome, testo, f = l
    if f:
        return f'<article class="luogo" data-k="{citta}">{p.img(f, sizes="(max-width: 860px) 70vw, 26vw")}<span class="citta">{CITTA[citta]}</span><h3>{nome}</h3><p>{testo}</p></article>'
    return f'<article class="luogo senza-foto" data-k="{citta}"><span class="citta">{CITTA[citta]}</span><h3>{nome}</h3><p>{testo}</p></article>'


def contatti():
    p = Pagina("contatti")
    rep = [("Prenotazioni", "+39 02 61 777 1", "tel:+3902617771", EMAIL), ("Eventi", "+39 02 61 777 726", "tel:+390261777726", "events@cosmohotelpalace.it"),
           ("Commerciale", "+39 02 61 777 686", "tel:+390261777686", "sales@cosmohotelpalace.it"), ("Ristorante", "+39 02 61 777 1", "tel:+3902617771", EMAIL)]
    reparti = "".join(f'<div class="reparto"><p class="occhiello">Ufficio</p><h3>{n}</h3><a href="{h}">{t}</a><a href="mailto:{m}">{m}</a></div>' for n, t, h, m in rep)
    filtri = '<button type="button" data-k="tutto" aria-pressed="true">Tutto</button>' + "".join(f'<button type="button" data-k="{k}" aria-pressed="false">{v}</button>' for k, v in CITTA.items())
    luoghi = "".join(luogo(p, l) for l in DINTORNI)
    corpo = f"""{copertina(p, "facciata", "Contatti e location", "A 2 km da Milano, <em>vicino a tutto</em>")}
<section class="sezione"><div class="wrap introduzione">
  <div class="compare"><p class="occhiello">Indirizzo</p><p class="indirizzo" style="margin-top:18px">Via F. De Sanctis, 5<br>20092 Cinisello Balsamo<br>Milano · Italia</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:28px"><a class="btn btn-pieno" href="{MAPPA}" target="_blank" rel="noopener">Apri in Google Maps</a><button class="btn btn-linea" type="button" data-copia="Cosmo Hotel Palace, Via F. De Sanctis 5, 20092 Cinisello Balsamo (MI)">Copia l'indirizzo</button></div></div>
  <div class="testo compare"><p class="lead">Il Cosmo Hotel Palace è vicino alle principali attrazioni di Milano, Monza e del Lago di Como.</p>
    <p>Le principali arterie stradali (Autostrada A4 Milano–Venezia, Tangenziale Est e Tangenziale Nord) lo collegano a Milano e Monza e ai poli strategici: Rho Fiera, Milano City Fiera, MiCo Milano Congressi, le stazioni di Sesto FS e Milano Centrale, gli aeroporti di Linate, Malpensa e Orio al Serio.</p></div>
</div></section>
<section class="sezione sabbia"><div class="wrap">
  <div class="testa-sezione"><div><p class="occhiello">Come arrivare</p><h2 class="titolo-l">In auto, in tram <em>o in aereo</em></h2></div></div>
  <div class="arrivi">
    <div>{icona("tram")}<h3 class="titolo-s">Verso il centro di Milano</h3><p>Il tram 31 si trova a pochi passi dall'hotel e in poche fermate porta alla metro M5, fermata Bignami.</p></div>
    <div>{icona("auto")}<h3 class="titolo-s">In auto</h3><p>Autostrada A4 Milano–Venezia, Tangenziale Est e Nord. 200 posti auto a disposizione e un'area per gli autobus.</p></div>
    <div>{icona("aereo")}<h3 class="titolo-s">Aeroporti e stazioni</h3><p>Linate, Malpensa e Orio al Serio. Stazioni di Sesto FS e Milano Centrale.</p></div>
  </div>
</div></section>
<section class="sezione"><div class="wrap">
  <div class="testa-sezione"><div><p class="occhiello">Contatti</p><h2 class="titolo-l">Scrivici o chiamaci</h2></div></div>
  <div class="reparti">{reparti}</div>
</div></section>
<section class="sezione sabbia"><div class="wrap">
  <div class="testa-sezione"><div><p class="occhiello">Nei dintorni</p><h2 class="titolo-l">Cosa vedere <em>vicino all'hotel</em></h2></div></div>
  <div class="filtri" data-filtri="luoghi" role="group" aria-label="Filtra i luoghi">{filtri}</div>
  <div class="griglia-luoghi" id="luoghi">{luoghi}</div>
</div></section>"""
    return p, documento(p, "Contatti e Location · Cosmo Hotel Palace", "Come raggiungere il Cosmo Hotel Palace a Cinisello Balsamo, a 2 km da Milano: contatti, indicazioni e cosa vedere nei dintorni.", corpo)


def partners():
    p = Pagina("partners")
    voci = [("torri", "Cosmo Hotel Torri", "http://www.cosmohoteltorri.it/", "www.cosmohoteltorri.it"),
            ("residence", "Cosmo Residence", "http://www.residencecosmo.it/", "www.residencecosmo.it"),
            ("trivulzio", "Villa Trivulzio", "https://www.villatrivulzio.it/", "www.villatrivulzio.it")]
    blocchi = "".join(f"""<article class="partner"><div class="compare">{p.img(k, sizes="(max-width: 860px) 100vw, 55vw")}</div>
  <div class="corpo compare" style="display:grid;gap:22px"><p class="occhiello">Hotel partner</p><h2 class="titolo-l">{n}</h2>
  <p><a class="link-freccia" href="{u}" target="_blank" rel="noopener">{t}</a></p></div></article>""" for k, n, u, t in voci)
    corpo = f"""{copertina(p, "ingresso", "Tutti i nostri partners", "Non rinunciare <em>al comfort dei nostri hotel</em>")}
<section class="sezione"><div class="wrap">{blocchi}</div></section>
<section class="sezione sabbia"><div class="wrap"><p class="lead">Per maggiori informazioni contatta i nostri uffici: <a href="mailto:{EMAIL}">{EMAIL}</a> · <a href="{TEL_HREF}">+39 02 61 777 1</a></p></div></section>"""
    return p, documento(p, "Hotel Partners · Cosmo Hotel Palace", "Gli hotel partner del Cosmo Hotel Palace: Cosmo Hotel Torri, Cosmo Residence e Villa Trivulzio.", corpo)


def main():
    if os.path.isdir(OUT):
        for n in os.listdir(OUT):
            if n != "foto": shutil.rmtree(os.path.join(OUT, n)) if os.path.isdir(os.path.join(OUT, n)) else os.remove(os.path.join(OUT, n))
    os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
    prepara_foto()
    shutil.copy(os.path.join(QUI, "src", "site.css"), os.path.join(OUT, "assets", "site.css"))
    shutil.copy(os.path.join(QUI, "src", "site.js"), os.path.join(OUT, "assets", "site.js"))
    pagine = [home(), camere(), scheda_camera("classic"), scheda_camera("family"), scheda_camera("suite"),
              meeting(), ristoranti(), foto_video(), wellness(), contatti(), partners()]
    for p, doc in pagine:
        d = os.path.join(OUT, p.path); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(doc)
    usate = set()
    for p, doc in pagine:
        usate |= set(__import__("re").findall(r'foto/([\w\-]+?)(?:-m)?\.webp', doc))
    for f in os.listdir(os.path.join(OUT, "foto")):
        if f.endswith(".webp") and f.replace("-m.webp", "").replace(".webp", "") not in usate:
            os.remove(os.path.join(OUT, "foto", f))
    print(len(pagine), "pagine,", len(usate), "foto usate ->", OUT)


if __name__ == "__main__":
    main()

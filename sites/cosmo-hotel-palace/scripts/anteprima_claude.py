#!/usr/bin/env python3
"""
Prepara out-anteprima/ a partire da out/ (npx next build) per l'anteprima come
Artifact su claude.ai. Non tocca out/ e non tocca lo script del portfolio.

L'hosting degli Artifact ha limiti che un sito Next esportato non rispetta:
  1. i percorsi che iniziano con "_" non si pubblicano:  _next -> nx  (e via i
     file __next.*.txt, _not-found, 404);
  2. non c'e' l'indice delle cartelle: /camere/ non apre camere/index.html;
  3. il sito non sta alla radice dell'host, quindi nessun percorso
     "/qualcosa" puo' funzionare: tutto deve essere relativo alla pagina;
  4. il router client di Next non puo' funzionare (RSC .txt non pubblicabili);
  5. i caratteri U+FFFD rompono la pubblicazione.

  6. la pagina d'ingresso dell'Artifact viene incorniciata dall'hosting in un
     documento html/head/body: dentro c'e' un secondo <html> e React non puo'
     idratare (errore #418). Percio' index.html e' una paginetta-ingresso
     (generata qui) che porta a home/index.html; la home di Next sta li' e,
     come tutte le altre pagine del sito, viene servita cosi' com'e'.

Cosa fa, per ogni pagina html a profondita' d (P = "../" * d, "./" in radice):
  - "/_next/..." -> "<P>nx/..." sia negli attributi sia nel payload RSC
    inline (stessa stringa nei due posti, cosi' l'idratazione non trova
    differenze). Idem per /favicon.ico;
  - i link interni (href="/camere/") restano com'e' nell'html e nel payload
    (idem, per l'idratazione); li risolve uno script iniettato:
      * in cattura intercetta il clic e fa una navigazione piena verso
        <P>camere/index.html (il router di Next non vede mai il clic);
      * al passaggio del mouse/tocco riscrive l'href in un indirizzo vero
        (per "apri in nuova scheda"), conservando l'originale in data-pv;
      * /prenota/ lo lascia al sito (BookLink apre il foglio di prenotazione);
        il motore di prenotazione esterno e' target=_blank e non si tocca;
  - fissa self.TURBOPACK_CHUNK_BASE_PATH = "<P>nx/" (la STESSA stringa relativa
    degli attributi src/href e del payload: il runtime turbopack identifica
    i chunk confrontando stringhe, non URL risolti; con un prefisso assoluto
    l'idratazione non parte mai). Cosi' anche gli import() dinamici (three,
    ecc.) cercano nx/static/chunks/... dalla pagina in cui sono;
  - neutralizza history.pushState/replaceState: Next, all'avvio, riscrive
    l'URL in "/camere/suite/" (percorso assoluto), e in un'anteprima
    ospitata romperebbe ricarica e percorsi relativi;
  - fa rispondere 404 locale alle richieste del router di Next (HEAD e RSC
    del prefetch dei Link), che altrimenti andrebbero a percorsi inesistenti
    alla radice dell'host: il router le gestisce in silenzio.

Uso:  cd sites/cosmo-hotel-palace && npx next build && python3 scripts/anteprima_claude.py > /tmp/files.json
Stampa su stdout la lista JSON dei file per `files` dell'Artifact
(root = out-anteprima, pagina = out-anteprima/index.html).
"""
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, ".."))
SRC = os.path.join(SITE, "out")
DST = os.path.join(SITE, "out-anteprima")

if not os.path.isdir(SRC):
    sys.exit("manca out/: esegui prima `npx next build`")
if os.path.isdir(DST):
    shutil.rmtree(DST)
shutil.copytree(SRC, DST)
os.chdir(DST)

TEXT = (".js", ".css", ".html", ".svg", ".xml", ".json")


def read(p):
    return open(p, encoding="utf-8", errors="surrogateescape").read()


def write(p, s):
    open(p, "w", encoding="utf-8", errors="surrogateescape").write(s)


def walk():
    for root, _, files in os.walk("."):
        for f in files:
            yield os.path.relpath(os.path.join(root, f), ".")


# 0) cio' che non serve (e non si puo' pubblicare): payload RSC, 404, _not-found,
#    manifest _buildManifest.js & co. (del vecchio router "pages", mai referenziati)
for rel in list(walk()):
    base = os.path.basename(rel)
    if base.endswith(".txt") or base.startswith("_"):
        os.remove(rel)
for d in ("_not-found", "404"):
    shutil.rmtree(d, ignore_errors=True)
for f in ("404.html", "sitemap.xml"):
    if os.path.exists(f):
        os.remove(f)

# 1) _next -> nx
if os.path.isdir("_next"):
    os.rename("_next", "nx")
for rel in walk():
    if rel.endswith(".js"):
        s = read(rel)
        s2 = re.sub(r"(?<![A-Za-z0-9_])_next/", "nx/", s)
        # U+FFFD in un letterale stringa -> stessa cosa, ma scritta come escape
        s2 = s2.replace("�", "\\uFFFD")
        if s2 != s:
            write(rel, s2)
    elif rel.endswith(".css"):
        s = read(rel)
        if "�" in s or "_next/" in s:
            write(rel, s.replace("�", "\\FFFD ").replace("_next/", "nx/"))

# 1b) Next legge il percorso della pagina da window.location (usePathname,
#     useSearchParams). Ospitata, la pagina sta in /…/camere/suite/index.html e i
#     componenti che dipendono dal percorso (barra di prenotazione, voce attiva
#     del menu) idraterebbero diversamente dall'html (React #418 su /prenota/ e
#     /centro-congressi/). Si usa invece il percorso virtuale del payload
#     (initialRSCPayload.c, es. "/prenota") piu' ?query e #hash reali.
PATCH = re.compile(r"(\w+)=(\w+)\?\(0,\w+\.createHrefFromUrl\)\(\2\):(\w+)(?=,\w+=\{metadataVaryPath:null)")
npatch = 0
for rel in walk():
    if rel.endswith(".js"):
        s = read(rel)
        s2, n = PATCH.subn(lambda m: '%s=%s+(%s?%s.search+%s.hash:"")' % (m.group(1), m.group(3), m.group(2), m.group(2), m.group(2)), s)
        if n:
            npatch += n
            write(rel, s2)
if npatch != 1:
    print("ATTENZIONE: patch del percorso iniziale applicata %d volte (attese 1): "
          "usePathname restera' quello ospitato e /prenota/ e /centro-congressi/ "
          "daranno l'errore React #418 (recuperabile)" % npatch, file=sys.stderr)

# 2) script iniettato (il segnaposto __P__ e __SELF__ cambia per pagina)
INJECT = r"""<script>(function(){var L=location.href,P="__P__",SELF="__SELF__";
function abs(r){return new URL(r,L)}
self.TURBOPACK_CHUNK_BASE_PATH=P+"nx/";
["pushState","replaceState"].forEach(function(k){var o=history[k];if(o)history[k]=function(s,t){return o.call(this,s,t)}});
var of=window.fetch;if(of)window.fetch=function(i,o){try{var u=new URL(typeof i==="string"?i:(i.url||String(i)),L),h=(o&&o.headers)||(i&&i.headers)||{},r=h.get?h.get("rsc"):(h.RSC||h.rsc);var m=(o&&o.method)||(i&&i.method)||"GET";if(u.origin===location.origin&&(r||/^head$/i.test(m)||/\.txt$/.test(u.pathname)))return Promise.resolve(new Response("",{status:404}))}catch(e){}return of.apply(this,arguments)};
function route(a){var h=a.getAttribute("data-pv")||a.getAttribute("href");if(!h||h.charAt(0)!=="/"||h.charAt(1)==="/")return null;var m=/^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(h),p=m[1];if(p.slice(-1)!=="/"){if(/\.[a-z0-9]+$/i.test(p))return null;p+="/"}return{p:p,q:m[2]||"",hash:m[3]||""}}
function dest(r){return abs(P+(r.p==="/"?"home/":r.p.slice(1))+"index.html")}
function fix(e){var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;if(!a||a.hasAttribute("data-pv"))return;var r=route(a);if(r&&r.p!=="/prenota/"){a.setAttribute("data-pv",a.getAttribute("href"));a.setAttribute("href",dest(r).href+r.q+r.hash)}}
["pointerover","focusin","touchstart","contextmenu"].forEach(function(n){document.addEventListener(n,fix,{capture:true,passive:true})});
document.addEventListener("click",function(e){if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;if(!a||a.target==="_blank"||a.hasAttribute("download"))return;var r=route(a);if(!r||r.p==="/prenota/")return;e.preventDefault();e.stopImmediatePropagation();
if(r.p===SELF&&(!r.q||function(){var c=new URLSearchParams(location.search);c.delete("3d");return c.toString()===new URLSearchParams(r.q).toString()}())){var t=r.hash.length>1?document.getElementById(decodeURIComponent(r.hash.slice(1))):null;if(t)t.scrollIntoView();else window.scrollTo(0,0);return}
var q=new URLSearchParams(r.q),k=new URLSearchParams(location.search).get("3d");if(k&&!q.has("3d"))q.set("3d",k);var qs=q.toString();location.href=dest(r).href+(qs?"?"+qs:"")+r.hash},true);
if(!location.hash){try{history.scrollRestoration="manual"}catch(e){}var stop=false,up=function(){if(!stop)try{window.scrollTo(0,0)}catch(e){}};["wheel","touchstart","keydown","mousedown"].forEach(function(n){addEventListener(n,function(){stop=true},{passive:true,once:true})});up();document.addEventListener("DOMContentLoaded",up);addEventListener("load",function(){up();setTimeout(up,200);setTimeout(up,700)})}
})();</script>"""

# la home di Next -> home/index.html (index.html sara' la paginetta-ingresso)
os.makedirs("home")
os.rename("index.html", "home/index.html")

pages = []
for rel in walk():
    if not rel.endswith(".html"):
        continue
    parts = rel.split("/")
    depth = len(parts) - 1
    P = "../" * depth if depth else "./"
    SELF = "/" if rel == "home/index.html" else "/" + "/".join(parts[:-1]) + "/"
    s = read(rel)
    # asset: stessa sostituzione negli attributi e nel payload RSC (hanno " davanti, con o senza \)
    s = s.replace('"/_next/', '"' + P + "nx/")
    s = s.replace('"/favicon.ico', '"' + P + "favicon.ico")
    if "/_next/" in s:
        sys.exit("restano percorsi /_next/ in " + rel)
    if "</head>" not in s:
        sys.exit("manca </head> in " + rel)
    s = s.replace("<head>", "<head>" + INJECT.replace("__P__", P).replace("__SELF__", SELF), 1)
    write(rel, s)
    pages.append(rel)

# 2b) paginetta-ingresso (e' lei che l'hosting incornicia: niente <html>/<head>/<body>)
LAUNCHER = """<title>Cosmo Hotel Palace</title>
<style>
:root{--bg:#faf6ee;--fg:#1f2a22;--muted:#5d6a60;--accent:#2b4030;--on-accent:#faf6ee;--line:#e2d8c3;--miele:#e9a23b}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141b16;--fg:#efe9db;--muted:#a3ad9f;--accent:#e9a23b;--on-accent:#1b1406;--line:#2e3a31;--miele:#e9a23b;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#141b16;--fg:#efe9db;--muted:#a3ad9f;--accent:#e9a23b;--on-accent:#1b1406;--line:#2e3a31;--miele:#e9a23b;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:16px/1.55 "Hanken Grotesk",system-ui,sans-serif;padding-inline:20px;padding-block:12vh 8vh}
main{max-width:34rem;margin-inline:auto;display:flex;flex-direction:column;gap:24px}
h1{font:600 clamp(2rem,7vw,2.8rem)/1.1 "Fraunces",Georgia,serif;margin:0;text-wrap:balance}
p{margin:0;max-width:60ch;color:var(--muted)}
.go{align-self:flex-start;background:var(--accent);color:var(--on-accent);text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;border:2px solid transparent}
.go:hover{filter:brightness(1.08)}
.go:focus-visible,a:focus-visible{outline:3px solid var(--miele);outline-offset:3px}
h2{font:700 .75rem/1 "Hanken Grotesk",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:0}
ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(11rem,1fr));gap:0 24px;border-top:1px solid var(--line)}
li{border-bottom:1px solid var(--line)}
li a{display:block;padding:11px 0;color:var(--fg);text-decoration:none}
li a:hover{color:var(--accent);text-decoration:underline}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Hanken+Grotesk:wght@400;700&display=swap">
<main>
<h1>Cosmo Hotel Palace</h1>
<p>Anteprima del sito: camere in 3D, Centro Congressi con configuratore, ristorante, wellness, contatti. Si apre da sola; se non parte, usa il pulsante.</p>
<a class="go" id="go" href="home/index.html">Apri il sito</a>
<h2>Pagine</h2>
<ul>
<li><a href="home/index.html">Home</a></li>
<li><a href="camere/index.html">Camere</a></li>
<li><a href="camere/classic-double-room/index.html">Classic Double Room</a></li>
<li><a href="camere/family-room/index.html">Family Room</a></li>
<li><a href="camere/suite/index.html">Suite</a></li>
<li><a href="centro-congressi/index.html">Centro Congressi</a></li>
<li><a href="ristorazione/index.html">Ristorazione</a></li>
<li><a href="wellness/index.html">Wellness</a></li>
<li><a href="contatti/index.html">Contatti</a></li>
<li><a href="come-arrivare/index.html">Come arrivare</a></li>
<li><a href="prenota/index.html">Prenota</a></li>
<li><a href="privacy/index.html">Privacy</a></li>
</ul>
</main>
<script>try{location.replace("home/index.html"+location.search)}catch(e){}</script>
"""
write("index.html", LAUNCHER)

# 3) lista dei file (niente percorsi con "_")
files = []
for rel in walk():
    if rel == "index.html":
        continue
    if any(x.startswith("_") for x in rel.split("/")):
        sys.exit("percorso con '_' non pubblicabile: " + rel)
    files.append(rel)
files.sort()

tot = sum(os.path.getsize(f) for f in files) + os.path.getsize("index.html")
print(
    "pagine: %d, file da pubblicare (escluso index.html): %d, totale %.1f MB"
    % (len(pages), len(files), tot / 1e6),
    file=sys.stderr,
)
json.dump([{"path": f} for f in files], sys.stdout)

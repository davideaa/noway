#!/usr/bin/env python3
"""
Versione offline del sito (Davide: "da mandare ai miei amici, che funzioni in
locale"): una cartella da aprire con doppio clic su index.html, e il suo zip.

Parte dall'export statico (npm run export -> out-export) e lo rende navigabile
da file://, senza server:
  - i link fra pagine diventano file veri e relativi (.../index.html);
  - la pagina dettagli trova i suoi asset in dettagli/_next (assetPrefix "./");
  - le icone assolute (/icon.png) diventano relative;
  - via tutto quello che offline non serve: dati RSC (.txt), pagine 404,
    source map, sitemap/robots/og, e /simulatore/ (pagina vecchia, non collegata).

Uso:  cd sites/portfolio && npm run export && python3 scripts/offline.py [cartella-zip]
Crea out-offline/ e <cartella-zip>/Portfolio-Algo-Manager-offline.zip (default: out-offline/..).
"""
import base64
import os
import re
import shutil
import sys
import zipfile

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(BASE, "out-export")
OUT = os.path.join(BASE, "out-offline")
NOME = "Portfolio-Algo-Manager-offline"

if not os.path.isfile(os.path.join(SRC, "index.html")) or not os.path.isdir(os.path.join(SRC, "_next")):
    sys.exit("manca l'export: prima 'npm run export' (e non far girare anteprima_claude.py su out-export)")

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
shutil.copytree(SRC, OUT)
os.chdir(OUT)


def read(p):
    return open(p, encoding="utf-8", errors="surrogateescape").read()


def write(p, s):
    open(p, "w", encoding="utf-8", errors="surrogateescape").write(s)


# 1) via quello che offline non serve
for d in ("simulatore", "_not-found", "404"):
    if os.path.isdir(d):
        shutil.rmtree(d)
for root, _, files in os.walk("."):
    for f in files:
        p = os.path.join(root, f)
        if f.endswith((".txt", ".map")) or f in ("404.html", "sitemap.xml", "og.png", "og.svg"):
            os.remove(p)

# 2) link fra pagine e icone: file veri, relativi
s = read("index.html")
s = re.sub(r'"/dettagli/?(#[^"]*)?"', lambda m: '"./dettagli/index.html' + (m.group(1) or "") + '"', s)
s = re.sub(r'\\"/dettagli/?(#[^"\\]*)?\\"', lambda m: '\\"./dettagli/index.html' + (m.group(1) or "") + '\\"', s)
s = s.replace('href="/"', 'href="./index.html"')
s = re.sub(r'"/(favicon-32|icon|apple-touch-icon)\.png"', r'"./\1.png"', s)
write("index.html", s)

d = read("dettagli/index.html")
d = re.sub(r'"/dettagli/?(#[^"]*)"', r'"\1"', d)  # ancore della stessa pagina
d = re.sub(r'\\"/dettagli/?(#[^"\\]*)\\"', r'\\"\1\\"', d)
d = re.sub(r'"/dettagli/?"', '"./index.html"', d)
d = re.sub(r'\\"/dettagli/?\\"', '\\"./index.html\\"', d)
d = d.replace('href="/"', 'href="../index.html"')
d = d.replace('\\"/\\"', '\\"../index.html\\"')
d = re.sub(r'"/(favicon-32|icon|apple-touch-icon)\.png"', r'"../\1.png"', d)
write("dettagli/index.html", d)

# i link scritti nel codice dei componenti (il film verso i dettagli)
for root, _, files in os.walk("_next"):
    for f in files:
        if f.endswith(".js"):
            p = os.path.join(root, f)
            t = read(p)
            t2 = re.sub(r'"/dettagli/?(#[^"]*)?"', lambda m: '"./dettagli/index.html' + (m.group(1) or "") + '"', t)
            t2 = t2.replace('href:"/"', 'href:"./index.html"')  # il marchio della barra del film
            if t2 != t:
                write(p, t2)

# 3) i caratteri dentro il CSS: da file:// Chrome blocca i font caricati come file separati
#    (origine "null"), e il sito ripiegherebbe sui caratteri di sistema
for root, _, files in os.walk(os.path.join("_next", "static", "chunks")):
    for f in files:
        if f.endswith(".css"):
            p = os.path.join(root, f)
            css = read(p)

            def dentro(m):
                font = os.path.normpath(os.path.join(root, m.group(1)))
                return "url(data:font/woff2;base64," + base64.b64encode(open(font, "rb").read()).decode() + ")"

            write(p, re.sub(r"url\((\.\./media/[\w.\-]+\.woff2)\)", dentro, css))
for f in ("index.html", "dettagli/index.html"):
    write(f, re.sub(r'<link rel="preload" href="[^"]+\.woff2" as="font"[^>]*/>', "", read(f)))

# 4) gli asset della pagina dettagli, relativi a lei
shutil.copytree("_next", os.path.join("dettagli", "_next"))

# 5) zip
dest = sys.argv[1] if len(sys.argv) > 1 else BASE
os.makedirs(dest, exist_ok=True)
zp = os.path.join(dest, NOME + ".zip")
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for root, _, files in os.walk("."):
        for f in sorted(files):
            p = os.path.join(root, f)
            z.write(p, os.path.join(NOME, os.path.relpath(p, ".")))
print(zp, os.path.getsize(zp))

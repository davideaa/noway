#!/usr/bin/env python3
"""
Prepara out-export (npm run export) per l'anteprima come Artifact su claude.ai.

Davide ha chiesto di non usare piu' Netlify e di avere i link qui su Claude.
L'hosting degli Artifact ha tre limiti che il sito Next deve aggirare:
  1. i percorsi che iniziano con "_" non si pubblicano: _next -> nx;
  2. non serve l'indice delle cartelle e il router di Next non funziona:
     i link diventano .../index.html e caricano la pagina intera;
  3. la navigazione fra pagine dentro l'anteprima non e' affidabile: i
     Dettagli e il Simulatore si aprono in un pannello a schermo intero
     (iframe) sopra il film, con "Torna al film".
Inoltre: i caratteri U+FFFD nei chunk rompevano la pubblicazione (-> "?"),
e con assetPrefix "./" la pagina dettagli cerca gli asset in dettagli/nx.

Uso:  cd sites/portfolio && npm run export && python3 scripts/anteprima_claude.py
Stampa su stdout la lista JSON dei file da passare a `files` dell'Artifact
(root = out-export, pagina = out-export/index.html).
"""
import json
import os
import re
import shutil
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out-export")
os.chdir(ROOT)

TEXT = (".js", ".css", ".html", ".txt", ".svg", ".xml", ".json")


def read(p):
    return open(p, encoding="utf-8", errors="surrogateescape").read()


def write(p, s):
    open(p, "w", encoding="utf-8", errors="surrogateescape").write(s)


def walk():
    for root, _, files in os.walk("."):
        for f in files:
            yield os.path.join(root, f)


# 1) _next -> nx, ovunque
if os.path.isdir("_next"):
    if os.path.isdir("nx"):
        shutil.rmtree("nx")
    os.rename("_next", "nx")
for p in walk():
    if p.endswith(TEXT):
        s = read(p)
        if "_next/" in s:
            write(p, s.replace("_next/", "nx/"))

# 2) link fra pagine: file veri, relativi
s = read("index.html")
s = re.sub(r'"/dettagli/?(#[^"]*)?"', lambda m: '"./dettagli/index.html' + (m.group(1) or "") + '"', s)
s = re.sub(r'"/simulatore/?"', '"./simulatore/index.html"', s)
s = s.replace('href="/"', 'href="./index.html"')
s = s.replace('\\"/simulatore/\\"', '\\"./simulatore/index.html\\"')
s = re.sub(r'\\"/dettagli/?\\"', '\\"./dettagli/index.html\\"', s)
write("index.html", s)

d = read("dettagli/index.html")
d = re.sub(r'"/dettagli/?(#[^"]*)"', r'"\1"', d)  # ancore della stessa pagina
d = re.sub(r'"/dettagli/?"', '"./index.html"', d)
d = re.sub(r'"/simulatore/?"', '"../simulatore/index.html"', d)
d = d.replace('href="/"', 'href="../index.html"')
# anche nei dati che React usa dopo il caricamento (stringhe JSON con le virgolette escapate)
d = d.replace('\\"/simulatore/\\"', '\\"../simulatore/index.html\\"')
d = re.sub(r'\\"/dettagli/?\\"', '\\"./index.html\\"', d)
write("dettagli/index.html", d)

for p in walk():
    if p.startswith("./nx/") and p.endswith(".js"):
        s = read(p)
        s2 = re.sub(r'"/dettagli/?"', '"./dettagli/index.html"', s)
        if s2 != s:
            write(p, s2)

# 3) pannello a schermo intero per Dettagli e Simulatore (solo anteprima)
PANEL = r"""<script>(function(){function close(){var ov=document.getElementById("pv-overlay");if(ov){ov.remove();document.documentElement.style.overflow=""}}
function openIn(h,label){var ov=document.getElementById("pv-overlay");if(!ov){ov=document.createElement("div");ov.id="pv-overlay";ov.setAttribute("style","position:fixed;inset:0;z-index:2147483000;background:#080b0e;display:flex;flex-direction:column");ov.innerHTML='<div style="flex:none;display:flex;align-items:center;gap:12px;padding:10px 14px;background:#0b0f12;border-bottom:1px solid #252e34;font:600 14px Manrope,system-ui,sans-serif;color:#f1f4ee"><button id="pv-back" type="button" style="cursor:pointer;background:#c8fa72;color:#15200c;border:0;border-radius:999px;padding:9px 14px;font:700 13px Manrope,system-ui,sans-serif">← Torna al film</button><span id="pv-label" style="opacity:.75"></span></div><iframe id="pv-frame" title="Dettagli" style="flex:1;width:100%;border:0;background:#080b0e" allowfullscreen></iframe>';document.body.appendChild(ov);document.getElementById("pv-back").addEventListener("click",close)}document.getElementById("pv-label").textContent=label;document.getElementById("pv-frame").src=h;document.documentElement.style.overflow="hidden"}
document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});
document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;if(!a)return;var h=a.getAttribute("href")||"";if(/dettagli\/index\.html/.test(h)){e.preventDefault();e.stopImmediatePropagation();openIn(h,"Dettagli del portafoglio");return}if(/simulatore\/index\.html/.test(h)){e.preventDefault();e.stopImmediatePropagation();openIn(h,"Simulatore")}},true);
window.addEventListener("message",function(e){if(e&&e.data==="pv-close")close()});})();</script>"""
INNER = r"""<script>document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;if(!a)return;var h=a.getAttribute("href")||"";if(/^\.\.\/(index\.html)?$/.test(h)){e.preventDefault();e.stopImmediatePropagation();if(window.parent!==window){window.parent.postMessage("pv-close","*")}else{window.location.href=h}return}if(/simulatore\/index\.html/.test(h)&&!a.target){e.preventDefault();e.stopImmediatePropagation();window.location.href=h}},true);</script>"""
for f, snip in (("index.html", PANEL), ("dettagli/index.html", INNER)):
    s = read(f)
    if 'id="pv-' not in s and "pv-close" not in s:
        s = s.replace("</head>", snip + "</head>", 1)
        write(f, s)

# 4) U+FFFD -> "?" (rompeva la pubblicazione)
for p in walk():
    if p.endswith(TEXT):
        s = read(p)
        if "�" in s:
            write(p, s.replace("�", "?"))

# 5) gli asset della pagina dettagli, relativi a lei
if os.path.isdir("dettagli/nx"):
    shutil.rmtree("dettagli/nx")
shutil.copytree("nx", "dettagli/nx")

# 6) lista dei file (niente percorsi con "_", niente pagine 404 e dati RSC)
files = []
for p in walk():
    rel = p[2:]
    if rel == "index.html":
        continue
    parts = rel.split("/")
    if any(x.startswith("_") for x in parts):
        continue
    if rel.startswith("404") or rel.endswith(".txt") and rel != "robots.txt":
        continue
    files.append(rel)
files.sort()
json.dump([{"path": f} for f in files], sys.stdout)

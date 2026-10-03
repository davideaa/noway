#!/usr/bin/env python3
"""Scarica le foto dal sito ufficiale www.cosmohotelpalace.it in foto-src/ (fuori dal repo).
Si usano SOLO foto del sito dell'hotel. Uso: python3 scripts/foto.py"""
import os, re, subprocess
QUI = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(QUI, "..", "foto-src"); os.makedirs(DEST, exist_ok=True)
PAGINE = ["", "camere-suites", "camere-suites/camere/classic-room", "camere-suites/camere/family-room",
          "camere-suites/suite", "meeting-ed-eventi", "ristoranti", "ristoranti/ristorante-cosmo-grill",
          "ristoranti/lounge-bar", "ristoranti/eventi-aziendali-e-privati", "fitness-wellness",
          "foto-video", "hotel-partners", "contatti-location"]
def curl(u, out=None):
    a = ["curl", "-sS", "-L", "-m", "60", "-A", "Mozilla/5.0", u] + (["-o", out] if out else [])
    return subprocess.run(a, capture_output=True).stdout
visti = {}
for p in PAGINE:
    h = curl("https://www.cosmohotelpalace.it/" + p).decode("utf8", "ignore")
    for k, nome in re.findall(r"https://image-tc\.galaxy\.tf/(wijpeg-\w+)/([\w\-\.]+?\.jpg)", h):
        nome = re.sub(r"_(standard|wide)\.jpg$", ".jpg", nome)
        if nome in visti: continue
        visti[nome] = k
        f = os.path.join(DEST, nome)
        if not os.path.exists(f):
            curl(f"https://image-tc.galaxy.tf/{k}/{nome}?width=2000", f)
for n, k in [("logo-chiaro.png", "wipng-43imqbomlpcfp4346j26gmz85/chpw-2x.png?width=500"),
             ("logo-scuro.png", "wipng-6156mmd5a52m69bwixhseo3sf/chp-2x.png?width=600")]:
    curl("https://image-tc.galaxy.tf/" + k, os.path.join(DEST, n))
print(len(visti), "foto in", os.path.abspath(DEST))

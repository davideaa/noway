#!/usr/bin/env python3
"""
Puntini dei continenti per il pianeta del finale del film (Davide: "il mondo che
gira con il nostro logo"). Legge i contorni delle terre emerse di Natural Earth
(1:110m, dominio pubblico, pacchetto world-atlas: land-110m.json, TopoJSON) e
tiene i punti di una griglia quasi uniforme sulla sfera che cadono sulla terra.

Uscita: src/components/film/globo-punti.json = [lat*10, lon*10, lat*10, lon*10, ...]
(interi: piccolo e veloce da leggere).

Uso: python3 scripts/globo.py [percorso di land-110m.json]
     (senza argomento lo scarica da cdn.jsdelivr.net)
"""
import json
import math
import pathlib
import sys
import urllib.request

RADICE = pathlib.Path(__file__).resolve().parent.parent
PASSO = 1.45  # gradi fra un puntino e l'altro


def carica():
    if len(sys.argv) > 1:
        return json.load(open(sys.argv[1]))
    url = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r)


def anelli(topo):
    """Decodifica TopoJSON (archi quantizzati e a differenze) in anelli [(lon, lat)]."""
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    archi = []
    for a in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in a:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        archi.append(pts)

    def arco(i):
        return archi[i] if i >= 0 else list(reversed(archi[~i]))

    out = []
    for g in topo["objects"]["land"]["geometries"]:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        for poly in polys:
            for ring in poly:
                pts = []
                for i in ring:
                    pts.extend(arco(i)[1:] if pts else arco(i))
                out.append(srotola(pts))
    return out


def srotola(pts):
    """Longitudini continue: un contorno che passa la linea del cambio di data (Eurasia,
    Fiji, Wrangel) altrimenti "salta" da +180 a -180 e taglia il mondo con una riga."""
    out = [pts[0]]
    for lon, lat in pts[1:]:
        prev = out[-1][0]
        while lon - prev > 180:
            lon -= 360
        while lon - prev < -180:
            lon += 360
        out.append((lon, lat))
    return out


def dentro(lon, lat, ring):
    c = False
    n = len(ring)
    for i in range(n):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % n]
        if (y1 > lat) != (y2 > lat):
            if lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
                c = not c
    return c


def main():
    rings = anelli(carica())
    # riquadro di ogni anello, per scartare in fretta
    box = [(min(p[0] for p in r), max(p[0] for p in r), min(p[1] for p in r), max(p[1] for p in r)) for r in rings]
    punti = []
    lat = -58.0
    while lat <= 84:
        n = max(1, int(round(360 * math.cos(math.radians(lat)) / PASSO)))
        for k in range(n):
            lon = -180 + (k + 0.5) * 360 / n
            pari = 0
            for r, (a, b, c, d) in zip(rings, box):
                # il punto e le sue copie a +-360 gradi (per i contorni srotolati)
                for l2 in (lon, lon + 360, lon - 360):
                    if a <= l2 <= b and c <= lat <= d and dentro(l2, lat, r):
                        pari ^= 1
            if pari:
                punti += [round(lat * 10), round(lon * 10)]
        lat += PASSO
    dest = RADICE / "src/components/film/globo-punti.json"
    dest.write_text(json.dumps(punti, separators=(",", ":")))
    print(len(punti) // 2, "puntini ->", dest, dest.stat().st_size, "byte")


if __name__ == "__main__":
    main()

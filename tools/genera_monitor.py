#!/usr/bin/env python3
"""Costruisce monitor/monitor.html: la pagina del monitor live, con dentro
i backtest di riferimento delle strategie in uso.

La pagina funziona da sola, anche senza internet: si apre col doppio clic.
Tutto il calcolo (soglie, orizzonte, cono) lo fa lei, nel browser, dal
backtest della strategia scelta. Qui si mettono solo i dati di partenza,
cosi' non vanno ricaricati a mano ogni volta. Altre strategie si possono
aggiungere dalla pagina stessa trascinando il loro report del tester.

Uso:
    python3 tools/genera_monitor.py            # scrive monitor/monitor.html
    python3 tools/genera_monitor.py --artifact percorso.html   # anche la
                                               # versione per claude.ai
"""
import sys, os, json

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, QUI)
from dati_validazione import leggi

RADICE = os.path.join(QUI, '..')
# (file, rischio %, id, nome, etichette, nota)
# L'oro e' UN EA con due tecniche, che si spengono una per una dagli input.
RIFERIMENTI = [
    ('dati/oro_puprime_065.html.gz', 0.65, 'oro', 'Oro · V1XAU',
     {'S3-DONCH': 'ROTTURA M30', 'S2-PULLB': 'RITRACCIAMENTO H4'}, ''),
    ('dati/nasdaq_puprime_098.html.gz', 0.98, 'nas', 'Nasdaq · NAS100',
     {'QL_SessionOpenMom': 'MOMENTUM'},
     'Il backtest del nasdaq è girato col rischio adattivo acceso: la R è nominale, '
     'e il confronto vale solo se anche il live gira con la stessa impostazione.'),
]
# come si spegne una tecnica sola, se diventa rossa
SPEGNI = {'S3-DONCH': 'InpS3Enabled = false', 'S2-PULLB': 'InpS2Enabled = false'}
FINO = '2023.12.31'   # il confine dentro/fuori campione del progetto: riferimento prudente


def riferimenti():
    out = []
    for path, pct, id_, nome, nomi, nota in RIFERIMENTI:
        ops, _, residui = leggi(os.path.join(RADICE, path), pct / 100.0)
        if residui:
            raise SystemExit('%s: %d aperture senza chiusura' % (path, residui))
        tags = []
        for o in ops:
            if o.tag not in tags:
                tags.append(o.tag)
        simbolo = ''
        # il simbolo non e' nell'operazione: lo si prende dal report
        import gzip, re, html as h
        raw = gzip.open(os.path.join(RADICE, path), 'rt', encoding='utf-16', errors='ignore').read()
        m = re.search(r'Simbolo:</t[dh]>\s*<t[dh][^>]*>(?:<b>)?([^<]+)', raw)
        simbolo = h.unescape(m.group(1)).strip() if m else ''
        out.append({'id': id_, 'nome': nome, 'simbolo': simbolo, 'rischio': pct,
                    'tags': tags, 'nomiTag': nomi, 'nota': nota, 'fino': FINO,
                    'spegni': {t: SPEGNI[t] for t in tags if t in SPEGNI},
                    't': [[o.apertura[:16], o.chiusura[:16], 'L' if o.tipo == 'long' else 'S',
                           round(o.R, 4), tags.index(o.tag)] for o in ops]})
    return out


def main(argv):
    modello = open(os.path.join(RADICE, 'monitor', 'modello.html'), encoding='utf-8').read()
    rif = riferimenti()
    corpo = modello.replace('/*__RIFERIMENTI__*/',
                            'window.RIFERIMENTI = %s;' % json.dumps(rif, ensure_ascii=False,
                                                                    separators=(',', ':')))
    pagina = ('<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
              '<style>:root{color-scheme:light} body{margin:0} [hidden]{display:none!important}</style>\n'
              '</head>\n<body>\n' + corpo + '\n</body>\n</html>\n')
    dest = os.path.join(RADICE, 'monitor', 'monitor.html')
    open(dest, 'w', encoding='utf-8').write(pagina)
    print('%s  %.0f KB  (%s)' % (os.path.relpath(dest, RADICE), len(pagina.encode()) / 1024,
                                 ', '.join('%s %d operazioni' % (r['nome'], len(r['t'])) for r in rif)))
    if '--artifact' in argv:
        a = argv[argv.index('--artifact') + 1]
        open(a, 'w', encoding='utf-8').write(corpo)
        print('versione per claude.ai: %s' % a)


if __name__ == '__main__':
    main(sys.argv[1:])

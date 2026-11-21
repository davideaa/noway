# Crea programma.html (A4) da lezioni.json + schema.md; poi pdf.cjs lo stampa in PDF con Chromium.
import json, re, html
L = json.load(open('lezioni.json'))
WK = json.load(open('weekend.json'))
S = open('schema.md').read().splitlines()
caps, weeks = [], {}
for line in S:
    m = re.match(r'^C(\d+) (.+) \((\w+)\)$', line.strip())
    if m: caps.append((int(m.group(1)), m.group(2), m.group(3))); continue
    m = re.match(r'^S(\d) ([^:]+):', line.strip())
    if m: weeks[(caps[-1][0], int(m.group(1)))] = m.group(2)
MESI = {'ottobre': 'ottobre 2026', 'novembre': 'novembre 2026', 'dicembre': 'dicembre 2026', 'gennaio': 'gennaio 2027', 'febbraio': 'febbraio 2027', 'marzo': 'marzo 2027',
        'aprile': 'aprile 2027', 'maggio': 'maggio 2027', 'giugno': 'giugno 2027', 'luglio': 'luglio 2027', 'agosto': 'agosto 2027', 'settembre': 'settembre 2027'}
GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì']
e = lambda s: html.escape(str(s))
cap1 = lambda s: s[:1].upper() + s[1:]
out = []
out.append(f'''<!doctype html><html lang="it"><head><meta charset="utf-8"><link rel="stylesheet" href="../../reel/font.css"><style>
@page {{ size: A4; margin: 16mm 14mm 16mm 14mm; }}
:root {{ --ink:#0d1210; --mut:#5d6762; --lime:#4f7d12; --limebg:#eef7dd; --line:#dde3dc; --red:#b3342b; }}
body {{ font-family: Manrope, sans-serif; color: var(--ink); font-size: 9.6pt; line-height: 1.38; margin: 0; }}
h1 {{ font-size: 30pt; line-height: 1.05; margin: 0 0 6mm; letter-spacing: -0.5pt; }}
h2 {{ font-size: 18pt; margin: 0 0 1mm; letter-spacing: -0.3pt; }}
h3 {{ font-size: 11pt; margin: 5mm 0 2mm; color: var(--lime); text-transform: uppercase; letter-spacing: 1pt; font-family: "IBM Plex Mono", monospace; }}
.mono {{ font-family: "IBM Plex Mono", monospace; letter-spacing: .6pt; }}
.cover {{ height: 255mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }}
.cover .tag {{ color: var(--lime); font-family: "IBM Plex Mono", monospace; font-size: 10pt; letter-spacing: 2pt; margin-bottom: 6mm; }}
.cover p {{ font-size: 12pt; color: var(--mut); max-width: 150mm; }}
.box {{ border: 1px solid var(--line); border-radius: 3mm; padding: 4mm 5mm; margin: 3mm 0; }}
table.ov {{ width: 100%; border-collapse: collapse; font-size: 9pt; }}
table.ov td, table.ov th {{ border-bottom: 1px solid var(--line); padding: 1.6mm 1.5mm; text-align: left; vertical-align: top; }}
table.ov th {{ font-family: "IBM Plex Mono", monospace; font-size: 8pt; color: var(--mut); }}
.chap {{ page-break-before: always; }}
.chaphead {{ border-left: 4px solid var(--lime); padding-left: 4mm; margin-bottom: 4mm; }}
.chaphead .m {{ color: var(--mut); font-family: "IBM Plex Mono", monospace; font-size: 9pt; letter-spacing: 1pt; }}
.les {{ border: 1px solid var(--line); border-radius: 2.5mm; padding: 3mm 4mm; margin: 0 0 2.6mm; page-break-inside: avoid; }}
.les.caso {{ background: var(--limebg); border-color: #c9e3a3; }}
.les .top {{ display: flex; gap: 3mm; align-items: baseline; }}
.les .n {{ font-family: "IBM Plex Mono", monospace; font-weight: 600; color: var(--lime); min-width: 11mm; }}
.les .t {{ font-weight: 800; font-size: 11pt; flex: 1; }}
.les .d {{ font-family: "IBM Plex Mono", monospace; font-size: 7.6pt; color: var(--mut); }}
.badge {{ font-family: "IBM Plex Mono", monospace; font-size: 7.4pt; background: var(--lime); color: #fff; border-radius: 2mm; padding: .4mm 1.6mm; margin-left: 2mm; }}
.g {{ font-style: italic; margin: 1mm 0 1.2mm 14mm; color: #26302b; }}
.les ul {{ margin: 0 0 1.2mm 14mm; padding-left: 4mm; }}
.les li {{ margin: 0 0 .6mm; }}
.r {{ margin: .5mm 0 0 14mm; }}
.r b {{ font-family: "IBM Plex Mono", monospace; font-size: 7.6pt; color: var(--mut); letter-spacing: .6pt; font-weight: 600; display: inline-block; min-width: 20mm; }}
</style></head><body>''')
out.append('''<div class="cover"><div class="tag">MACRO &amp; ALGO · @macro.algo.desk</div><h1>Dalla teoria<br>alla realtà</h1>
<p>Il programma completo dei reel: <b>264 reel</b> in un anno (240 lezioni + 24 speciali del weekend), dal circuito dell'economia alla gestione di un portafoglio. Per universitari e giovani che vogliono capire come gira davvero l'economia e come muove i mercati.</p>
<p class="mono" style="font-size:9pt">12 capitoli · 5 reel a settimana + 1 weekend speciale al mese · ogni giorno alle 12:00 · ottobre 2026 → settembre 2027</p></div>''')
out.append('''<h2>Come funziona</h2><div class="box"><b>Struttura.</b> 12 capitoli, uno al mese. Ogni capitolo ha 4 settimane; ogni settimana 5 reel, dal lunedì al venerdì. Il <b>venerdì è sempre un «Caso reale»</b>: la teoria della settimana applicata a un fatto vero (per esempio: cosa hanno fatto le banche centrali con i tassi durante il Covid). Totale 240 reel. I giorni feriali in più di ogni mese restano per gli «Extra» sulle notizie forti.</div>
<div class="box"><b>Weekend speciale «Investimenti e trading» (1 al mese).</b> A metà mese, il sabato e la domenica della seconda settimana: <b>sabato</b> una spiegazione pratica sul mondo degli investimenti e del trading; <b>domenica</b> un caso reale in cui quello che si è visto sabato si poteva applicare (con orizzonte, rischi e numeri veri). 12 weekend = 24 reel. Sempre educazione, mai consigli personali.</div>
<div class="box"><b>Uscita.</b> Ogni giorno alle <b>12:00</b>, sempre alla stessa ora, per creare l'abitudine: si guarda tra una lezione e l'altra o si recupera nel pomeriggio.</div>
<div class="box"><b>Ogni reel (80–100 secondi, voce sempre presente).</b><br>1. <b>Gancio</b> (primi 3 secondi): una frase o una domanda che riguarda chi guarda.<br>2. <b>Di cosa parliamo e dove siamo</b>: «Lezione 27, capitolo Soldi e banche: oggi l'interesse composto», e perché serve saperlo.<br>3. <b>Spiegazione</b> in 3 passaggi, ognuno con la sua animazione: l'immagine fa vedere quello che dice la voce.<br>4. <b>Caso o esempio reale</b> con un dato vero e la fonte a schermo.<br>5. <b>Cosa ti porti a casa</b> in una frase.<br>6. <b>Chiusura fissa</b>: «Oggi è mercoledì: lezione 3 di 5 della settimana» (nel weekend: «Speciale weekend, parte 1 di 2»), poi «Domani: …» e Segui.</div>
<div class="box"><b>Regole.</b> Ordine rigoroso: ogni lezione usa solo cose già spiegate prima (vedi «Collega»). Numeri solo da fonti ufficiali (ISTAT, Eurostat, Banca d'Italia, BCE, Fed, FRED, EIA, Agenzia delle Entrate, ESMA, OCSE), con data; dove una scheda dice «da verificare», il dato si controlla al momento di produrre il reel. Contenuto educativo, mai consigli d'investimento personali. Grafica nello stile noir del canale, nessuna persona reale.</div>
<div class="box"><b>Come leggere ogni scheda.</b> <span class="mono">GANCIO</span> la frase d'apertura · <span class="mono">SPIEGA</span> i 3 punti che chi guarda deve capire · <span class="mono">ESEMPIO</span> il caso reale o il dato · <span class="mono">TI SERVE</span> perché è utile · <span class="mono">VISUAL</span> l'animazione principale · <span class="mono">COLLEGA</span> le lezioni precedenti su cui si appoggia.</div>''')
out.append('<h2 style="margin-top:6mm">I 12 capitoli</h2><table class="ov"><tr><th>CAP.</th><th>MESE</th><th>TITOLO</th><th>LE 4 SETTIMANE</th></tr>')
for c, t, m in caps:
    ws = ' · '.join(weeks[(c, s)] for s in range(1, 5))
    out.append(f'<tr><td class="mono">{c}</td><td>{e(cap1(MESI[m]))}</td><td><b>{e(t)}</b></td><td>{e(ws)}</td></tr>')
out.append('</table>')
for c, t, m in caps:
    out.append(f'<div class="chap"><div class="chaphead"><div class="m">CAPITOLO {c} · {e(MESI[m].upper())} · LEZIONI {(c-1)*20+1}–{c*20}</div><h2>{e(t)}</h2></div>')
    for s in range(1, 5):
        out.append(f'<h3>Settimana {s} · {e(weeks[(c, s)])}</h3>')
        if s == 3:
            w = WK[c - 1]
            out.append('<h3>Weekend speciale · Investimenti e trading</h3>')
            for gi, key in ((0, 'sab'), (1, 'dom')):
                l = w[key]
                out.append(f'''<div class="les caso"><div class="top"><span class="n">W{c:02d}{'ab'[gi]}</span><span class="t">{e(l['titolo'])}<span class="badge">WEEKEND</span></span><span class="d">{['SABATO','DOMENICA'][gi]}</span></div>
<div class="g">«{e(l['gancio'])}»</div><ul>{''.join(f'<li>{e(p)}</li>' for p in l['spiega'])}</ul>
<div class="r"><b>ESEMPIO</b>{e(l['esempio'])}</div><div class="r"><b>TI SERVE</b>{e(l['ti_serve'])}</div><div class="r"><b>VISUAL</b>{e(l['visual'])}</div></div>''')
        for d in range(5):
            n = (c - 1) * 20 + (s - 1) * 5 + d + 1; l = L[n - 1]; caso = l['caso_reale']
            col = ', '.join(str(v) for v in l.get('collega', [])) or '—'
            out.append(f'''<div class="les{' caso' if caso else ''}"><div class="top"><span class="n">{n:03d}</span><span class="t">{e(cap1(l['titolo']))}{'<span class="badge">CASO REALE</span>' if caso else ''}</span><span class="d">{GIORNI[d].upper()}</span></div>
<div class="g">«{e(l['gancio'])}»</div><ul>{''.join(f'<li>{e(p)}</li>' for p in l['spiega'])}</ul>
<div class="r"><b>ESEMPIO</b>{e(l['esempio'])}</div><div class="r"><b>TI SERVE</b>{e(l['ti_serve'])}</div><div class="r"><b>VISUAL</b>{e(l['visual'])}</div><div class="r"><b>COLLEGA</b>{e(col)}</div></div>''')
    out.append('</div>')
out.append('</body></html>')
open('programma.html', 'w').write('\n'.join(out)); print('html ok')

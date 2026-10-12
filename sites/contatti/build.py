#!/usr/bin/env python3
"""Pagina delle bozze: per ogni attività il messaggio pronto da copiare, i contatti e la foto del sito come prova.

  node scripts/guarda.cjs dati/lead-*.json    # foto dei siti (dati/schermate/) e prove viste nel browser (dati/visti.json)
  python3 build.py                            # -> out/bozze.html (si pubblica come artifact)
  python3 build.py --tel "+39 333 123 4567" --email lavoro@dominio.it

I dati delle attività stanno in dati/ (fuori dal repo, che è pubblico): lead-*.json dalla ricerca (RICERCA.md),
bozze.json con oggetto e testo di ogni messaggio. Nei testi la firma si aggiunge qui, uguale per tutti.
"""
import base64, html, io, json, os, sys
from PIL import Image

QUI = os.path.dirname(os.path.abspath(__file__))
DATI = os.path.join(QUI, "dati")
e = html.escape


def opzione(nome, predefinito):
    return sys.argv[sys.argv.index(nome) + 1] if nome in sys.argv else predefinito


TELEFONO = opzione("--tel", "")
EMAIL = opzione("--email", "ciao.davidestudio@gmail.com")      # la mail di lavoro, come nella vetrina
ALLEGATO = "Davide-prima-e-dopo.html"
GRUPPI = [("lead-hotel-milano.json", "milano-hotel", "Hotel a Milano"),
          ("lead-montagna.json", "montagna", "Hotel in montagna"),
          ("lead-ristoranti-milano.json", "milano-tavola", "Ristoranti e locali a Milano")]


PRESENTAZIONE = ("Mi chiamo Davide, ho 22 anni, sono laureato in Economia delle banche e da tre anni lavoro come freelance: "
                 "rifaccio i siti di hotel, ristoranti e locali perché siano belli, chiari e veloci, e li collego a prenotazioni, "
                 "ordini e logistica. Mi occupo anche di grafica e motion graphic: animazioni, reel e video.")
GUARDATO = ("Ho guardato il vostro sito con gli occhi di un cliente che vi cerca per la prima volta, e ci sono alcune cose "
            "che vi fanno perdere più di quanto sembri:")
VETRINA = ("Vi allego la mia vetrina, così vedete come lavoro: è un file che si apre con un doppio clic, anche senza internet. "
           "Dentro ci sono tre siti reali che ho ridisegnato, un hotel e due ristoranti dell'area di Milano: a sinistra com'erano, "
           "a destra come li ho rifatti, da computer e da telefono. Bastano due minuti.")
COME = ("Come funziona: mi raccontate cosa vi serve e che budget avete in mente, e io vi mando una proposta chiara con cosa faccio, "
        "in quanto tempo e a che prezzo. Parlate sempre e solo con me, dall'inizio alla consegna, e il pagamento è semplice: con bonifico.")
CONGEDO = "Se invece non è il momento, nessun problema: basta una riga e non vi scrivo più.\n\nUn saluto,"


def messaggio(b):
    """Il messaggio intero: aggancio, chi sono, cosa ho visto, cosa farei, vetrina, come funziona, invito, firma."""
    aggancio = b["aggancio"][0].upper() + b["aggancio"][1:]
    invito = ("Se vi incuriosisce, rispondete a questa email o chiamatemi al " + (TELEFONO or "[IL TUO NUMERO]") +
              ": in dieci minuti capiamo insieme se posso esservi utile.")
    note = "\n".join("– " + n for n in b["note"])
    parti = ["Buongiorno,", aggancio, PRESENTAZIONE, GUARDATO + "\n\n" + note, b["proposta"], VETRINA, COME, invito, CONGEDO, firma()]
    return "\n\n".join(parti)


def firma():
    righe = ["Davide", "Web designer freelance · siti, restyling, motion graphic"]
    righe.append(" · ".join(x for x in (TELEFONO or "[IL TUO NUMERO]", EMAIL) if x))
    return "\n".join(righe)


def foto(nome, lato=420):
    f = os.path.join(DATI, "schermate", nome)
    if not os.path.exists(f):
        return ""
    im = Image.open(f).convert("RGB")
    im.thumbnail((lato, lato * 3), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "WEBP", quality=62, method=6)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()


def recensioni(r):
    if not r or not r.get("voto"):
        return ""
    n = f" su {r['numero']:,}".replace(",", ".") if r.get("numero") else ""
    fonte = r.get("fonte", "").split(" (")[0]
    return f"{str(r['voto']).replace('.', ',')}{n} · {fonte}"


def main():
    bozze = {b["id"]: b for b in json.load(open(os.path.join(DATI, "bozze.json"), encoding="utf-8"))}
    schede, conta = [], {}
    for file, gruppo, _ in GRUPPI:
        for l in json.load(open(os.path.join(DATI, file), encoding="utf-8")):
            if l["id"] not in bozze:
                continue
            b = bozze[l["id"]]
            c = l.get("contatti") or {}
            email = (c.get("email") or "").split(" ")[0]
            tel = c.get("telefono") or ""
            testo = messaggio(b) if "aggancio" in b else b["testo"].rstrip() + "\n\n" + firma()
            conta[gruppo] = conta.get(gruppo, 0) + 1
            schede.append(dict(id=l["id"], gruppo=gruppo, priorita=b.get("priorita", l.get("priorita", 3)), nome=l["nome"],
                               citta=l.get("citta", ""), zona=l.get("zona") or "", livello=l.get("livello", ""), sito=l["sito"],
                               rec=recensioni(l.get("recensioni")), email=email, tel=tel, ig=c.get("instagram") or "",
                               modulo=c.get("modulo") or "", oggetto=b["oggetto"], testo=testo,
                               nota=l.get("note") or "", foto=foto(f"{l['id']}-tel.png"), foto2=foto(f"{l['id']}-tel2.png")))
    schede.sort(key=lambda s: (s["priorita"], [g[1] for g in GRUPPI].index(s["gruppo"])))
    pagina = open(os.path.join(QUI, "src", "bozze.html"), encoding="utf-8").read()
    filtri = "".join(f'<button type="button" class="filtro" data-gruppo="{g}" aria-pressed="false">{e(n)} <span>{conta.get(g, 0)}</span></button>'
                     for _, g, n in GRUPPI)
    sostituzioni = {
        "{{DATI}}": json.dumps(schede, ensure_ascii=False).replace("<", "\\u003c"),
        "{{FILTRI}}": filtri, "{{TOTALE}}": str(len(schede)), "{{ALLEGATO}}": e(ALLEGATO), "{{EMAIL}}": e(EMAIL),
        "{{TEL_STATO}}": (f"il tuo numero ({e(TELEFONO)})" if TELEFONO else
                          '<mark>manca il tuo numero</mark>: nei messaggi c\'è scritto [IL TUO NUMERO]'),
    }
    for k, v in sostituzioni.items():
        pagina = pagina.replace(k, v)
    os.makedirs(os.path.join(QUI, "out"), exist_ok=True)
    f = os.path.join(QUI, "out", "bozze.html")
    open(f, "w", encoding="utf-8").write(pagina)
    print(f, len(schede), "bozze", round(os.path.getsize(f) / 1e6, 2), "MB")


if __name__ == "__main__":
    main()

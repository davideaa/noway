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
ALLEGATO = "Davide-portfolio.html"
GRUPPI = [("lead-hotel-milano.json", "milano-hotel", "Hotel a Milano"),
          ("lead-montagna.json", "montagna", "Hotel in montagna"),
          ("lead-ristoranti-milano.json", "milano-tavola", "Ristoranti e locali a Milano")]


# Testo voluto da Davide (12/10/2026): scritto come lo scriverebbe un ragazzo, difetti solo accennati (se no li
# sistemano da soli), il suo ruolo di collegamento fra l'attività e chi la cerca online, il "portfolio" allegato,
# come funziona e bonifico, l'invito a rispondere. Niente complimenti iniziali né frasi di congedo.
PRESENTAZIONE = ("Mi chiamo Davide, ho 22 anni, mi sono laureato in Economia delle banche e da tre anni lavoro come freelance. "
                 "Rifaccio siti per hotel, ristoranti e locali, curando la grafica, le animazioni e il collegamento con prenotazioni e ordini.")
RUOLO = ("Il mio lavoro è proprio questo: fare da collegamento tra la vostra attività e chi vi cerca online, e valorizzarla al meglio, "
         "sia nella grafica sia nel modo in cui il cliente vi trova, vi scopre e vi contatta.")
PORTFOLIO = ("Vi allego il mio portfolio, così potete vedere cosa so fare. È un file che si apre con un doppio clic, anche senza internet, "
             "e dentro ci sono tre siti reali che ho rifatto, un hotel e due ristoranti della zona di Milano, con il prima e il dopo "
             "da computer e da telefono.")
COME = ("Se vi interessa vi spiego volentieri come lavoro. Mi dite di cosa avete bisogno e che budget avete in mente, e io vi preparo "
        "una proposta con tempi e costi. Parlate sempre direttamente con me e il pagamento è con bonifico.")


def messaggio(b):
    """Il messaggio intero: chi sono, cosa ho notato (accennato) e cosa meriterebbe spazio, il mio ruolo, portfolio, come funziona, invito, firma."""
    notato = "Ho guardato il vostro sito e ho notato qualche problema, " + b["problemi"] + ". " + b["valore"]
    invito = ("Se vi incuriosisce, rispondete pure a questa mail o chiamatemi al " + TELEFONO + "." if TELEFONO else
              "Se vi incuriosisce, rispondete pure a questa mail, anche solo con un numero e un orario in cui chiamarvi.")
    parti = ["Buongiorno,", PRESENTAZIONE, notato, RUOLO, PORTFOLIO, COME, invito, "Un saluto,", firma()]
    return "\n\n".join(parti)


def firma():
    righe = ["Davide", "Web designer freelance · siti, restyling, motion graphic"]
    righe.append(" · ".join(x for x in (TELEFONO, EMAIL) if x))
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
                          'nessun numero: i messaggi chiedono di rispondere alla mail (con --tel il numero entra nell\'invito e nella firma)'),
    }
    for k, v in sostituzioni.items():
        pagina = pagina.replace(k, v)
    os.makedirs(os.path.join(QUI, "out"), exist_ok=True)
    pronte = [{"id": s["id"], "a": s["email"], "oggetto": s["oggetto"], "testo": s["testo"]} for s in schede if s["email"]]
    json.dump(pronte, open(os.path.join(DATI, "per-gmail.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    senza = [s["nome"] for s in schede if not s["email"]]
    if senza:
        print("  senza email (solo modulo o telefono):", ", ".join(senza))
    f = os.path.join(QUI, "out", "bozze.html")
    open(f, "w", encoding="utf-8").write(pagina)
    print(f, len(schede), "bozze", round(os.path.getsize(f) / 1e6, 2), "MB")


if __name__ == "__main__":
    main()

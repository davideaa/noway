#!/usr/bin/env python3
"""Controllo finale delle email trovate (richiesta di Davide: solo indirizzi veri, attivi, usati dall'attività).

Per ogni attività in dati/lead2-*.json prende l'email di lavoro (o, se manca, quella generica) e verifica che:
  1. sia scritta davvero nella pagina indicata in contatti.dove (o in home / contatti, scaricate di nuovo adesso);
  2. il dominio abbia un server di posta (record MX, via dns.google);
  3. il dominio dell'email somigli a quello del sito (avviso, non scarto: alcuni usano un dominio diverso ma loro).
Scrive dati/verifica-email.json e stampa una riga per attività: OK / SCARTA con il motivo.

  python3 -I scripts/verifica_email.py
"""
import glob, json, os, re, subprocess, urllib.parse

QUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATI = os.path.join(QUI, "dati")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0 Safari/537.36"
PUBBLICI = {"gmail.com", "libero.it", "hotmail.it", "hotmail.com", "yahoo.it", "yahoo.com", "outlook.it", "outlook.com", "virgilio.it", "tiscali.it", "alice.it", "icloud.com"}


def scarica(url):
    try:
        return subprocess.run(["curl", "-sSL", "--max-time", "25", "-A", UA, url], capture_output=True, timeout=40).stdout.decode("utf-8", "replace")
    except Exception:
        return ""


def cfemail(h):
    """Le email protette da Cloudflare (data-cfemail="...") tornano in chiaro."""
    def dec(m):
        e = bytes.fromhex(m.group(1)); k = e[0]
        return bytes(b ^ k for b in e[1:]).decode("utf-8", "replace")
    return re.sub(r'data-cfemail="([0-9a-f]+)"', lambda m: dec(m), h) + " " + " ".join(
        dec(m) for m in re.finditer(r"/cdn-cgi/l/email-protection#([0-9a-f]+)", h))


def mx(dominio):
    try:
        out = subprocess.run(["curl", "-sS", "--max-time", "15", f"https://dns.google/resolve?name={dominio}&type=MX"],
                             capture_output=True, timeout=25).stdout
        d = json.loads(out)
        return [a["data"] for a in d.get("Answer", []) if a.get("type") == 15]
    except Exception:
        return None


def radice(host):
    parti = host.lower().removeprefix("www.").split(".")
    return ".".join(parti[-2:]) if len(parti) >= 2 else host


def main():
    esito = {}
    for f in sorted(glob.glob(os.path.join(DATI, "lead2-*.json"))):
        for l in json.load(open(f, encoding="utf-8")):
            c = l.get("contatti") or {}
            email = (c.get("email_lavoro") or c.get("email") or "").strip().split()[0] if (c.get("email_lavoro") or c.get("email")) else ""
            tipo = "lavoro" if c.get("email_lavoro") else "generica"
            r = {"id": l["id"], "nome": l["nome"], "email": email, "tipo": tipo, "motivi": [], "avvisi": []}
            if not re.fullmatch(r"[\w.+-]+@[\w-]+(\.[\w-]+)+", email or ""):
                r["motivi"].append("email mancante o scritta male")
            else:
                dominio = email.split("@")[1].lower()
                pagine = [c.get("dove"), l.get("sito")]
                sito = urllib.parse.urlparse(l.get("sito", ""))
                for p in ("contatti", "contact", "contacts", "it/contatti", "privacy", "privacy-policy", "it/privacy"):
                    pagine.append(f"{sito.scheme}://{sito.netloc}/{p}")
                home = scarica(l.get("sito", ""))
                for href in re.findall(r'href="([^"#]+)"', home, re.I):
                    if re.search(r"contatt|contact|privacy|impressum|dove-siamo|chi-siamo|about|eventi|events|meeting|lavora", href, re.I):
                        pagine.append(urllib.parse.urljoin(l.get("sito", ""), href))
                pagine = list(dict.fromkeys(pagine))[:14]
                trovata = None
                for p in [x for x in pagine if x]:
                    h = cfemail(scarica(p)).lower()
                    # anche offuscata: &#64; o [at]
                    h = h.replace("&#64;", "@").replace("%40", "@").replace("[at]", "@").replace("(at)", "@")
                    if email.lower() in h:
                        trovata = p
                        break
                if not trovata:
                    r["motivi"].append("non la trovo scritta sul loro sito adesso")
                r["trovata_in"] = trovata
                m = mx(dominio)
                if m is None:
                    r["avvisi"].append("controllo MX non riuscito")
                elif not m:
                    r["motivi"].append(f"il dominio {dominio} non riceve posta (nessun MX)")
                r["mx"] = m
                if dominio not in PUBBLICI and radice(dominio) != radice(sito.netloc):
                    r["avvisi"].append(f"dominio email ({dominio}) diverso dal sito ({sito.netloc})")
                if c.get("email_lavoro") and re.match(r"(info|prenotazion|booking|reservation|reception)", email.split("@")[0]):
                    r["avvisi"].append("segnata come di lavoro ma sembra generica")
            r["ok"] = not r["motivi"]
            esito[l["id"]] = r
            print(("OK     " if r["ok"] else "SCARTA ") + f"{l['id']:<45} {email:<40} {tipo:<8} " + "; ".join(r["motivi"] + r["avvisi"]))
    json.dump(esito, open(os.path.join(DATI, "verifica-email.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    ok = [r for r in esito.values() if r["ok"]]
    print(f"\n{len(ok)} su {len(esito)} passano; di lavoro: {sum(r['tipo'] == 'lavoro' for r in ok)}")


if __name__ == "__main__":
    main()

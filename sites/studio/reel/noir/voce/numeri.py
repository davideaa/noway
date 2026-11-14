# Confronto dei NUMERI tra copione e trascrizione della voce (11–14/11/2026).
# Il controllo di somiglianza toglie i numeri da entrambi i lati (Whisper li scrive in cifre), quindi un numero detto male
# passava con somiglianza 1,00: «trentasei mesi» → «56 mesi» (P31), «trentatremila» → «32.000» (P36).
# Qui: ogni numero del copione da 20 in su deve comparire, uguale, nella trascrizione. Sotto 20 non si controlla
# («un», «due», «tre e mezzo», decimali: troppo ambigui tra parole e cifre).
# Uso: mancanti(testo_copione, trascrizione) → lista dei numeri attesi e non sentiti (vuota = a posto).
import re, unicodedata

U = {'zero': 0, 'uno': 1, 'un': 1, 'una': 1, 'due': 2, 'tre': 3, 'quattro': 4, 'cinque': 5, 'sei': 6, 'sette': 7, 'otto': 8, 'nove': 9, 'dieci': 10,
     'undici': 11, 'dodici': 12, 'tredici': 13, 'quattordici': 14, 'quindici': 15, 'sedici': 16, 'diciassette': 17, 'diciotto': 18, 'diciannove': 19}
D = {'venti': 20, 'trenta': 30, 'quaranta': 40, 'cinquanta': 50, 'sessanta': 60, 'settanta': 70, 'ottanta': 80, 'novanta': 90}
DE = {k[:-1]: v for k, v in D.items()}   # vent·uno, trent·otto


def _sotto100(s):
    if s == '': return 0
    if s in U: return U[s]
    for k, v in D.items():
        if s == k: return v
        if s.startswith(k) and s[len(k):] in U and U[s[len(k):]] < 10: return v + U[s[len(k):]]
    for k, v in DE.items():
        if s.startswith(k) and s[len(k):] in ('uno', 'otto'): return v + U[s[len(k):]]
    return None


def _sotto1000(s):
    if s == '': return 0
    i = s.find('cento')
    if i >= 0:
        a, b = s[:i], s[i + 5:]
        h = 1 if a == '' else U.get(a)
        if h is None or not 1 <= h <= 9: return None
        if b.startswith('ttanta') or b.startswith('tto'): b = 'o' + b   # cent·ottanta, cent·otto
        r = _sotto100(b)
        return None if r is None else h * 100 + r
    return _sotto100(s)


def parola(s):
    """«centosessantacinquemila» → 165000; None se non è un numero."""
    s = unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-z]', '', s)
    if not s: return None
    tot = 0
    for nome, mult in (('miliardi', 10 ** 9), ('miliardo', 10 ** 9), ('milioni', 10 ** 6), ('milione', 10 ** 6)):
        i = s.find(nome)
        if i >= 0:
            a = _sotto1000(s[:i]) if s[:i] else 1
            if a is None: return None
            tot += a * mult; s = s[i + len(nome):]
    i = s.find('mila')
    if i >= 0:
        a = _sotto1000(s[:i])
        if a is None or a == 0: return None
        tot += a * 1000; s = s[i + 4:]
    elif s.startswith('mille'):
        tot += 1000; s = s[5:]
    r = _sotto1000(s)
    if r is None: return None
    return tot + r if (tot + r) or s == 'zero' else None


def numeri(testo):
    """Tutti i numeri interi di un testo: quelli in lettere e quelli in cifre come li scrive Whisper («165 .000», «10 %», «3 ,2»)."""
    t = re.sub(r'\bper\s+cento\b', ' % ', testo.replace('’', "'"), flags=re.I)   # «per cento» non è il numero cento
    out = []
    for m in re.finditer(r"\d+(?:\s?\.\d{3})+|\d+(?:\s?mila)?", t):   # migliaia col punto (anche staccato), «30mila»; dei decimali resta la parte intera
        g = m.group(0)
        if 'mila' in g: out.append(int(re.sub(r'\D', '', g)) * 1000)
        else: out.append(int(re.sub(r'\D', '', g)))
    for w in re.findall(r"[A-Za-zÀ-ÿ]+", t):
        v = parola(w)
        if v is not None: out.append(v)
    return out


def mancanti(copione, sentito, soglia=20):
    """Numeri del copione (da `soglia` in su) che la trascrizione non riporta."""
    att = [v for v in numeri(copione) if v >= soglia]
    got = numeri(sentito)
    manca = []
    for v in att:
        if v in got: got.remove(v)
        else: manca.append(v)
    return manca


if __name__ == '__main__':
    prove = [
        ("Gli intermediari, però, ne vedono soltanto gli ultimi trentasei mesi.", "Gli intermediari però ne vedono soltanto gli ultimi 56 mesi.", [36]),
        ("Gli intermediari, però, ne vedono soltanto gli ultimi trentasei mesi.", "Gli intermediari però ne vedono soltanto gli ultimi 36 mesi.", []),
        ("una casa da centosessantacinquemila euro: di solito la banca presta fino all'ottanta per cento, e il resto, trentatremila euro", "una casa da 165 .000 euro, di solito la banca presta fino all '80%, e il resto, 32 .000 euro", [33000]),
        ("due prestiti da diecimila euro in sessanta mesi, entrambi con un Tan dell'otto per cento", "due prestiti da 10 .000 euro in 60 mesi, entrambi con un tan dell '8%", []),
        ("Nel duemilaventicinque quasi un acquisto di casa su due, il quarantasei per cento", "Nel 2025 quasi un acquisto di casa su 2, il 46%", []),
        ("circa duecentocinquantaseimila famiglie hanno visto la rata salire di oltre il trenta per cento", "circa 256 .000 famiglie hanno visto la rata salire di oltre il 30%", []),
        ("era circa il dieci virgola quattro per cento", "era circa il 10 ,4%", []),
        ("In tutto gli interessi sono oltre sessantatremila euro, e restituisci circa centoquarantadue euro ogni cento presi", "In tutto gli interessi sono oltre 63 .000 euro e restituisci circa 142 euro ogni 100 presi", []),
        ("un miliardo e quaranta milioni di dollari, in trenta rate", "1 miliardo e 40 milioni di dollari in 30 rate", []),
        ("circa settecentoundici euro al mese, venticinque anni e mezzo, centottanta, millecinquecentonovantanove", "circa 711 euro al mese, 25 anni e mezzo, 180, 1 .599", []),
        ("tra chi compra fino a trent'anni circa due su tre", "tra chi compra fino a 30 anni circa 2 su 3", []),
    ]
    ok = True
    for c, s, atteso in prove:
        r = mancanti(c, s); ok &= r == atteso
        print('OK ' if r == atteso else 'NO!', r, '|', numeri(c), '→', numeri(s))
    print('TUTTO OK' if ok else 'ERRORI')

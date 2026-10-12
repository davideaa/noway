#!/usr/bin/env python3
# Controllo del copione PRIMA di generare la voce: costa zero e risparmia i minuti che la voce spreca sulle frasi difficili.
# Uso: python3 controlla_copione.py righe-pN.json      → elenca i problemi; esce con errore se ce ne sono di bloccanti.
# Regole nate dagli errori veri delle puntate 1 e 2 (vedi PROCEDURA-PUNTATE.md).
import json, re, sys
R = json.load(open(sys.argv[1])); err = warn = 0
FISSE = {"num", "fine", "cta"}
def out(kind, k, msg):
    global err, warn
    print(f"{kind} [{k}] {msg}"); err += kind == "ERRORE"; warn += kind == "AVVISO"
parole = 0
for s, k in R:
    if k == "num": continue
    w = s.split(); parole += len(w)
    if re.search(r"\d", s): out("ERRORE", k, "cifre nel testo: i numeri vanno scritti in lettere")
    if re.search(r"\b[A-Z]{2,}\b", s): out("ERRORE", k, f"sigla maiuscola {re.findall(r'[A-Z]{2,}', s)}: la voce la legge lettera per lettera (scrivere «Pil», «Bce» o per esteso)")
    if re.search(r"\bPil\b[^,;:]{0,12}[.?!]\s*$", s): out("ERRORE", k, "«Pil» in fondo alla riga: fallisce sempre («PIN»); scrivere «prodotto interno lordo»")
    elif re.search(r"\bPil\s*[.?!]", s): out("AVVISO", k, "«Pil» prima di un punto: a rischio, meglio a metà frase")
    if re.search(r"\blordo\s+[aiouàìò]", s, re.I): out("ERRORE", k, "«lordo» seguito da vocale: la voce lo lega («lordo italiano» → «all'orda italiano», 8 su 8 nella Puntata 9); metti dopo una consonante («lordo dell'Italia»); «lordo è» invece passa (Puntate 2 e 7)")
    if re.search(r"\bPil\s+[aeiouàèéìòù]", s, re.I): out("ERRORE", k, "«Pil» seguito da vocale: la voce dice «Pilo» («Pil invece» → «Pilo invece»); metti dopo una consonante («il Pil conta»)")
    if re.search(r"\s[oO]\s", s) and k not in FISSE: out("ERRORE", k, "«o» da sola tra due parole: la voce la salta («cose in più o solo» → «cose in più solo», Puntata 4); scrivere «oppure»")
    if len(w) <= 3: out("ERRORE", k, "frase di 3 parole o meno: la voce le sbaglia spesso")
    if len(w) > 30: out("AVVISO", k, f"{len(w)} parole: oltre 30 la voce tende a inventare una coda")
    if k not in FISSE:
        if re.match(r"^(Primo|Secondo|Terzo|Quarto|Quinto)\s*[:,]|^Punto\b", s): out("ERRORE", k, "elenco «Primo / Secondo…»: Davide vuole un discorso fluido, non punti")
        if re.search(r":\s*(un|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+euro\.?$", s): out("AVVISO", k, "frase telegrafica «…: un euro.»: renderla discorsiva")
        if s.count(".") >= 3: out("AVVISO", k, "tante frasi brevi nella stessa scena: suona a scatti, unirle con «e», «ma», «perché», «così»")
print(f"\n{parole} parole → durata stimata {parole / 2.72:.0f} s (obiettivo 75–85 s)")
if not 190 <= parole <= 235: out("AVVISO", "tutto", "lunghezza fuori dall'obiettivo (190–235 parole)")
print(f"{err} errori, {warn} avvisi"); sys.exit(1 if err else 0)

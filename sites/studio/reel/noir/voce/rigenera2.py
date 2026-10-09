# Selezione severa (v2). Per ogni frase indicata prova fino a 8 seed e tiene la prima che passa TUTTI i controlli,
# giudicata da Whisper large-v3-turbo (più severo dello "small"):
#   1. tutte le parole del copione, nessuna in più (somiglianza >= 0,985: anche una sola «e» saltata fa scartare; numeri esclusi)
#   2. nessuna parola incerta (probabilità >= 0,45): una parola biascicata è uno "sfarfallio"
#   3. finale pulito: dopo l'ultima parola il suono si spegne (niente fine forzata a metà parola)
#   4. durata ragionevole (niente frasi a vanvera dopo il copione)
# Se nessun seed passa tiene il migliore e lo segnala con !!.  Uso (dalla cartella delle frasi): python rigenera2.py 1 2 5  |  python rigenera2.py tutte
import json, re, sys, difflib, shutil, wave, numpy as np, torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
import os, hashlib
R = json.load(open("righe.json")); SKIP = set(os.environ.get("SKIP", "num").split(","))
idx = [i for i, (_, k) in enumerate(R) if k not in SKIP] if sys.argv[1:] == ["tutte"] else [int(v) for v in sys.argv[1:]]
# cache delle frasi GIÀ promosse (stesso testo → stesso file, niente rigenerazione): ~/reel-lavoro/cache/<sha1>.wav
CACHE = os.path.expanduser("~/reel-lavoro/cache"); os.makedirs(CACHE, exist_ok=True)
chiave = lambda s: os.path.join(CACHE, hashlib.sha1(s.encode()).hexdigest()[:16] + ".wav")
NUM = r"\b(un terzo|un|duemila\w*|centotrenta\w*|duecento|cento|venti|dieci|nove|otto|sette|sei|cinque|quattro|tre|due|uno)\b"   # numeri in lettere: Whisper li scrive in cifre
NUMRE = r"(?:zero|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici|tredici|quattordici|quindici|sedici|diciassette|diciotto|diciannove|vent|venti|trent|trenta|quarant|quaranta|cinquant|cinquanta|sessant|sessanta|settant|settanta|ottant|ottanta|novant|novanta|cento|cent|mille|mila|milione|milioni|miliardo|miliardi_no|virgola|terzo)+"   # una parola fatta solo di pezzi di numero («duemilaventitre», «venticinque», «virgola»)
def norm(s, heard=False):
    s = s.lower().replace("’", "'").replace("è", "e").replace("toch", "tok").replace("'", " ").replace("%", " per cento ").replace("g7", "gi sette").replace("€", " euro ")
    s = re.sub(r"\be mezzo\b", " ", s)                      # «quattro e mezzo» = «4,5»
    s = re.sub(NUM, " ", re.sub(r"\d[\d.,]*", " ", s))     # numeri tolti da ENTRAMBI i lati ("ci sei dentro")
    import unicodedata
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()   # tré → tre
    return [w for w in re.sub(r"[^a-z ]", " ", s).split() if not re.fullmatch(NUMRE, w)]
def coda(f, last_end):
    w = wave.open(f); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
    ref = np.sqrt((a ** 2).mean()) + 1e-9; db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) / ref + 1e-9) if len(x) else -99
    fine = db(a[-int(0.06 * sr):])                       # ultimi 60 ms del file
    dopo = a[int((last_end + 0.05) * sr):]                # dopo l'ultima parola: deve esserci un punto di silenzio
    minimo = min((db(dopo[k:k + int(0.05 * sr)]) for k in range(0, max(1, len(dopo) - int(0.05 * sr)), int(0.025 * sr))), default=fine)
    return fine, minimo
tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu"); asr = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
for i in idx:
    if os.path.exists(chiave(R[i][0])): shutil.copy(chiave(R[i][0]), f"r{i:02d}.wav"); print(f"{i:02d} DALLA CACHE (già verificata)", flush=True); continue
    best = (-9, None); exp = len(R[i][0].split()) / 2.4
    for seed in (11, 23, 42, 77, 101, 202, 303, 404):
        torch.manual_seed(seed); wav = tts.generate(R[i][0], language_id="it", exaggeration=0.35, cfg_weight=0.4)
        f = f"r{i:02d}_v{seed}.wav"; ta.save(f, wav, tts.sr); dur = wav.shape[-1] / tts.sr
        W = [w for s in asr.transcribe(f, language="it", beam_size=5, word_timestamps=True)[0] for w in s.words]
        got = " ".join(w.word.strip() for w in W)
        sim = difflib.SequenceMatcher(None, norm(R[i][0]), norm(got, True)).ratio()
        pmin = min((w.probability for w in W), default=0)
        fine, minimo = coda(f, W[-1].end if W else dur)
        ok_fine = fine < -30 or minimo < -38
        passa = sim >= 0.985 and pmin >= 0.45 and ok_fine and dur <= 1.6 * exp + 1
        score = sim + 0.3 * pmin + (0.2 if ok_fine else 0) - (1 if dur > 1.6 * exp + 1 else 0)
        print(f"{i:02d} seed {seed:3d} {'PASSA' if passa else 'no   '} sim {sim:.2f} pmin {pmin:.2f} fine {fine:5.0f}dB min {minimo:5.0f}dB {dur:.1f}s | {got}", flush=True)
        if passa: best = (9, f); break          # chi passa tutti i controlli è SEMPRE la scelta (prima vinceva il punteggio più alto, anche se bocciato)
        if score > best[0]: best = (score, f)
    shutil.copy(best[1], f"r{i:02d}.wav")
    if passa: shutil.copy(best[1], chiave(R[i][0]))
    print(f"{i:02d} SCELTA {best[1]}{'' if passa else '  !! nessuno passa tutti i controlli'}", flush=True)
print("FATTO", flush=True)

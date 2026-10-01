# Per le frasi indicate: genera 3 versioni (seed diversi), le trascrive con Whisper e tiene la migliore come rNN.wav.
import json, re, sys, difflib, shutil, torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
R = json.load(open("righe.json")); idx = [int(v) for v in sys.argv[1:]]
NUM = r"(diecimila|duemilaventiquattro|duemilaventisei|otto|ventidue|sedici|centomila)"
def norm(s, heard=False):
    s = s.lower().replace("’", "'").replace("è", "e").replace("toch", "tok")
    s = re.sub(r"\d[\d.,]*", " ", s) if heard else re.sub(NUM, " ", s)
    return re.sub(r"[^a-zàéìòù' ]", " ", s).split()
tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu"); asr = WhisperModel("small", device="cpu", compute_type="int8")
for i in idx:
    best = (-1, None, "")
    for seed in (11, 23, 42):
        torch.manual_seed(seed); wav = tts.generate(R[i][0], language_id="it", exaggeration=0.35, cfg_weight=0.4)
        f = f"r{i:02d}_s{seed}.wav"; ta.save(f, wav, tts.sr)
        got = " ".join(s.text.strip() for s in asr.transcribe(f, language="it", beam_size=5)[0])
        r = difflib.SequenceMatcher(None, norm(R[i][0]), norm(got, True)).ratio()
        print(f"{i:02d} seed {seed} {r:.2f} | {got}", flush=True)
        if r > best[0]: best = (r, f, got)
    shutil.copy(best[1], f"r{i:02d}.wav"); print(f"{i:02d} SCELTA {best[1]} ({best[0]:.2f})", flush=True)
print("FATTO", flush=True)

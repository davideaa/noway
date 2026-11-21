import json, time, torch, torchaudio as ta
torch.manual_seed(7)
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
t0 = time.time(); m = ChatterboxMultilingualTTS.from_pretrained(device="cpu"); print("modello in %.0fs" % (time.time() - t0), flush=True)
R = json.load(open("righe.json"))
import sys
only = [int(v) for v in sys.argv[1:]] if len(sys.argv) > 1 else range(len(R))
for i in only:
    s = R[i][0]; t0 = time.time()
    wav = m.generate(s, language_id="it", exaggeration=0.35, cfg_weight=0.4)
    ta.save(f"r{i:02d}.wav", wav, m.sr)
    print(i, "%.1fs audio in %.0fs" % (wav.shape[-1] / m.sr, time.time() - t0), s, flush=True)
print("FATTO", flush=True)

import json, time, torch, torchaudio as ta
torch.manual_seed(7)
from chatterbox.tts import ChatterboxTTS
m = ChatterboxTTS.from_pretrained(device="cpu")
R = json.load(open("righe.json"))
for i, (s, _) in enumerate(R):
    t0 = time.time()
    wav = m.generate(s, exaggeration=0.35, cfg_weight=0.4)
    ta.save(f"r{i:02d}.wav", wav, m.sr)
    print(i, "%.1fs audio in %.0fs" % (wav.shape[-1] / m.sr, time.time() - t0), s, flush=True)
print("FATTO", flush=True)

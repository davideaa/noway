#!/usr/bin/env bash
# Produce una puntata dalla voce al video finale. Prima servono (scritti a mano): voce/righe-pN.json, pN.html, pN-fonti.md.
# Uso (dalla cartella noir/): setsid nohup ./produci.sh N > ~/reel-lavoro/pN.log 2>&1 &   — poi si segue il log.
# Passi: voce (selezione severa + cache) → taglio al silenzio → montaggio sui battiti → render 4 processi → mix -14 LUFS
#        → codifica → verifica finale sull'audio vero. Se la verifica fallisce il video NON va pubblicato.
set -e
N=$1; NN=$(printf %02d $N); NOIR=$(cd "$(dirname "$0")" && pwd); W=${LAVORO:-$HOME/reel-lavoro}/p$N; PY=$HOME/tts/bin/python
RUN=${RUN_WAV:-$HOME/reel-lavoro/run.wav}   # base «Run!» (mandata da Davide, non nel repository)
mkdir -p "$W" && cp "$NOIR/voce/righe-p$N.json" "$W/righe.json" && cp "$NOIR/voce/rigenera2.py" "$W/"
cd "$W"   # DA=2 riparte dal taglio (voce già pronta in $W, es. dopo aver rifatto una sola frase con rigenera2.py N)
if [ "${DA:-1}" -le 1 ]; then echo "== 1. voce $(date +%T)"; $PY rigenera2.py tutte 2>&1 | grep -E "seed|SCELTA|CACHE|FATTO"; fi
echo "== 2. taglio $(date +%T)"; $PY "$NOIR/voce/taglia.py" "$W" $(python3 -c "import json;print(' '.join(str(i) for i,(s,k) in enumerate(json.load(open('righe.json'))) if k!='num'))") | grep "^r"
cp righe.json pulite/; [ -f pulite/r00.wav ] || cp r00.wav pulite/ 2>/dev/null || true
echo "== 3. montaggio $(date +%T)"; SKIP=num FIRST=${FIRST:-1.2412} python3 "$NOIR/voce/monta_cues.py" "$W/pulite" 0.6206; cp pulite/cues.json "$NOIR/cues-p$N.json"
DUR=$(python3 -c "import json;print(json.load(open('pulite/cues.json'))['DUR'])")
echo "== 4. render $(date +%T) DUR $DUR"; cd "$NOIR"; rm -rf "out-p$N" && mkdir "out-p$N"
for c in 0 1 2 3; do CUES=cues-p$N.json COMP=p$N.html PARTE=$c/4 node render.cjs "out-p$N" > "$W/render$c.log" 2>&1 & done; wait
grep -h ERR "$W"/render?.log && { echo "ERRORI NEL RENDER"; exit 1; } || true
echo "== 5. mix $(date +%T)"; python3 voce/base_loop.py "$RUN" 0.260 0.6206 20 $(python3 -c "print($DUR+0.3)") "$W/base.wav"
ffmpeg -v error -y -i "$W/pulite/narrazione.wav" -af "aresample=44100,highpass=f=70,equalizer=f=140:t=q:w=1:g=1.5" "$W/narr.wav"
./mix_fisso.sh "$W/narr.wav" "$W/base.wav" "$W/mix.wav"
echo "== 6. codifica $(date +%T)"; ffmpeg -y -v error -framerate 60 -i "out-p$N/%04d.jpg" -i "$W/mix.wav" -t $DUR -c:v libx264 -preset veryfast -crf 21 -pix_fmt yuv420p -profile:v high -r 60 -c:a aac -b:a 192k -movflags +faststart "$W/Puntata$N.mp4"
ffmpeg -hide_banner -i "$W/Puntata$N.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
echo "== 7. verifica finale $(date +%T)"; cd "$W"; $PY "$NOIR/voce/verifica_finale.py" "$W/pulite" "$W/mix.wav" 2>&1 | grep -v Warn
echo "== FINE $(date +%T): $W/Puntata$N.mp4"

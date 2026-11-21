#!/usr/bin/env bash
# Dal scene.json al reel finito: fotogrammi (4 processi), effetti, mix, codifica a 2 passate sotto ~29 MB.
# Uso: ./monta.sh musica.m4a INIZIO_S NOME_USCITA [kbps_video=3700]
#   INIZIO_S = secondo della canzone da cui parte il reel (allineato a un battito: vedi battiti.py)
set -euo pipefail
MUS=$1; SS=$2; OUT=$3; KB=${4:-3700}
PY=${PY:-python3}
FF=$($PY -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())" 2>/dev/null || echo ffmpeg)
T=$($PY -c "import json;print(json.load(open('scene.json'))[-1]['t1'])")
rm -rf out && mkdir out
for c in 0 1 2 3; do PARTE=$c/4 node render.cjs out > r$c.log 2>&1 & done; wait
grep -h "ERR" r*.log && exit 1 || true
$PY sfx.py
$FF -y -v error -ss "$SS" -t "$T" -i "$MUS" -i sfx.wav -filter_complex \
 "[0:a]afade=t=in:d=0.05,afade=t=out:st=$($PY -c "print($T-0.87)"):d=0.87[m];[1:a]volume=0.45,aformat=channel_layouts=stereo[f];[m][f]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
 -map "[a]" -c:a aac -b:a 192k mix.m4a
for p in 1 2; do
  if [ $p = 1 ]; then $FF -y -v error -framerate 60 -i out/%04d.jpg -c:v libx264 -preset slow -b:v ${KB}k -maxrate 6000k -bufsize 8000k -pix_fmt yuv420p -r 60 -pass 1 -passlogfile pl -an -f mp4 /dev/null
  else $FF -y -v error -framerate 60 -i out/%04d.jpg -i mix.m4a -c:v libx264 -preset slow -b:v ${KB}k -maxrate 6000k -bufsize 8000k -pix_fmt yuv420p -profile:v high -r 60 -pass 2 -passlogfile pl -c:a copy -shortest -movflags +faststart "$OUT"; fi
done
rm -f pl* r?.log
ls -la "$OUT"

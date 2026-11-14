#!/usr/bin/env bash
# Voce + base a volume COSTANTE (niente abbassamenti): la base viene scavata nelle frequenze della voce
# (1–4 kHz) e portata ~9 dB sotto la voce. Uso: ./mix_fisso.sh voce.wav base.wav uscita.wav
# v2: compressione leggera sulla voce (le sillabe deboli non spariscono sotto la base) e livello finale
# a -14 LUFS / picco -1 dBTP, come i reel di riferimento (prima usciva a -16, cioè più basso).
set -e
TMP="${3%.wav}_pre.wav"
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex "[0:a]aresample=44100,highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-2,aformat=channel_layouts=stereo[v];[1:a]aresample=44100,equalizer=f=1200:t=q:w=1.2:g=-3,equalizer=f=2800:t=q:w=1.2:g=-5,loudnorm=I=-25:TP=-4[m];[v][m]amix=inputs=2:duration=longest:normalize=0" -ar 44100 "$TMP"
I=$(ffmpeg -hide_banner -i "$TMP" -af ebur128 -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&/I:/{print $2; exit}')
G=$(python3 -c "print(round(-14.0 - ($I), 2))")
ffmpeg -v error -y -i "$TMP" -af "volume=${G}dB,alimiter=limit=0.78:attack=3:release=60:level=disabled" -ar 44100 "$3"
rm -f "$TMP"
echo "mix: da $I LUFS, guadagno ${G} dB"

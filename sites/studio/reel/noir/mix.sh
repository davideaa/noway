#!/usr/bin/env bash
# Voce + musica: la musica si abbassa da sola quando parla la voce (sidechain). Uso: ./mix.sh voce.wav musica.wav uscita.wav
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex "[0:a]aresample=44100,aformat=channel_layouts=stereo,adelay=0|0,asplit=2[v][sc];[1:a]volume=0.55[m];[m][sc]sidechaincompress=threshold=0.04:ratio=8:attack=15:release=350[md];[v][md]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95" -ar 44100 "$3"

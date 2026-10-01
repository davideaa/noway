#!/usr/bin/env bash
# Voce + base a volume COSTANTE (niente abbassamenti): la base viene scavata nelle frequenze della voce
# (1–4 kHz) e portata ~9 dB sotto la voce. Uso: ./mix_fisso.sh voce.wav base.wav uscita.wav
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex "[0:a]aresample=44100,highpass=f=70,loudnorm=I=-16:TP=-2,aformat=channel_layouts=stereo[v];[1:a]aresample=44100,equalizer=f=1200:t=q:w=1.2:g=-3,equalizer=f=2800:t=q:w=1.2:g=-5,loudnorm=I=-25:TP=-4[m];[v][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95" -ar 44100 "$3"

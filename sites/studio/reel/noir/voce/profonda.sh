#!/usr/bin/env bash
# Rende la voce più profonda: tono giù di N semitoni (formanti spostate), corpo sui bassi, de-esser, compressione, -16 LUFS.
# Uso: ./profonda.sh ingresso.wav N uscita.wav
P=$(python3 -c "print(2**(-$2/12))")
ffmpeg -v error -y -i "$1" -af "aresample=44100,rubberband=pitch=$P:formant=shifted:pitchq=quality,highpass=f=60,equalizer=f=110:t=q:w=1:g=3,equalizer=f=320:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1:g=1.5,deesser,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5" -ar 44100 "$3"

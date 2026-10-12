# Reel promozionale «Claude → Portfolio Algo Manager» (04/10/2026)

Video consegnato a Davide: 26 s, 1080×1920, 60 fps. Ricrea lo schema di un reel Perplexity che lui ha mandato
(punto → cursore luminoso → logo → casella → scelta del modello → domanda → risposta → logo del brand),
con Claude al posto di Perplexity e il sito `sites/portfolio` come «risposta».

Non sono nel repository (pubblico): la musica (presa dal video di riferimento) e gli screenshot del sito.

## Come si rifà
1. Sito: `cd sites/portfolio && npm ci && npm run export`, poi servire `out-export/` su :8765
   (con `ln -s ../_next out-export/dettagli/_next`, altrimenti /dettagli esce senza stile).
2. `node foto_sito.cjs <cartella>` → `<cartella>/reel/img/*.png` (home finale, schede, oro, simulatore dopo il clic).
   Il simbolo del logo va ritagliato da `assets/logo/logo-davide-colori-sito.png`
   (righe 214–816): **quel file ha scritto «PORTOFOLIO»**, la scritta si rifà a parte in Manrope.
3. Font locali (Source Serif 4, Inter, Manrope, IBM Plex Mono) da Google Fonts in `fonts/` + `fonts.css`.
4. Musica: battito 0,4993 s, primo colpo 0,23 s, accento ogni 2 s (1,21 + 2k). Allungata ripetendo
   la frase 13,21–17,21 s (8 battiti) con dissolvenze di 12 ms: i battiti restano regolari.
5. `reel.html` espone `seek(t)`: ogni fotogramma dipende SOLO da t. `PARTE=k/4 node render.cjs out` in 4 processi,
   `FRAMES=a-b,...` per rifare solo dei tratti; poi ffmpeg con la musica (−14 LUFS).

## Errori da non ripetere
- Uno stile letto dal fotogramma precedente (`e.style.opacity * k`) rompe il render in parallelo: ogni proprietà va
  riscritta da zero a ogni `seek(t)`.
- Durante gli zoom della camera gli elementi grandi fuori inquadratura (il logo) restano tagliati sul bordo: vanno spenti.
- Controllo finale: differenza fra fotogrammi consecutivi → nessun fotogramma isolato; i salti grandi solo sugli accenti.

# Reel «Matteo Conti» (12/10/2026, una tantum)

Unisce due video mandati da Davide (non nel repository, sono di terzi):
1. il video dell'università (verticale nativo, 17,7 s), lasciato intero e portato a 1080×1920;
2. il video di Matteo Conti (fascia 16:9 dentro un 9:16 grigio), messo in una scheda nello stile del primo
   (nero, oro, serif, griglia e formule), ridotto appena al 93% per avere il margine: nessun ingrandimento.

Sopra la scheda: chi è, solo con quello che dice o scrive lui («market maker per sette anni nella più grande banca
dei paesi nordici», «Hedge fund manager»). «Più di 30 milioni» NON è detto nei video né trovato online: non messo.
Il video di Conti si ferma a «the execution is actually automated» (28,30 s): la frase dopo («make money
consistently every single month») è una promessa di guadagno e resta fuori. Chiusura: «Dalla teoria alla realtà.»

Rifare: estrarre la fascia (`ffmpeg -t 28.4 -vf crop=1080:608:0:656 bf/%04d.jpg`), trascrivere b.wav con Whisper
(parole con tempi in b.json), `PARTE=k/4 node render.cjs out`, poi xfade 0,3 s a 17,437 e audio −14 LUFS.

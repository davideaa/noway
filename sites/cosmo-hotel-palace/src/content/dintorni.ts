/**
 * Nei dintorni (COPY sez. 5.1–5.3, dal BRIEF). Solo luoghi e frasi di COPY.
 * Nessuna distanza e nessun tempo di viaggio: COPY li dà `[DA CONFERMARE]`, tranne Leolandia
 * («a 25 minuti dall'hotel», dichiarato nel BRIEF). I luoghi sono riferimenti reali: nessun link.
 */

export type ZonaId = "milano" | "monza" | "como";

export type Luogo = { nome: string; testo: string };
export type Zona = { id: ZonaId; titolo: string; luoghi: readonly Luogo[] };

export const dintorni: readonly Zona[] = [
  {
    id: "milano",
    titolo: "Milano",
    luoghi: [
      { nome: "Duomo di Milano", testo: "Fondato nel XIV secolo e dedicato a Maria Nascente. Domina la piazza con la sua mole di marmo." },
      { nome: "Corso Vittorio Emanuele II", testo: "Una delle vie più importanti del centro e una delle più frequentate per lo shopping." },
      {
        nome: "Galleria Vittorio Emanuele II",
        testo: "Collega piazza del Duomo a piazza della Scala. Costruita dal Mengoni (1865–1878), ha una copertura in ferro e vetro che culmina nell'ottagono.",
      },
      { nome: "Castello Sforzesco", testo: "Con il Duomo, uno dei monumenti simbolo della città. Un vasto complesso fortificato, di origine rinascimentale." },
      {
        nome: "Pinacoteca di Brera",
        testo: "In via Brera, tra le più importanti pinacoteche italiane. Ospita lo Sposalizio della Vergine di Raffaello e la Pala Montefeltro di Piero della Francesca.",
      },
      { nome: "Cenacolo Vinciano", testo: "Tra le maggiori creazioni del Rinascimento milanese." },
    ],
  },
  {
    id: "monza",
    titolo: "Monza",
    luoghi: [
      { nome: "Reggia di Monza", testo: "La residenza estiva dei Savoia, a due passi da Milano. Storia, arte e paesaggio." },
      { nome: "Parco di Monza", testo: "700 ettari a nord della città, con oltre 14 km di mura." },
      { nome: "Autodromo Nazionale Monza", testo: "Ospita il Gran Premio d'Italia di Formula 1 e altri eventi. La stagione va da marzo a novembre." },
      { nome: "Duomo di Monza e Corona Ferrea", testo: "Basilica minore di San Giovanni Battista, nel centro storico. Custodisce la Corona Ferrea." },
      { nome: "Arengario", testo: "L'antico Palazzo Comunale, riconoscibile dal porticato ad arcate." },
    ],
  },
  {
    id: "como",
    titolo: "Como e dintorni",
    luoghi: [
      { nome: "Como e Lago di Como", testo: "Una meta turistica internazionale, nota per il paesaggio." },
      { nome: "Villa Carlotta", testo: "A Tremezzina, tra le ville e i giardini più celebri del lago." },
      { nome: "Leolandia", testo: "A Capriate San Gervasio (Bergamo), a 25 minuti dall'hotel. Un parco divertimenti per una giornata in famiglia." },
    ],
  },
] as const;

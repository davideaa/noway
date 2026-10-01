/*
 * Testi del modulo Camere che COPY non ha (DECISIONI 12). Sono qui e non in content/copy.ts perché
 * quel file è del modulo 2: il coordinatore li può spostare lì (le chiavi sono già raggruppate).
 * Tutto ciò che COPY ha (nota del diorama, comandi, interruttori, consigliere, confronto, stati)
 * si legge da `copy.camere`; qui restano solo le etichette accessibili e i titoli di blocco nuovi.
 */
export const testiCamere = {
  // NUOVO TESTO: nome accessibile dei due radiogroup e del gruppo delle sotto-viste (UX 5.2)
  ariaVista: "Vista della camera",
  ariaParteCamera: "Parte della camera",
  // NUOVO TESTO: titolo della lista delle dotazioni nella scheda tecnica
  dotazioni: "Dotazioni",
  // NUOVO TESTO: gruppo dei punti nella pianta (gli stessi del 3D)
  ariaPuntiPianta: "Punti della pianta",
  // NUOVO TESTO: etichette delle righe della scheda tecnica che COPY 3.2 non ha come chiave
  ospitiRiga: "Ospiti",
  // NUOVO TESTO: nome accessibile della barra con le tre camere
  ariaScegliDue: "Camere da confrontare",
  // NUOVO TESTO: etichetta della prima colonna (solo per i lettori di schermo)
  caratteristica: "Caratteristica",
  // NUOVO TESTO: suffisso del pulsante «Esplora la camera», letto dai lettori di schermo
  // (tre link con lo stesso testo non si distinguono)
  nomeAccessibile: "{azione}: {nome}",
} as const;

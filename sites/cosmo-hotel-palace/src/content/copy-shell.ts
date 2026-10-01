/**
 * Testi NUOVI del modulo 7 «Struttura del sito» (header, menu, footer, 404, ContactChoice).
 * Stanno in un file a parte, e non in `copy.ts`, perché altri moduli lavorano in parallelo su
 * `copy.ts` (DECISIONI 12: testi nuovi, scritti seguendo il tono di COPY). Quando il lavoro si
 * chiude si possono spostare dentro `copy.ts` senza cambiare i chiamanti: stessa forma di `copy`.
 *
 * Tutti i testi di questo file sono `NUOVO TESTO`; quelli già in `copy.ts` (nome, voci di menu,
 * footer, 404) si leggono da lì.
 */
export const copyShell = {
  // NUOVO TESTO: nomi dei punti di riferimento (landmark), distinti fra loro (UX 12)
  ariaNavPrincipale: "Principale",
  ariaNavMenu: "Menu del sito",
  ariaNavMenuSenzaJs: "Menu del sito (senza JavaScript)",
  ariaNavEsplora: "Esplora il sito",
  ariaFooterContatti: "Contatti per reparto",
  ariaFooterSocial: "Social",
  ariaFooterLegale: "Note legali",
  // NUOVO TESTO: il nome del sito è un link alla home
  ariaHome: "Cosmo Hotel Palace, vai alla home",
  // NUOVO TESTO: «{telefono}» / «{email}» (ContactChoice, per un reparto qualsiasi)
  chiamaNumero: "Chiama {telefono}",
  scriviA: "Scrivi a {email}",
  // NUOVO TESTO: nome accessibile del gruppo dei due link di ContactChoice
  ariaContactChoice: "Come contattare {reparto}",
  // NUOVO TESTO: nota di fondo pagina (le viste 3D e i disegni non sono fotografie)
  ricostruzioni:
    "Le viste 3D e le illustrazioni del sito sono ricostruzioni illustrative, non fotografie. Arredi e proporzioni sono indicativi: le superfici in metri quadri sono quelle reali.",
  // NUOVO TESTO: 404
  eyebrow404: "Errore 404",
} as const;

export type CopyShell = typeof copyShell;

/** Formattazione italiana dei numeri: virgola decimale, meno tipografico, segno esplicito sui rendimenti. */
export const it = (v: number, d = 1) => v.toFixed(d).replace("-", "−").replace(".", ",");
export const signed = (v: number, d = 1) => (v > 0 ? "+" : "") + it(v, d);
export const int = (v: number) => v.toLocaleString("it-IT");
/** "+184,5 R" */
export const R = (v: number, d = 1) => `${signed(v, d)} R`;

export const MESI_BREVI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
export const MESI_LUNGHI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

/** "2024-01" -> "gen 2024" */
export const meseIt = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MESI_BREVI[Number(m) - 1]} ${y}`;
};
/** "2024-01" -> "gennaio 2024" */
export const meseLungo = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MESI_LUNGHI[Number(m) - 1]} ${y}`;
};
/** il mese prima di "2024-01" -> "2023-12" */
export const mesePrima = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

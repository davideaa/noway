import { MESI_BREVI, R, meseLungo } from "@/lib/format";

/**
 * Mappa anno x mese dei risultati mensili in R. Scala divergente: perdita in
 * --bad, utile in --acc, grigio della superficie a zero; piu' pieno il colore,
 * piu' grande il valore (in proporzione al mese piu' grande in valore assoluto).
 * Il valore e' scritto nella cella dai 950 px in su; sotto, sta nel `title` e
 * nella tabella "Vedi i numeri". Il colore non e' mai da solo.
 */
export function Heatmap({ perMese, ultimoMese }: { perMese: Record<string, number>; ultimoMese: string }) {
  const mesi = Object.keys(perMese).sort();
  const anni = [...new Set(mesi.map((m) => m.slice(0, 4)))];
  const vmax = Math.max(...mesi.map((m) => Math.abs(perMese[m]))) || 1;
  return (
    <div className="heat" role="presentation">
      <div className="heat__grid">
        <span className="heat__corner" aria-hidden="true" />
        {MESI_BREVI.map((m) => (
          <span key={m} className="heat__col" aria-hidden="true">
            {m}
          </span>
        ))}
        {anni.map((a) => (
          <div key={a} className="contents">
            <span className="heat__row" aria-hidden="true">
              {a}
            </span>
            {MESI_BREVI.map((_, i) => {
              const ym = `${a}-${String(i + 1).padStart(2, "0")}`;
              if (ym > ultimoMese || !(ym in perMese)) return <span key={ym} className="heat__void" aria-hidden="true" />;
              const v = perMese[ym];
              // intensita' in 8 passi (classi heat__cell--1 ... --8), tinta dal segno
              const q = Math.max(1, Math.min(8, Math.ceil((Math.abs(v) / vmax) * 8)));
              return (
                <span
                  key={ym}
                  className={`heat__cell ${v < 0 ? "is-neg" : v > 0 ? "is-pos" : "is-zero"} heat__cell--${q}`}
                  title={`${meseLungo(ym)}: ${R(v)}`}
                  aria-hidden="true"
                >
                  <span className="heat__val">{R(v).replace(" R", "")}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="heat__scale t-note" aria-hidden="true">
        <span className="heat__sw" style={{ background: "var(--bad)" }} /> mese in perdita ·{" "}
        <span className="heat__sw" style={{ background: "var(--acc)" }} /> mese in utile · colore più pieno = valore più
        grande (fino a ±{R(vmax).replace("+", "")})
      </p>
    </div>
  );
}

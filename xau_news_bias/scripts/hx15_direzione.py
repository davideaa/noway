"""H-X15 emendamento 2: solo direzione, senza costi né stop, ricerca 2011-19 (esplorativo, non promuove niente)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from hx15_analysis import A_RULES, B_RULES, N_PERM, SEED, perm_within, signals  # noqa: E402
from hx15_build import CACHE  # noqa: E402
from xnb.config import get_settings  # noqa: E402

A_W = {"E1": (-60, 60), "E5": (-60, 300), "E15": (-60, 900)}
B_W = {"X5": (60, 300), "X15": (60, 900), "X60": (60, 3600)}


def mids(t0):
    z = np.load(CACHE / f"{t0:%Y%m%d_%H%M}.npz")
    t, mid = z["t"], (z["bid"] + z["ask"]) / 2
    return {s: float(mid[int(np.searchsorted(t, s * 1000, side="right") - 1)]) for s in (-60, 60, 300, 900, 3600)}


def stats(move, sig, fam, groups):
    """Per gruppo e verso: n, quota giusta, t del movimento/U nella direzione della regola."""
    out = {}
    for v in (1, -1):
        x = v * sig[:, None] * move  # eventi x finestre
        m = sig != 0
        for g in groups:
            sel = m & ((fam == g) | (g == "TUTTE"))
            y = x[sel]
            n = len(y)
            if n < 30:
                continue
            mu, sd = y.mean(0), y.std(0, ddof=1)
            out[(g, v)] = (n, (y > 0).mean(0), mu / (sd / np.sqrt(n)))
    return out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2" / "hx15"
    df = pd.read_parquet(R / "slots_2008_2023.parquet")
    cn = pd.read_parquet(R / "cpi_nfp.parquet")
    cn = cn[cn.t0 < pd.Timestamp("2024-01-01", tz="UTC")]
    sig = signals(df, cn)
    d = df[df.ok & df.U.notna()].merge(sig, on=["t0", "fam"]).sort_values("t0")
    d = d[(d.t0.dt.year >= 2011) & (d.t0.dt.year <= 2019)].reset_index(drop=True)
    mm = pd.DataFrame([mids(t) for t in d.t0])
    fam = d.fam.to_numpy()
    groups = sorted(set(fam)) + ["TUTTE"]
    moves = {k: np.column_stack([(mm[b] - mm[a]) / d.U for a, b in w.values()]) for k, w in (("A", A_W), ("B", B_W))}
    names = {"A": list(A_W), "B": list(B_W)}

    def run(perm=None):
        rows = []
        for kind, rules in (("A", A_RULES), ("B", B_RULES)):
            mv = moves[kind] if perm is None else moves[kind][perm]
            for r in rules:
                for (g, v), (n, hit, t) in stats(mv, d[r].to_numpy(), fam, groups).items():
                    for i, w in enumerate(names[kind]):
                        rows.append((g, r, v, w, n, hit[i], t[i]))
        return pd.DataFrame(rows, columns=["gruppo", "regola", "verso", "finestra", "n", "giuste", "t"])

    obs = run()
    rng = np.random.default_rng(SEED)
    maxt = np.array([run(perm_within(fam, rng)).t.max() for _ in range(N_PERM)])
    obs["p_fw"] = [(maxt >= t).mean() for t in obs.t]
    obs = obs[obs.regola != "A9"].sort_values("t", ascending=False)  # A9 non cambia con le permutazioni
    out = {"eventi": len(d), "combinazioni": len(obs), "maxt_nullo": {q: float(np.quantile(maxt, q)) for q in (0.5, 0.9, 0.95)},
           "migliori_15": obs.head(15).round(3).to_dict("records"),
           "A9_sempre_long": run().query("regola=='A9'").round(3).to_dict("records")}
    (R / "direzione_esplorativo.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    pd.set_option("display.width", 200)
    print("eventi", len(d), "combinazioni", len(obs), "t massima per caso:", out["maxt_nullo"])
    print(obs.head(15).round(3).to_string(index=False))

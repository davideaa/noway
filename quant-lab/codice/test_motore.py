"""Known-answer tests for the lab engine. Synthetic data where the right answer is known.

Run: python3 codice/test_motore.py   (exit code 1 if any test fails)
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import coint

sys.path.insert(0, str(Path(__file__).parent))
from strategia_a_pairs import bh, run as run_pairs
from strategia_b_carry import run_coin
from validazione import block_bootstrap_p, deflated_sharpe, sharpe

RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append((name, bool(ok), detail))
    print(("PASSA " if ok else "FALLISCE ") + name + (f"  [{detail}]" if detail else ""))


rng = np.random.default_rng(42)
idx = pd.date_range("2018-01-01", periods=2000, freq="D")

# 1. Engle-Granger detects a true cointegrated pair
x = np.cumsum(rng.normal(0, 0.02, 2000)) + 5
s = np.zeros(2000)
for t in range(1, 2000):
    s[t] = 0.9 * s[t - 1] + rng.normal(0, 0.01)
y = 1.5 * x + s
check("cointegrazione vera riconosciuta (p<0,01)", coint(y, x)[1] < 0.01, f"p={coint(y, x)[1]:.4f}")

# 2. False-positive rate on independent random walks ~5%
fp = []
for _ in range(400):
    a = np.cumsum(rng.normal(0, 1, 365)); b = np.cumsum(rng.normal(0, 1, 365))
    fp.append(coint(a, b)[1] < 0.05)
rate = np.mean(fp)
check("falsi positivi su passeggiate casuali tra 2% e 9%", 0.02 <= rate <= 0.09, f"{rate:.3f}")

# 3. Benjamini-Hochberg: all-null p-values -> (almost) nothing passes
null_p = rng.uniform(0, 1, 105)
check("BH su p-value tutti casuali: al massimo 1 scoperta", bh(null_p).sum() <= 1, f"{bh(null_p).sum()}")
mixed = np.r_[np.full(5, 1e-5), rng.uniform(0, 1, 100)]
check("BH ritrova 5 segnali veri tra 105", bh(mixed)[:5].all(), f"{bh(mixed).sum()} scoperte")

# 4. Bootstrap: zero-mean noise -> p not small; strong positive drift -> p small
noise = rng.normal(0, 0.01, 1500)
check("bootstrap su rumore puro: p > 0,05", block_bootstrap_p(noise - noise.mean()) > 0.05)
check("bootstrap su rendimento con deriva forte: p < 0,01", block_bootstrap_p(noise + 0.003) < 0.01)

# 5. DSR: more trials -> lower DSR for the same series
r = rng.normal(0.0005, 0.01, 1500)
d1 = deflated_sharpe(r, [sharpe(r)] * 1)
d_many = deflated_sharpe(r, list(rng.normal(0, 1, 100)))
check("DSR scende quando aumentano i tentativi", d_many < d1 or d1 > 0.99, f"1 prova {d1:.3f}, 100 prove {d_many:.3f}")

# 6. Pairs backtest on a synthetic mean-reverting pair, zero costs -> profitable
px = pd.Series(np.exp(x), idx)
py = pd.Series(np.exp(y), idx)
price = pd.DataFrame({"Y": py, "X": px})
fund = pd.DataFrame({"Y": 0.0, "X": 0.0}, index=idx)
pnl, tr, log, nt = run_pairs(price, fund, fee=0, slip=0, start="2019-02-01", end="2023-06-01", k=1)
check("pairs su coppia sintetica che torna alla media: guadagno > 0 senza costi", pnl.sum() > 0 and len(tr) > 5,
      f"P&L {pnl.sum():.3f}, trade {len(tr)}")
check("pairs: la maggior parte delle uscite è un ritorno alla media", (tr.reason == "media").mean() > 0.5 if len(tr) else False,
      f"{(tr.reason == 'media').mean():.2f}" if len(tr) else "0 trade")

# 7. Pairs backtest on two independent random walks -> no free money after costs
xa = pd.Series(np.exp(np.cumsum(rng.normal(0, 0.03, 2000)) + 3), idx)
xb = pd.Series(np.exp(np.cumsum(rng.normal(0, 0.03, 2000)) + 3), idx)
pnl2, tr2, _, _ = run_pairs(pd.DataFrame({"Y": xa, "X": xb}), fund, start="2019-02-01", end="2023-06-01", k=1)
check("pairs su monete indipendenti: nessun guadagno sistematico (≤ 0 o pochi trade)", pnl2.sum() <= 0.02 or len(tr2) < 3,
      f"P&L {pnl2.sum():.3f}, trade {len(tr2)}")

# 8. Carry: constant funding 0.03%/day, no basis moves, zero costs -> earns N * f * days
sp = pd.Series(100 * np.exp(np.cumsum(rng.normal(0, 0.03, 1000))), idx[:1000])
fr = pd.Series(0.0003, idx[:1000])
p, n_tr, ex = run_coin(sp, sp.copy(), fr, 1.0, always=True, fee_spot=0, fee_perp=0, slip=0)
expected = 0.0003 * (len(sp) - 9)  # signal needs 7 days + 1 day execution lag
check("carry: incassa esattamente il funding atteso (prezzo irrilevante)", abs(p.sum() - expected) / expected < 0.02,
      f"{p.sum():.4f} vs {expected:.4f}")
p_up, *_ = run_coin(sp, sp * 1.0, fr * 0, 1.0, always=True, fee_spot=0, fee_perp=0, slip=0)
check("carry: con funding zero e base ferma il P&L è zero anche se il prezzo crolla o esplode", abs(p_up.sum()) < 1e-9,
      f"{p_up.sum():.2e}")

# 9. No look-ahead: shuffling future prices must not change past P&L
price2 = price.copy()
price2.loc["2022-01-01":] = price2.loc["2022-01-01":].values[::-1]
pa, *_ = run_pairs(price, fund, fee=0, slip=0, start="2019-02-01", end="2021-06-01", k=1)
pb, *_ = run_pairs(price2, fund, fee=0, slip=0, start="2019-02-01", end="2021-06-01", k=1)
check("niente look-ahead: cambiare il futuro non cambia il passato", np.allclose(pa.values, pb.values))

n_fail = sum(not ok for _, ok, _ in RESULTS)
print(f"\n{len(RESULTS) - n_fail}/{len(RESULTS)} test passati")
pd.DataFrame(RESULTS, columns=["test", "passa", "dettaglio"]).to_csv(
    Path(__file__).resolve().parents[1] / "registri" / "TEST_MOTORE.csv", index=False)
sys.exit(1 if n_fail else 0)

"""H-X7 (docs/IPOTESI-HX7-DIREZIONE.md): direzione della prima M1 su tutte le news, walk-forward annuale."""
import json
import multiprocessing as mp
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from scipy import stats as sps  # noqa: E402

from xnb.config import get_settings  # noqa: E402
from xnb.phase2 import registry as REG  # noqa: E402
from xnb.phase2.models2 import FEATURE_SETS, columns_for  # noqa: E402
from xnb.phase2.validate import holm  # noqa: E402

YEARS = list(range(2014, 2027))
GROUPS = {"ALL": ["CPI", "NFP"], "NFP": ["NFP"], "CPI": ["CPI"]}
MODELS = ["logit", "lgbm", "knn"]
_D: dict = {}


def est(name):
    from sklearn.decomposition import PCA
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import LogisticRegression
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler

    if name == "logit":
        return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), LogisticRegression(C=0.1, max_iter=3000))
    if name == "lgbm":
        import lightgbm as lgb

        return lgb.LGBMClassifier(n_estimators=150, learning_rate=0.03, num_leaves=4, min_child_samples=15,
                                  colsample_bytree=0.5, subsample=0.8, subsample_freq=1, reg_lambda=2.0,
                                  random_state=7, n_jobs=1, verbose=-1)
    return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), PCA(n_components=8, random_state=7),
                         KNeighborsClassifier(n_neighbors=15, weights="distance"))


def job(args):
    from threadpoolctl import threadpool_limits

    g, m, fs = args
    d = _D["data"]
    d = d[d.family.isin(GROUPS[g])]
    cols = columns_for(list(d.columns), fs)
    out = []
    with threadpool_limits(1):
        for y in YEARS:
            tr = d[d.t0_utc < pd.Timestamp(f"{y}-01-01", tz="UTC")]
            te = d[d.year == y]
            if len(te) == 0 or len(tr) < 40:
                continue
            Xtr = tr[cols].to_numpy(float)
            keep = ~np.all(np.isnan(Xtr), axis=0)
            e = est(m)
            e.fit(Xtr[:, keep], tr.up.to_numpy())
            p = e.predict_proba(te[cols].to_numpy(float)[:, keep])[:, 1]
            out += [(i, float(q)) for i, q in zip(te.event_id, p)]
    return args, out


if __name__ == "__main__":
    R = get_settings().research_dir / "phase2"
    ev = pd.read_parquet(R / "p2_events.parquet")
    ev = ev[ev.a_ok.fillna(False).astype(bool) & (ev.a_move != 0)]
    ft = pd.read_parquet(R / "p2_features.parquet")
    x = ft[ft.cutoff == "T-1M"].drop(columns=["family", "t0_utc"])
    data = ev[["event_id", "family", "t0_utc", "year", "a_move"]].merge(x, on="event_id").sort_values("t0_utc")
    data["up"] = (data.a_move > 0).astype(int)
    _D["data"] = data
    grid = [(g, m, f) for g in GROUPS for m in MODELS for f in FEATURE_SETS]
    preds = {}
    with ProcessPoolExecutor(max_workers=REG.workers_for("MAXIMUM"), mp_context=mp.get_context("fork")) as ex:
        for args, out in ex.map(job, grid):
            preds[args] = dict(out)
    REG.log_experiment_once("hx7_direction", "ALL", "classifier_configs", len(grid), {"years": YEARS}, "p2", 7)
    d = data.set_index("event_id")

    def acc(pmap, ids):
        ids = [i for i in ids if i in pmap]
        ok = [(pmap[i] >= 0.5) == bool(d.at[i, "up"]) for i in ids]
        return (float(np.mean(ok)) if ok else None), len(ok), int(np.sum(ok))

    table = []
    for (g, m, f), pm in preds.items():
        ids = d[d.family.isin(GROUPS[g])].index
        st = [i for i in ids if d.at[i, "year"] <= 2019]
        te = [i for i in ids if d.at[i, "year"] >= 2020]
        a_s, n_s, _ = acc(pm, st)
        a_t, n_t, k_t = acc(pm, te)
        table.append({"group": g, "model": m, "features": f, "acc_studio": a_s, "n_studio": n_s, "acc_test": a_t,
                      "n_test": n_t, "hit_test": k_t})
    tab = pd.DataFrame(table)
    # confronti: stessi anni, stessa regola "solo passato"
    base = {}
    for g, fams in GROUPS.items():
        sub = d[d.family.isin(fams)]
        rows = {}
        for y in YEARS:
            past = sub[sub.t0_utc < pd.Timestamp(f"{y}-01-01", tz="UTC")]
            cur = sub[sub.year == y]
            maj = int(past.up.mean() >= 0.5)
            for i, r in cur.iterrows():
                rows.setdefault("maggioranza", {})[i] = float(maj)
                v = r.get("f_xau_ret_60m_atrh", np.nan)
                if v == v and v != 0:
                    rows.setdefault("segui_ultima_ora", {})[i] = float(v > 0)
                    rows.setdefault("inverti_ultima_ora", {})[i] = float(v < 0)
                v = r.get("f_react_same_last_dir", np.nan)
                if v == v and v != 0:
                    rows.setdefault("reazione_precedente", {})[i] = float(v > 0)
        for k, pm in rows.items():
            ids = sub.index
            base[f"{g}|{k}"] = {"studio": acc(pm, [i for i in ids if d.at[i, "year"] <= 2019]),
                                "test": acc(pm, [i for i in ids if d.at[i, "year"] >= 2020])}
    chosen, tests = {}, []
    for g in GROUPS:
        t = tab[tab.group == g].sort_values("acc_studio", ascending=False).iloc[0].to_dict()
        chosen[g] = t
        bt = base[f"{g}|maggioranza"]["test"][0]
        p50 = float(sps.binomtest(int(t["hit_test"]), int(t["n_test"]), 0.5, alternative="greater").pvalue)
        pb = float(sps.binomtest(int(t["hit_test"]), int(t["n_test"]), bt, alternative="greater").pvalue)
        tests.append({"group": g, **t, "baseline_maggioranza_test": bt, "p_vs_50": p50, "p_vs_maggioranza": pb})
    adj = holm([x["p_vs_50"] for x in tests])
    for x, a in zip(tests, adj):
        x["holm_vs_50"] = a
    out = {"table": table, "baselines": base, "chosen": chosen, "tests": tests,
           "share_configs": {g: {"studio_gt_55": float((tab[tab.group == g].acc_studio > 0.55).mean()),
                                 "test_mean": float(tab[tab.group == g].acc_test.mean()),
                                 "test_max": float(tab[tab.group == g].acc_test.max())} for g in GROUPS}}
    g = "ALL"
    c = chosen[g]
    out["pred_ALL"] = {i: p for i, p in preds[(g, c["model"], c["features"])].items()}
    dd = R / "hx7"
    dd.mkdir(exist_ok=True)
    (dd / "hx7_results.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    print(pd.DataFrame(tests)[["group", "model", "features", "acc_studio", "n_studio", "acc_test", "n_test",
                               "baseline_maggioranza_test", "p_vs_50", "p_vs_maggioranza", "holm_vs_50"]].round(3).to_string())
    print({k: v for k, v in out["share_configs"].items()})
    for k, v in base.items():
        print(k, "studio %.3f" % (v["studio"][0] or 0), "test %.3f n %d" % (v["test"][0] or 0, v["test"][1]))

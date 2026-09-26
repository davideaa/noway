"""Registro live H-X8/H-X11: bias scritta PRIMA di ogni CPI e NFP, risultato aggiunto DOPO. Append-only, catena di hash.

    python scripts/hx8_live.py update   # risolve le release passate (>= 2 h fa) e scrive le bias delle prossime
    python scripts/hx8_live.py verify   # controlla la catena

Bias = contrario della reazione della release precedente della stessa famiglia (prima M1, mid).
Risultato: movimento della prima M1 e trade di Davide (T0-60 s, stop 60/100 pips, uscita fine M1, -1R)
nei tre scenari di spread di H-X11. Il CPI si registra solo per informazione: non si trada.
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "live" / "hx8_live.jsonl"
CAL = ROOT / "live" / "calendar.json"
GENESIS = "0" * 64


def digest(rec: dict) -> str:
    body = {k: v for k, v in rec.items() if k != "hash"}
    return hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def read_log() -> list[dict]:
    if not LOG.exists():
        return []
    return [json.loads(x) for x in LOG.read_text(encoding="utf-8").splitlines() if x.strip()]


def verify(recs: list[dict]) -> None:
    prev = GENESIS
    seen_pred, seen_res = set(), set()
    for i, r in enumerate(recs):
        assert r["seq"] == i, f"seq {r['seq']} != {i}"
        assert r["prev_hash"] == prev, f"catena rotta al record {i}"
        assert r["hash"] == digest(r), f"hash sbagliato al record {i}"
        if r["type"] == "prediction":
            assert r["event_id"] not in seen_pred, f"bias doppia per {r['event_id']}"
            assert r["created_utc"] < r["t0_utc"], f"bias di {r['event_id']} scritta dopo la release"
            seen_pred.add(r["event_id"])
        else:
            assert r["event_id"] in seen_pred and r["event_id"] not in seen_res, f"risultato non valido per {r['event_id']}"
            seen_res.add(r["event_id"])
        prev = r["hash"]


def append(recs: list[dict], rec: dict) -> None:
    rec = {"seq": len(recs), **rec, "prev_hash": recs[-1]["hash"] if recs else GENESIS}
    rec["hash"] = digest(rec)
    recs.append(rec)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def last_reactions() -> dict[str, dict]:
    """Ultima reazione nota per famiglia: storico (p2_events) più i risultati live."""
    from xnb.config import get_settings

    ev = pd.read_parquet(get_settings().research_dir / "phase2" / "p2_events.parquet")
    ev = ev[ev.a_ok.fillna(False).astype(bool) & ev.family.isin(["CPI", "NFP"])].sort_values("t0_utc")
    out = {}
    for r in ev.itertuples():
        out[r.family] = {"event_id": r.event_id, "t0_utc": r.t0_utc.strftime("%Y-%m-%dT%H:%M:%SZ"), "mv": round(float(r.a_move), 2)}
    for r in read_log():
        if r["type"] == "result" and r["t0_utc"] > out.get(r["family"], {}).get("t0_utc", ""):
            out[r["family"]] = {"event_id": r["event_id"], "t0_utc": r["t0_utc"], "mv": r["mv"]}
    return out


def resolve(ev: dict) -> dict | None:
    from xnb.phase2 import hx5
    from xnb.providers.dukascopy import DukascopyProvider
    sys.path.insert(0, str(ROOT / "scripts"))
    from hx11_site import SPREAD_CAP, first_minute_move, load_ticks, quotes, trade

    t0 = pd.Timestamp(ev["t0_utc"])
    t, bid, ask = load_ticks(DukascopyProvider(), t0)
    if len(t) < 20 or t.max() < 60_000:
        return None  # tick non ancora disponibili: si riprova al prossimo aggiornamento
    mv = first_minute_move(t, bid, ask)
    d = 1 if ev["bias"] == "LONG" else -1
    stop = hx5.stop_usd(t0)
    res = {}
    for s in SPREAD_CAP:
        b, a = quotes(bid, ask, s)
        tr = trade(t, b, a, d, stop, s != "S0")
        res[s] = {k: tr[k] for k in ("en", "sl", "ex", "st", "r")}
    return {"mv": round(mv, 2), "hit": bool(mv != 0 and (mv > 0) == (d > 0)), "stop_usd": stop, "trade": res,
            "n_ticks": int(len(t))}


def update(now: datetime) -> None:
    recs = read_log()
    verify(recs)
    stamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    preds = {r["event_id"]: r for r in recs if r["type"] == "prediction"}
    done = {r["event_id"] for r in recs if r["type"] == "result"}
    for eid, p in sorted(preds.items(), key=lambda x: x[1]["t0_utc"]):
        if eid in done or pd.Timestamp(p["t0_utc"]) + pd.Timedelta(hours=2) > pd.Timestamp(now):
            continue
        out = resolve(p)
        if out is None:
            print("tick non ancora disponibili per", eid)
            continue
        append(recs, {"type": "result", "event_id": eid, "family": p["family"], "t0_utc": p["t0_utc"],
                      "created_utc": stamp, "bias": p["bias"], **out})
        print("risultato", eid, p["bias"], out["mv"], out["trade"]["S1"]["r"])
    cal = json.loads(CAL.read_text(encoding="utf-8"))["eventi"]
    last = last_reactions()
    pending = {r["family"] for r in recs if r["type"] == "prediction" and r["event_id"] not in {x["event_id"] for x in recs if x["type"] == "result"}}
    for ev in sorted(cal, key=lambda x: x["t0_utc"]):
        fam = ev["family"]
        if ev["event_id"] in preds or fam in pending or ev["t0_utc"] <= stamp:
            continue
        prev = last.get(fam)
        if prev is None or prev["mv"] == 0 or prev["t0_utc"] >= ev["t0_utc"]:
            continue
        bias = "SHORT" if prev["mv"] > 0 else "LONG"
        append(recs, {"type": "prediction", "event_id": ev["event_id"], "family": fam, "t0_utc": ev["t0_utc"],
                      "created_utc": stamp, "bias": bias, "regola": "contrario della release precedente",
                      "precedente": prev, "da_tradare": fam == "NFP"})
        pending.add(fam)
        print("bias", ev["event_id"], bias, "(precedente", prev["event_id"], prev["mv"], ")")
    verify(recs)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "update"
    if cmd == "verify":
        verify(read_log())
        print("catena ok,", len(read_log()), "record")
    else:
        update(datetime.now(timezone.utc))

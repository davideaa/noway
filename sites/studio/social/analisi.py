import json, statistics as st, datetime as dt
from zoneinfo import ZoneInfo
A={**json.load(open('acc.json')),**json.load(open('acc2.json'))}
ROME=ZoneInfo("Europe/Rome"); NY=ZoneInfo("America/New_York")
rows=[]; summ=[]
for u,d in A.items():
    if "media" not in d: print("ERR",u,d); continue
    f=d["followers"]
    reels=[m for m in d["media"] if m.get("media_product_type")=="REELS" and m.get("view_count") is not None]
    for m in d["media"]:
        pass
    if not reels: summ.append((u,f,0,0,0,0,0)); continue
    v=[m["view_count"] for m in reels]; med=st.median(v)
    t=[dt.datetime.fromisoformat(m["timestamp"].replace("+0000","+00:00")) for m in reels]
    span=(max(t)-min(t)).days or 1
    for m,tt in zip(reels,t):
        rows.append(dict(u=u,f=f,v=m["view_count"],rel=m["view_count"]/med if med else None,vf=m["view_count"]/f,
                         likes=m.get("like_count"),com=m.get("comments_count"),cap=m.get("caption") or "",link=m["permalink"],
                         rome=tt.astimezone(ROME),ny=tt.astimezone(NY)))
    summ.append((u,f,len(reels),med,st.median([x/f for x in v]),max(v),len(reels)/span*7))
print("%-20s %9s %5s %10s %8s %10s %7s"%("account","follower","reel","mediana v","v/foll","max","reel/sett"))
for s in sorted(summ,key=lambda x:-x[4]):
    print("%-20s %9d %5d %10d %8.2f %10d %7.1f"%s)
json.dump([{k:(str(v) if k in('rome','ny') else v) for k,v in r.items()} for r in rows],open('reels.json','w'),ensure_ascii=False)
# TOP per v/follower
print("\nTOP 15 reel per visualizzazioni/follower")
for r in sorted(rows,key=lambda r:-r['vf'])[:15]:
    print("%-18s v=%9d (%.1fx follower) %s ore Roma %s | %s"%(r['u'],r['v'],r['vf'],r['rome'].strftime('%a %d/%m'),r['rome'].strftime('%H:%M'),r['cap'][:70].replace("\n"," ")))

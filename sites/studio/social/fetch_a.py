import subprocess, json, sys, urllib.parse
ME="17841425810972500"
FIELDS="timestamp,media_product_type,media_type,view_count,like_count,comments_count,caption,permalink,thumbnail_url"
def call(user, after=None):
    m = f"media.limit(50)" if not after else f"media.after({after}).limit(50)"
    f = f"business_discovery.username({user}){{username,name,followers_count,media_count,biography,{m}{{{FIELDS}}}}}"
    url = f"https://graph.facebook.com/v23.0/{ME}?" + urllib.parse.urlencode({"fields": f})
    out = subprocess.run(["curl","-s","-m","40",url],capture_output=True,text=True).stdout
    return json.loads(out)
res={}
for u in ["nabila.finanza","warwatchz","curiox26","alanintelligence","chartingbit"]:
    d=call(u)
    if "business_discovery" not in d:
        res[u]={"error":d.get("error",d)}; print(u,"ERRORE",json.dumps(d)[:300]); continue
    bd=d["business_discovery"]; media=bd["media"]["data"]; cur=bd["media"].get("paging",{}).get("cursors",{}).get("after")
    pages=1
    while cur and pages<3:
        d2=call(u,cur)
        if "business_discovery" not in d2: break
        m=d2["business_discovery"]["media"]; media+=m["data"]; cur=m.get("paging",{}).get("cursors",{}).get("after"); pages+=1
    res[u]={"followers":bd["followers_count"],"media_count":bd["media_count"],"name":bd.get("name"),"bio":bd.get("biography"),"media":media}
    print(u,bd["followers_count"],"follower;",len(media),"post letti")
json.dump(res,open("acc.json","w"),ensure_ascii=False)

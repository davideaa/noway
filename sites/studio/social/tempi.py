import json, random, statistics as st, datetime as dt, math, re
R=json.load(open('reels.json'))
EXCL={"apexmotion.visuals","madebyext","byimpact","pickmytrade"}
R=[r for r in R if r['u'] not in EXCL and r['rel']]
for r in R:
    r['h']=dt.datetime.fromisoformat(r['rome']).hour; r['wd']=dt.datetime.fromisoformat(r['rome']).weekday()
random.seed(1)
def boot(vals,B=2000):
    ms=sorted(st.median(random.choices(vals,k=len(vals))) for _ in range(B)); return ms[int(.05*B)],ms[int(.95*B)]
print("reel analizzati (14 account a tema):",len(R)); allmed=st.median(r['rel'] for r in R); print("mediana relativa globale:",round(allmed,2))
print("\nPER FASCIA ORARIA (ora italiana)  rel = visualizzazioni / mediana dell'account stesso")
bins=[(0,6),(6,9),(9,12),(12,15),(15,18),(18,21),(21,24)]
for a,b in bins:
    v=[r['rel'] for r in R if a<=r['h']<b]
    if len(v)>=8:
        lo,hi=boot(v); print("%02d-%02d  n=%3d  mediana %.2f  [%.2f–%.2f]"%(a,b,len(v),st.median(v),lo,hi))
print("\nPER GIORNO")
for i,n in enumerate("Lun Mar Mer Gio Ven Sab Dom".split()):
    v=[r['rel'] for r in R if r['wd']==i]; lo,hi=boot(v)
    print("%s n=%3d mediana %.2f [%.2f–%.2f]"%(n,len(v),st.median(v),lo,hi))
# caption features
print("\nCAPTION")
def feat(name,f):
    a=[r['rel'] for r in R if f(r)]; b=[r['rel'] for r in R if not f(r)]
    if len(a)>=10 and len(b)>=10: print("%-32s sì n=%3d med %.2f | no n=%3d med %.2f"%(name,len(a),st.median(a),len(b),st.median(b)))
feat("caption breve (<80 caratteri)",lambda r:len(r['cap'])<80)
feat("caption lunga (>300)",lambda r:len(r['cap'])>300)
feat("contiene hashtag",lambda r:'#' in r['cap'])
feat("contiene '?'",lambda r:'?' in r['cap'])
feat("contiene 'link in bio'",lambda r:'link in bio' in r['cap'].lower())
feat("contiene 'comment' (CTA)",lambda r:'comment' in r['cap'].lower())
feat("contiene emoji",lambda r:bool(re.search('[\U0001F300-\U0001FAFF]',r['cap'])))
feat("contiene cifre/$",lambda r:bool(re.search(r'[\d$%]',r['cap'])))
feat("inglese (the/is/of)",lambda r:bool(re.search(r'\b(the|is|of|and)\b',r['cap'].lower())))
# parole nei top vs bottom
top=[r for r in R if r['rel']>=2]; bot=[r for r in R if r['rel']<0.5]
print("\nreel >=2x la mediana del proprio account:",len(top)," | <0.5x:",len(bot))
from collections import Counter
def words(rs): 
    c=Counter()
    for r in rs: c.update(set(re.findall(r"[a-zàèéìòù']{4,}",r['cap'].lower())))
    return c
ct,cb=words(top),words(bot)
sc=[(w,ct[w]/len(top)-cb[w]/len(bot),ct[w],cb[w]) for w in set(ct)|set(cb) if ct[w]+cb[w]>=8]
print("parole più frequenti nei top (vs flop):",[ (w,t,b) for w,d,t,b in sorted(sc,key=lambda x:-x[1])[:12]])
print("parole più frequenti nei flop (vs top):",[ (w,t,b) for w,d,t,b in sorted(sc,key=lambda x:x[1])[:12]])

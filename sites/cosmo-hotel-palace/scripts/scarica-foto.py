#!/usr/bin/env python3
"""Scarica le foto del sito attuale dell'hotel in public/foto/<pagina>/ (NON committate: vedi .gitignore).
Servono solo per la proposta di restyling da mostrare al cliente, proprietario delle foto."""
import re, os, subprocess, hashlib, json
BASE="https://www.cosmohotelpalace.it"
PAGES={"home":"","camere":"camere-suites","classic":"camere-suites/camere/classic-room","family":"camere-suites/camere/family-room","suite":"camere-suites/suite","meeting":"meeting-ed-eventi","ristoranti":"ristoranti","wellness":"fitness-wellness","galleria":"foto-video","partners":"hotel-partners","contatti":"contatti-location"}
out=os.path.join(os.path.dirname(__file__),"..","public","foto"); os.makedirs(out,exist_ok=True)
seen={}; manifest={}
def get(u,dst=None):
    a=["curl","-sS","-L","-m","60","-A","Mozilla/5.0",u]
    if dst: a+=["-o",dst]
    return subprocess.run(a,capture_output=True)
for pg,path in PAGES.items():
    html=get(f"{BASE}/{path}").stdout.decode("utf8","ignore")
    ids=[]
    for m in re.finditer(r'https://image-tc\.galaxy\.tf/(wijpeg-\w+)/([\w\-\.]+?\.jpg)',html):
        k,name=m.group(1),m.group(2)
        if k in ids: continue
        ids.append(k)
        if k in seen: continue
        seen[k]=pg
        d=os.path.join(out,pg); os.makedirs(d,exist_ok=True)
        fn=os.path.join(d,name)
        if not os.path.exists(fn):
            get(f"https://image-tc.galaxy.tf/{k}/{name}?width=1920",fn)
        manifest.setdefault(pg,[]).append(name)
json.dump(manifest,open(os.path.join(out,"manifest.json"),"w"),indent=1)
print({k:len(v) for k,v in manifest.items()})

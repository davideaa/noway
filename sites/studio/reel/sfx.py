# Effetti sonori sintetizzati (click, tick, whoosh, pop, boom, riser) messi sui tempi di scene.json -> sfx.wav
import json, numpy as np, wave, subprocess
sr=44100; import json as _j;_S=_j.load(open('scene.json'));T=_S[-1]['t1']; N=int(sr*T)
S=json.load(open('scene.json'))
fx=np.zeros(N)
rng=np.random.default_rng(7)
def add(t,sig,g=1.0):
    i=int(t*sr); j=min(N,i+len(sig)); 
    if i<N: fx[i:j]+=sig[:j-i]*g
def env(n,a,d):
    e=np.ones(n); na=int(a*sr); e[:na]=np.linspace(0,1,na) if na>0 else 1; e*=np.exp(-np.arange(n)/(d*sr)); return e
def click():
    n=int(0.05*sr); t=np.arange(n)/sr
    s=np.sin(2*np.pi*2400*t)*np.exp(-t/0.006)*0.6+rng.normal(0,1,n)*np.exp(-t/0.002)*0.5
    s+=np.sin(2*np.pi*900*t)*np.exp(-t/0.015)*0.4
    return s
def tick():
    n=int(0.02*sr); t=np.arange(n)/sr
    return (rng.normal(0,1,n)*np.exp(-t/0.0015)*0.5+np.sin(2*np.pi*3200*t)*np.exp(-t/0.003)*0.3)
def whoosh(d=0.32):
    n=int(d*sr); t=np.arange(n)/sr; x=rng.normal(0,1,n)
    # rumore filtrato con una passa-banda che sale
    out=np.zeros(n); y1=y2=0; 
    fc=400+5000*(t/d)**1.5
    for k in range(n):
        w=2*np.pi*fc[k]/sr; a=0.12
        y1=y1+w*(x[k]-y1)*1.0 if w<1 else x[k]
        out[k]=y1
    out=np.diff(np.r_[0,out])*3
    e=np.sin(np.pi*np.clip(t/d,0,1))**2
    return out*e*0.9
def pop():
    n=int(0.09*sr); t=np.arange(n)/sr; f=700+900*t/0.09
    return np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t/0.03)*0.5
def boom():
    n=int(1.2*sr); t=np.arange(n)/sr; f=70*np.exp(-t/0.4)+38
    return (np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t/0.45)+rng.normal(0,1,n)*np.exp(-t/0.05)*0.3)*0.9
def riser(d):
    n=int(d*sr); t=np.arange(n)/sr; x=rng.normal(0,1,n); x=np.convolve(x,np.ones(6)/6,'same')
    return x*(t/d)**2*0.35

def glitch():
    n=int(0.14*sr); t=np.arange(n)/sr; sq=np.sign(np.sin(2*np.pi*np.where((t*60).astype(int)%2==0,180,420)*t))
    return (sq*0.35+rng.normal(0,1,n)*0.25)*(np.floor(t*40)%3!=1)*np.exp(-t/0.08)
for s in S:
    tr=s.get('tr')
    if tr in('whip','zoom','rise'): add(s['t0']-0.14,whoosh(),0.4)
    for q in (s.get('taps') or ([s['tap']] if 'tap' in s else [])): add(q['t'],click(),0.8)
    if s['type']=='term':
        tt=s['t0']+0.15
        for txt,ok in s['lines']:
            for k in range(0,len(txt),2): add(tt+k*0.022,tick(),0.28)
            tt+=len(txt)*0.022+0.12
    if s['type']=='flap':
        for k in range(14): add(s['t0']+0.03+k*0.045,tick(),0.3)
    if s['type']=='count3':
        for k in range(3): add(s['t0']+k*0.5455,pop(),0.4)
# i drop sono le scene con "drop": 1 in scene.json: boom sul colpo e riser nei 2 s prima
for s in S:
    if s.get('drop'): add(s['t0'],boom(),0.75); add(max(0,s['t0']-1.6),riser(1.6),0.8); add(max(0,s['t0']-0.6),whoosh(0.6),0.5)
add(_S[-1]['t0'],boom(),0.4)
fx=fx/ max(1e-6,np.abs(fx).max())*0.8
w=wave.open('sfx.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((fx*32767).astype(np.int16).tobytes()); w.close()
print('sfx ok')

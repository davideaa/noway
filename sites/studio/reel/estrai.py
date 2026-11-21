# Ritaglia le registrazioni dello schermo nei fotogrammi f/NN usati dalle scene 'tel', 'phone' (con schermo vero) e 'mac'.
# TEL = registrazione del telefono (1320x2868), MAC = registrazione del Mac. Le finestre 'film'/'det' sono quelle misurate
# sulla registrazione del 30/09 (barra di Claude e di Safari tagliate): con una registrazione nuova vanno rimisurate.
import json, subprocess, os
try: import imageio_ffmpeg; F=imageio_ffmpeg.get_ffmpeg_exe()
except ImportError: F='ffmpeg'
TEL=os.environ.get('TEL','tel.mp4'); MAC=os.environ.get('MAC','registrazione.mov')
S=json.load(open('scene.json'))
def win(w):
    if w=='film': return (109,600,1102,1960)
    if w=='det': return (45,585,1229,2185)
    z=w['z'];ww=1229/z;hh=2185/z;x=45+w['c'][0]*1229-ww/2;y=585+w['c'][1]*2185-hh/2
    x=max(45,min(45+1229-ww,x));y=max(585,min(585+2185-hh,y))
    return (int(x),int(y),int(ww)//2*2,int(hh)//2*2)
for i,s in enumerate(S):
    if s['type'] not in ('tel','phone','mac'): continue
    n=round((s['t1']-s['t0'])*60)+1
    speed=(s['s1']-s['s0'])/(s['t1']-s['t0'])
    d=f"f/{i:02d}"; os.makedirs(d,exist_ok=True)
    if len(os.listdir(d))>=n: continue
    if s['type']=='mac':
        src=MAC; vf=f"setpts=(PTS-STARTPTS)/{speed},fps=60,scale=1600:-2"
    else:
        x,y,w,h=win(s['win']); src=TEL
        sc="1080:1920" if s['type']=='tel' else "720:1280"
        vf=f"setpts=(PTS-STARTPTS)/{speed},fps=60,crop={w}:{h}:{x}:{y},scale={sc}:flags=lanczos"
    subprocess.run([F,'-hide_banner','-loglevel','error','-y','-ss',str(s['s0']),'-t',str(s['s1']-s['s0']+0.3),'-i',src,'-vf',vf,'-frames:v',str(n),'-q:v','3',f"{d}/%04d.jpg"],check=True)
    print(i,s['type'],n,len(os.listdir(d)),round(speed,2),flush=True)

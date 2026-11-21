// Grafiche ricostruite (niente screenshot): dati veri da mc.json, storia.json
window.G={};
const LIME='#c8fa72',RED='#ff6f5c',TEAL='#5eead4';
const fmt=v=>Math.round(v).toLocaleString('it-IT');
function box(id){let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.className='gx';document.getElementById('stage').appendChild(el)}el.style.display='block';return el}
function pts(arr,x0,x1,y0,y1,lo,hi,upto){const n=arr.length;const m=Math.max(1,Math.min(n,Math.floor(upto*(n-1))+1));let s='';for(let i=0;i<m;i++){const x=x0+(x1-x0)*i/(n-1),y=y1-(y1-y0)*(arr[i]-lo)/(hi-lo);s+=(i?' ':'')+x.toFixed(1)+','+y.toFixed(1)}
  if(m<n&&upto*(n-1)>m-1){const f=upto*(n-1)-(m-1),a=arr[m-1],b=arr[m];const v=a+(b-a)*f;s+=' '+(x0+(x1-x0)*(upto)).toFixed(1)+','+(y1-(y1-y0)*(v-lo)/(hi-lo)).toFixed(1)}return s}
const eo2=u=>1-Math.pow(1-Math.max(0,Math.min(1,u)),3), cl=(x,a,b)=>Math.max(a,Math.min(b,x));
// 1) curva delle discese (portafoglio, 1% per operazione, storico)
G.ddchart=(age,s)=>{const el=box('g_dd');const H=window.STORIA;
 if(!el.dataset.ok){el.innerHTML=`<div class="gcard" style="top:430px;height:900px"><div class="gk">PORTAFOGLIO · 2019–2026 · RISCHIO 1%</div><div class="gt">Le discese</div><div class="gsub">quanto si era sotto il punto più alto</div><div class="gsub" style="position:absolute;right:52px;top:196px;font-size:24px;font-family:IBM Plex Mono">discesa massima</div>
  <svg viewBox="0 0 900 560" style="position:absolute;left:0;top:300px;width:900px;height:560px"><g id="ddgrid"></g><polygon id="ddA" fill="url(#ddg)"/><polyline id="ddL" fill="none" stroke="${RED}" stroke-width="3.5" stroke-linejoin="round"/><line id="ddC" y1="20" y2="540" stroke="#fff" stroke-opacity=".5" stroke-dasharray="6 6"/>
  <defs><linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${RED}" stop-opacity=".05"/><stop offset="1" stop-color="${RED}" stop-opacity=".45"/></linearGradient></defs></svg>
  <div class="gbig" id="ddN" style="position:absolute;right:52px;top:118px;font-size:74px;color:${RED}"></div></div>`;
  let g='';[0,-.1,-.2,-.3].forEach((v,i)=>{const y=40+i*160;g+=`<line x1="50" x2="880" y1="${y}" y2="${y}" stroke="#fff" stroke-opacity=".07"/><text x="40" y="${y+8}" fill="#fff" fill-opacity=".45" font-size="22" text-anchor="end" font-family="IBM Plex Mono">${v?Math.round(v*100)+'%':'0'}</text>`});
  ['2019','2021','2023','2025'].forEach((y,i)=>{g+=`<text x="${60+i*260}" y="560" fill="#fff" fill-opacity=".45" font-size="22" font-family="IBM Plex Mono">${y}</text>`});el.querySelector('#ddgrid').innerHTML=g;el.dataset.ok=1}
 const u=eo2((age-0.05)/0.75);const P=pts(H.dd,60,880,40,520,-0.3,0,u);el.querySelector('#ddL').setAttribute('points',P);el.querySelector('#ddA').setAttribute('points','60,40 '+P+' '+(60+820*u).toFixed(1)+',40');
 el.querySelector('#ddC').setAttribute('x1',60+820*u);el.querySelector('#ddC').setAttribute('x2',60+820*u);
 const k=Math.floor(u*(H.dd.length-1));let mn=0;for(let i=0;i<=k;i++)mn=Math.min(mn,H.dd[i]);if(u>0.97)mn=H.ddmin;el.querySelector('#ddN').textContent='−'+Math.abs(mn*100).toFixed(1).replace('.',',')+'%';
 const c=el.firstChild;const q=eo2(age/0.3);c.style.transform=`perspective(1600px) rotateX(${(1-q)*22}deg) translateY(${(1-q)*120}px)`;c.style.opacity=q};
// 2) il modulo del simulatore, compilato dalla manina
G.form=(age,s)=>{const el=box('g_form');
 if(!el.dataset.ok){el.innerHTML=`<div class="gcard" style="top:330px;height:1100px"><div class="gt"><i class="gdot"></i>Simulatore Monte Carlo</div><div class="gsub">500 futuri possibili, dalle operazioni vere</div>
  <div class="gk" style="margin-top:56px">CAPITALE INIZIALE</div><div class="gfield"><span id="fcap"></span><i class="gcar"></i></div>
  <div class="gk" style="margin-top:44px">DISCESA MASSIMA ACCETTATA</div><div class="gval" id="flim">0%</div><div class="gslide"><i id="fbar"></i><b id="fkn"></b></div>
  <div class="gk" style="margin-top:44px">PER QUANTI ANNI</div><div class="gpills" id="fy">${[1,2,3,4,5,6,7].map(n=>`<span>${n}</span>`).join('')}</div>
  <div class="gbtn" id="fgo">▶ Avvia la simulazione</div></div>`;el.dataset.ok=1}
 const c=el.firstChild;const q=eo2(age/0.3);c.style.transform=`perspective(1600px) rotateX(${(1-q)*20}deg) translateY(${(1-q)*140}px) scale(${1+(age>2.2?Math.min(0.08,(age-2.2)*0.4):0)})`;c.style.opacity=q;
 const cap='10.000 €';el.querySelector('#fcap').textContent=cap.slice(0,cl(Math.floor((age-0.25)/0.055),0,cap.length));
 const sl=eo2((age-0.8)/0.55);el.querySelector('#fbar').style.width=(sl*40)+'%';el.querySelector('#fkn').style.left=(sl*40)+'%';el.querySelector('#flim').textContent=Math.round(sl*20)+'%';
 [...el.querySelectorAll('#fy span')].forEach((p,i)=>{p.className=(i===4&&age>1.62)?'on':''});
 const b=el.querySelector('#fgo');const pr=age>2.18&&age<2.4;b.style.transform=`scale(${pr?0.96:1})`;b.style.boxShadow=age>2.18?`0 0 ${60+(age-2.18)*200}px rgba(200,250,114,.7)`:'0 0 30px rgba(200,250,114,.25)'};
// 3) il ventaglio delle simulazioni
G.fan=(age,s,dur)=>{const el=box('g_fan');const M=window.MC;const k=0.957;
 if(!el.dataset.ok){let h=`<div class="gk" style="position:absolute;left:70px;top:330px">SIMULAZIONE · 10.000 € · 5 ANNI · SCENARIO PRUDENTE</div><div class="gt" style="position:absolute;left:70px;top:372px">500 futuri possibili</div>
  <svg id="fansvg" viewBox="0 0 1080 900" style="position:absolute;left:0;top:520px;width:1080px;height:900px"><g id="fgrid"></g><polygon id="fband" fill="${LIME}" fill-opacity=".13"/><g id="fpaths"></g><polyline id="fmed" fill="none" stroke="${LIME}" stroke-width="6" stroke-linejoin="round" style="filter:drop-shadow(0 0 10px ${LIME})"/><line id="fcur" y1="30" y2="820" stroke="${LIME}" stroke-width="3"/></svg>
  <div class="gtag" id="fcurT"></div><div class="gpill" id="l95"></div><div class="gpill mid" id="l50"></div><div class="gpill" id="l5"></div>`;el.innerHTML=h;
  let g='';[10000,30000,50000,70000].forEach(v=>{const y=820-(v/10000-0.8)/(7.2-0.8)*780;g+=`<line x1="120" x2="900" y1="${y}" y2="${y}" stroke="#fff" stroke-opacity=".07"/><text x="110" y="${y+8}" fill="#fff" fill-opacity=".45" font-size="24" text-anchor="end" font-family="IBM Plex Mono">${fmt(v/1000)}k €</text>`});
  for(let a=1;a<=5;a++)g+=`<text x="${120+780*a/5}" y="870" fill="#fff" fill-opacity=".45" font-size="24" text-anchor="middle" font-family="IBM Plex Mono">${a} ann${a>1?'i':'o'}</text>`;el.querySelector('#fgrid').innerHTML=g;
  el.querySelector('#fpaths').innerHTML=M.p.map(()=>`<polyline fill="none" stroke="${LIME}" stroke-opacity=".16" stroke-width="1.6"/>`).join('');el.dataset.ok=1}
 const u=eo2(age/2.0*1.0);const X0=120,X1=900,Y0=40,Y1=820,lo=0.8,hi=7.2;const sc=a=>a.map(v=>v*k);
 [...el.querySelectorAll('#fpaths polyline')].forEach((pl,i)=>pl.setAttribute('points',pts(sc(M.p[i]),X0,X1,Y0,Y1,lo,hi,u)));
 const q5=sc(M.q[0]),q50=sc(M.q[1]),q95=sc(M.q[2]);const top=pts(q95,X0,X1,Y0,Y1,lo,hi,u),bot=pts(q5,X0,X1,Y0,Y1,lo,hi,u).split(' ').reverse().join(' ');
 el.querySelector('#fband').setAttribute('points',top+' '+bot);el.querySelector('#fmed').setAttribute('points',pts(q50,X0,X1,Y0,Y1,lo,hi,u));
 const cx=X0+(X1-X0)*u;el.querySelector('#fcur').setAttribute('x1',cx);el.querySelector('#fcur').setAttribute('x2',cx);el.querySelector('#fcur').style.opacity=u<1?1:Math.max(0,1-(age-2.0)/0.3);
 const mo=Math.round(u*60);const T=el.querySelector('#fcurT');T.textContent=`dopo ${Math.floor(mo/12)} anni${mo%12?' e '+mo%12+' mesi':''}`;T.style.left=(cx-110)+'px';T.style.top='520px';T.style.opacity=u<1?1:0;
 const yAt=v=>520+Y1-(v-lo)/(hi-lo)*(Y1-Y0);const L=[['l95','95% · 66.198 €',q95[60]],['l50','mediana · 35.317 €',q50[60]],['l5','5% · 20.852 €',q5[60]]];
 L.forEach(([id,txt,v],i)=>{const p=el.querySelector('#'+id);p.textContent=txt;const a=eo2((age-2.0-i*0.1)/0.25);p.style.opacity=a;p.style.left=(X1-360)+'px';p.style.top=(yAt(v)-34)+'px';p.style.transform=`translateX(${(1-a)*60}px)`});
 const f=age>dur-1.1?eo2((age-(dur-1.1))/0.3):0;el.style.transform=`scale(${1+0.1*f})`;el.style.transformOrigin='60% 62%'};
// 4) confronto con gli indici (storico reale) e la mediana simulata
G.bench=(age,s)=>{const el=box('g_bench');const M=window.MC,H=window.STORIA;
 if(!el.dataset.ok){el.innerHTML=`<div class="gpills big" style="position:absolute;left:50%;top:360px;transform:translateX(-50%)" id="bt"><span>Simulazioni</span><span>Confronto con benchmark</span></div>
  <svg viewBox="0 0 1080 900" style="position:absolute;left:0;top:500px;width:1080px;height:900px"><g id="bgrid"></g><polyline id="bS" fill="none" stroke="#e8ecef" stroke-width="4"/><polyline id="bN" fill="none" stroke="${TEAL}" stroke-width="4"/><polyline id="bM" fill="none" stroke="${LIME}" stroke-width="7" style="filter:drop-shadow(0 0 10px ${LIME})"/></svg>
  <div class="gpill mid" id="bmL">Strategie · 35.317 €</div><div class="gpill" id="bnL" style="color:${TEAL}">Nasdaq-100 · 26.581 €</div><div class="gpill" id="bsL">S&amp;P 500 · 19.027 €</div>
  <div class="gfoot" style="top:1440px">indici: storico reale 2019–2023, senza dividendi<br>strategie: mediana simulata, scenario prudente</div>`;
  let g='';[10000,20000,30000,40000].forEach(v=>{const y=820-(v/10000-0.8)/(4.0-0.8)*780;g+=`<line x1="120" x2="880" y1="${y}" y2="${y}" stroke="#fff" stroke-opacity=".07"/><text x="110" y="${y+8}" fill="#fff" fill-opacity=".45" font-size="24" text-anchor="end" font-family="IBM Plex Mono">${fmt(v/1000)}k €</text>`});el.querySelector('#bgrid').innerHTML=g;el.dataset.ok=1}
 [...el.querySelectorAll('#bt span')].forEach((p,i)=>p.className=(age>0.32?i===1:i===0)?'on':'');
 const u=eo2((age-0.4)/1.2);const med=M.q[1].map(v=>v*0.957);const X0=120,X1=880,Y0=40,Y1=820,lo=0.8,hi=4.0;
 el.querySelector('#bM').setAttribute('points',pts(med,X0,X1,Y0,Y1,lo,hi,u));el.querySelector('#bN').setAttribute('points',pts(H['^NDX'],X0,X1,Y0,Y1,lo,hi,u));el.querySelector('#bS').setAttribute('points',pts(H['^GSPC'],X0,X1,Y0,Y1,lo,hi,u));
 const yAt=v=>500+Y1-(v-lo)/(hi-lo)*(Y1-Y0);[['bmL',med[60]],['bnL',H['^NDX'][60]],['bsL',H['^GSPC'][60]]].forEach(([id,v],i)=>{const p=el.querySelector('#'+id);const a=eo2((age-1.55-i*0.08)/0.25);p.style.opacity=a;p.style.left='560px';p.style.top=(yAt(v)-(i===2?0:34))+'px'});
 el.querySelector('.gfoot').style.opacity=eo2((age-1.6)/0.3)};
// 5) scegli il rischio: la discesa massima storica cambia
G.risk=(age,s)=>{const el=box('g_risk');
 if(!el.dataset.ok){el.innerHTML=`<div class="gt" style="position:absolute;left:0;right:0;top:360px;text-align:center;display:block;font-size:96px;line-height:1.05">Tu scegli<br>quanto <span style="color:${LIME}">rischiare.</span></div>
  <div class="gk" style="position:absolute;left:0;right:0;top:640px;text-align:center">RISCHIO PER OPERAZIONE</div><div class="gpills big" id="rp" style="position:absolute;left:50%;top:700px;transform:translateX(-50%)"><span>0,5%</span><span>1%</span><span>2%</span></div>
  <div class="gbig" id="rv" style="position:absolute;left:0;right:0;top:880px;text-align:center"></div><div class="gk" style="position:absolute;left:0;right:0;top:1190px;text-align:center">DISCESA MASSIMA NEL BACKTEST 2019–2026</div>`;el.dataset.ok=1}
 const sel=age<0.62?1:age<1.32?0:2;const vals=[15.0,28.0,49.0];const prev=age<0.62?1:age<1.32?1:0;const t0=age<0.62?0:age<1.32?0.62:1.32;
 const f=eo2((age-t0)/0.35);const v=vals[prev]+(vals[sel]-vals[prev])*f;const rv=el.querySelector('#rv');rv.textContent='−'+v.toFixed(1).replace('.',',')+'%';
 rv.style.color=v<20?LIME:v<35?'#ffb057':RED;rv.style.textShadow=`0 0 70px ${rv.style.color}66`;
 [...el.querySelectorAll('#rp span')].forEach((p,i)=>p.className=i===sel?'on':'')};
// ---- nuove scene (prova 5) ----
const GOLD='#e8b04a',BLUE='#5b9dff',PURP='#a78bfa';
function enter(el,age,d=0.3){const c=el.firstElementChild;if(!c)return;const q=eo2(age/d);c.style.transform=`perspective(1600px) rotateX(${(1-q)*20}deg) translateY(${(1-q)*140}px)`;c.style.opacity=q}
// 3 mercati
G.markets=(age,s)=>{const el=box('g_mk');const C=window.CURVE;
 if(!el.dataset.ok){const D=[['oro','XAUUSD','ORO',GOLD],['nasdaq','NASDAQ','INDICE USA',BLUE],['usdjpy','USDJPY','VALUTA',PURP]];
  el.innerHTML=`<div class="gt" style="position:absolute;left:0;right:0;top:360px;justify-content:center;font-size:100px">3 mercati.</div>`+D.map(([k,n,m,c],i)=>{const v=C[k];const p=v.map((y,j)=>`${(j/(v.length-1)*820).toFixed(1)},${(120-y*110).toFixed(1)}`).join(' ');
  return `<div class="mk" style="top:${620+i*300}px;border-color:${c}66"><div class="mkn" style="color:${c}">${n}</div><div class="mkm">${m}</div><svg viewBox="0 0 820 130"><polyline points="${p}" fill="none" stroke="${c}" stroke-width="4" pathLength="1" class="mkl"/></svg></div>`}).join('');el.dataset.ok=1}
 [...el.querySelectorAll('.mk')].forEach((m,i)=>{const a=eo2((age-i*0.12)/0.3);m.style.opacity=a;m.style.transform=`translateX(${(1-a)*(i%2?-600:600)}px)`;const l=m.querySelector('.mkl');l.style.strokeDasharray='1';l.style.strokeDashoffset=String(1-eo2((age-i*0.12-0.1)/0.6))});
 el.firstChild.style.opacity=eo2(age/0.2)};
// ottimizzato / validato fuori campione
G.timeline=(age,s)=>{const el=box('g_tl');
 if(!el.dataset.ok){el.innerHTML=`<div class="gt" style="position:absolute;left:0;right:0;top:500px;display:block;text-align:center;font-size:84px;line-height:1.08">Due periodi.<br><span style="color:#c8fa72">Nessun trucco.</span></div>
  <div class="tlb"><i id="tl1"></i><i id="tl2"></i></div><div class="tly" style="left:80px">2019</div><div class="tly" style="left:600px">2024</div><div class="tly" style="right:80px">2026</div>
  <div class="tll" id="tll1" style="left:80px">OTTIMIZZATO<br><b>2019–2023</b></div><div class="tll" id="tll2" style="right:80px;text-align:right;color:#c8fa72">VALIDATO FUORI CAMPIONE<br><b>2024–2026</b></div>`;el.dataset.ok=1}
 const a=eo2((age-0.05)/0.4),b=eo2((age-0.45)/0.4);el.querySelector('#tl1').style.width=(a*62)+'%';el.querySelector('#tl2').style.width=(b*38)+'%';el.querySelector('#tll1').style.opacity=a;el.querySelector('#tll2').style.opacity=b;el.firstChild.style.opacity=eo2(age/0.2)};
// 93 mesi, 6 con tutte e tre in perdita
G.months=(age,s)=>{const el=box('g_mo');const E=window.EXTRA;
 if(!el.dataset.ok){let h=`<div class="gt" style="position:absolute;left:0;right:0;top:360px;justify-content:center;font-size:92px">Mai tutte insieme.</div><div class="mog">`;
  E.mesi.forEach((m,i)=>{h+=`<i data-n="${E.neg[i]?1:0}"></i>`});h+=`</div><div class="gbig" id="moN" style="position:absolute;left:0;right:0;top:1250px;text-align:center;font-size:150px;color:${RED}"></div><div class="gk" style="position:absolute;left:0;right:0;top:1420px;text-align:center">MESI SU 93 IN CUI HANNO PERSO TUTTE E TRE</div>`;el.innerHTML=h;el.dataset.ok=1}
 const cells=[...el.querySelectorAll('.mog i')];const u=eo2((age-0.1)/0.7);const k=Math.floor(u*cells.length);let neg=0;
 cells.forEach((c,i)=>{const on=i<k;if(on&&c.dataset.n==='1')neg++;c.style.background=on?(c.dataset.n==='1'?RED:'rgba(200,250,114,.55)'):'rgba(255,255,255,.06)';c.style.boxShadow=on&&c.dataset.n==='1'?`0 0 18px ${RED}`:'none'});
 el.querySelector('#moN').textContent=neg;el.firstChild.style.opacity=eo2(age/0.2)};
// ricerca
G.search=(age,s,dur)=>{const el=box('g_se');
 if(!el.dataset.ok){el.innerHTML=`<div class="br"><div class="brt"><i></i><i></i><i></i></div><div class="brlogo"><img src="logo-grande.webp"></div><div class="brs"><svg viewBox="0 0 24 24" width="44" height="44"><circle cx="10" cy="10" r="7" fill="none" stroke="#9aa3a8" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="#9aa3a8" stroke-width="2.4" stroke-linecap="round"/></svg><span id="seT"></span><i class="gcar" id="seC"></i></div><div class="brb" id="seB">Cerca</div></div>`;el.dataset.ok=1}
 enter(el,age,0.35);const q='Portfolio Algo Manager';const n=cl(Math.floor((age-0.45)/0.075),0,q.length);el.querySelector('#seT').textContent=n?q.slice(0,n):'';el.querySelector('#seT').style.color=n?'#fff':'#6b7378';if(!n)el.querySelector('#seT').textContent='Cerca…';
 el.querySelector('#seC').style.opacity=(Math.floor(age*3)%2||n<q.length)?1:0;const B=el.querySelector('#seB');const pr=s.tap&&age>s.tap.t-s.t0-0.02;B.style.transform=`scale(${pr&&age<s.tap.t-s.t0+0.15?0.94:1})`;B.style.boxShadow=pr?'0 0 60px rgba(200,250,114,.8)':'none'};
// la home del sito, ricostruita
G.hero=(age,s)=>{const el=box('g_he');
 if(!el.dataset.ok){el.innerHTML=`<div class="he"><div class="heh"><img src="logo-grande.webp"><span>Portfolio Algo Manager</span><b>Contattaci</b></div>
  <div class="gk" style="margin-top:120px;color:#c8fa72">01 — INGRESSO · XAUUSD · NASDAQ · USDJPY</div>
  <div class="het" id="heT">${['Tre strategie','algoritmiche','validate attraverso','modelli quantitativi.'].map(l=>`<div><span>${l}</span></div>`).join('')}</div>
  <div class="heb"><b id="heB">Scegli una strategia →</b><i>Apri il simulatore</i></div><div class="gk" style="margin-top:70px">BACKTEST 2019–2026 · VALIDATO FUORI CAMPIONE</div></div>`;el.dataset.ok=1}
 [...el.querySelectorAll('#heT span')].forEach((sp,i)=>{const a=eo2((age-0.1-i*0.1)/0.35);sp.style.transform=`translateY(${(1-a)*110}%)`;sp.style.opacity=a});
 el.querySelector('.heb').style.opacity=eo2((age-0.55)/0.3);const B=el.querySelector('#heB');const ta=s.tap?age-(s.tap.t-s.t0):-1;B.style.transform=`scale(${ta>0&&ta<0.15?0.95:1})`;B.style.boxShadow=ta>0?`0 0 ${40+ta*160}px rgba(200,250,114,.7)`:'none';
 el.firstChild.style.opacity=eo2(age/0.2)};
// statistiche per strategia (schede)
G.stats=(age,s)=>{const el=box('g_st');const X=window.EXTRA.stats;const D=[['oro','XAUUSD',GOLD],['nasdaq','Nasdaq',BLUE],['usdjpy','USDJPY',PURP]];
 if(!el.dataset.ok){el.innerHTML=`<div class="gpills big" id="stp" style="position:absolute;left:50%;top:380px;transform:translateX(-50%)">${D.map(d=>`<span>${d[1]}</span>`).join('')}</div>
  <div class="gt" id="stn" style="position:absolute;left:90px;top:560px;font-size:110px"></div>
  ${['OPERAZIONI','PERDITE DI FILA, LA SERIE PEGGIORE','DISCESA MASSIMA'].map((k,i)=>`<div class="stt" style="top:${760+i*250}px"><div class="gk">${k}</div><div class="stv" id="stv${i}"></div></div>`).join('')}
  <div class="gfoot" style="top:1520px">backtest 2019–2026 · rischio 1% per operazione</div>`;el.dataset.ok=1}
 const idx=Math.min(2,s.at.filter(a=>s.t0+age>=a).length-1);const [k,n,c]=D[idx];const st=X[k];const since=s.t0+age-s.at[idx];const f=eo2(since/0.35);
 [...el.querySelectorAll('#stp span')].forEach((p,i)=>{p.className=i===idx?'on':'';p.style.background=i===idx?c:'';p.style.borderColor=i===idx?c:'';p.style.boxShadow=i===idx?`0 0 30px ${c}88`:'none'});
 const N=el.querySelector('#stn');N.innerHTML=`<i class="gdot" style="background:${c};box-shadow:0 0 18px ${c}"></i>${n}`;N.style.opacity=f;N.style.transform=`translateX(${(1-f)*80}px)`;
 el.querySelector('#stv0').textContent=Math.round(st.op*f).toLocaleString('it-IT');el.querySelector('#stv1').textContent=Math.round(st.fila*f);
 const v2=el.querySelector('#stv2');v2.textContent='−'+Math.abs(st.dd*f).toFixed(1).replace('.',',')+'%';v2.style.color=RED;
 el.querySelectorAll('.stt').forEach(t=>t.style.borderColor=c+'55');el.firstChild.style.opacity=eo2(age/0.2)};
// 4.206 operazioni, una per una
G.trades=(age,s)=>{const el=box('g_tr');const R=window.EXTRA.R;
 if(!el.dataset.ok){el.innerHTML=`<canvas id="trc" width="920" height="760" style="position:absolute;left:80px;top:560px"></canvas><div class="gbig" id="trN" style="position:absolute;left:0;right:0;top:330px;text-align:center;font-size:170px;color:#c8fa72"></div><div class="gk" style="position:absolute;left:0;right:0;top:1360px;text-align:center">OPERAZIONI NEL BACKTEST · NESSUNA ESCLUSA</div>`;el.dataset.ok=1}
 const cv=el.querySelector('#trc'),x=cv.getContext('2d');x.clearRect(0,0,920,760);const cols=66,sz=13.9;const u=eo2((age-0.05)/1.3);const k=Math.floor(u*R.length);
 for(let i=0;i<R.length;i++){const cx=(i%cols)*sz,cy=Math.floor(i/cols)*sz*0.84;x.fillStyle=i<k?(R[i]>0?'rgba(200,250,114,.85)':'rgba(255,111,92,.8)'):'rgba(255,255,255,.05)';x.fillRect(cx,cy,sz-3,sz*0.84-3)}
 el.querySelector('#trN').textContent=k.toLocaleString('it-IT')};

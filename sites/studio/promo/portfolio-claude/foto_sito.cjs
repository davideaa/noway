const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const O=process.argv[2]+'/reel/img/';
 const p=await b.newPage({viewport:{width:900,height:1600},deviceScaleFactor:2});
 // home: frame finale e un frame intermedio
 await p.goto('http://localhost:8765/',{waitUntil:'load'}); await p.waitForTimeout(4000);
 const H=await p.evaluate(()=>document.documentElement.scrollHeight);
 for (const [f,n] of [[0.03,'home-a'],[0.3,'home-b'],[0.62,'home-c'],[0.985,'home-end']]) { await p.evaluate(y=>window.scrollTo(0,y),Math.round(H*f)); await p.waitForTimeout(3500); await p.screenshot({path:O+n+'.png'}); }
 await p.goto('http://localhost:8765/dettagli/',{waitUntil:'load'}); await p.waitForTimeout(3000);
 await p.screenshot({path:O+'dett-top.png'});
 const cards=await p.$$('.xp-card'); for (let i=0;i<cards.length;i++) await cards[i].screenshot({path:O+'card'+i+'.png'});
 const xp=await p.$('#esplora'); await xp.screenshot({path:O+'esplora.png'});
 await p.goto('http://localhost:8765/dettagli/#oro',{waitUntil:'load'}); await p.waitForTimeout(3500);
 await p.screenshot({path:O+'oro-top.png'});
 const blocks=await p.$$('.xp-block'); console.log('blocks',blocks.length); for (let i=0;i<Math.min(4,blocks.length);i++) await blocks[i].screenshot({path:O+'oro-b'+i+'.png'});
 await p.goto('http://localhost:8765/dettagli/#portafoglio',{waitUntil:'load'}); await p.waitForTimeout(3500);
 const pb=await p.$$('.xp-block'); if(pb[0]) await pb[0].screenshot({path:O+'port-b0.png'});
 await p.screenshot({path:O+'port-top.png'});
 await p.goto('http://localhost:8765/dettagli/#simulatore',{waitUntil:'load'}); await p.waitForTimeout(3000);
 await p.screenshot({path:O+'sim-top.png'});
 const btn=p.getByRole('button',{name:/Avvia la simulazione/i}); await btn.first().click(); await p.waitForTimeout(10000);
 const svg=await p.$$('svg'); let best=null,ba=0; for (const s of svg){const bb=await s.boundingBox(); if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=s;}}
 await best.evaluate(e=>e.scrollIntoView({block:'center'})); await p.waitForTimeout(800);
 const bb=await best.boundingBox(); await p.screenshot({path:O+'sim-chart.png',clip:{x:Math.max(0,bb.x-30),y:Math.max(0,bb.y-160),width:Math.min(900,bb.width+60),height:bb.height+230}});
 await p.screenshot({path:O+'sim-view.png'});
 await b.close();
})();

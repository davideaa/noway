const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const out=process.argv[2]; fs.mkdirSync(out,{recursive:true});
  const FPS=+(process.env.FPS||60), DUR=+(process.env.DUR||26.05);
  let frames=[]; if(process.env.TIMES){frames=process.env.TIMES.split(' ').map(Number)} else {const N=Math.round(DUR*FPS); for(let i=0;i<N;i++)frames.push(i);}
  if(process.env.FRAMES){frames=[];process.env.FRAMES.split(',').forEach(x=>{const[a,b]=x.split('-').map(Number);for(let i=a;i<=b;i++)frames.push(i)})}
  if(process.env.PARTE){const [k,n]=process.env.PARTE.split('/').map(Number); frames=frames.filter((_,i)=>i%n===k);}
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:1080,height:1920}}); p.on('pageerror',e=>console.log('ERR',e.message)); p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
  await p.goto('file://'+path.resolve(__dirname,'reel.html')); await p.waitForFunction(()=>window.READY===true);
  await p.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  for(const f of frames){ const t=process.env.TIMES? f : f/FPS; await p.evaluate(t=>window.seek(t),t);
    const name=process.env.TIMES? 't'+t.toFixed(2) : String(f).padStart(5,'0'); await p.screenshot({path:path.join(out,name+'.jpg'),type:'jpeg',quality:92}); }
  await b.close();
})();

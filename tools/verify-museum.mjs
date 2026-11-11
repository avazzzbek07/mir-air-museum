// Local browser smoke/performance check; requires Chromium (CHROME_PATH override supported).
import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const baseline = process.argv.includes('--baseline');
const server = createServer(async (req, res) => {
  try {
    const name = new URL(req.url, 'http://localhost').pathname;
    if (name === '/__three.js') { res.writeHead(200, {'Content-Type':'text/javascript'}); res.end(await readFile(process.env.THREE_PATH || '/tmp/museum-three.module.js')); return; }
    if (name === '/fb.js') { res.writeHead(200, {'Content-Type':'text/javascript'}); res.end('throw new Error("Offline smoke test");'); return; }
    const path = resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    let body = await readFile(path);
    if (name === '/app.js') {
      if (baseline) body = execFileSync('git', ['show', 'HEAD:app.js'], { cwd: root });
      body = body.toString().replace('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', '/__three.js') + '\nglobalThis.__museum = { stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures, ratio: renderer.getPixelRatio(), shadows: renderer.shadowMap.enabled, lowPower, exhibits: scene.children.filter(o => o.name.startsWith("exhibit:")).map(o => ({id:o.name, meshes:(()=>{let n=0;o.traverse(c=>{if(c.isMesh)n++});return n})()})) }), snap(i) { goStop(i, true); prog=i; tourAt(prog,camera.position,camT); camera.lookAt(camT); }, get renderer() { return renderer; }, get scene() { return scene; } };';
    }
    const types = { '.html':'text/html', '.js':'text/javascript', '.jpg':'image/jpeg', '.png':'image/png' };
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const profile = await mkdtemp(join(tmpdir(), 'museum-check-'));
const browser = spawn(process.env.CHROME_PATH || '/home/avazbek/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', ['--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--no-first-run', 'about:blank'], { stdio:'ignore' });
const delay = ms => new Promise(r => setTimeout(r, ms));
let ws;
try {
  let port;
  for(let i=0;i<50;i++){try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await delay(200);}}
  assert.ok(port,'Chromium did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  let id=0;const pending=new Map(), errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;};
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Network.enable'); await cdp('Network.setBlockedURLs',{urls:['https://*']});
  for(const preset of [{name:'desktop',width:1440,height:900,dpr:1,mobile:false,cpu:1,ram:8,cores:8},{name:'weak-phone',width:360,height:740,dpr:3,mobile:true,cpu:4,ram:2,cores:4},{name:'tablet',width:820,height:1180,dpr:2,mobile:true,cpu:2,ram:4,cores:4}].filter(p => !process.env.MUSEUM_PRESET || p.name === process.env.MUSEUM_PRESET)){
    await cdp('Emulation.setDeviceMetricsOverride',{width:preset.width,height:preset.height,deviceScaleFactor:preset.dpr,mobile:preset.mobile});
    await cdp('Emulation.setTouchEmulationEnabled',{enabled:preset.mobile});
    await cdp('Emulation.setCPUThrottlingRate',{rate:preset.cpu});
    const init=await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(navigator,'deviceMemory',{get:()=>${preset.ram}});Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>${preset.cores}});`});
    const started=Date.now();await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
    let ready=false;
    for(let i=0;i<180;i++){if(await evaluate('!!globalThis.__museum && document.getElementById("loader").classList.contains("done")')){ready=true;break;}await delay(250);}
    assert.ok(ready,`museum did not load: ${preset.name}`);
    const loadingMs=Date.now()-started; console.log('Loaded ' + preset.name + ' in ' + loadingMs + 'ms');
    const halls=[];
    for(const hall of [1,3,5,7,8,9,10]){
      await evaluate(`location.hash='hall-${hall}'`);await delay(250); await evaluate(`__museum.snap(${hall})`); await delay(350);
      const stats=await evaluate('__museum.stats()');halls.push({hall,...stats});
      if (hall === 3) await writeFile(`/tmp/museum-${baseline?'before':'after'}-${preset.name}-radar.png`,Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
    }
    if(!baseline){assert.equal(halls[0].exhibits.length,9);assert.ok(halls[0].exhibits.every(o=>o.meshes>0));if(preset.mobile)assert.equal(halls[0].shadows,false);}
    await writeFile(`/tmp/museum-${baseline?'before':'after'}-${preset.name}.png`,Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
    await evaluate("location.hash='projects'");await delay(350);
    assert.equal(await evaluate('document.body.classList.contains("page")'),true);
    const previous=await evaluate('__museum.renderer.info.render.frame');await delay(300);
    assert.equal(await evaluate('__museum.renderer.info.render.frame'),previous,'3D should pause on content pages');
    console.log(JSON.stringify({preset:preset.name,baseline,loadingMs,maxCalls:Math.max(...halls.map(h=>h.calls)),maxTriangles:Math.max(...halls.map(h=>h.triangles)),maxTextures:Math.max(...halls.map(h=>h.textures)),ratio:halls[0].ratio,exhibits:halls[0].exhibits,errors}));
    assert.deepEqual(errors,[]);
    await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:init.identifier});
  }
} finally {ws?.close();browser.kill();server.close();}

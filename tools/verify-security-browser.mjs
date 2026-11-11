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
    if (name === '/fb.js') { res.writeHead(200, {'Content-Type':'text/javascript'}); res.end(`
      export const modScope = u => u?.emailVerified ? u.scope || "" : "";
      export const onUser = cb => { globalThis.__authCallback = cb; cb(null); };
      export const loadPublic = async () => ({projects:[],news:[],counts:{},votes:{}});
      export const getProfile = async uid => { await new Promise(r=>setTimeout(r,80)); return {_id:uid,name:"Synthetic Student",group:"mir-1",status:"approved",skills:[],contacts:{email:"private-sentinel@example.invalid"}}; };
      export const visibleProfiles = async (u,own) => { await new Promise(r=>setTimeout(r,80)); return [own]; };
    `); return; }
    const path = resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    let body = await readFile(path);
    if (name === '/app.js') {
      if (baseline) body = execFileSync('git', ['show', 'HEAD:app.js'], { cwd: root });
      body = body.toString().replace('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', '/__three.js') + '\nglobalThis.__museum = { stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures, ratio: renderer.getPixelRatio(), shadows: renderer.shadowMap.enabled, lowPower, exhibits: scene.children.filter(o => o.name.startsWith("exhibit:")).map(o => ({id:o.name, meshes:(()=>{let n=0;o.traverse(c=>{if(c.isMesh)n++});return n})()})) }), snap(i) { goStop(i, true); prog=i; tourAt(prog,camera.position,camT); camera.lookAt(camT); }, get renderer() { return renderer; }, get scene() { return scene; } };';
    }
    if (name === '/app.js') body += '\nglobalThis.__securityFixture = { S, syncUser, route, normalize };';
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
  await cdp('Emulation.setDeviceMetricsOverride',{width:1100,height:800,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/#projects`});
  for(let i=0;i<100;i++){if(await evaluate('!!globalThis.__securityFixture && !!globalThis.__authCallback'))break;await delay(100);}
  assert.ok(await evaluate('!!globalThis.__securityFixture'));
  await evaluate(`(() => {
    const {S,normalize,route}=__securityFixture;
    const payload='<img src=x onerror="globalThis.__xss=1">';
    S.dyn=[normalize({_id:'xss',title:payload,desc:payload,group:'mir-1',groups:['mir-1'],type:'project',stage:'demo',authors:payload,tags:[payload],demo:'javascript:globalThis.__xss=2',repo:'data:text/html,test'})];
    return route(true);
  })()`);
  assert.equal(await evaluate('!!globalThis.__xss'),false);
  assert.equal(await evaluate('document.querySelector("#page img[onerror], #page script") === null'),true);
  assert.equal(await evaluate('document.querySelector("#page .pcard h3").textContent.includes("<img")'),true);
  await evaluate(`__securityFixture.S.profiles=[{_id:'xss',name:'<svg onload="globalThis.__xss=3">',group:'mir-1',skills:['<img src=x onerror="globalThis.__xss=4">'],contacts:{site:'javascript:globalThis.__xss=5',github:'data:text/html,test'}}];location.hash='s-xss'`);
  await delay(150);
  assert.equal(await evaluate('!!globalThis.__xss'),false);
  assert.equal(await evaluate('document.querySelector("#page svg[onload], #page img[onerror], #page .clinks a") === null'),true);
  await evaluate(`const blocked=document.createElement('script');blocked.textContent='globalThis.__cspInjected=true';document.head.append(blocked);`);
  await delay(80);
  assert.equal(await evaluate('!!globalThis.__cspInjected'),false,'CSP must block inline scripts');
  await evaluate(`const base=document.createElement('base');base.href='https://attacker.invalid/';document.head.append(base);`);
  assert.ok((await evaluate('document.baseURI')).startsWith('http://127.0.0.1:'),'CSP must block injected base URLs');
  await evaluate(`__securityFixture.syncUser({uid:'mockstudent',email:'mock@example.invalid',emailVerified:true})`);
  await evaluate(`location.hash='s-mockstudent'`);await delay(100);
  assert.ok(await evaluate('document.getElementById("page").textContent.includes("private-sentinel@example.invalid")'));
  await evaluate('__securityFixture.syncUser(null)');
  assert.equal(await evaluate('document.getElementById("page").textContent.includes("private-sentinel@example.invalid")'),false);
  await evaluate(`(async()=>{const pending=__securityFixture.syncUser({uid:'slowstudent',email:'slow@example.invalid',emailVerified:true});await __securityFixture.syncUser(null);await pending;})()`);
  assert.equal(await evaluate('__securityFixture.S.user === null && __securityFixture.S.me === null && __securityFixture.S.profiles.length === 0'),true,'Late responses must not restore private data after logout');
  assert.deepEqual(errors,[]);
  console.log('Passed: browser XSS rendering, unsafe links, CSP inline scripts, injected base URL, logout cleanup and stale authentication responses.');

} finally {ws?.close();browser.kill();server.close();}

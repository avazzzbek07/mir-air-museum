import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, collection, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, writeBatch, serverTimestamp, Timestamp, setLogLevel } from 'firebase/firestore';
import { escapeHtml, safeUrl, contactUrl } from '../security.js';

// Never point these tests at a real project. All accounts and records are synthetic.
const projectId = 'demo-museum-security';
const baseline = !!process.env.BASELINE_RULES;
const endpoint = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8180';
assert.match(endpoint, /^(127\.0\.0\.1|localhost):\d+$/, 'Only a loopback emulator is allowed');
let env;
const photo = 'data:image/jpeg;base64,/9j/2Q==';
const profile = (group = 'mir-1', status = 'pending') => ({ name: 'Synthetic Student', group, status, bio: 'Test only', skills: ['Arduino'], internship: false, contacts: {email:'synthetic@example.invalid'}, photo:'', createdAt:serverTimestamp(), updatedAt:serverTimestamp() });
const project = (ownerUid='student1', group='mir-1', status='pending') => ({ title:'Synthetic Project', desc:'Test only', group, groups:[group], type:'project', stage:'demo', tags:['ESP32'], authors:'Synthetic Student', cover:photo, demo:'', repo:'', ownerUid, status, createdAt:serverTimestamp(), updatedAt:serverTimestamp() });
const news = (email='nkhmielan@gmail.com', group='mir-1') => ({kind:'news', title:'Synthetic News', text:'Test only', date:Timestamp.fromMillis(123456), place:'', link:'', groups:group?[group]:[], author:email, createdAt:serverTimestamp(), updatedAt:serverTimestamp()});
const account = (uid, email = `${uid}@example.invalid`, verified = true, provider='password', extra={}) => env.authenticatedContext(uid, {email, email_verified:verified, firebase:{sign_in_provider:provider}, ...extra}).firestore();
const student = () => account('student1');
const mod1 = (verified=true) => account('moderator1', 'nkhmielan@gmail.com', verified);
const mod2 = () => account('moderator2', 'sigmaman1501@gmail.com');
const admin = () => account('admin', 'avazbek.madrakhimovw@gmail.com');
const guest = () => env.unauthenticatedContext().firestore();
const protectedWrite = p => baseline ? assertSucceeds(p) : assertFails(p);
before(async()=>{
  setLogLevel('silent');
  const [host,port]=endpoint.split(':');
  env=await initializeTestEnvironment({projectId,firestore:{host,port:Number(port),rules:await readFile(process.env.BASELINE_RULES || new URL('../firestore.rules',import.meta.url),'utf8')}});
});
beforeEach(async()=>{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await Promise.all([
      setDoc(doc(db,'profiles/student1'),profile('mir-1','approved')),
      setDoc(doc(db,'profiles/student2'),profile('mir-2','approved')),
      setDoc(doc(db,'profiles/pending1'),profile()),
      setDoc(doc(db,'profiles/other1'),profile('mir-1','approved')),
      setDoc(doc(db,'projects/published'),project('student1','mir-1','approved')),
      setDoc(doc(db,'projects/pending'),project()),
      setDoc(doc(db,'projects/otherGroup'),project('student2','mir-2')),
      setDoc(doc(db,'projectPhotos/published'),{photos:[photo]}),
      setDoc(doc(db,'news/group1'),news()),
      setDoc(doc(db,'news/group2'),news('sigmaman1501@gmail.com','mir-2')),
      setDoc(doc(db,'news/global'),news('avazbek.madrakhimovw@gmail.com',null)),
    ]);
  });
});
after(async()=>{await env?.cleanup();});

test('guest cannot extract approved profiles or contacts (baseline: exposed)',async()=>{await protectedWrite(getDoc(doc(guest(),'profiles/student1')));});
test('guest cannot query all approved profiles (baseline: exposed)',async()=>{await protectedWrite(getDocs(query(collection(guest(),'profiles'),where('status','==','approved'))));});
test('another student cannot extract contacts, even in the same group (baseline: exposed)',async()=>{await protectedWrite(getDoc(doc(account('other1'),'profiles/student1')));});
test('published photos cannot be replaced without review (baseline: bypass)',async()=>{await protectedWrite(setDoc(doc(student(),'projectPhotos/published'),{photos:[]}));});
test('published photos cannot be removed without review (baseline: bypass)',async()=>{await protectedWrite(deleteDoc(doc(student(),'projectPhotos/published')));});
test('group moderator cannot delete another group news (baseline: bypass)',async()=>{await protectedWrite(deleteDoc(doc(mod1(),'news/group2')));});
test('group moderator cannot rewrite another group news (baseline: bypass)',async()=>{await protectedWrite(updateDoc(doc(mod1(),'news/group2'),{title:'Changed by another group',updatedAt:serverTimestamp()}));});
test('group moderator cannot delete global news (baseline: bypass)',async()=>{await protectedWrite(deleteDoc(doc(mod1(),'news/global')));});
test('moderator cannot impersonate another news author (baseline: bypass)',async()=>{await protectedWrite(setDoc(doc(mod1(),'news/spoofed'),news('someone-else@example.invalid')));});
test('anonymous account cannot create student profiles (baseline: allowed)',async()=>{await protectedWrite(setDoc(doc(account('anon','anon@example.invalid',false,'anonymous'),'profiles/anon'),profile()));});
test('non-string tags cannot poison public project pages (baseline: allowed)',async()=>{await protectedWrite(setDoc(doc(student(),'projects/badTags'),{...project(),tags:[{malicious:'object'}]}));});
test('non-string skills cannot poison student pages (baseline: allowed)',async()=>{await protectedWrite(setDoc(doc(account('newStudent'),'profiles/newStudent'),{...profile(),skills:[{}]}));});
test('anonymous accounts cannot write likes (baseline: allowed)',async()=>{const db=account('anon','anon@example.invalid',false,'anonymous');await protectedWrite(setDoc(doc(db,'likes/starys_anon'),{project:'starys',device:'anon',at:serverTimestamp()}));});

if(!baseline){
test('owner can read their own private profile',async()=>{await assertSucceeds(getDoc(doc(student(),'profiles/student1')));});
test('moderator can read and list their group profiles',async()=>{const db=mod1();await assertSucceeds(getDoc(doc(db,'profiles/student1')));await assertSucceeds(getDocs(query(collection(db,'profiles'),where('group','==','mir-1'),where('status','==','approved'))));});
test('moderator cannot read or query another group profiles',async()=>{const db=mod1();await assertFails(getDoc(doc(db,'profiles/student2')));await assertFails(getDocs(query(collection(db,'profiles'),where('status','==','approved'))));});
test('administrator can read profiles across groups',async()=>{await assertSucceeds(getDocs(collection(admin(),'profiles')));});
test('unverified moderator email does not grant privileges',async()=>{await assertFails(getDoc(doc(mod1(false),'profiles/student1')));});
test('a forged role field does not grant privileges',async()=>{const db=account('attacker','attacker@example.invalid',true,'password',{role:'admin',admin:true});await assertFails(getDoc(doc(db,'profiles/student1')));});
test('unverified email account may create its initial pending profile',async()=>{await assertSucceeds(setDoc(doc(account('newStudent','newStudent@example.invalid',false),'profiles/newStudent'),profile()));});
test('owner cannot approve own profile or add a role',async()=>{const db=account('pending1');await assertFails(updateDoc(doc(db,'profiles/pending1'),{status:'approved',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(db,'profiles/pending1'),{role:'admin',updatedAt:serverTimestamp()}));});
test('profile cannot be overwritten by another student',async()=>{await assertFails(updateDoc(doc(account('student2'),'profiles/student1'),{bio:'tampered',status:'pending',updatedAt:serverTimestamp()}));});
test('profile changes go back to review',async()=>{const ref=doc(student(),'profiles/student1');await assertSucceeds(updateDoc(ref,{bio:'Updated',status:'pending',updatedAt:serverTimestamp()}));});
test('moderator can approve own group but cannot modify profile content',async()=>{const ref=doc(mod1(),'profiles/pending1');await assertFails(updateDoc(ref,{bio:'tampered',status:'approved',updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(ref,{status:'approved',updatedAt:serverTimestamp()}));});
test('moderator cannot approve another group projects',async()=>{await assertFails(updateDoc(doc(mod1(),'projects/otherGroup'),{status:'approved',updatedAt:serverTimestamp()}));});
test('owner cannot self-publish a project or change its owner',async()=>{const ref=doc(student(),'projects/pending');await assertFails(updateDoc(ref,{status:'approved',updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref,{ownerUid:'student2',updatedAt:serverTimestamp()}));});
test('pending projects and photos are private',async()=>{await assertFails(getDoc(doc(guest(),'projects/pending')));await assertFails(getDoc(doc(account('student2'),'projects/pending')));await assertSucceeds(getDoc(doc(student(),'projects/pending')));});
test('public projects and their published photos remain readable',async()=>{await assertSucceeds(getDoc(doc(guest(),'projects/published')));await assertSucceeds(getDoc(doc(guest(),'projectPhotos/published')));});
test('approved student can create pending project and photos atomically',async()=>{const db=student(),b=writeBatch(db);b.set(doc(db,'projects/newProject'),project());b.set(doc(db,'projectPhotos/newProject'),{photos:[photo]});await assertSucceeds(b.commit());});
test('unapproved account cannot create project spam',async()=>{await assertFails(setDoc(doc(account('pending1'),'projects/spam'),project('pending1')));});
test('administrator without student profile can submit a pending project',async()=>{await assertSucceeds(setDoc(doc(admin(),'projects/adminDraft'),project('admin')));});
test('photo edit succeeds together with resubmission for review',async()=>{const db=student(),b=writeBatch(db);b.update(doc(db,'projects/published'),{status:'pending',updatedAt:serverTimestamp()});b.set(doc(db,'projectPhotos/published'),{photos:[]});await assertSucceeds(b.commit());await assertFails(getDoc(doc(guest(),'projectPhotos/published')));});
test('photo document cannot be created without its parent project',async()=>{await assertFails(setDoc(doc(student(),'projectPhotos/orphan'),{photos:[photo]}));});
test('owner can delete a project and photos in one batch',async()=>{const db=student(),b=writeBatch(db);b.delete(doc(db,'projectPhotos/published'));b.delete(doc(db,'projects/published'));await assertSucceeds(b.commit());});
test('invalid group ids, duplicates and script URLs are rejected',async()=>{const db=student();for(const patch of [{groups:['mir-1','invalid']},{groups:['mir-1','mir-1']},{demo:'javascript:alert(1)'},{repo:'data:text/html,test'},{tags:['x'.repeat(41)]}])await assertFails(setDoc(doc(db,'projects/invalid'),{...project(),...patch}));});
test('moderation requires a current server timestamp',async()=>{await assertFails(updateDoc(doc(mod1(),'projects/pending'),{status:'approved',updatedAt:Timestamp.fromMillis(1)}));});
test('moderator can publish, edit and delete news for their group',async()=>{const ref=doc(mod1(),'news/new');await assertSucceeds(setDoc(ref,news()));await assertSucceeds(updateDoc(ref,{title:'Updated news',updatedAt:serverTimestamp()}));await assertSucceeds(deleteDoc(ref));});
test('news scope cannot be escalated after creation',async()=>{await assertFails(updateDoc(doc(mod1(),'news/group1'),{groups:[],updatedAt:serverTimestamp()}));});
test('news author and creation timestamp cannot be forged on update',async()=>{const ref=doc(mod1(),'news/group1');await assertFails(updateDoc(ref,{author:'spoof@example.invalid',updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref,{createdAt:Timestamp.fromMillis(1),updatedAt:serverTimestamp()}));});
test('administrator can manage news from all groups',async()=>{await assertSucceeds(deleteDoc(doc(admin(),'news/group2')));});
test('ordinary student cannot publish or delete news',async()=>{await assertFails(setDoc(doc(student(),'news/forged'),news()));await assertFails(deleteDoc(doc(student(),'news/group1')));});
test('like counters cannot be changed without a fresh student vote',async()=>{await assertFails(setDoc(doc(student(),'likeCounts/starys'),{n:100,v:100,last:'student1'}));});
test('approved student vote increments counters atomically exactly once',async()=>{const db=student(),b=writeBatch(db);b.set(doc(db,'likes/starys_student1'),{project:'starys',device:'student1',at:serverTimestamp()});b.set(doc(db,'likeCounts/starys'),{n:1,v:1,last:'student1'});await assertSucceeds(b.commit());await assertFails(updateDoc(doc(db,'likeCounts/starys'),{n:2,v:2,last:'student1'}));await assertFails(updateDoc(doc(db,'likes/starys_student1'),{at:serverTimestamp()}));});
test('unknown collections remain denied',async()=>{await assertFails(setDoc(doc(admin(),'secrets/test'),{value:'test'}));await assertFails(getDocs(collection(guest(),'secrets')));});
test('text escaping and link validation reject injection payloads',()=>{
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  for(const payload of ['javascript:alert(1)','JaVaScRiPt:alert(1)','data:text/html,<script>alert(1)</script>','blob:https://example.org/x','https://safe.example\n.evil.example','https://user:secret@example.org'])assert.equal(safeUrl(payload),'');
  assert.equal(safeUrl('https://example.org/project'),'https://example.org/project');
  assert.equal(contactUrl('site','javascript:alert(1)'),'');
  assert.equal(contactUrl('github','@student'),'https://github.com/student');
});
test('CSP blocks inline script, arbitrary remote script and plugins',async()=>{const html=await readFile(new URL('../index.html',import.meta.url),'utf8');const policy=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];const scripts=policy.match(/script-src ([^;]+)/)[1];assert.ok(!scripts.includes('unsafe-inline'));assert.ok(!scripts.includes('unsafe-eval'));assert.ok(!scripts.includes('*'));assert.match(policy,/object-src 'none'/);assert.match(policy,/base-uri 'none'/);assert.match(html,/name="referrer" content="no-referrer"/);});
}

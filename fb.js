// Firebase access for the site: auth, profiles, submitted projects, likes, news and moderation.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, reload, signInAnonymously,
  applyActionCode, verifyPasswordResetCode, confirmPasswordReset,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, runTransaction, Timestamp, writeBatch, deleteField,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig, MODERATORS } from "./config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
export { Timestamp };

/* ---------- auth ---------- */
export const onUser = (cb) => onAuthStateChanged(auth, cb);
export const signIn = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
// Email links (verify, reset) land on the site itself once the Firebase console's custom action URL
// points at https://avazzzbek07.github.io/mir-air-museum/ — app.js handles ?mode=…&oobCode=… there.
export async function signUp(email, pass) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  try { await sendEmailVerification(cred.user); } catch (e) {}
  return cred.user;
}
export const resendVerification = () => sendEmailVerification(auth.currentUser);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export const applyCode = (code) => applyActionCode(auth, code);
export const emailForReset = (code) => verifyPasswordResetCode(auth, code);
export const confirmReset = (code, pass) => confirmPasswordReset(auth, code, pass);
export const logout = () => signOut(auth);
export async function refreshUser() { if (auth.currentUser) { await reload(auth.currentUser); await auth.currentUser.getIdToken(true); } return auth.currentUser; }
export function modScope(user) {
  if (!user || user.isAnonymous || !user.emailVerified) return "";
  return MODERATORS[(user.email || "").toLowerCase()] || "";
}

/* ---------- public data ---------- */
const rows = (snap) => snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
export async function loadPublic() {
  const [projects, profiles, news, counts] = await withTimeout(Promise.all([
    getDocs(query(collection(db, "projects"), where("status", "==", "approved"))).then(rows),
    getDocs(query(collection(db, "profiles"), where("status", "==", "approved"))).then(rows),
    getDocs(collection(db, "news")).then(rows),
    getDocs(collection(db, "likeCounts")).then((s) => Object.fromEntries(s.docs.map((d) => [d.id, d.data().n || 0]))),
  ]), 8000);
  return { projects, profiles, news, counts };
}

/* ---------- profiles ---------- */
export async function getProfile(uid) { const s = await getDoc(doc(db, "profiles", uid)); return s.exists() ? { _id: s.id, ...s.data() } : null; }
// A new profile is created at sign-up, before the email is confirmed; later edits need a confirmed email.
export async function saveProfile(uid, data, isNew) {
  const body = { ...data, status: "pending", updatedAt: serverTimestamp() };
  if (isNew) body.createdAt = serverTimestamp();
  if (isNew) await setDoc(doc(db, "profiles", uid), body);
  else { await needVerified(); await updateDoc(doc(db, "profiles", uid), body); }
}

/* ---------- projects ----------
   projects/{id} holds the text and a small cover; full-size photos live in projectPhotos/{id}
   and load only when the project page opens, so the project list stays light.
   Older projects kept full photos in projects/{id}.photos; saving one moves them out. */
export async function myProjects(uid) { return rows(await getDocs(query(collection(db, "projects"), where("ownerUid", "==", uid)))); }
export async function getProject(id) {
  const s = await getDoc(doc(db, "projects", id)); if (!s.exists()) return null;
  const p = { _id: s.id, ...s.data() };
  p.legacyPhotos = !!p.photos?.length;
  if (!p.legacyPhotos) p.photos = await getPhotos(id);
  return p;
}
export async function getPhotos(id) {
  try { const s = await getDoc(doc(db, "projectPhotos", id)); return s.exists() ? s.data().photos || [] : []; } catch (e) { return []; }
}
// photos === null keeps the stored photos; an array replaces them and `cover` must match photos[0].
export async function saveProject(id, data, uid, photos) {
  await needVerified();
  const ref = id ? doc(db, "projects", id) : doc(collection(db, "projects"));
  const body = { ...data, ownerUid: uid, status: "pending", updatedAt: serverTimestamp() };
  const b = writeBatch(db);
  if (id) b.update(ref, { ...body, photos: deleteField() });
  else b.set(ref, { ...body, createdAt: serverTimestamp() });
  if (photos) b.set(doc(db, "projectPhotos", ref.id), { photos });
  await b.commit();
  return ref.id;
}
export async function deleteProject(id) {
  const b = writeBatch(db);
  b.delete(doc(db, "projectPhotos", id)); b.delete(doc(db, "projects", id));
  await b.commit();
}

/* ---------- moderation ---------- */
// Rules read email_verified from the ID token, which can predate the verification; refresh it first.
async function freshToken() {
  const u = auth.currentUser; if (!u) return;
  const r = await u.getIdTokenResult();
  if (!r.claims.email_verified) { await reload(u); await u.getIdToken(true); }
}
async function needVerified() {
  await freshToken();
  if (!auth.currentUser?.emailVerified) { const e = new Error("need-verify"); e.code = "need-verify"; throw e; }
}
export async function modQueue(scope) {
  await freshToken();
  const pend = (coll) => {
    const c = [where("status", "==", "pending")];
    if (scope !== "all") c.push(where("group", "==", scope));
    return getDocs(query(collection(db, coll), ...c)).then(rows);
  };
  const [profiles, projects] = await Promise.all([pend("profiles"), pend("projects")]);
  return { profiles, projects };
}
export async function setStatus(coll, id, status) { await freshToken(); return updateDoc(doc(db, coll, id), { status, updatedAt: serverTimestamp() }); }

/* ---------- likes: one per account per project, counter raised in the same transaction ----------
   Visitors without an account get an anonymous Firebase account on their first like, so every like
   is tied to a uid the rules can check instead of a code the browser makes up. */
export async function like(project) {
  if (!auth.currentUser) await signInAnonymously(auth);
  const device = auth.currentUser.uid;
  const likeRef = doc(db, "likes", `${project}_${device}`), cRef = doc(db, "likeCounts", project);
  return runTransaction(db, async (tx) => {
    const [l, c] = await Promise.all([tx.get(likeRef), tx.get(cRef)]);
    if (l.exists()) return c.exists() ? c.data().n : 1;
    const n = (c.exists() ? c.data().n : 0) + 1;
    tx.set(likeRef, { project, device, at: serverTimestamp() });
    tx.set(cRef, { n, last: device });
    return n;
  });
}

/* ---------- news ---------- */
export const addNews = async (data, email) => (await freshToken(), addDoc(collection(db, "news"), { ...data, author: email, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
export const deleteNews = (id) => deleteDoc(doc(db, "news", id));

/* ---------- images: resize in the browser and store as a compressed data URL ---------- */
export async function compressImage(file, maxSide, maxBytes) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    let side = maxSide;
    for (let attempt = 0; attempt < 6; attempt++) {
      const k = Math.min(1, side / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      for (const q of [0.82, 0.7, 0.58]) {
        const data = c.toDataURL("image/jpeg", q);
        if (data.length <= maxBytes) return data;
      }
      side = Math.round(side * 0.75);
    }
    throw new Error("photo-too-large");
  } finally { URL.revokeObjectURL(url); }
}

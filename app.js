import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { t, getLang, setLang } from "./i18n.js";

/* Firebase is optional at runtime: if it can't load, the site still works read-only from data.js. */
let FB = null;
try { FB = await import("./fb.js"); } catch (e) { console.warn("Firebase unavailable", e); }

/* ============================================================
   Data: static records from data.js + approved records from Firestore
   ============================================================ */
const STATIC = ITEMS.filter((p) => SITE.showExamples || !p.example).map((p, i) => ({ ...p, created: -i }));
const ACH = ACHIEVEMENTS.filter((a) => SITE.showExamples || !a.example);
const GROUP = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
const BOT_URL = SITE.bot ? `https://t.me/${SITE.bot}` : "";
const FEATURED = ["starys", "cyberbuddy", "esp32-mini-radar", "glove-mouse", "smartsprout", "pixie", "esp32-rc-car", "kamkor", "sunflower"];
const MODEL = { kamkor: "kamkor", sunflower: "sunflower" };

const S = { dyn: [], profiles: [], news: [], counts: {}, loaded: false, offline: !FB, user: null, me: null, scope: "" };
let LIKED = new Set();
try { LIKED = new Set(JSON.parse(localStorage.getItem("mirair-liked") || "[]")); } catch (e) {}

const ms = (ts) => (ts && ts.toMillis ? ts.toMillis() : 0);
function normalize(d) {
  return {
    id: "u-" + d._id, _id: d._id, dyn: true, title: d.title, desc: d.desc, group: d.group, groups: d.groups,
    type: d.type, status: d.stage, author: d.authors, tags: d.tags || [], photos: d.photos || [],
    demo: d.demo || "", repo: d.repo || "", ownerUid: d.ownerUid, created: ms(d.createdAt),
    story: { problem: d.problem, solution: d.solution, result: d.result },
  };
}
const ALL = () => [...S.dyn, ...STATIC];
const byId = (id) => ALL().find((p) => p.id === id);
const groupsOf = (p) => p.groups || (p.group ? [p.group] : []);
const gname = (id) => GROUP[id]?.name || id;
const profileByName = (name) => S.profiles.find((p) => p.name === name);
const memberByName = (name) => TEAM.find((m) => m.name === name);

const loadPromise = (async () => {
  if (!FB) return;
  try {
    const d = await FB.loadPublic();
    S.dyn = d.projects.map(normalize).sort((a, b) => b.created - a.created);
    S.profiles = d.profiles.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    S.news = d.news; S.counts = d.counts;
  } catch (e) { console.warn(e); S.offline = true; }
  S.loaded = true;
  if (!museumOn) route(true);
})();

/* ============================================================
   Helpers
   ============================================================ */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
const plural = (n, a, b, c) => { if (getLang() !== "ru") return a; const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
const initials = (name) => (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const fmtDate = (msv, opts = { day: "numeric", month: "long", year: "numeric" }) => new Date(msv).toLocaleDateString(getLang() === "ky" ? "ky-KG" : getLang() === "en" ? "en-GB" : "ru-RU", opts);
function toast(msg) { const el = $("toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 3200); }
function errText(e) {
  const c = e?.code || e?.message || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)) return t("err.auth");
  if (/email-already-in-use/.test(c)) return t("err.exists");
  if (/weak-password/.test(c)) return t("err.weak");
  if (/photo-too-large/.test(c)) return t("err.photo");
  return t("err.generic") + (e?.code ? ` (${e.code})` : "");
}
const heart = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>`;
const likeBtn = (id) => `<button type="button" class="likebtn" data-like="${esc(id)}" aria-pressed="${LIKED.has(id)}" title="${esc(LIKED.has(id) ? t("liked") : t("like"))}">${heart}<span>${S.counts[id] || 0}</span></button>`;

/* ============================================================
   Shared fragments
   ============================================================ */
const statusChip = (s) => `<span class="chip st-${esc(s)}">${esc(t("st." + s))}</span>`;
const modChip = (s) => `<span class="chip st-${esc(s)}">${esc(t(s))}</span>`;
const groupChips = (p) => { const gs = groupsOf(p); return gs.map((g) => `<span class="gchip">${esc(gname(g))}</span>`).join("") + (gs.length > 1 ? `<span class="gchip">${esc(t("mixed"))}</span>` : ""); };
const cover = (p) => p.photos?.length ? `<img src="${esc(p.photos[0])}" alt="${esc(p.title)}" loading="lazy">` : `<div class="blueprint" aria-hidden="true">${esc(p.title.split(":")[0])}</div>`;
const card = (p) => `<a class="pcard" href="#p-${esc(p.id)}">
  <div class="pimg">${cover(p)}</div>
  <div class="pbody"><div class="pmeta">${statusChip(p.status)}${groupChips(p)}</div>
    <h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>
    <div class="tags">${(p.tags || []).slice(0, 5).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
    <div class="pfoot"><span>${esc(p.author)}</span>${likeBtn(p.id)}</div></div></a>`;
const avatar = (p, big) => p.photo ? `<img class="ava${big ? " big" : ""}" src="${esc(p.photo)}" alt="${esc(p.name)}">` : `<div class="ava${big ? " big" : ""}" aria-hidden="true">${esc(initials(p.name))}</div>`;
const scard = (p) => `<a class="scard" href="#s-${esc(p._id)}">${avatar(p)}<div>
  <h3>${esc(p.name)}</h3><div class="row"><span class="gchip">${esc(gname(p.group))}</span>${p.internship ? `<span class="badge">${esc(t("intern"))}</span>` : ""}</div>
  ${p.bio ? `<p>${esc(p.bio.slice(0, 140))}${p.bio.length > 140 ? "…" : ""}</p>` : ""}
  <div class="tags" style="margin-top:8px">${(p.skills || []).slice(0, 6).map((x) => `<span>${esc(x)}</span>`).join("")}</div></div></a>`;
const footer = () => `<footer class="foot"><div>© 2026 МИР×АИР · AIIiR Museum of Ideas · ${esc(t("foot"))}</div>
  <nav><a href="#top">${esc(t("nav.museum"))}</a><a href="#projects">${esc(t("nav.projects"))}</a><a href="#students">${esc(t("nav.students"))}</a><a href="#news">${esc(t("nav.news"))}</a><a href="#ideas">${esc(t("nav.ideas"))}</a><a href="#support">${esc(t("nav.support"))}</a></nav></footer>`;
const steps4 = () => `<ol class="steps">${[1, 2, 3, 4].map((i) => `<li><b>${esc(t("s" + i))}</b><span>${esc(t("s" + i + "t"))}</span></li>`).join("")}</ol>`;
const head = (eb, h, p) => `<div class="head"><div class="eyebrow">${eb}</div><h1>${esc(h)}</h1>${p ? `<p>${esc(p)}</p>` : ""}</div>`;
const offlineNote = () => (S.offline ? `<div class="banner info"><span>${esc(t("err.offline"))}</span></div>` : "");
const seg = (k, state, opts) => opts.map(([v, l]) => `<button type="button" data-v="${esc(v)}" aria-pressed="${state[k] === v}">${esc(l)}</button>`).join("");

/* ============================================================
   Pages
   ============================================================ */
const filt = { q: "", g: "all", t: "all", s: "all", o: "new" };
const sfilt = { q: "", g: "all", skill: "", intern: false };

const PAGES = {
  about() {
    const built = ALL().filter((p) => p.type !== "idea").length;
    return `${head(esc(t("about.eyebrow")), t("about.title"), t("about.lead"))}
    <div class="stats">
      <div class="stat"><b>${SITE.total}</b><span>${esc(t("stat.students"))}</span></div>
      <div class="stat"><b>${GROUPS.length}</b><span>${esc(t("stat.groups"))}</span></div>
      <div class="stat"><b>${built}</b><span>${esc(t("stat.projects"))}</span></div>
      <div class="stat"><b>${ACH.length}</b><span>${esc(t("stat.win"))}</span></div>
    </div>
    <section class="block"><h2 class="sec">${esc(t("who"))}</h2><p class="lede">${esc(t("who.lead"))}</p>
      <div class="grid">${[1, 2, 3, 4].map((i) => `<div class="tile"><h3>${esc(t("d" + i))}</h3><p>${esc(t("d" + i + "t"))}</p></div>`).join("")}</div></section>
    <section class="block"><h2 class="sec">${esc(t("for.whom"))}</h2>
      <div class="grid">${[1, 2, 3, 4].map((i) => `<div class="tile"><h3>${esc(t("fw" + i))}</h3><p>${esc(t("fw" + i + "t"))}</p></div>`).join("")}</div></section>
    <section class="block"><h2 class="sec">${esc(t("steps.title"))}</h2>${steps4()}</section>
    <section class="block"><h2 class="sec">${esc(t("nav.groups"))}</h2>${groupCards()}</section>`;
  },

  projects() {
    const ranked = ALL().filter((p) => S.counts[p.id] > 0).sort((a, b) => S.counts[b.id] - S.counts[a.id]).slice(0, 6);
    return `${head(`${esc(t("projects.eyebrow"))} · ${ALL().length}`, t("projects.title"), t("projects.lead"))}
    <div class="row"><a class="btn solid" href="#submit">+ ${esc(t("add.project"))}</a></div>
    ${ranked.length ? `<section class="block"><h2 class="sec">${esc(t("top.title"))}</h2><p class="lede">${esc(t("top.lead"))}</p>
      <div class="rank">${ranked.map((p) => `<a href="#p-${esc(p.id)}">${p.photos?.[0] ? `<img src="${esc(p.photos[0])}" alt="" loading="lazy">` : `<div class="ph"></div>`}<b>${esc(p.title)}</b><span>♥ ${S.counts[p.id]}</span></a>`).join("")}</div></section>` : ""}
    <section class="block">
      <div class="filters">
        <div class="field grow"><label for="q">${esc(t("search"))}</label><input id="q" type="search" placeholder="${esc(t("search.ph"))}" value="${esc(filt.q)}"></div>
        <div class="field"><span class="lbl">${esc(t("f.group"))}</span><div class="seg" data-f="g">${seg("g", filt, [["all", t("all")], ...GROUPS.map((g) => [g.id, g.name])])}</div></div>
        <div class="field"><span class="lbl">${esc(t("f.type"))}</span><div class="seg" data-f="t">${seg("t", filt, [["all", t("all")], ["project", t("ty.project")], ["demo", t("ty.demo")], ["site", t("ty.site")], ["idea", t("ty.idea")]])}</div></div>
        <div class="field"><span class="lbl">${esc(t("f.status"))}</span><div class="seg" data-f="s">${seg("s", filt, [["all", t("all")], ["work", t("st.work")], ["demo", t("st.demo")], ["best", t("st.best")], ["idea", t("st.idea")]])}</div></div>
        <div class="field"><span class="lbl">${esc(t("f.sort"))}</span><div class="seg" data-f="o">${seg("o", filt, [["new", t("sort.new")], ["likes", t("sort.likes")]])}</div></div>
      </div>
      <div class="count" id="pcount"></div><div class="grid" id="plist"></div>
    </section>`;
  },

  students() {
    const skills = [...new Set(S.profiles.flatMap((p) => p.skills || []))].sort((a, b) => a.localeCompare(b));
    return `${head(esc(t("students.eyebrow")), t("students.title"), t("students.lead"))}${offlineNote()}
    <div class="row"><span class="count">${S.profiles.length} / ${SITE.total} ${esc(t("students.filled"))}</span><a class="btn gold" href="#me">${esc(t("make.profile"))}</a></div>
    <section class="block"><div class="filters">
      <div class="field grow"><label for="sq">${esc(t("search"))}</label><input id="sq" type="search" value="${esc(sfilt.q)}" placeholder="Arduino, Python…"></div>
      <div class="field"><span class="lbl">${esc(t("f.group"))}</span><div class="seg" data-sf="g">${seg("g", sfilt, [["all", t("all")], ...GROUPS.map((g) => [g.id, g.name])])}</div></div>
      <div class="field"><label for="sskill">${esc(t("skill"))}</label><select id="sskill"><option value="">${esc(t("all"))}</option>${skills.map((s) => `<option${s === sfilt.skill ? " selected" : ""}>${esc(s)}</option>`).join("")}</select></div>
      <label class="check"><input type="checkbox" id="sintern"${sfilt.intern ? " checked" : ""}> ${esc(t("intern.only"))}</label>
    </div><div class="grid two" id="slist"></div></section>`;
  },

  groups() { return `${head(`${esc(t("groups.eyebrow"))} · ${SITE.total}`, t("groups.title"), t("groups.lead"))}${groupCards()}`; },

  news() {
    const now = Date.now() - 86400000;
    const items = S.news.map((n) => ({ ...n, when: ms(n.date) }));
    const upcoming = items.filter((n) => n.kind === "event" && n.when >= now).sort((a, b) => a.when - b.when);
    const feed = items.filter((n) => !(n.kind === "event" && n.when >= now)).sort((a, b) => b.when - a.when);
    return `${head(esc(t("news.eyebrow")), t("news.title"))}${offlineNote()}
    <section class="block"><h2 class="sec">${esc(t("events.up"))}</h2>
      ${upcoming.length ? `<div class="events">${upcoming.map((n) => `<div class="event"><span class="d">${fmtDate(n.when, { day: "numeric" })}</span><span class="m">${esc(fmtDate(n.when, { month: "long", year: "numeric" }))}</span>
        <h3>${esc(n.title)}</h3>${n.place ? `<p>${esc(n.place)}</p>` : ""}${n.text ? `<p>${esc(n.text)}</p>` : ""}${safeUrl(n.link) ? `<a href="${esc(safeUrl(n.link))}" target="_blank" rel="noopener">${esc(t("n.link"))} →</a>` : ""}</div>`).join("")}</div>`
        : `<div class="empty">${esc(t("events.none"))}</div>`}</section>
    <section class="block"><h2 class="sec">${esc(t("news.feed"))}</h2><div class="feed">
      ${feed.map((n) => `<div class="item"><div class="when">${esc(fmtDate(n.when))}</div><div><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p>
        ${n.photo ? `<img src="${esc(n.photo)}" alt="" loading="lazy">` : ""}${safeUrl(n.link) ? `<p><a href="${esc(safeUrl(n.link))}" target="_blank" rel="noopener">${esc(t("n.link"))} →</a></p>` : ""}</div>
        ${S.scope ? `<button type="button" class="btn danger" data-delnews="${esc(n._id)}">${esc(t("delete"))}</button>` : "<span></span>"}</div>`).join("")}
      <div class="item"><div class="when">${esc(t("final.eyebrow").split("·")[1] || "")}</div><div class="news">
        <img src="img/news-kabar.jpg" alt="Кыргызские студенты стали лучшими медиаспециалистами на Космических играх" loading="lazy">
        <div class="facts"><h3>Кыргызские студенты стали лучшими медиаспециалистами на Космических играх</h3>
          <p>Международные космические игры прошли в Москве на площадке МГТУ им. Н. Э. Баумана. О нашем успехе написало Кыргызское национальное информационное агентство «Кабар».</p>
          <div class="row"><a class="btn" href="https://kabar.kg" target="_blank" rel="noopener">${esc(t("news.source"))}: kabar.kg</a></div></div></div><span></span></div>
    </div></section>
    <section class="block"><h2 class="sec">${esc(t("gallery"))}</h2>${gallery()}</section>
    <section class="block"><h2 class="sec">${esc(t("video"))}</h2><p class="lede">${esc(t("video.lead"))}</p>
      <video controls preload="metadata" playsinline src="media/projects.mp4"></video></section>`;
  },

  ideas() {
    return `${head(esc(t("ideas.eyebrow")), t("ideas.title"), t("ideas.lead"))}
    ${BOT_URL ? `<section class="block"><div class="botbox"><img class="qr" src="img/bot-qr.png" alt="QR @${esc(SITE.bot)}">
      <div class="facts"><h2 class="sec">@${esc(SITE.bot)}</h2><p class="lede">${esc(t("bot.lead"))}</p>
        <div class="row"><a class="btn solid" href="${esc(BOT_URL)}" target="_blank" rel="noopener">${esc(t("bot.open"))}</a><a class="btn" href="#submit">+ ${esc(t("add.project"))}</a></div></div></div></section>` : ""}
    <section class="block"><h2 class="sec">${esc(t("idea.prep"))}</h2><p class="lede">${esc(t("idea.prep.lead"))}</p>
      <form class="form" id="ideaForm">
        <div class="field full"><label for="idea-title">${esc(t("idea.title"))}</label><input id="idea-title" required maxlength="120"></div>
        <div class="field full"><label for="idea-text">${esc(t("idea.text"))}</label><textarea id="idea-text" required maxlength="1500"></textarea></div>
        <div class="field"><label for="idea-author">${esc(t("idea.author"))}</label><input id="idea-author" maxlength="80"></div>
        <div class="field"><label for="idea-group">${esc(t("f.group"))}</label><select id="idea-group"><option value="">—</option>${GROUPS.map((g) => `<option>${esc(g.full)}</option>`).join("")}</select></div>
        <div class="field full"><label for="idea-out">${esc(t("idea.msg"))}</label><textarea id="idea-out" readonly></textarea></div>
        <div class="full"><button class="btn solid" type="submit">${esc(t("idea.send"))}</button></div>
      </form></section>
    <section class="block"><h2 class="sec">${esc(t("steps.title"))}</h2>${steps4()}</section>
    <section class="block"><h2 class="sec">${esc(t("st.idea"))}</h2><div class="grid">${ALL().filter((p) => p.status === "idea").map(card).join("")}</div></section>`;
  },

  support() {
    return `${head(esc(t("support.eyebrow")), t("support.title"), t("support.lead"))}
    <div class="grid two">${[1, 2, 3, 4].map((i) => `<div class="tile"><h3>${esc(t("sup" + i))}</h3><p>${esc(t("sup" + i + "t"))}</p>${SITE.sums?.[i - 1] ? `<div class="chip st-best">${esc(SITE.sums[i - 1])}</div>` : ""}</div>`).join("")}</div>
    <section class="block"><h2 class="sec">${esc(t("coop"))}</h2><p class="lede">${esc(t("coop.lead"))}</p>
      <div class="row">${SITE.telegram ? `<a class="btn solid" href="${esc(SITE.telegram)}" target="_blank" rel="noopener">Telegram</a>` : ""}${BOT_URL ? `<a class="btn gold" href="${esc(BOT_URL)}" target="_blank" rel="noopener">@${esc(SITE.bot)}</a>` : ""}</div></section>`;
  },

  me() {
    if (!FB) return `${head(esc(t("nav.me")), t("auth.title"))}<div class="banner info">${esc(t("err.offline"))}</div>`;
    if (!S.user) {
      return `${head(esc(t("nav.me")), t("auth.title"), t("auth.lead"))}
      <div class="authbox">
        <div class="tabs" role="tablist"><button type="button" role="tab" data-tab="login" aria-selected="${authTab === "login"}">${esc(t("login"))}</button><button type="button" role="tab" data-tab="register" aria-selected="${authTab === "register"}">${esc(t("register"))}</button></div>
        ${authTab === "login" ? `<form class="form" id="loginForm">
          <div class="field full"><label for="li-email">${esc(t("email"))}</label><input id="li-email" type="email" required autocomplete="email"></div>
          <div class="field full"><label for="li-pass">${esc(t("password"))}</label><input id="li-pass" type="password" required autocomplete="current-password"></div>
          <div class="full row"><button class="btn solid" type="submit">${esc(t("login"))}</button><button class="btn" type="button" id="forgot">${esc(t("forgot"))}</button></div></form>`
        : `<form class="form" id="regForm">
          <div class="field full"><label for="rg-group">${esc(t("f.group"))}</label><select id="rg-group" required>${GROUPS.map((g) => `<option value="${esc(g.id)}">${esc(g.full)}</option>`).join("")}</select></div>
          <div class="field full"><label for="rg-name">${esc(t("you.are"))}</label><select id="rg-name" required></select></div>
          <div class="field full"><label for="rg-email">${esc(t("email"))}</label><input id="rg-email" type="email" required autocomplete="email"></div>
          <div class="field full"><label for="rg-pass">${esc(t("password.new"))}</label><input id="rg-pass" type="password" required minlength="6" autocomplete="new-password"></div>
          <div class="full"><button class="btn solid" type="submit">${esc(t("register"))}</button></div></form>`}
      </div>`;
    }
    const p = S.me, st = p?.status;
    return `${head(esc(S.user.email), t("profile.title"))}
    ${!S.user.emailVerified ? `<div class="banner"><span>${esc(t("verify.need"))}</span><span class="row"><button class="btn" type="button" id="resend">${esc(t("verify.resend"))}</button><button class="btn" type="button" id="recheck">↻</button></span></div>` : ""}
    <div class="banner ${st === "approved" ? "ok" : st === "rejected" ? "bad" : "info"}"><span>${esc(t("profile.status." + (st || "none")))}</span>${st === "approved" ? `<a class="btn" href="#s-${esc(S.user.uid)}">→</a>` : ""}</div>
    <section class="block"><form class="form" id="profForm">
      <div class="field full"><span class="lbl">${esc(t("p.photo"))}</span><div class="row">${avatar({ name: p?.name, photo: p?.photo || "" })}<input id="pf-photo" type="file" accept="image/*"><span class="hintx">${esc(t("p.photo.hint"))}</span></div></div>
      <div class="field"><label for="pf-group">${esc(t("f.group"))}</label><select id="pf-group">${GROUPS.map((g) => `<option value="${esc(g.id)}"${g.id === p?.group ? " selected" : ""}>${esc(g.full)}</option>`).join("")}</select></div>
      <div class="field"><label for="pf-name">${esc(t("you.are"))}</label><select id="pf-name" data-current="${esc(p?.name || "")}"></select></div>
      <div class="field full"><label for="pf-bio">${esc(t("p.bio"))}</label><textarea id="pf-bio" maxlength="600" placeholder="${esc(t("p.bio.ph"))}">${esc(p?.bio || "")}</textarea></div>
      <div class="field full"><label for="pf-skills">${esc(t("p.skills"))}</label><input id="pf-skills" maxlength="400" placeholder="${esc(t("p.skills.ph"))}" value="${esc((p?.skills || []).join(", "))}"></div>
      <label class="check full"><input type="checkbox" id="pf-intern"${p?.internship ? " checked" : ""}> ${esc(t("p.intern"))}</label>
      <p class="note full">${esc(t("p.contacts.hint"))}</p>
      ${["telegram", "github", "cemail", "linkedin", "site"].map((k) => `<div class="field"><label for="pf-${k}">${esc(t("p." + k))}</label><input id="pf-${k}" maxlength="120" value="${esc(p?.contacts?.[k === "cemail" ? "email" : k] || "")}"></div>`).join("")}
      <div class="full row"><button class="btn solid" type="submit">${esc(t("save"))}</button><button class="btn" type="button" id="logout">${esc(t("logout"))}</button></div>
    </form></section>
    <section class="block"><h2 class="sec">${esc(t("my.projects"))}</h2><div class="row"><a class="btn gold" href="#submit">+ ${esc(t("add.project"))}</a></div><div class="grid" id="myProjects"></div></section>`;
  },

  submit(id) {
    if (!FB) return `<div class="banner info">${esc(t("err.offline"))}</div>`;
    if (!S.user) return `${head(esc(t("nav.projects")), t("submit.title"))}<div class="banner"><span>${esc(t("need.login"))}</span><a class="btn solid" href="#me">${esc(t("login"))}</a></div>`;
    const p = editing || {};
    const gs = p.groups || [S.me?.group || "mir-1"];
    const opt = (v, cur, label) => `<option value="${v}"${v === cur ? " selected" : ""}>${esc(label)}</option>`;
    return `${head(esc(t("nav.projects")), id ? t("submit.edit") : t("submit.title"), t("submit.lead"))}
    <form class="form" id="projForm" data-id="${esc(id || "")}">
      <div class="field full"><label for="pj-title">${esc(t("f.title"))}</label><input id="pj-title" required maxlength="120" value="${esc(p.title || "")}"></div>
      <div class="field full"><label for="pj-desc">${esc(t("f.desc"))}</label><textarea id="pj-desc" required maxlength="600">${esc(p.desc || "")}</textarea></div>
      <div class="field"><span class="lbl">${esc(t("f.groups"))}</span><div class="row">${GROUPS.map((g) => `<label class="check"><input type="checkbox" name="pj-g" value="${esc(g.id)}"${gs.includes(g.id) ? " checked" : ""}> ${esc(g.name)}</label>`).join("")}</div></div>
      <div class="field"><label for="pj-type">${esc(t("f.typ"))}</label><select id="pj-type">${["project", "demo", "site", "idea"].map((v) => opt(v, p.type || "project", t("ty." + v))).join("")}</select></div>
      <div class="field"><label for="pj-stage">${esc(t("f.stage"))}</label><select id="pj-stage">${["idea", "work", "demo"].map((v) => opt(v, p.stage || "work", t("st." + v))).join("")}</select></div>
      <div class="field full"><label for="pj-tags">${esc(t("f.tags"))}</label><input id="pj-tags" maxlength="300" value="${esc((p.tags || []).join(", "))}" placeholder="ESP32, C++, 3D-печать"></div>
      <div class="field full"><label for="pj-authors">${esc(t("f.authors"))}</label><input id="pj-authors" required maxlength="300" value="${esc(p.authors || S.me?.name || "")}"></div>
      <div class="field full"><label for="pj-photos">${esc(t("f.photos"))}</label><input id="pj-photos" type="file" accept="image/*" multiple><div class="thumbrow" id="pj-thumbs">${(p.photos || []).map((u) => `<img src="${esc(u)}" alt="">`).join("")}</div></div>
      <div class="field"><label for="pj-demo">${esc(t("f.demo"))}</label><input id="pj-demo" type="url" maxlength="300" value="${esc(p.demo || "")}"></div>
      <div class="field"><label for="pj-repo">${esc(t("f.repo"))}</label><input id="pj-repo" type="url" maxlength="300" value="${esc(p.repo || "")}"></div>
      <div class="field full"><label for="pj-problem">${esc(t("f.problem"))}</label><textarea id="pj-problem" maxlength="800">${esc(p.problem || "")}</textarea></div>
      <div class="field full"><label for="pj-solution">${esc(t("f.solution"))}</label><textarea id="pj-solution" maxlength="1200">${esc(p.solution || "")}</textarea></div>
      <div class="field full"><label for="pj-result">${esc(t("f.result"))}</label><textarea id="pj-result" maxlength="800">${esc(p.result || "")}</textarea></div>
      <div class="full row"><button class="btn solid" type="submit">${esc(t("send.review"))}</button>${id ? `<button class="btn danger" type="button" id="pj-delete">${esc(t("delete"))}</button>` : ""}</div>
    </form>`;
  },

  mod() {
    if (!S.scope) return `${head(esc(t("mod.title")), t("mod.title"))}<div class="banner"><span>${esc(t("mod.denied"))}</span>${S.user ? "" : `<a class="btn solid" href="#me">${esc(t("login"))}</a>`}</div>`;
    return `${head(esc(S.scope === "all" ? "МИР-1 · МИР-2 · МИР-3" : gname(S.scope)), t("mod.title"), t("mod.lead"))}
    <section class="block"><h2 class="sec">${esc(t("mod.profiles"))}</h2><div class="feed" id="qProfiles"><div class="empty">…</div></div></section>
    <section class="block"><h2 class="sec">${esc(t("mod.projects"))}</h2><div class="feed" id="qProjects"><div class="empty">…</div></div></section>
    <section class="block"><h2 class="sec">${esc(t("mod.news"))}</h2>
      <form class="form" id="newsForm">
        <div class="field"><label for="nw-kind">${esc(t("n.kind"))}</label><select id="nw-kind"><option value="news">${esc(t("n.news"))}</option><option value="event">${esc(t("n.event"))}</option></select></div>
        <div class="field"><label for="nw-date">${esc(t("n.date"))}</label><input id="nw-date" type="date" required value="${new Date().toISOString().slice(0, 10)}"></div>
        <div class="field full"><label for="nw-title">${esc(t("n.title"))}</label><input id="nw-title" required maxlength="140"></div>
        <div class="field full"><label for="nw-text">${esc(t("n.text"))}</label><textarea id="nw-text" maxlength="2000"></textarea></div>
        <div class="field"><label for="nw-place">${esc(t("n.place"))}</label><input id="nw-place" maxlength="140"></div>
        <div class="field"><label for="nw-link">${esc(t("n.link"))}</label><input id="nw-link" type="url" maxlength="300"></div>
        <div class="field full"><label for="nw-photo">${esc(t("n.photo"))}</label><input id="nw-photo" type="file" accept="image/*"></div>
        <div class="full"><button class="btn solid" type="submit">${esc(t("publish"))}</button></div>
      </form></section>`;
  },
};

/* ---------- email links from Firebase: ?mode=verifyEmail|resetPassword|recoverEmail&oobCode=… ---------- */
const AT = {
  ru: { title: "Ссылка из письма", busy: "Проверяем ссылку…", ok: "Email подтверждён. Теперь можно пользоваться всеми возможностями сайта.", bad: "Ссылка устарела или уже использована. Запросите новое письмо на странице входа.",
    reset: "Новый пароль", for: "Для аккаунта", setpass: "Сохранить пароль", done: "Пароль изменён. Войдите с новым паролем.", go: "Перейти в профиль", login: "Войти" },
  ky: { title: "Каттагы шилтеме", busy: "Шилтеме текшерилүүдө…", ok: "Email ырасталды. Эми сайттын бардык мүмкүнчүлүктөрүн колдоно аласыз.", bad: "Шилтеменин мөөнөтү бүткөн же колдонулган. Кирүү барагынан жаңы кат сураңыз.",
    reset: "Жаңы сырсөз", for: "Аккаунт үчүн", setpass: "Сырсөздү сактоо", done: "Сырсөз өзгөртүлдү. Жаңы сырсөз менен кириңиз.", go: "Профилге өтүү", login: "Кирүү" },
  en: { title: "Email link", busy: "Checking the link…", ok: "Your email is confirmed. You can now use everything on the site.", bad: "This link has expired or was already used. Request a new email from the sign-in page.",
    reset: "New password", for: "For account", setpass: "Save password", done: "Password changed. Sign in with your new password.", go: "Go to profile", login: "Sign in" },
};
const at = (k) => (AT[getLang()] || AT.ru)[k];
const ACT = (() => {
  const q = new URLSearchParams(location.search), mode = q.get("mode"), code = q.get("oobCode");
  if (!mode || !code) return null;
  history.replaceState(null, "", location.pathname + "#action");
  return { mode, code, state: "busy", started: false, email: "" };
})();
PAGES.action = () => {
  if (!ACT) return `${head("", at("title"), at("bad"))}`;
  const s = ACT.state;
  return `${head(esc(at("title")), ACT.mode === "resetPassword" ? at("reset") : at("title"))}
    ${s === "busy" ? `<div class="banner info"><span>${esc(at("busy"))}</span></div>` : ""}
    ${s === "ok" ? `<div class="banner ok"><span>${esc(at("ok"))}</span><a class="btn solid" href="#me">${esc(at("go"))}</a></div>` : ""}
    ${s === "bad" ? `<div class="banner bad"><span>${esc(at("bad"))}</span><a class="btn" href="#me">${esc(at("login"))}</a></div>` : ""}
    ${s === "done" ? `<div class="banner ok"><span>${esc(at("done"))}</span><a class="btn solid" href="#me">${esc(at("login"))}</a></div>` : ""}
    ${s === "form" ? `<form class="form authbox" id="resetForm"><p class="note full">${esc(at("for"))}: ${esc(ACT.email)}</p>
      <div class="field full"><label for="rs-pass">${esc(t("password.new"))}</label><input id="rs-pass" type="password" required minlength="6" autocomplete="new-password"></div>
      <div class="full"><button class="btn solid" type="submit">${esc(at("setpass"))}</button></div></form>` : ""}`;
};
async function runAction() {
  if (!ACT || ACT.started || !FB) return;
  ACT.started = true;
  try {
    if (ACT.mode === "resetPassword") { ACT.email = await FB.emailForReset(ACT.code); ACT.state = "form"; }
    else { await FB.applyCode(ACT.code); ACT.state = "ok"; const u = await FB.refreshUser(); if (u) { S.user = u; S.scope = FB.modScope(u); renderNav(); } }
  } catch (e) { console.warn(e); ACT.state = "bad"; }
  if (location.hash === "#action") route(true);
}

function groupCards() {
  return `<div class="grid">${GROUPS.map((g) => {
    const n = ALL().filter((p) => groupsOf(p).includes(g.id)).length;
    return `<a class="tile gcard" href="#g-${esc(g.id)}"><div class="eyebrow">${esc(g.full)}</div><div class="big">${esc(g.name)}</div><p>${esc(g.about)}</p><p class="note">${g.size} ${esc(t("students.n"))} · ${n} ${esc(t("projects.n"))}</p></a>`;
  }).join("")}</div>`;
}
const gallery = () => `<div class="photos">
  <figure><img src="img/games-stage.jpg" alt="" loading="lazy"><figcaption>Международные космические игры</figcaption></figure>
  <figure><img src="img/games-field.jpg" alt="" loading="lazy"><figcaption>На площадке игр</figcaption></figure>
  <figure><img src="img/moscow.jpg" alt="" loading="lazy"><figcaption>Красная площадь, Москва</figcaption></figure></div>`;
const nameLink = (name) => { const pr = profileByName(name); return pr ? `<a href="#s-${esc(pr._id)}">${esc(name)}</a>` : esc(name); };

function projectPage(p) {
  const s = p.story || {};
  const hall = HALLS.indexOf(p) + 1;
  const tbl = (rows, a, b) => `<div class="scroll-x"><table class="kv"><thead><tr><th>${esc(t(a))}</th><th>${esc(t(b))}</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>`;
  const photos = p.photos || [];
  const own = p.dyn && S.user && p.ownerUid === S.user.uid;
  return `<a class="back" href="#projects">${esc(t("back.projects"))}</a>
  <div class="proj"><div class="gallery">${photos.length ? `<img class="main" id="gMain" src="${esc(photos[0])}" alt="${esc(p.title)}">${photos.length > 1 ? `<div class="thumbs">${photos.map((ph, i) => `<button type="button" data-ph="${esc(ph)}" aria-pressed="${i === 0}" aria-label="${i + 1}"><img src="${esc(ph)}" alt=""></button>`).join("")}</div>` : ""}` : `<div class="pimg">${cover(p)}</div>`}</div>
    <div class="facts"><div class="pmeta">${statusChip(p.status)}<span class="gchip">${esc(t("ty." + p.type))}</span>${groupChips(p)}</div>
      <h1 class="ptitle">${esc(p.title)}</h1><p class="lede">${esc(p.desc)}</p>
      <div class="tags">${(p.tags || []).map((x) => `<span>${esc(x)}</span>`).join("")}</div>
      <p class="note">${esc(t("by"))}: ${esc(p.author)}</p>
      <div class="row">${likeBtn(p.id)}
        ${safeUrl(p.demo) ? `<a class="btn solid" href="${esc(safeUrl(p.demo))}" target="_blank" rel="noopener">${esc(t("demo"))}</a>` : ""}
        ${safeUrl(p.repo) ? `<a class="btn" href="${esc(safeUrl(p.repo))}" target="_blank" rel="noopener">${esc(t("repo"))}</a>` : ""}
        ${p.slides ? `<a class="btn" href="${esc(p.slides)}" target="_blank" rel="noopener">${esc(t("slides"))}</a>` : ""}
        ${hall ? `<a class="btn gold" href="#hall-${hall}">${esc(t("in.museum"))} ${hall}</a>` : ""}
        ${own ? `<a class="btn" href="#submit-${esc(p._id)}">${esc(t("edit"))}</a>` : ""}</div></div></div>
  ${s.problem || s.solution || s.result ? `<section class="block"><div class="story">${["problem", "solution", "result"].filter((k) => s[k]).map((k) => `<div class="tile"><div class="eyebrow">${esc(t(k))}</div><p>${esc(s[k])}</p></div>`).join("")}</div></section>` : ""}
  ${s.steps?.length ? `<section class="block"><h2 class="sec">${esc(t("how"))}</h2><ol class="steps">${s.steps.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join("")}</ol></section>` : ""}
  ${s.parts?.length ? `<section class="block"><h2 class="sec">${esc(t("parts"))}</h2>${tbl(s.parts, "part", "purpose")}</section>` : ""}
  ${s.team?.length ? `<section class="block"><h2 class="sec">${esc(t("team"))}</h2>${tbl(s.team, "member", "did")}</section>` : ""}
  ${s.next?.length ? `<section class="block"><h2 class="sec">${esc(t("next"))}</h2>${tbl(s.next, "improve", "descr")}</section>` : ""}
  ${s.code ? `<section class="block"><h2 class="sec">${esc(t("code"))}</h2><pre class="code"><code>${esc(s.code)}</code></pre></section>` : ""}`;
}

function studentPage(p) {
  const m = memberByName(p.name);
  const surname = p.name.split(" ")[0];
  const projects = ALL().filter((x) => (x.dyn && x.ownerUid === p._id) || (x.author || "").includes(surname));
  const c = p.contacts || {};
  const links = [
    c.telegram && [`https://t.me/${c.telegram.replace(/^@|https?:\/\/t\.me\//g, "")}`, "Telegram"],
    c.github && [/^https?:/.test(c.github) ? c.github : `https://github.com/${c.github.replace(/^@/, "")}`, "GitHub"],
    c.linkedin && [/^https?:/.test(c.linkedin) ? c.linkedin : `https://www.linkedin.com/in/${c.linkedin}`, "LinkedIn"],
    c.site && [/^https?:/.test(c.site) ? c.site : `https://${c.site}`, t("p.site")],
  ].filter(Boolean);
  return `<a class="back" href="#students">${esc(t("back.students"))}</a>
  <div class="person">${avatar(p, true)}<div class="facts">
    <div class="eyebrow">${esc(GROUP[p.group]?.full || "")}${m?.team && !GROUP[p.group]?.flat ? ` · ${esc(m.team)}` : ""}${m?.role ? ` · ${esc(ROLE_RU[m.role] || "")}` : ""}${m?.lead ? ` · ${esc(t("teamlead"))}` : ""}</div>
    <h1 class="ptitle">${esc(p.name)}</h1>${p.internship ? `<div><span class="badge">${esc(t("intern"))}</span></div>` : ""}
    ${p.bio ? `<p class="lede" style="white-space:pre-line">${esc(p.bio)}</p>` : ""}</div></div>
  ${p.skills?.length ? `<section class="block"><h2 class="sec">${esc(t("skills"))}</h2><div class="tags">${p.skills.map((x) => `<span>${esc(x)}</span>`).join("")}</div></section>` : ""}
  ${links.length || c.email ? `<section class="block"><h2 class="sec">${esc(t("contacts"))}</h2><div class="clinks">${links.map(([u, l]) => `<a class="btn" href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join("")}${c.email ? `<span class="btn" style="user-select:all">${esc(c.email)}</span>` : ""}</div></section>` : ""}
  <section class="block"><h2 class="sec">${esc(t("his.projects"))}</h2><div class="grid">${projects.map(card).join("") || `<div class="empty">${esc(t("no.projects"))}</div>`}</div></section>`;
}

function groupPage(g) {
  const items = ALL().filter((p) => groupsOf(p).includes(g.id));
  const ach = ACH.filter((a) => a.group === g.id);
  const roster = g.flat
    ? `<ol class="flatlist">${g.squads.flatMap((sq) => sq.teams.flatMap((tm) => tm.members)).map((m) => `<li>${nameLink(m.name)}</li>`).join("")}</ol>`
    : g.squads.map((sq) => `<div class="squad"><h3>${esc(sq.name)}</h3>${sq.director ? `<p class="note">${esc(t("squad.lead"))}: ${esc(sq.director)}</p>` : ""}
        <div class="grid">${sq.teams.map((tm) => `<div class="tile team"><h4>${esc(tm.name)}</h4><ul class="members">${tm.members.map((m) => `<li><span class="${m.lead ? "lead" : ""}">${nameLink(m.name)}${m.lead ? ` · ${esc(t("teamlead"))}` : ""}</span><span class="role">${esc(ROLE_RU[m.role] || "")}</span></li>`).join("")}</ul></div>`).join("")}</div></div>`).join("");
  return `<a class="back" href="#groups">${esc(t("back.groups"))}</a>
  ${head(`${esc(g.full)} · ${g.size} ${esc(t("students.n"))}`, g.name, g.about)}
  <section class="block"><h2 class="sec">${esc(t("group.projects"))}</h2><div class="grid">${items.map(card).join("") || `<div class="empty">${esc(t("group.none"))}</div>`}</div></section>
  ${ach.length ? `<section class="block"><h2 class="sec">${esc(t("achievements"))}</h2>${ach.map((a) => `<div class="item"><div class="when">${esc(a.date)}</div><div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div><span></span></div>`).join("")}</section>` : ""}
  <section class="block"><h2 class="sec">${esc(t("roster"))}</h2>${roster}</section>`;
}

/* ---------- list renderers (filters keep focus because only the list re-renders) ---------- */
function renderList() {
  const q = filt.q.trim().toLowerCase();
  let rows = ALL().filter((p) => (filt.g === "all" || groupsOf(p).includes(filt.g)) && (filt.t === "all" || p.type === filt.t) && (filt.s === "all" || p.status === filt.s)
    && (!q || [p.title, p.desc, p.author, ...(p.tags || [])].join(" ").toLowerCase().includes(q)));
  rows = filt.o === "likes" ? rows.sort((a, b) => (S.counts[b.id] || 0) - (S.counts[a.id] || 0)) : rows.sort((a, b) => (b.status === "best") - (a.status === "best") || b.created - a.created);
  $("plist").innerHTML = rows.map(card).join("") || `<div class="empty">${esc(t("none"))}</div>`;
  $("pcount").textContent = `${t("shown")}: ${rows.length} ${t("of")} ${ALL().length}`;
}
function renderStudents() {
  const q = sfilt.q.trim().toLowerCase();
  const rows = S.profiles.filter((p) => (sfilt.g === "all" || p.group === sfilt.g) && (!sfilt.skill || (p.skills || []).includes(sfilt.skill)) && (!sfilt.intern || p.internship)
    && (!q || [p.name, p.bio, ...(p.skills || [])].join(" ").toLowerCase().includes(q)));
  $("slist").innerHTML = rows.map(scard).join("") || `<div class="empty">${esc(S.profiles.length ? t("students.none") : t("students.empty"))}</div>`;
}
function fillNames(sel, group, current) {
  const g = GROUP[group]; if (!sel || !g) return;
  const taken = new Set(S.profiles.filter((p) => p._id !== S.user?.uid).map((p) => p.name));
  const names = g.squads.flatMap((sq) => sq.teams.flatMap((tm) => tm.members.map((m) => m.name)));
  sel.innerHTML = `<option value="">${esc(t("choose"))}</option>` + names.map((n) => `<option${n === current ? " selected" : ""}${taken.has(n) ? " disabled" : ""}>${esc(n)}</option>`).join("");
}
async function renderMyProjects() {
  const box = $("myProjects"); if (!box) return;
  try {
    const mine = (await FB.myProjects(S.user.uid)).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
    box.innerHTML = mine.map((d) => { const p = normalize(d); return `<div class="tile"><div class="row">${modChip(d.status)}</div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>
      <div class="row">${d.status === "approved" ? `<a class="btn" href="#p-${esc(p.id)}">→</a>` : ""}<a class="btn" href="#submit-${esc(d._id)}">${esc(t("edit"))}</a></div></div>`; }).join("") || `<div class="empty">${esc(t("no.projects"))}</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
async function renderQueue() {
  try {
    const q = await FB.modQueue(S.scope);
    const act = (coll, id) => `<div class="row"><button class="btn solid" type="button" data-mod="${coll}" data-id="${esc(id)}" data-st="approved">${esc(t("approve"))}</button><button class="btn danger" type="button" data-mod="${coll}" data-id="${esc(id)}" data-st="rejected">${esc(t("reject"))}</button></div>`;
    $("qProfiles").innerHTML = q.profiles.map((p) => `<div class="qitem">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : `<div class="ph"></div>`}<div><h3>${esc(p.name)} · ${esc(gname(p.group))}</h3>
      <p>${esc(p.bio || "")}</p><div class="tags" style="margin-top:6px">${(p.skills || []).map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>${act("profiles", p._id)}</div>`).join("") || `<div class="empty">${esc(t("mod.empty"))}</div>`;
    $("qProjects").innerHTML = q.projects.map((d) => `<div class="qitem">${d.photos?.[0] ? `<img src="${esc(d.photos[0])}" alt="">` : `<div class="ph"></div>`}<div><h3>${esc(d.title)} · ${esc((d.groups || []).map(gname).join(" + "))}</h3>
      <p>${esc(d.desc)}</p><p>${esc(t("by"))}: ${esc(d.authors)}</p>${[d.problem, d.solution, d.result].filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join("")}</div>${act("projects", d._id)}</div>`).join("") || `<div class="empty">${esc(t("mod.empty"))}</div>`;
  } catch (e) { $("qProfiles").innerHTML = $("qProjects").innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}

/* ============================================================
   Router
   ============================================================ */
let museumOn = false, museumScroll = 0, authTab = "login", editing = null;
const NAV = [["museum", "#top", "nav.museum"], ["projects", "#projects", "nav.projects"], ["students", "#students", "nav.students"], ["groups", "#groups", "nav.groups"],
  ["news", "#news", "nav.news"], ["ideas", "#ideas", "nav.ideas"], ["about", "#about", "nav.about"], ["support", "#support", "nav.support"]];
let navKey = "museum";
function renderNav() {
  $("nav").innerHTML = NAV.map(([k, h, l]) => `<a href="${h}" data-r="${k}"${k === navKey ? ' aria-current="page"' : ""}>${esc(t(l))}</a>`).join("")
    + (S.scope ? `<a href="#mod" data-r="mod"${navKey === "mod" ? ' aria-current="page"' : ""}>${esc(t("nav.mod"))}</a>` : "")
    + `<a class="acct" href="#me" data-r="me"${navKey === "me" ? ' aria-current="page"' : ""}>${esc(S.user ? t("nav.profile") : t("nav.me"))}</a>`;
}
async function route(soft) {
  const h = decodeURIComponent(location.hash.slice(1));
  const alias = { bank: "ideas", photos: "news", achievements: "news", top: "", museum: "" };
  const r = h in alias ? alias[h] : h;
  $("nav").classList.remove("open"); $("menuBtn").setAttribute("aria-expanded", "false");
  if (!r || /^hall-\d+$/.test(r)) { navKey = "museum"; renderNav(); return showMuseum(r); }
  let html, key = r, after = null;
  if (PAGES[r]) html = PAGES[r]();
  else if (r.startsWith("p-") && byId(r.slice(2))) { html = projectPage(byId(r.slice(2))); key = "projects"; }
  else if (r.startsWith("g-") && GROUP[r.slice(2)]) { html = groupPage(GROUP[r.slice(2)]); key = "groups"; }
  else if (r.startsWith("s-")) {
    key = "students";
    let p = S.profiles.find((x) => x._id === r.slice(2));
    if (!p && FB && S.user && r.slice(2) === S.user.uid) p = S.me;
    html = p ? studentPage(p) : S.loaded ? `${head("", t("nf.title"), t("nf.text"))}` : `<div class="empty">…</div>`;
  } else if (r.startsWith("submit")) {
    key = "projects";
    const id = r.startsWith("submit-") ? r.slice(7) : "";
    editing = null;
    if (id && FB && S.user) { try { editing = await FB.getProject(id); } catch (e) {} }
    html = PAGES.submit(id);
  } else if (!S.loaded && (r.startsWith("p-u-"))) html = `<div class="empty">…</div>`;
  else html = `${head("", t("nf.title"), t("nf.text"))}<p><a href="#top">${esc(t("nav.museum"))}</a> · <a href="#projects">${esc(t("nav.projects"))}</a></p>`;
  if (museumOn) museumScroll = scrollY;
  museumOn = false;
  if (free) toggleFree();
  document.body.classList.add("page");
  const y = scrollY;
  $("page").innerHTML = `<div class="wrap">${html}${footer()}</div>`;
  navKey = key; renderNav();
  window.scrollTo(0, soft ? y : 0);
  if (key === "projects" && $("plist")) renderList();
  if (r === "students") renderStudents();
  if (r === "ideas") updateIdea();
  if (r === "me" && S.user) { fillNames($("pf-name"), $("pf-group").value, S.me?.name); renderMyProjects(); }
  if (r === "me" && !S.user && $("rg-name")) fillNames($("rg-name"), $("rg-group").value, "");
  if (r === "mod" && S.scope) renderQueue();
  if (r === "action") runAction();
}
function showMuseum(r) {
  const wasPage = !museumOn;
  museumOn = true;
  document.body.classList.remove("page");
  sizeTrack();
  const m = /^hall-(\d+)$/.exec(r || "");
  if (m) goStop(Math.min(+m[1], N - 1), true); else if (wasPage) window.scrollTo(0, museumScroll);
  prog = scrollProg();
  if (!started) startMuseum();
}
addEventListener("hashchange", () => route());

/* ---------- auth state ---------- */
if (FB) FB.onUser(async (u) => {
  S.user = u; S.scope = FB.modScope(u); S.me = null;
  if (u) { try { S.me = await FB.getProfile(u.uid); } catch (e) {} }
  renderNav();
  const h = location.hash.slice(1);
  if (!museumOn && (/^(me|mod|submit|s-|p-)/.test(h) || h === "news")) route(true);
});

/* ============================================================
   Page interactions (delegated)
   ============================================================ */
const page = $("page");
page.addEventListener("input", (e) => {
  if (e.target.id === "q") { filt.q = e.target.value; renderList(); }
  if (e.target.id === "sq") { sfilt.q = e.target.value; renderStudents(); }
  if (e.target.closest("#ideaForm")) updateIdea();
});
page.addEventListener("change", async (e) => {
  const id = e.target.id;
  if (id === "sskill") { sfilt.skill = e.target.value; renderStudents(); }
  if (id === "sintern") { sfilt.intern = e.target.checked; renderStudents(); }
  if (id === "rg-group") fillNames($("rg-name"), e.target.value, "");
  if (id === "pf-group") fillNames($("pf-name"), e.target.value, "");
  if (e.target.closest("#ideaForm")) updateIdea();
  if (id === "pj-photos") {
    const files = [...e.target.files].slice(0, 3);
    $("pj-thumbs").innerHTML = files.map((f) => `<img src="${esc(URL.createObjectURL(f))}" alt="">`).join("");
  }
});
page.addEventListener("click", async (e) => {
  const lb = e.target.closest("[data-like]");
  if (lb) { e.preventDefault(); e.stopPropagation(); return doLike(lb.dataset.like); }
  const b = e.target.closest(".seg button");
  if (b) {
    const set = b.parentElement.dataset.f ? filt : sfilt, k = b.parentElement.dataset.f || b.parentElement.dataset.sf;
    set[k] = b.dataset.v;
    b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    return set === filt ? renderList() : renderStudents();
  }
  const th = e.target.closest(".thumbs button");
  if (th) { $("gMain").src = th.dataset.ph; th.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === th))); }
  const tab = e.target.closest("[data-tab]");
  if (tab) { authTab = tab.dataset.tab; route(true); }
  if (e.target.id === "forgot") {
    const email = $("li-email").value.trim();
    if (!email) { $("li-email").focus(); return; }
    try { await FB.resetPassword(email); toast(t("reset.sent")); } catch (err) { toast(errText(err)); }
  }
  if (e.target.id === "logout") { await FB.logout(); location.hash = "top"; }
  if (e.target.id === "resend") { try { await FB.resendVerification(); toast(t("verify.sent")); } catch (err) { toast(errText(err)); } }
  if (e.target.id === "recheck") { const u = await FB.refreshUser(); S.user = u; S.scope = FB.modScope(u); route(true); }
  const mb = e.target.closest("[data-mod]");
  if (mb) {
    mb.disabled = true;
    try { await FB.setStatus(mb.dataset.mod, mb.dataset.id, mb.dataset.st); mb.closest(".qitem").remove(); toast(t("saved").split(".")[0] + "."); }
    catch (err) { mb.disabled = false; toast(errText(err)); }
  }
  const dn = e.target.closest("[data-delnews]");
  if (dn) { try { await FB.deleteNews(dn.dataset.delnews); S.news = S.news.filter((n) => n._id !== dn.dataset.delnews); route(true); } catch (err) { toast(errText(err)); } }
  if (e.target.id === "pj-delete") {
    const id = $("projForm").dataset.id;
    try { await FB.deleteProject(id); S.dyn = S.dyn.filter((p) => p._id !== id); location.hash = "me"; } catch (err) { toast(errText(err)); }
  }
});
page.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector('[type="submit"]');
  const v = (id) => ($(id)?.value || "").trim();
  const busy = (on) => { if (btn) btn.disabled = on; };
  if (f.id === "ideaForm") {
    const text = ideaText(); let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (err) { $("idea-out").select(); }
    if (BOT_URL) window.open(BOT_URL, "_blank", "noopener");
    return toast(copied ? t("idea.copied") : t("idea.select"));
  }
  busy(true);
  try {
    if (f.id === "resetForm") { await FB.confirmReset(ACT.code, $("rs-pass").value); ACT.state = "done"; route(true); }
    if (f.id === "loginForm") { await FB.signIn(v("li-email"), $("li-pass").value); }
    if (f.id === "regForm") {
      const name = v("rg-name"), group = v("rg-group");
      if (!name) { $("rg-name").focus(); busy(false); return; }
      const u = await FB.signUp(v("rg-email"), $("rg-pass").value);
      await FB.saveProfile(u.uid, { name, group, bio: "", skills: [], internship: false, contacts: {}, photo: "" }, true);
      S.me = await FB.getProfile(u.uid);
      toast(t("verify.need"));
      route(true);
    }
    if (f.id === "profForm") {
      const file = $("pf-photo").files[0];
      const photo = file ? await FB.compressImage(file, 400, 190000) : S.me?.photo || "";
      const contacts = {};
      [["telegram", "telegram"], ["github", "github"], ["cemail", "email"], ["linkedin", "linkedin"], ["site", "site"]].forEach(([k, key]) => { const x = v("pf-" + k); if (x) contacts[key] = x; });
      const data = { name: v("pf-name") || S.me?.name, group: v("pf-group"), bio: v("pf-bio"), skills: v("pf-skills").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20), internship: $("pf-intern").checked, contacts, photo };
      if (!data.name) { $("pf-name").focus(); busy(false); return; }
      await FB.saveProfile(S.user.uid, data, !S.me);
      S.me = await FB.getProfile(S.user.uid);
      toast(t("saved")); route(true);
    }
    if (f.id === "projForm") {
      const id = f.dataset.id;
      const groups = [...f.querySelectorAll('[name="pj-g"]:checked')].map((x) => x.value);
      if (!groups.length) groups.push(S.me?.group || "mir-1");
      const files = [...$("pj-photos").files].slice(0, 3);
      const photos = files.length ? await Promise.all(files.map((fl) => FB.compressImage(fl, 1100, 210000))) : editing?.photos || [];
      const data = { title: v("pj-title"), desc: v("pj-desc"), group: groups[0], groups, type: v("pj-type"), stage: v("pj-stage"),
        tags: v("pj-tags").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12), authors: v("pj-authors"), photos,
        demo: v("pj-demo"), repo: v("pj-repo"), problem: v("pj-problem"), solution: v("pj-solution"), result: v("pj-result") };
      await FB.saveProject(id || null, data, S.user.uid);
      toast(t("sent.review")); location.hash = "me";
    }
    if (f.id === "newsForm") {
      const file = $("nw-photo").files[0];
      const data = { kind: v("nw-kind"), title: v("nw-title"), text: v("nw-text"), date: FB.Timestamp.fromDate(new Date(v("nw-date") + "T12:00:00")), place: v("nw-place"), link: v("nw-link"), groups: S.scope === "all" ? [] : [S.scope] };
      if (file) data.photo = await FB.compressImage(file, 1200, 380000);
      const ref = await FB.addNews(data, S.user.email);
      S.news.push({ _id: ref.id, ...data });
      f.reset(); toast(t("published"));
    }
  } catch (err) { console.warn(err); toast(errText(err)); }
  busy(false);
});
function ideaText() { const v = (id) => ($(id)?.value || "").trim(); return [`Идея: ${v("idea-title")}`, v("idea-text"), v("idea-author") && `Автор: ${v("idea-author")}`, v("idea-group") && `Группа: ${v("idea-group")}`].filter(Boolean).join("\n\n"); }
function updateIdea() { if ($("idea-out")) $("idea-out").value = $("idea-title").value || $("idea-text").value ? ideaText() : ""; }

async function doLike(id) {
  if (LIKED.has(id) || !FB) return;
  const btns = () => document.querySelectorAll(`[data-like="${CSS.escape(id)}"]`);
  btns().forEach((b) => (b.disabled = true));
  try {
    const n = await FB.like(id);
    S.counts[id] = n; LIKED.add(id);
    try { localStorage.setItem("mirair-liked", JSON.stringify([...LIKED])); } catch (e) {}
    btns().forEach((b) => { b.setAttribute("aria-pressed", "true"); b.title = t("liked"); b.querySelector("span").textContent = n; });
  } catch (e) { console.warn(e); toast(t("like.err")); }
  btns().forEach((b) => (b.disabled = false));
}
$("pLike").addEventListener("click", (e) => { const b = e.target.closest("[data-like]"); if (b) doLike(b.dataset.like); });

/* ---------- chrome: language, menu ---------- */
function applyI18n() {
  document.querySelectorAll("[data-i]").forEach((el) => (el.textContent = t(el.dataset.i)));
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === getLang())));
  $("walkBtn").textContent = free ? t("walk.exit") : t("walk");
  $("menuBtn").textContent = t("menu");
  $("freeHelp").textContent = coarse ? t("help.touch") : t("help.mouse");
  applyPanel(); renderNav(); renderRail();
  if (currentStop >= 1 && currentStop <= H) fillPanel(currentStop - 1);
}
document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { setLang(b.dataset.lang); applyI18n(); if (!museumOn) route(true); }));
$("menuBtn").addEventListener("click", () => { const o = $("nav").classList.toggle("open"); $("menuBtn").setAttribute("aria-expanded", String(o)); });

/* ============================================================
   3D museum: a night lab with neon lines and Kyrgyz ornament
   ============================================================ */
const coarse = matchMedia("(pointer: coarse)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = () => innerWidth < 720;
let free = false, started = false, renderer = null, currentStop = -1;
let HALLS = FEATURED.map(byId).filter(Boolean);
let H = HALLS.length, N = H + 2;
const HALL_START = 10, NAVE = 5.2, OUTER = 8.5, RR = 11, STEP = 12;
let PORTALS, EX_Z, HALL_END, RZ;
function layout() {
  H = HALLS.length; N = H + 2;
  PORTALS = Array.from({ length: H + 2 }, (_, i) => HALL_START - STEP * i);
  EX_Z = HALLS.map((_, i) => -8 - STEP * i);
  HALL_END = PORTALS.at(-1) - 5.1; RZ = HALL_END - 6.9;
}
layout();
function sizeTrack() { $("track").style.height = `${(N - 1) * 105 + 100}vh`; }
function scrollProg() { const max = document.documentElement.scrollHeight - innerHeight; return max > 0 ? (scrollY / max) * (N - 1) : 0; }
function goStop(i, instant) { const max = document.documentElement.scrollHeight - innerHeight; window.scrollTo({ top: (i / (N - 1)) * max, behavior: instant || reduced ? "auto" : "smooth" }); }
let prog = 0;
function stopLabel(i) { return i === 0 ? t("entrance") : i === N - 1 ? t("rotunda") : `${t("hall")} ${i}: ${HALLS[i - 1].title}`; }
function renderRail() {
  const rail = $("rail"); rail.innerHTML = "";
  for (let i = 0; i < N; i++) {
    const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", stopLabel(i)); b.title = stopLabel(i);
    if (i === currentStop) b.classList.add("on");
    b.addEventListener("click", () => goStop(i)); rail.appendChild(b);
  }
}
function fillPanel(i) {
  const p = HALLS[i]; if (!p) return;
  $("pNo").textContent = `${t("hall")} ${i + 1}`;
  $("pCat").textContent = groupsOf(p).map(gname).join(" + ");
  $("pTitle").textContent = p.title; $("pDesc").textContent = p.desc;
  $("pTech").textContent = (p.tags || []).slice(0, 4).join(", ");
  $("pAuthor").textContent = p.author; $("pStatus").textContent = t("st." + p.status);
  $("pLink").href = `#p-${p.id}`; $("pLike").innerHTML = likeBtn(p.id);
  $("panel").classList.toggle("right", i % 2 === 0);
}
let panelMini = narrow();
try { const v = localStorage.getItem("mirair-panel"); if (v) panelMini = v === "mini"; } catch (e) {}
function applyPanel() { $("panel").classList.toggle("mini", panelMini); $("pToggle").textContent = panelMini ? t("panel.more") : t("panel.less"); $("pToggle").setAttribute("aria-expanded", String(!panelMini)); }
$("pToggle").addEventListener("click", () => { panelMini = !panelMini; applyPanel(); try { localStorage.setItem("mirair-panel", panelMini ? "mini" : "full"); } catch (e) {} });
$("toTop").addEventListener("click", (e) => { e.preventDefault(); if (location.hash && location.hash !== "#top") { museumScroll = 0; location.hash = "top"; return; } if (free) toggleFree(); goStop(0); });

function toggleFree() {
  free = !free;
  document.body.classList.toggle("free", free);
  $("freeHelp").hidden = !free; $("pad").hidden = !(free && coarse);
  $("walkBtn").textContent = free ? t("walk.exit") : t("walk");
  if (!camera) return;
  if (free) { const dir = new THREE.Vector3(); camera.getWorldDirection(dir); look.yaw = Math.atan2(-dir.x, -dir.z); look.pitch = Math.asin(dir.y); camera.position.y = 1.75; snapInside(camera.position); }
  else { keys.clear(); prog = scrollProg(); }
}
$("walkBtn").addEventListener("click", toggleFree);

let camera, scene, sun, clock, look = { yaw: 0, pitch: 0 }, keys = new Set();
const spinning = [], animators = [], STOPS = [];

async function startMuseum() {
  started = true;
  // wait briefly for approved student projects so they get their own halls
  await Promise.race([loadPromise, new Promise((r) => setTimeout(r, 3000))]);
  const extra = S.dyn.filter((p) => p.photos?.length && p.type !== "idea").slice(0, Math.max(0, 14 - HALLS.length));
  HALLS = [...extra, ...HALLS]; layout(); sizeTrack(); renderRail();
  if (museumOn && /^#hall-\d+$/.test(location.hash)) goStop(Math.min(+location.hash.slice(6), N - 1), true);

  const canvas = $("scene");
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
  catch (e) { $("loader").innerHTML = `<p class="err">WebGL недоступен, поэтому 3D-музей не открывается. Все проекты есть в разделе <a href="#projects">«${esc(t("nav.projects"))}»</a>.</p>`; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color("#070912"), 22, 95);
  camera = new THREE.PerspectiveCamera(coarse && innerWidth < innerHeight ? 68 : 55, innerWidth / innerHeight, 0.1, 600);
  const CYAN = new THREE.Color("#5fd4e6"), GOLD = new THREE.Color("#e0b25a");

  /* night sky with a faint aurora band */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#0b1238") }, mid: { value: new THREE.Color("#141a3a") }, bottom: { value: new THREE.Color("#05060c") } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.5)) : mix(mid, bottom, min(-h*4.0,1.0)); float a = exp(-pow((h-0.35)*6.0,2.0)) * (0.5+0.5*sin(vP.x*9.0+vP.z*5.0)); c += vec3(0.05,0.22,0.24)*a*0.6; gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}",
  }));
  scene.add(sky);
  {
    const pm = new THREE.PMREMGenerator(renderer); const env = new THREE.Scene(); env.add(sky.clone());
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: "#2b3a66", side: THREE.DoubleSide }));
    panel.position.set(0, 250, 0); panel.rotation.x = Math.PI / 2; env.add(panel);
    scene.environment = pm.fromScene(env, 0.04).texture; scene.environmentIntensity = 0.9;
  }
  scene.add(new THREE.HemisphereLight("#6f86c9", "#0d0f1c", 1.1));
  sun = new THREE.DirectionalLight("#cfe6ff", 1.6);
  sun.castShadow = true; sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  /* textures: dark tiles with instrument grid, and the gold ram-horn (кочкор мүйүз) ornament band */
  const tex = (c, rx, ry) => { const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = maxAniso; tx.repeat.set(rx, ry); return tx; };
  function floorCanvas() {
    const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d");
    g.fillStyle = "#0b0e1c"; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(95,212,230,0.10)"; g.lineWidth = 1; for (let k = 32; k < 512; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
    g.strokeStyle = "rgba(95,212,230,0.35)"; g.lineWidth = 2; g.strokeRect(1, 1, 510, 510);
    // central ornament medallion: four ram horns around a rhombus
    g.save(); g.translate(256, 256); g.strokeStyle = "rgba(224,178,90,0.55)"; g.lineWidth = 4; g.lineCap = "round";
    for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(0, -90, 70, -90, 70, -50); g.bezierCurveTo(70, -24, 40, -24, 42, -46); g.stroke(); }
    g.beginPath(); g.moveTo(0, -26); g.lineTo(26, 0); g.lineTo(0, 26); g.lineTo(-26, 0); g.closePath(); g.stroke(); g.restore();
    return c;
  }
  function ornamentCanvas() {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, 1024, 128);
    g.strokeStyle = "#ffffff"; g.lineWidth = 7; g.lineCap = "round";
    for (let x = 0; x < 1024; x += 128) {
      g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 28, 64);
      g.bezierCurveTo(x + 28, 14, x + 74, 14, x + 74, 54); g.bezierCurveTo(x + 74, 78, x + 50, 78, x + 52, 58);
      g.moveTo(x + 128, 64); g.lineTo(x + 100, 64);
      g.bezierCurveTo(x + 100, 114, x + 54, 114, x + 54, 74); g.bezierCurveTo(x + 54, 50, x + 78, 50, x + 76, 70);
      g.stroke();
    }
    g.fillRect(0, 4, 1024, 4); g.fillRect(0, 120, 1024, 4);
    return c;
  }
  const span = HALL_START + 30 - (RZ - RR - 24);
  const orn = ornamentCanvas();
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: tex(floorCanvas(), 11, span / 4), roughness: 0.22, metalness: 0.55 }),
    wall: new THREE.MeshStandardMaterial({ color: "#11152a", roughness: 0.6, metalness: 0.3 }),
    stone: new THREE.MeshStandardMaterial({ color: "#1a1f38", roughness: 0.45, metalness: 0.5 }),
    gold: new THREE.MeshStandardMaterial({ color: "#e0b25a", roughness: 0.28, metalness: 0.85, emissive: GOLD, emissiveIntensity: 0.12 }),
    ink: new THREE.MeshStandardMaterial({ color: "#1d1b22", roughness: 0.75 }),
    neon: new THREE.MeshBasicMaterial({ color: CYAN }),
    neonGold: new THREE.MeshBasicMaterial({ color: GOLD }),
    band: new THREE.MeshBasicMaterial({ map: tex(orn, 6, 1), color: GOLD, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  };
  function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const add = (parent, m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };

  /* architecture */
  const floor = mesh(new THREE.PlaneGeometry(44, span), M.floor, 0, 0, HALL_START + 30 - span / 2); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  function column(x, z, h = 5.5, r = 0.34) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    mesh(new THREE.BoxGeometry(r * 2.8, 0.3, r * 2.8), M.stone, 0, 0.15, 0, g);
    mesh(new THREE.CylinderGeometry(r * 0.9, r, h - 0.6, 6), M.stone, 0, 0.3 + (h - 0.6) / 2, 0, g);
    for (const y of [0.42, h - 0.42]) { const ring = mesh(new THREE.TorusGeometry(r * 1.08, 0.025, 6, 6), M.neon, 0, y, 0, g); ring.rotation.x = Math.PI / 2; ring.castShadow = false; }
    const strip = mesh(new THREE.BoxGeometry(0.03, h - 1.2, 0.03), M.neon, 0, h / 2, r * 0.93, g); strip.castShadow = false;
    mesh(new THREE.BoxGeometry(r * 3, 0.24, r * 2.4), M.stone, 0, h - 0.12, 0, g);
  }
  const len = HALL_START - HALL_END, mid = (HALL_START + HALL_END) / 2;
  for (const s of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.6, 11.5, len), M.wall, s * (OUTER + 0.3), 5.75, mid);
    // glowing ornament band along each wall, above the pictures
    const band = mesh(new THREE.PlaneGeometry(len, 0.9), M.band.clone(), s * (OUTER - 0.01), 5.4, mid); band.rotation.y = -s * Math.PI / 2; band.castShadow = false;
    band.material.map = M.band.map.clone(); band.material.map.repeat.set(len / 2.2, 1); band.material.map.needsUpdate = true;
    const line = mesh(new THREE.BoxGeometry(0.04, 0.04, len), M.neon, s * (OUTER - 0.02), 0.6, mid); line.castShadow = false;
    mesh(new THREE.BoxGeometry(OUTER - NAVE, 0.4, len), M.stone, s * (NAVE + (OUTER - NAVE) / 2 + 0.3), 6.4, mid);
    mesh(new THREE.BoxGeometry(1.2, 0.7, HALL_START - PORTALS.at(-1) + 0.8), M.stone, s * NAVE, 5.85, (HALL_START + PORTALS.at(-1)) / 2);
    const top = mesh(new THREE.BoxGeometry(0.05, 0.05, HALL_START - PORTALS.at(-1) + 0.8), M.neon, s * (NAVE - 0.62), 5.55, (HALL_START + PORTALS.at(-1)) / 2); top.castShadow = false;
    mesh(new THREE.BoxGeometry(OUTER - NAVE - 0.4, 11.5, 0.8), M.wall, s * (NAVE + (OUTER - NAVE) / 2 + 0.5), 5.75, HALL_START + 0.4);
  }
  for (const z of PORTALS) {
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(1.1, 5.5, 1.5), M.stone, s * NAVE, 2.75, z);
    mesh(new THREE.TorusGeometry(NAVE, 0.5, 6, 48, Math.PI), M.stone, 0, 5.5, z).scale.z = 1.4;
    const glow = mesh(new THREE.TorusGeometry(NAVE - 0.52, 0.035, 6, 64, Math.PI), M.neonGold, 0, 5.5, z + 0.72); glow.castShadow = false;
    const glow2 = mesh(new THREE.TorusGeometry(NAVE - 0.52, 0.035, 6, 64, Math.PI), M.neonGold, 0, 5.5, z - 0.72); glow2.castShadow = false;
  }
  for (let i = 0; i < PORTALS.length - 1; i++) { const a = PORTALS[i], b = PORTALS[i + 1]; for (const f of [1 / 3, 2 / 3]) for (const s of [-1, 1]) column(s * NAVE, a + (b - a) * f); }
  for (let z = HALL_START + 1; z > HALL_END - 1; z -= 1.7) mesh(new THREE.BoxGeometry(OUTER * 2 + 1.2, 0.4, 0.3), M.stone, 0, 11.7, z);
  for (const x of [-NAVE, NAVE]) mesh(new THREE.BoxGeometry(0.5, 0.6, len + 2), M.stone, x, 11.2, mid);
  // a neon line down the centre of the floor, the "signal path" through the halls
  const path = mesh(new THREE.BoxGeometry(0.06, 0.01, len + 8), M.neon, 0, 0.006, mid - 3); path.castShadow = false;

  /* rotunda with a tunduk (түндүк) crown overhead */
  const open = Math.asin(OUTER / RR);
  {
    mesh(new THREE.CylinderGeometry(RR, RR, 11.5, 96, 1, true, open, Math.PI * 2 - open * 2), new THREE.MeshStandardMaterial({ color: "#11152a", roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide }), 0, 5.75, RZ);
    const n = 14;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.PI / n; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < open + 0.15) continue; column(Math.sin(a) * (RR - 1.6), RZ + Math.cos(a) * (RR - 1.6), 6.2, 0.38); }
    const ring = mesh(new THREE.TorusGeometry(RR - 1.6, 0.4, 8, 96), M.stone, 0, 6.5, RZ); ring.rotation.x = Math.PI / 2; ring.scale.z = 1.6;
    for (const r of [3, 6, 8.6]) { const l = mesh(new THREE.RingGeometry(r, r + 0.05, 128), r === 6 ? M.neonGold : M.neon, 0, 0.012, RZ); l.rotation.x = -Math.PI / 2; l.castShadow = false; }
    mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.9, 6), M.stone, 0, 0.45, RZ - 1);
    // tunduk: an outer ring with two sets of three crossing arches (kuldurmach), glowing gold
    const tg = new THREE.Group(); tg.position.set(0, 10.6, RZ); scene.add(tg);
    const tring = mesh(new THREE.TorusGeometry(3.2, 0.12, 8, 96), M.neonGold, 0, 0, 0, tg); tring.rotation.x = Math.PI / 2; tring.castShadow = false;
    for (const rot of [0, Math.PI / 2]) for (const off of [-1.1, 0, 1.1]) {
      const r = Math.sqrt(3.2 * 3.2 - off * off);
      const arc = mesh(new THREE.TorusGeometry(r, 0.07, 6, 48, Math.PI), M.neonGold, 0, 0, 0, tg);
      arc.scale.y = 0.35; arc.rotation.set(0, rot, 0); arc.position.set(rot ? off : 0, 0, rot ? 0 : off); arc.castShadow = false;
    }
    animators.push((tm) => (tg.rotation.y = tm * 0.05));
    const disk = mesh(new THREE.CircleGeometry(RR, 64), new THREE.MeshBasicMaterial({ color: "#05070f", side: THREE.DoubleSide }), 0, 11.65, RZ); disk.rotation.x = Math.PI / 2;
  }

  /* pictures, light boxes, models */
  const loader = new THREE.TextureLoader();
  const photo = (url, cb) => loader.load(url, (tx) => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = maxAniso; cb(tx, tx.image.width / tx.image.height); }, undefined, () => {});
  const fit = (ar, maxW, maxH) => (ar > maxW / maxH ? [maxW, maxW / ar] : [maxH * ar, maxH]);
  function framed(tx, w, h, x, y, z, rotY) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
    const b = 0.1;
    mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, emissive: "#ffffff", emissiveMap: tx, emissiveIntensity: 0.55, roughness: 0.8 }), 0, 0, 0.03, g);
    for (const [bw, bh, bx, by] of [[w + b * 2, b, 0, h / 2 + b / 2], [w + b * 2, b, 0, -h / 2 - b / 2], [b, h, -w / 2 - b / 2, 0], [b, h, w / 2 + b / 2, 0]]) mesh(new THREE.BoxGeometry(bw, bh, 0.1), M.gold, bx, by, 0.03, g);
    const glow = mesh(new THREE.PlaneGeometry(w + 0.9, h + 0.9), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.07, depthWrite: false }), 0, 0, 0.005, g); glow.castShadow = false;
  }
  const backZ = RZ - RR + 0.35;
  photo("img/news-kabar.jpg", (tx, ar) => { const [w, h] = fit(ar, 3.4, 4.2); framed(tx, w, h, 0, 3.4, backZ, 0); });
  for (const [img, s] of [["img/games-stage.jpg", -1], ["img/moscow.jpg", 1]]) { const a = s * 0.62, r = RR - 0.35; photo(img, (tx, ar) => { const [w, h] = fit(ar, 2.4, 3.1); framed(tx, w, h, Math.sin(a) * r, 3.2, RZ - Math.cos(a) * r, -a); }); }

  function pedestal(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.12, 6), M.stone, 0, 0.06, 0, g);
    mesh(new THREE.CylinderGeometry(0.6, 0.66, 0.96, 6), M.stone, 0, 0.6, 0, g);
    mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 6), M.stone, 0, 1.12, 0, g);
    const ring = mesh(new THREE.TorusGeometry(0.76, 0.02, 6, 6), M.neon, 0, 1.165, 0, g); ring.rotation.x = Math.PI / 2; ring.rotation.z = Math.PI / 6; ring.castShadow = false;
    // hologram halo above the exhibit
    const halo = mesh(new THREE.TorusGeometry(0.9, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.55 }), 0, 2.85, 0, g); halo.rotation.x = Math.PI / 2; halo.castShadow = false;
    const cone = mesh(new THREE.CylinderGeometry(0.9, 0.7, 1.6, 6, 1, true), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }), 0, 2.05, 0, g); cone.castShadow = false;
    animators.push((tm) => { halo.position.y = 2.85 + Math.sin(tm * 1.3 + x) * 0.06; halo.material.opacity = 0.4 + 0.2 * Math.sin(tm * 2 + z); });
  }
  function lightbox(url) {
    const g = new THREE.Group();
    add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), M.gold), 0, 0.15, 0);
    photo(url, (tx, ar) => {
      const [w, h] = fit(ar, 1.25, 1.25), y = 0.3 + h / 2;
      add(g, new THREE.Mesh(new THREE.BoxGeometry(w + 0.07, h + 0.07, 0.05), M.gold), 0, y, 0);
      const face = new THREE.MeshStandardMaterial({ map: tx, emissive: "#ffffff", emissiveMap: tx, emissiveIntensity: 0.75, roughness: 0.6 });
      const f1 = add(g, new THREE.Mesh(new THREE.PlaneGeometry(w, h), face), 0, y, 0.027);
      const f2 = add(g, new THREE.Mesh(new THREE.PlaneGeometry(w, h), face), 0, y, -0.027); f2.rotation.y = Math.PI; f1.castShadow = f2.castShadow = false;
    });
    return g;
  }
  const plastic = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45 });
  const metal = new THREE.MeshStandardMaterial({ color: "#b9bcc6", roughness: 0.3, metalness: 0.8 });
  const pcb = new THREE.MeshStandardMaterial({ color: "#1f6b4a", roughness: 0.55 });
  const glowM = (hex) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.6, roughness: 0.3 });
  function model(kind) {
    const g = new THREE.Group();
    if (kind === "sunflower") {
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.6), plastic("#e9e7f2")), 0, 0.04, 0);
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.18), pcb), -0.12, 0.095, 0.12);
      const us = new THREE.Group(); us.position.set(0.22, 0.2, 0.18); g.add(us);
      add(us, new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.13, 0.02), pcb));
      for (const s of [-1, 1]) add(us, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 24), metal), s * 0.08, 0, 0.04).rotation.x = Math.PI / 2;
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.02), M.ink), 0.22, 0.13, 0.17);
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.14), plastic("#2f3f9e")), 0, 0.19, -0.08);
      const headG = new THREE.Group(); headG.position.set(0, 0.34, -0.08); g.add(headG);
      add(headG, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 16), M.stone), 0, 0.08, 0);
      const face = new THREE.Group(); face.position.y = 0.32; headG.add(face);
      const petals = new THREE.MeshStandardMaterial({ color: "#e0a526", emissive: "#e0a526", emissiveIntensity: 0.25, roughness: 0.6 });
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; add(face, new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.13, 4, 10), petals), Math.cos(a) * 0.17, Math.sin(a) * 0.17, -0.01).rotation.z = a - Math.PI / 2; }
      add(face, new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 32), plastic("#3b2a17"))).rotation.x = Math.PI / 2;
      add(face, new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.12), M.ink), 0, 0, 0.07);
      for (const s of [-1, 1]) add(face, new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), glowM("#ff4d3d")), s * 0.06, 0, 0.04);
      animators.push((tm) => { headG.rotation.y = Math.sin(tm * 0.7) * 0.7; face.rotation.x = Math.sin(tm * 0.5) * 0.15; });
    }
    if (kind === "kamkor") {
      add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 12), M.gold), 0, 0.28, -0.05);
      const unit = new THREE.Group(); unit.position.y = 0.9; g.add(unit);
      add(unit, new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.34, 10, 32), plastic("#eeedf3"))).scale.z = 0.38;
      add(unit, new THREE.Mesh(new THREE.CircleGeometry(0.13, 40), new THREE.MeshStandardMaterial({ color: "#1d1b22", roughness: 0.15, metalness: 0.3 })), 0, 0.12, 0.085);
      const ring = add(unit, new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 48), glowM("#5fd4e6")), 0, 0.12, 0.086);
      add(unit, new THREE.Mesh(new THREE.SphereGeometry(0.035, 18, 12), glowM("#e0662f")), 0.08, -0.12, 0.07);
      const waves = [];
      for (let k = 0; k < 3; k++) { const w = add(unit, new THREE.Mesh(new THREE.TorusGeometry(0.22 + k * 0.12, 0.006, 6, 48, Math.PI * 0.6), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.5 })), 0, 0.12, 0.12 + k * 0.04); w.rotation.z = Math.PI * 0.2; w.castShadow = false; waves.push(w); }
      animators.push((tm) => { ring.material.emissiveIntensity = 0.6 + 0.6 * (0.5 + 0.5 * Math.sin(tm * 2.4)); waves.forEach((w, k) => { const f = (tm * 0.6 + k / 3) % 1; w.scale.setScalar(0.7 + f * 0.8); w.material.opacity = 0.7 * (1 - f); }); });
    }
    return g;
  }
  function blueprintTex(i, labels) {
    const c = document.createElement("canvas"); c.width = 640; c.height = 800; const g = c.getContext("2d");
    g.fillStyle = "#0c1430"; g.fillRect(0, 0, 640, 800);
    g.strokeStyle = "rgba(95,212,230,0.12)"; g.lineWidth = 1; for (let x = 20; x < 640; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 800); g.stroke(); } for (let y = 20; y < 800; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(640, y); g.stroke(); }
    g.strokeStyle = "#5fd4e6"; g.fillStyle = "#e8f8fb"; g.lineWidth = 2.4; g.strokeRect(36, 36, 568, 728);
    const box = (x, tt) => { g.strokeRect(x, 200, 140, 70); g.font = "500 17px 'JetBrains Mono', monospace"; g.textAlign = "center"; g.fillText(tt, x + 70, 241); g.textAlign = "left"; };
    box(70, labels[0]); box(250, labels[1]); box(430, labels[2]);
    g.beginPath(); g.moveTo(210, 235); g.lineTo(250, 235); g.moveTo(390, 235); g.lineTo(430, 235); g.moveTo(500, 270); g.lineTo(500, 330); g.lineTo(140, 330); g.lineTo(140, 270); g.stroke();
    g.font = "500 14px 'JetBrains Mono', monospace"; g.fillText("feedback", 270, 352);
    g.strokeStyle = "#e0b25a"; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= 500; x += 4) { const tt = x / 500, y = 560 - 150 * (1 - Math.exp(-5 * tt) * Math.cos(12 * tt)); x ? g.lineTo(70 + x, y) : g.moveTo(70, y); } g.stroke();
    g.font = "38px Forum, Georgia, serif"; g.fillText("Museum of Ideas", 70, 110);
    g.font = "500 20px 'JetBrains Mono', monospace"; g.fillText(`МИР×АИР · ${String(i + 1).padStart(2, "0")}`, 70, 700);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  }

  HALLS.forEach((p, i) => {
    const side = i % 2 ? 1 : -1, z = EX_Z[i], x = side * 2.7;
    pedestal(x, z);
    const kind = MODEL[p.id];
    const item = kind ? model(kind) : lightbox(p.photos[0]);
    item.position.set(x, 1.16, z);
    if (!kind) item.rotation.y = -side * 0.5;
    scene.add(item);
    if (kind === "kamkor" || !kind) spinning.push(item);
    const wallX = side * (OUTER - 0.02), rot = side * -Math.PI / 2;
    const wallImg = p.photos?.[1] || p.photos?.[0];
    if (wallImg) photo(wallImg, (tx, ar) => { const [w, h] = fit(ar, 2.6, 2.5); framed(tx, w, h, wallX, 3.0, z, rot); });
    else framed(blueprintTex(i, p.id === "kamkor" ? ["RADAR", "ESP32", "TELEGRAM"] : ["LDR ×2", "PI", "SERVO"]), 2.0, 2.5, wallX, 3.0, z, rot);
  });

  /* rotunda lettering */
  (async () => {
    try { await Promise.race([document.fonts.load("200px Forum"), new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}
    const c = document.createElement("canvas"); c.width = 2048; c.height = 640; const g = c.getContext("2d");
    const draw = (txt, size, y, sp, col) => { g.font = `${size}px Forum, Georgia, serif`; if ("letterSpacing" in g) g.letterSpacing = sp + "px"; g.textAlign = "center"; g.shadowColor = col; g.shadowBlur = 24; g.fillStyle = col; g.fillText(txt, 1024, y); };
    draw("МИР×АИР", 250, 290, 30, "#e0b25a");
    draw("AIIiR · MUSEUM OF IDEAS", 84, 440, 24, "#5fd4e6");
    draw("КГТУ им. И. РАЗЗАКОВА", 58, 550, 20, "#ece9f6");
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.repeat.x = -1; tx.offset.x = 1;
    const arc = 1.7;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(RR - 0.08, RR - 0.08, 3.6, 64, 1, true, Math.PI - arc / 2, arc), new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.BackSide, depthWrite: false }));
    band.position.set(0, 8.4, RZ); scene.add(band);
  })();

  /* tour path */
  STOPS.length = 0;
  STOPS.push({ p: new THREE.Vector3(0, 2.5, 18), t: new THREE.Vector3(0, 3.4, -30) });
  EX_Z.forEach((z, i) => { const side = i % 2 ? 1 : -1; STOPS.push({ p: new THREE.Vector3(side * -0.9, 1.95, z + 4.4), t: new THREE.Vector3(side * 2.7, 1.85, z - 0.2) }); });
  STOPS.push({ p: new THREE.Vector3(0, 2.1, PORTALS.at(-1) - 0.5), t: new THREE.Vector3(0, 5.6, RZ - RR) });

  /* free walk input */
  const kmap = { KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r" };
  addEventListener("keydown", (e) => { if (!free) return; const k = kmap[e.code]; if (k) { keys.add(k); e.preventDefault(); } if (e.code === "Escape") toggleFree(); });
  addEventListener("keyup", (e) => { const k = kmap[e.code]; if (k) keys.delete(k); });
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => { if (!free) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => { if (!drag || e.pointerId !== drag.id) return; const sens = coarse ? 0.005 : 0.0035; look.yaw -= (e.clientX - drag.x) * sens; look.pitch = Math.max(-1.2, Math.min(1.2, look.pitch - (e.clientY - drag.y) * sens)); drag.x = e.clientX; drag.y = e.clientY; });
  const endDrag = () => (drag = null);
  canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
  document.querySelectorAll("#pad button").forEach((b) => {
    // on the touch pad ← → turn the view (strafing feels broken on a phone); ↑ ↓ walk
    const k = { l: "tl", r: "tr" }[b.dataset.k] || b.dataset.k;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); keys.add(k); b.setPointerCapture(e.pointerId); });
    const up = () => keys.delete(k);
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
  });
  addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.fov = coarse && innerWidth < innerHeight ? 68 : 55; camera.updateProjectionMatrix(); });

  clock = new THREE.Clock();
  prog = scrollProg();
  tourAt(prog, camera.position, camT); camera.lookAt(camT);
  renderer.compile(scene, camera);
  requestAnimationFrame(() => { frameLoop(); setTimeout(() => $("loader").classList.add("done"), 250); });
}

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function tourAt(p, outP, outT) {
  const k = Math.min(N - 1.0001, Math.max(0, p)), i = Math.floor(k), f = ease(k - i);
  const a = STOPS[i], b = STOPS[i + 1];
  outP.lerpVectors(a.p, b.p, f); outT.lerpVectors(a.t, b.t, f);
  if (narrow()) { const off = (s) => (s >= 1 && s <= H ? 1 : 0); const w = off(i) + (off(i + 1) - off(i)) * f; outT.y -= 0.75 * w; outP.y += 0.15 * w; outP.z += 0.8 * w; }
  const arc = Math.sin(f * Math.PI); outP.x *= 1 - 0.7 * arc; outP.y += 0.35 * arc;
}
function inside(x, z) {
  if (z <= HALL_START + 6 && z >= HALL_END - 0.5 && Math.abs(x) <= OUTER - 0.5) return !EX_Z.some((ez, i) => Math.abs(z - ez) < 1.0 && Math.abs(x - (i % 2 ? 2.7 : -2.7)) < 1.0);
  const dz = z - RZ; return Math.hypot(x, dz) < RR - 2.3 && Math.hypot(x, dz + 1) > 1.8;
}
// The tour camera can stand outside the walkable area (the entrance stop is behind the hall start);
// free walk starts from the nearest point inside, otherwise every step is rejected.
function snapInside(p) {
  if (inside(p.x, p.z)) return;
  p.x = Math.max(-(OUTER - 1), Math.min(OUTER - 1, p.x)); p.z = Math.min(p.z, HALL_START + 5);
  if (!inside(p.x, p.z)) { p.x = 0; p.z = Math.min(p.z, HALL_START + 5); }
  if (!inside(p.x, p.z)) { p.x = 0; p.z = HALL_START; }
}
function walk(dt) {
  if (keys.has("tl")) look.yaw += 1.9 * dt; if (keys.has("tr")) look.yaw -= 1.9 * dt;
  const speed = 4.2 * dt, fw = new THREE.Vector3(-Math.sin(look.yaw), 0, -Math.cos(look.yaw)), rt = new THREE.Vector3(-fw.z, 0, fw.x), mv = new THREE.Vector3();
  if (keys.has("f")) mv.add(fw); if (keys.has("b")) mv.sub(fw); if (keys.has("r")) mv.add(rt); if (keys.has("l")) mv.sub(rt);
  if (mv.lengthSq()) { mv.normalize().multiplyScalar(speed); const p = camera.position, out = !inside(p.x, p.z); if (out || inside(p.x + mv.x, p.z)) p.x += mv.x; if (out || inside(p.x, p.z + mv.z)) p.z += mv.z; }
  camera.position.y += (1.75 - camera.position.y) * 0.1; camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");
}
function updateUI(p) {
  const near = Math.round(p), stop = Math.abs(p - near) < 0.3 ? near : -1;
  $("intro").classList.toggle("gone", p > 0.25); $("hint").classList.toggle("gone", p > 0.08);
  if (stop !== currentStop) { currentStop = stop; if (stop >= 1 && stop <= H) fillPanel(stop - 1); document.querySelectorAll("#rail button").forEach((b, i) => b.classList.toggle("on", i === stop)); }
  $("panel").classList.toggle("on", !free && stop >= 1 && stop <= H);
  $("final").classList.toggle("on", !free && p > N - 1.35);
}
const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), camT = new THREE.Vector3(), fwd = new THREE.Vector3(), SUN_OFFSET = new THREE.Vector3(16, 30, 9);
function frameLoop() {
  requestAnimationFrame(frameLoop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!museumOn) return;
  if (free) { walk(dt); updateUI(-1); }
  else {
    prog += (scrollProg() - prog) * (reduced ? 1 : 1 - Math.pow(0.0015, dt));
    tourAt(prog, tmpP, tmpT); const k = 1 - Math.pow(0.002, dt);
    camera.position.lerp(tmpP, k); camT.lerp(tmpT, k); camera.lookAt(camT); updateUI(prog);
  }
  if (!reduced) spinning.forEach((m, i) => (m.rotation.y += dt * (0.22 + i * 0.015)));
  const now = reduced ? 0 : clock.elapsedTime; animators.forEach((fn) => fn(now));
  camera.getWorldDirection(fwd); sun.target.position.copy(camera.position).addScaledVector(fwd, 9).setY(0); sun.position.copy(sun.target.position).add(SUN_OFFSET);
  renderer.render(scene, camera);
}

applyI18n();
route();

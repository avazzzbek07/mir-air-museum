import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* ============================================================
   Data comes from data.js (SITE, GROUPS, ROLE_RU, TEAM, ITEMS, ACHIEVEMENTS).
   Example placeholders are hidden unless SITE.showExamples is true.
   ============================================================ */
const PROJECTS = ITEMS.filter((p) => SITE.showExamples || !p.example);
const ACH = ACHIEVEMENTS.filter((a) => SITE.showExamples || !a.example);
const BYID = Object.fromEntries(PROJECTS.filter((p) => p.id).map((p) => [p.id, p]));
const GROUP = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
const BOT_URL = SITE.bot ? `https://t.me/${SITE.bot}` : "";

/* Halls of the 3D museum, entrance to rotunda. Projects with photos stand in light boxes;
   the two without photos get procedural models. */
const HALLS = ["starys", "cyberbuddy", "esp32-mini-radar", "glove-mouse", "smartsprout", "pixie", "esp32-rc-car", "kamkor", "sunflower"]
  .filter((id) => BYID[id]).map((id) => BYID[id]);
const MODEL = { kamkor: "kamkor", sunflower: "sunflower" };
const ACCENT = ["#2f3f9e", "#3d8c5a", "#a9853b", "#8a3b5a", "#2e7d8c", "#c08a2a", "#5a4fa0", "#2f3f9e", "#e0a526"];

const STATUS = { idea: "На обсуждении", work: "В работе", demo: "Демо готово", best: "Лучший проект" };
const TYPE = { idea: "Идея", project: "Проект", demo: "Демо", site: "Сайт" };

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const groupsOf = (p) => p.groups || (p.group ? [p.group] : []);
const gname = (id) => GROUP[id]?.name || id;
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2600);
}

/* ============================================================
   Pages
   ============================================================ */
const statusChip = (s) => `<span class="chip st-${esc(s)}">${esc(STATUS[s] || s)}</span>`;
const groupChips = (p) => {
  const gs = groupsOf(p);
  return gs.map((g) => `<span class="gchip">${esc(gname(g))}</span>`).join("") + (gs.length > 1 ? `<span class="gchip">Смешанная команда</span>` : "");
};
const cover = (p) => p.photos?.length
  ? `<img src="${esc(p.photos[0])}" alt="${esc(p.title)}" loading="lazy">`
  : `<div class="blueprint" aria-hidden="true">${esc(p.title.split(":")[0])}</div>`;

function card(p) {
  return `<a class="pcard" href="#p-${esc(p.id)}">
    <div class="pimg">${cover(p)}</div>
    <div class="pbody">
      <div class="pmeta">${statusChip(p.status)}${groupChips(p)}</div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.desc)}</p>
      <div class="tags">${(p.tags || []).slice(0, 5).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      <div class="by">${esc(p.author)}</div>
    </div>
  </a>`;
}

const footer = () => `<footer class="foot">
  <div>© 2026 МИР×АИР · AIIiR Museum of Ideas · КГТУ им. И. Раззакова</div>
  <nav><a href="#top">Музей</a><a href="#projects">Проекты</a><a href="#groups">Группы</a><a href="#ideas">Банк идей</a><a href="#support">Поддержать</a></nav>
</footer>`;

const steps4 = `<ol class="steps">
  <li><b>Предложи идею</b><span>Напиши её нашему боту в Telegram: что хочешь сделать и зачем.</span></li>
  <li><b>Обсуждаем</b><span>Команда смотрит идеи, объединяется в группы и уточняет задачи.</span></li>
  <li><b>Делаем</b><span>Идея превращается в прототип, демо или сайт. Ссылки добавляем в раздел «Проекты».</span></li>
  <li><b>Выбираем лучшее</b><span>Команда выбирает лучший проект, и он попадает на главное место.</span></li>
</ol>`;

const PAGES = {
  about() {
    const built = PROJECTS.filter((p) => p.type !== "idea").length;
    return `<div class="head"><div class="eyebrow">О нас · первый курс</div><h1>Мы первокурсники с большими амбициями</h1>
      <p>Мы только начали учиться, но растём с каждым днём и развиваемся сразу в разных направлениях: мехатроника, робототехника, автоматизация и искусственный интеллект. Здесь наши идеи, проекты и первые победы.</p></div>
    <div class="stats">
      <div class="stat"><b>${SITE.total}</b><span>студентов</span></div>
      <div class="stat"><b>${GROUPS.length}</b><span>группы</span></div>
      <div class="stat"><b>${built}</b><span>${plural(built, "проект", "проекта", "проектов")}</span></div>
      <div class="stat"><b>${ACH.length}</b><span>международная победа</span></div>
    </div>
    <section class="block"><h2 class="sec">Кто мы</h2>
      <p class="lede">Соединяем железо и интеллект: от механики и датчиков до нейросетей и систем управления. Развиваемся в разных направлениях и делаем проекты вместе.</p>
      <div class="grid">
        <div class="tile"><h3>Мехатроника</h3><p>Соединяем механику, электронику и программирование в одном устройстве.</p></div>
        <div class="tile"><h3>Робототехника</h3><p>Проектируем и собираем роботов, манипуляторы и мобильные платформы.</p></div>
        <div class="tile"><h3>Автоматизация</h3><p>Автоматизируем процессы и пишем алгоритмы управления.</p></div>
        <div class="tile"><h3>Искусственный интеллект</h3><p>Обучаем модели и делаем системы, которые принимают решения.</p></div>
      </div></section>
    <section class="block"><h2 class="sec">Как рождаются проекты</h2>${steps4}</section>
    <section class="block"><h2 class="sec">Наши группы</h2>${groupCards()}</section>`;
  },

  projects() {
    const tagCount = {};
    return `<div class="head"><div class="eyebrow">Портфолио · ${PROJECTS.length} ${plural(PROJECTS.length, "запись", "записи", "записей")}</div><h1>Наши проекты</h1>
      <p>Проекты, демо и идеи групп МИР-1, МИР-2 и МИР-3. Ищите по названию, технологии или автору, фильтруйте по группе, типу и статусу.</p></div>
    <section class="block">
      <div class="filters">
        <div class="field grow"><label for="q">Поиск</label><input id="q" type="search" placeholder="ESP32, радар, Шаршенбеков…" value="${esc(filt.q)}"></div>
        <div class="field"><label>Группа</label><div class="seg" data-f="g">${seg("g", [["all", "Все"], ...GROUPS.map((g) => [g.id, g.name])])}</div></div>
        <div class="field"><label>Тип</label><div class="seg" data-f="t">${seg("t", [["all", "Все"], ["project", "Проекты"], ["demo", "Демо"], ["site", "Сайты"], ["idea", "Идеи"]])}</div></div>
        <div class="field"><label>Статус</label><div class="seg" data-f="s">${seg("s", [["all", "Все"], ["work", "В работе"], ["demo", "Демо готово"], ["best", "Лучший"], ["idea", "Идея"]])}</div></div>
      </div>
      <div class="count" id="pcount"></div>
      <div class="grid" id="plist"></div>
    </section>`;
  },

  groups() {
    return `<div class="head"><div class="eyebrow">Состав · ${SITE.total} студентов</div><h1>Наши группы</h1>
      <p>Три группы первого курса направления «Мехатроника и робототехника». Откройте группу, чтобы увидеть состав, команды и проекты.</p></div>
      ${groupCards()}`;
  },

  achievements() {
    return `<div class="head"><div class="eyebrow">Победы и события</div><h1>Наши достижения</h1>
      <p>Победы, награды и события, которые подтверждают результат.</p></div>
    <section class="block">${ACH.map(achRow).join("") || `<div class="empty">Достижения скоро появятся.</div>`}</section>
    <section class="block"><h2 class="sec">Фото с игр</h2>${gallery()}</section>`;
  },

  ideas() {
    return `<div class="head"><div class="eyebrow">Банк идей</div><h1>Есть идея проекта?</h1>
      <p>Расскажите о ней нашему Telegram-боту. Идеи собираются в общий банк, команда выбирает лучшие, и они становятся проектами.</p></div>
    ${BOT_URL ? `<section class="block"><div class="botbox">
      <img class="qr" src="img/bot-qr.png" alt="QR-код бота @${esc(SITE.bot)}">
      <div class="facts"><h2 class="sec">@${esc(SITE.bot)}</h2>
        <p class="lede">Откройте бота или отсканируйте QR-код камерой телефона. Напишите идею: что хотите сделать и зачем. Команда обсудит её и поможет собрать людей.</p>
        <div class="links"><a class="btn solid" href="${esc(BOT_URL)}" target="_blank" rel="noopener">Открыть бота</a></div>
        <p class="note">Ссылка: ${esc(BOT_URL)}</p></div></div></section>` : ""}
    <section class="block"><h2 class="sec">Подготовить идею</h2>
      <p class="lede">Заполните поля, и сайт соберёт сообщение для бота. Нажмите кнопку: текст скопируется, а бот откроется в новой вкладке. Останется вставить текст и отправить.</p>
      <form class="form" id="ideaForm">
        <div class="field full"><label for="idea-title">Название идеи</label><input id="idea-title" required maxlength="120" placeholder="Например: умная теплица на ESP32"></div>
        <div class="field full"><label for="idea-text">Что хотите сделать и зачем</label><textarea id="idea-text" required maxlength="1500" placeholder="Какую проблему решает, как может работать, что понадобится"></textarea></div>
        <div class="field"><label for="idea-author">Ваше имя</label><input id="idea-author" maxlength="80" placeholder="Фамилия Имя"></div>
        <div class="field"><label for="idea-group">Группа</label><select id="idea-group"><option value="">Не указана</option>${GROUPS.map((g) => `<option value="${esc(g.full)}">${esc(g.full)}</option>`).join("")}</select></div>
        <div class="field full"><label for="idea-out">Сообщение для бота</label><textarea id="idea-out" readonly></textarea></div>
        <div class="full"><button class="btn solid" type="submit" id="idea-send">Скопировать и открыть бота</button></div>
      </form></section>
    <section class="block"><h2 class="sec">Как рождаются проекты</h2>${steps4}</section>
    <section class="block"><h2 class="sec">Идеи на обсуждении</h2>
      <div class="grid">${PROJECTS.filter((p) => p.status === "idea").map(card).join("") || `<div class="empty">Пока пусто: предложите первую идею.</div>`}</div></section>`;
  },

  news() {
    return `<div class="head"><div class="eyebrow">Новости и галерея</div><h1>Чем мы живём и где бываем</h1></div>
    <section class="block news">
      <img src="img/news-kabar.jpg" alt="Кыргызские студенты стали лучшими медиаспециалистами на Космических играх">
      <div class="facts"><div class="eyebrow">Новость · Кабар</div>
        <h2 class="sec">Кыргызские студенты стали лучшими медиаспециалистами на Космических играх</h2>
        <p class="lede">Международные космические игры прошли в Москве на площадке МГТУ им. Н. Э. Баумана. О нашем успехе написало Кыргызское национальное информационное агентство «Кабар».</p>
        <div class="links"><a class="btn" href="https://kabar.kg" target="_blank" rel="noopener">Источник: kabar.kg</a></div></div>
    </section>
    <section class="block"><h2 class="sec">Галерея</h2>${gallery()}</section>
    <section class="block"><h2 class="sec">Наши проекты на защите</h2>
      <p class="lede">Короткий ролик с презентаций: ребята показывают свои работы вживую. Робот, автоматический полив, сборка на Arduino и модульные кубы для базы на Марсе.</p>
      <video controls preload="metadata" playsinline src="media/projects.mp4"></video>
      <div class="links"><a class="btn" href="#projects">Смотреть все проекты</a></div></section>`;
  },

  support() {
    const items = [
      ["Оборудование и комплектующие", "Датчики, контроллеры, двигатели, 3D-принтер и материалы для сборки роботов и стендов."],
      ["Конкурсы и хакатоны", "Поездки, взносы и подготовка команды к соревнованиям, как на Международных космических играх."],
      ["Вычисления и сервисы", "Серверы и облачные мощности для обучения нейросетей, хостинг сайтов и демо."],
      ["Демонстрации и стенды", "Корпуса, печать, оформление стендов и материалы, чтобы показывать результат на выставках."],
    ];
    const c = SITE.curator || {};
    const contacts = [c.name && `Куратор: ${esc(c.name)}`, c.email && esc(c.email), c.phone && esc(c.phone)].filter(Boolean);
    return `<div class="head"><div class="eyebrow">Поддержать команду</div><h1>Бюджет превращается в работающие проекты</h1>
      <p>Вот на что пойдёт поддержка.</p></div>
    <div class="grid two">${items.map(([h, t], i) => `<div class="tile"><h3>${esc(h)}</h3><p>${esc(t)}</p>${SITE.sums?.[i] ? `<div class="chip st-best">${esc(SITE.sums[i])}</div>` : ""}</div>`).join("")}</div>
    <section class="block"><h2 class="sec">Хотите обсудить сотрудничество?</h2>
      <p class="lede">${contacts.length ? contacts.join(" · ") : "Напишите нам через Telegram-бота: сообщение увидит команда и куратор."}</p>
      <div class="links">${SITE.telegram ? `<a class="btn solid" href="${esc(SITE.telegram)}" target="_blank" rel="noopener">Наш Telegram</a>` : ""}${BOT_URL ? `<a class="btn${SITE.telegram ? "" : " solid"}" href="${esc(BOT_URL)}" target="_blank" rel="noopener">Написать боту @${esc(SITE.bot)}</a>` : ""}</div></section>`;
  },
};

function groupCards() {
  return `<div class="grid">${GROUPS.map((g) => {
    const n = PROJECTS.filter((p) => groupsOf(p).includes(g.id)).length;
    return `<a class="tile gcard" href="#g-${esc(g.id)}"><div class="eyebrow">${esc(g.full)}</div><div class="big">${esc(g.name)}</div>
      <p>${esc(g.about)}</p><p class="note">${g.size} ${plural(g.size, "студент", "студента", "студентов")} · ${n} ${plural(n, "проект", "проекта", "проектов")}</p></a>`;
  }).join("")}</div>`;
}
const achRow = (a) => `<div class="ach"><div class="when">${esc(a.date)}</div><div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div></div>`;
const gallery = () => `<div class="photos">
  <figure><img src="img/games-stage.jpg" alt="Команда с флагом Кыргызстана на сцене игр" loading="lazy"><figcaption>Международные космические игры</figcaption></figure>
  <figure><img src="img/games-field.jpg" alt="Команда в оранжевых комбинезонах на площадке игр" loading="lazy"><figcaption>На площадке игр</figcaption></figure>
  <figure><img src="img/moscow.jpg" alt="Команда на Красной площади" loading="lazy"><figcaption>Красная площадь, Москва</figcaption></figure>
</div>`;

function projectPage(p) {
  const s = p.story || {};
  const hall = HALLS.indexOf(p) + 1;
  const tbl = (rows, a, b) => `<div class="scroll-x"><table class="kv"><thead><tr><th>${a}</th><th>${b}</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>`;
  const photos = p.photos || [];
  return `<a class="back" href="#projects">← Все проекты</a>
  <div class="proj">
    <div class="gallery">${photos.length
      ? `<img class="main" id="gMain" src="${esc(photos[0])}" alt="${esc(p.title)}">${photos.length > 1 ? `<div class="thumbs">${photos.map((ph, i) => `<button type="button" data-ph="${esc(ph)}" aria-pressed="${i === 0}" aria-label="Фото ${i + 1}"><img src="${esc(ph)}" alt=""></button>`).join("")}</div>` : ""}`
      : `<div class="pimg">${cover(p)}</div>`}</div>
    <div class="facts">
      <div class="pmeta">${statusChip(p.status)}<span class="gchip">${esc(TYPE[p.type] || p.type)}</span>${groupChips(p)}</div>
      <h1 class="sec" style="font-size:clamp(34px,4.6vw,52px)">${esc(p.title)}</h1>
      <p class="lede">${esc(p.desc)}</p>
      <div class="tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      <p class="note">Авторы: ${esc(p.author)}</p>
      <div class="links">
        ${p.demo ? `<a class="btn solid" href="${esc(p.demo)}" target="_blank" rel="noopener">Демо</a>` : ""}
        ${p.repo ? `<a class="btn" href="${esc(p.repo)}" target="_blank" rel="noopener">Код</a>` : ""}
        ${p.slides ? `<a class="btn" href="${esc(p.slides)}" target="_blank" rel="noopener">Презентация (PDF)</a>` : ""}
        ${hall ? `<a class="btn" href="#hall-${hall}">Смотреть в музее · зал ${hall}</a>` : ""}
      </div>
    </div>
  </div>
  ${s.problem || s.solution || s.result ? `<section class="block"><div class="story">
    ${s.problem ? `<div class="tile"><div class="eyebrow">Проблема</div><p>${esc(s.problem)}</p></div>` : ""}
    ${s.solution ? `<div class="tile"><div class="eyebrow">Решение</div><p>${esc(s.solution)}</p></div>` : ""}
    ${s.result ? `<div class="tile"><div class="eyebrow">Результат</div><p>${esc(s.result)}</p></div>` : ""}
  </div></section>` : ""}
  ${s.steps?.length ? `<section class="block"><h2 class="sec">Как работает</h2><ol class="steps">${s.steps.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join("")}</ol></section>` : ""}
  ${s.parts?.length ? `<section class="block"><h2 class="sec">Из чего собрано</h2>${tbl(s.parts, "Компонент", "Назначение")}</section>` : ""}
  ${s.team?.length ? `<section class="block"><h2 class="sec">Команда</h2>${tbl(s.team, "Участник", "Чем занимался")}</section>` : ""}
  ${s.next?.length ? `<section class="block"><h2 class="sec">Что дальше</h2>${tbl(s.next, "Улучшение", "Описание")}</section>` : ""}
  ${s.code ? `<section class="block"><h2 class="sec">Фрагмент кода</h2><pre class="code"><code>${esc(s.code)}</code></pre></section>` : ""}`;
}

function groupPage(g) {
  const items = PROJECTS.filter((p) => groupsOf(p).includes(g.id));
  const ach = ACH.filter((a) => a.group === g.id);
  const roster = g.flat
    ? `<ol class="flatlist">${g.squads.flatMap((sq) => sq.teams.flatMap((t) => t.members)).map((m) => `<li>${esc(m.name)}</li>`).join("")}</ol>`
    : g.squads.map((sq) => `<div class="squad"><h3>${esc(sq.name)}</h3>${sq.director ? `<p class="note">Руководитель отряда: ${esc(sq.director)}</p>` : ""}
        <div class="grid">${sq.teams.map((t) => `<div class="tile team"><h4>${esc(t.name)}</h4><ul class="members">${t.members.map((m) => `<li><span class="${m.lead ? "lead" : ""}">${esc(m.name)}${m.lead ? " · тимлид" : ""}</span><span class="role">${esc(ROLE_RU[m.role] || "")}</span></li>`).join("")}</ul></div>`).join("")}</div></div>`).join("");
  return `<a class="back" href="#groups">← Все группы</a>
  <div class="head"><div class="eyebrow">${esc(g.full)} · ${g.size} ${plural(g.size, "студент", "студента", "студентов")}</div><h1>${esc(g.name)}</h1><p>${esc(g.about)}</p></div>
  <section class="block"><h2 class="sec">Проекты группы</h2><div class="grid">${items.map(card).join("") || `<div class="empty">Проекты группы скоро появятся. Предложите идею в <a href="#ideas">банке идей</a>.</div>`}</div></section>
  ${ach.length ? `<section class="block"><h2 class="sec">Достижения</h2>${ach.map(achRow).join("")}</section>` : ""}
  <section class="block"><h2 class="sec">Состав</h2>${roster}</section>`;
}

/* ---------- projects filter ---------- */
const filt = { q: "", g: "all", t: "all", s: "all" };
const seg = (k, opts) => opts.map(([v, l]) => `<button type="button" data-v="${esc(v)}" aria-pressed="${filt[k] === v}">${esc(l)}</button>`).join("");
function renderList() {
  const q = filt.q.trim().toLowerCase();
  const rows = PROJECTS.filter((p) =>
    (filt.g === "all" || groupsOf(p).includes(filt.g)) &&
    (filt.t === "all" || p.type === filt.t) &&
    (filt.s === "all" || p.status === filt.s) &&
    (!q || [p.title, p.desc, p.author, ...(p.tags || [])].join(" ").toLowerCase().includes(q)));
  const best = rows.filter((p) => p.status === "best"), rest = rows.filter((p) => p.status !== "best");
  $("plist").innerHTML = [...best, ...rest].map(card).join("") || `<div class="empty">Ничего не нашлось. Сбросьте фильтры или измените запрос.</div>`;
  $("pcount").textContent = `Показано: ${rows.length} из ${PROJECTS.length}`;
}

/* ---------- router ---------- */
let museumOn = false, museumScroll = 0;
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  const alias = { bank: "ideas", photos: "news", top: "", museum: "" };
  const r = h in alias ? alias[h] : h;
  $("nav").classList.remove("open"); $("menuBtn").setAttribute("aria-expanded", "false");
  if (!r || /^hall-\d+$/.test(r)) return showMuseum(r);
  let html, key = r;
  if (PAGES[r]) html = PAGES[r]();
  else if (r.startsWith("p-") && BYID[r.slice(2)]) { html = projectPage(BYID[r.slice(2)]); key = "projects"; }
  else if (r.startsWith("g-") && GROUP[r.slice(2)]) { html = groupPage(GROUP[r.slice(2)]); key = "groups"; }
  else if (GROUP[r]) { html = groupPage(GROUP[r]); key = "groups"; }
  else html = `<div class="head"><h1>Страница не найдена</h1><p>Такого раздела нет. <a href="#top">Вернуться в музей</a> или открыть <a href="#projects">проекты</a>.</p></div>`;
  if (museumOn) museumScroll = scrollY;
  museumOn = false;
  if (free) toggleFree();
  document.body.classList.add("page");
  $("page").innerHTML = `<div class="wrap">${html}${footer()}</div>`;
  document.querySelectorAll("#nav a").forEach((a) => (a.dataset.r === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  window.scrollTo(0, 0);
  if (key === "projects" && $("plist")) renderList();
  if (r === "ideas") updateIdea();
}
function showMuseum(r) {
  const wasPage = !museumOn;
  museumOn = true;
  document.body.classList.remove("page");
  document.querySelectorAll("#nav a").forEach((a) => (a.dataset.r === "museum" ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  sizeTrack();
  const m = /^hall-(\d+)$/.exec(r || "");
  if (m) { goStop(Math.min(+m[1], N - 1), true); }
  else if (wasPage) window.scrollTo(0, museumScroll);
  prog = scrollProg();
  if (!started) startMuseum();
}
addEventListener("hashchange", route);

/* page-level interactions (delegated, so re-rendering never loses handlers) */
$("page").addEventListener("input", (e) => {
  if (e.target.id === "q") { filt.q = e.target.value; renderList(); }
  if (e.target.closest("#ideaForm")) updateIdea();
});
$("page").addEventListener("change", (e) => { if (e.target.closest("#ideaForm")) updateIdea(); });
$("page").addEventListener("click", (e) => {
  const b = e.target.closest(".seg button");
  if (b) {
    const k = b.parentElement.dataset.f; filt[k] = b.dataset.v;
    b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderList(); return;
  }
  const th = e.target.closest(".thumbs button");
  if (th) { $("gMain").src = th.dataset.ph; th.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === th))); }
});
function ideaText() {
  const v = (id) => ($(id)?.value || "").trim();
  return [`Идея: ${v("idea-title")}`, v("idea-text"), v("idea-author") && `Автор: ${v("idea-author")}`, v("idea-group") && `Группа: ${v("idea-group")}`].filter(Boolean).join("\n\n");
}
function updateIdea() { if ($("idea-out")) $("idea-out").value = $("idea-title").value || $("idea-text").value ? ideaText() : ""; }
$("page").addEventListener("submit", async (e) => {
  if (e.target.id !== "ideaForm") return;
  e.preventDefault();
  const text = ideaText(), out = $("idea-out");
  let copied = false;
  try { await navigator.clipboard.writeText(text); copied = true; } catch (err) { out.focus(); out.select(); }
  if (BOT_URL) window.open(BOT_URL, "_blank", "noopener");
  toast(copied ? "Текст скопирован. Вставьте его в чат с ботом и отправьте." : "Текст выделен: скопируйте его и отправьте боту.");
});
$("menuBtn").addEventListener("click", () => {
  const open = $("nav").classList.toggle("open");
  $("menuBtn").setAttribute("aria-expanded", String(open));
});

/* ============================================================
   3D museum
   ============================================================ */
const coarse = matchMedia("(pointer: coarse)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let free = false, started = false, renderer = null;
let currentStop = -1;

const H = HALLS.length;
const N = H + 2; // entrance + halls + rotunda
const HALL_START = 10, NAVE = 5.2, OUTER = 8.5, RR = 11, STEP = 12;
const PORTALS = Array.from({ length: H + 2 }, (_, i) => HALL_START - STEP * i);
const EX_Z = HALLS.map((_, i) => -8 - STEP * i);
const HALL_END = PORTALS.at(-1) - 5.1, RZ = HALL_END - 6.9;

function sizeTrack() { $("track").style.height = `${(N - 1) * 105 + 100}vh`; }
function scrollProg() { const max = document.documentElement.scrollHeight - innerHeight; return max > 0 ? (scrollY / max) * (N - 1) : 0; }
function goStop(i, instant) {
  const max = document.documentElement.scrollHeight - innerHeight;
  window.scrollTo({ top: (i / (N - 1)) * max, behavior: instant || reduced ? "auto" : "smooth" });
}
let prog = 0;

function stopLabel(i) { return i === 0 ? "Вход" : i === N - 1 ? "Ротонда: достижения" : `Зал ${i}: ${HALLS[i - 1].title}`; }
function renderRail() {
  const rail = $("rail"); rail.innerHTML = "";
  for (let i = 0; i < N; i++) {
    const b = document.createElement("button"); b.type = "button";
    b.setAttribute("aria-label", stopLabel(i)); b.title = stopLabel(i);
    b.addEventListener("click", () => goStop(i));
    rail.appendChild(b);
  }
}
function fillPanel(i) {
  const p = HALLS[i];
  $("pNo").textContent = `Зал ${i + 1}`;
  $("pCat").textContent = groupsOf(p).map(gname).join(" + ");
  $("pTitle").textContent = p.title;
  $("pDesc").textContent = p.desc;
  $("pTech").textContent = (p.tags || []).slice(0, 4).join(", ");
  $("pAuthor").textContent = p.author;
  $("pStatus").textContent = STATUS[p.status] || p.status;
  $("pLink").href = `#p-${p.id}`;
  // exhibits alternate sides; the card takes the opposite side so it never covers the photo
  $("panel").classList.toggle("right", i % 2 === 0);
}

/* the hall card can be collapsed; narrow screens start collapsed, the choice is remembered */
const narrow = () => innerWidth < 720;
let panelMini = narrow();
try { const v = localStorage.getItem("mirair-panel"); if (v) panelMini = v === "mini"; } catch (e) {}
function applyPanel() {
  $("panel").classList.toggle("mini", panelMini);
  $("pToggle").textContent = panelMini ? "Подробнее" : "Свернуть";
  $("pToggle").setAttribute("aria-expanded", String(!panelMini));
}
$("pToggle").addEventListener("click", () => {
  panelMini = !panelMini; applyPanel();
  try { localStorage.setItem("mirair-panel", panelMini ? "mini" : "full"); } catch (e) {}
});
applyPanel();

$("toTop").addEventListener("click", (e) => {
  e.preventDefault();
  if (location.hash && location.hash !== "#top") { museumScroll = 0; location.hash = "top"; return; }
  if (free) toggleFree(); goStop(0);
});

function toggleFree() {
  free = !free;
  document.body.classList.toggle("free", free);
  $("freeHelp").hidden = !free;
  $("pad").hidden = !(free && coarse);
  $("walkBtn").textContent = free ? "К маршруту" : "Гулять свободно";
  if (!camera) return;
  if (free) {
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    look.yaw = Math.atan2(-dir.x, -dir.z); look.pitch = Math.asin(dir.y);
    camera.position.y = 1.75;
  } else { keys.clear(); prog = scrollProg(); }
}
$("walkBtn").addEventListener("click", toggleFree);
$("freeHelp").textContent = coarse ? "Тяните пальцем — смотреть · кнопки — идти" : "WASD или стрелки — идти · тяните мышью — смотреть · Esc — к маршруту";

let camera, scene, sun, clock, look = { yaw: 0, pitch: 0 }, keys = new Set();
const spinning = [], animators = [];

function startMuseum() {
  started = true;
  renderRail();
  const canvas = $("scene");
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    $("loader").innerHTML = '<p class="err">Этот браузер не поддерживает WebGL, поэтому 3D-музей не открывается. Все проекты доступны в разделе <a href="#projects">«Проекты»</a>.</p>';
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color("#e4e2f0"), 30, 110);
  camera = new THREE.PerspectiveCamera(coarse && innerWidth < innerHeight ? 68 : 55, innerWidth / innerHeight, 0.1, 600);

  /* sky + environment */
  function makeSky() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color("#8fb0e2") }, mid: { value: new THREE.Color("#d6dcf2") }, bottom: { value: new THREE.Color("#ece9f4") } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.6)) : mix(mid, bottom, min(-h*4.0,1.0)); gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}",
    });
    return new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), mat);
  }
  scene.add(makeSky());
  {
    const pm = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene(); envScene.add(makeSky());
    const warm = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: "#fff6ea", side: THREE.DoubleSide }));
    warm.position.set(0, 250, 0); warm.rotation.x = Math.PI / 2; envScene.add(warm);
    scene.environment = pm.fromScene(envScene, 0.04).texture;
    scene.environmentIntensity = 1.1;
  }
  scene.add(new THREE.HemisphereLight("#eef0ff", "#e4deea", 1.9));
  sun = new THREE.DirectionalLight("#fff3e3", 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  /* textures */
  function marble(size, tiles, seed = 1) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const g = c.getContext("2d");
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    g.fillStyle = "#f6f5f9"; g.fillRect(0, 0, size, size);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(150,145,175,${rnd() * 0.035})`; const r = rnd() * size * 0.18; g.beginPath(); g.arc(rnd() * size, rnd() * size, r, 0, 7); g.fill(); }
    g.filter = "blur(0.6px)";
    for (let v = 0; v < 16; v++) {
      let x = rnd() * size, y = rnd() * size, a = rnd() * Math.PI * 2;
      g.strokeStyle = `rgba(140,134,165,${0.05 + rnd() * 0.12})`; g.lineWidth = 0.6 + rnd() * 2.2;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 160; k++) { a += (rnd() - 0.5) * 0.5; x += Math.cos(a) * 6; y += Math.sin(a) * 6; g.lineTo(x, y); }
      g.stroke();
    }
    g.filter = "none";
    if (tiles) { g.strokeStyle = "rgba(120,115,140,0.16)"; g.lineWidth = 2; for (let k = 0; k <= 2; k++) { g.beginPath(); g.moveTo(k * size / 2, 0); g.lineTo(k * size / 2, size); g.moveTo(0, k * size / 2); g.lineTo(size, k * size / 2); g.stroke(); } }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    return t;
  }
  function blueprint(i, color, labels) {
    const c = document.createElement("canvas"); c.width = 640; c.height = 800;
    const g = c.getContext("2d");
    g.fillStyle = "#1e3577"; g.fillRect(0, 0, 640, 800);
    g.strokeStyle = "rgba(255,255,255,0.08)"; g.lineWidth = 1;
    for (let x = 20; x < 640; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 800); g.stroke(); }
    for (let y = 20; y < 800; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(640, y); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 2.5; g.strokeRect(36, 36, 568, 728);
    g.fillStyle = "rgba(255,255,255,0.92)"; g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 2.4;
    const box = (x, y, w, h, t) => { g.strokeRect(x, y, w, h); g.font = "500 17px 'JetBrains Mono', monospace"; g.textAlign = "center"; g.fillText(t, x + w / 2, y + h / 2 + 6); g.textAlign = "left"; };
    const arrow = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 12 * Math.cos(a - 0.4), y2 - 12 * Math.sin(a - 0.4)); g.lineTo(x2 - 12 * Math.cos(a + 0.4), y2 - 12 * Math.sin(a + 0.4)); g.closePath(); g.fill(); };
    box(70, 200, 140, 70, labels[0]); box(250, 200, 140, 70, labels[1]); box(430, 200, 140, 70, labels[2]);
    arrow(210, 235, 248, 235); arrow(390, 235, 428, 235);
    g.beginPath(); g.moveTo(500, 270); g.lineTo(500, 330); g.lineTo(140, 330); g.stroke(); arrow(140, 330, 140, 272);
    g.font = "500 14px 'JetBrains Mono', monospace"; g.fillText("feedback", 270, 352);
    g.strokeStyle = color; g.lineWidth = 3;
    g.beginPath(); for (let x = 0; x <= 500; x += 4) { const t = x / 500, y = 560 - 150 * (1 - Math.exp(-5 * t) * Math.cos(12 * t)); x ? g.lineTo(70 + x, y) : g.moveTo(70, y); } g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(70, 420); g.lineTo(70, 580); g.lineTo(590, 580); g.stroke();
    g.setLineDash([6, 6]); g.beginPath(); g.moveTo(70, 410); g.lineTo(590, 410); g.stroke(); g.setLineDash([]);
    g.font = "500 14px 'JetBrains Mono', monospace"; g.fillText("y(t)", 80, 430); g.fillText("t", 575, 600);
    g.font = "38px Forum, Georgia, serif"; g.fillText("Museum of Ideas", 70, 110);
    g.font = "500 20px 'JetBrains Mono', monospace"; g.fillText(`МИР×АИР · ЗАЛ ${String(i + 1).padStart(2, "0")}`, 70, 700);
    g.fillStyle = color; g.fillRect(70, 720, 120, 6);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
    return t;
  }
  const loader = new THREE.TextureLoader();
  function photo(url, onReady) {
    loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; onReady(t, t.image.width / t.image.height); }, undefined, () => {});
  }

  /* materials */
  const span = HALL_START + 30 - (RZ - RR - 24);
  const floorTex = marble(1024, true, 7); floorTex.repeat.set(10, span / 4.1);
  const wallTex = marble(1024, false, 3); wallTex.repeat.set(4, 1);
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.28, metalness: 0 }),
    wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.7 }),
    stone: new THREE.MeshStandardMaterial({ color: "#f4f3f8", roughness: 0.62 }),
    gold: new THREE.MeshStandardMaterial({ color: "#d8b25e", roughness: 0.3, metalness: 0.55 }),
    ink: new THREE.MeshStandardMaterial({ color: "#1d1b22", roughness: 0.75 }),
  };
  function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const add = (parent, m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };

  /* architecture */
  const floor = mesh(new THREE.PlaneGeometry(44, span), M.floor, 0, 0, HALL_START + 30 - span / 2);
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  function column(x, z, h = 5.5, r = 0.36) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    mesh(new THREE.BoxGeometry(r * 2.8, 0.3, r * 2.8), M.stone, 0, 0.15, 0, g);
    mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.3, 0.22, 24), M.stone, 0, 0.41, 0, g);
    mesh(new THREE.CylinderGeometry(r * 0.88, r, h - 1.0, 28), M.stone, 0, 0.52 + (h - 1.0) / 2, 0, g);
    mesh(new THREE.CylinderGeometry(r * 1.25, r * 0.9, 0.24, 24), M.stone, 0, h - 0.36, 0, g);
    mesh(new THREE.BoxGeometry(r * 3.0, 0.24, r * 2.2), M.stone, 0, h - 0.12, 0, g);
    for (const s of [-1, 1]) { const v = mesh(new THREE.CylinderGeometry(0.15, 0.15, r * 2.2, 18), M.stone, s * r * 1.35, h - 0.3, 0, g); v.rotation.x = Math.PI / 2; }
  }
  const len = HALL_START - HALL_END, mid = (HALL_START + HALL_END) / 2;
  for (const s of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.6, 11.5, len), M.wall, s * (OUTER + 0.3), 5.75, mid);
    mesh(new THREE.BoxGeometry(OUTER - NAVE, 0.4, len), M.stone, s * (NAVE + (OUTER - NAVE) / 2 + 0.3), 6.4, mid);
    mesh(new THREE.BoxGeometry(1.2, 0.7, HALL_START - PORTALS.at(-1) + 0.8), M.stone, s * NAVE, 5.85, (HALL_START + PORTALS.at(-1)) / 2);
    mesh(new THREE.BoxGeometry(1.5, 0.18, HALL_START - PORTALS.at(-1) + 0.8), M.stone, s * NAVE, 6.28, (HALL_START + PORTALS.at(-1)) / 2);
    mesh(new THREE.BoxGeometry(0.2, 0.35, len), M.stone, s * (OUTER - 0.05), 0.17, mid);
    mesh(new THREE.BoxGeometry(OUTER - NAVE - 0.4, 11.5, 0.8), M.wall, s * (NAVE + (OUTER - NAVE) / 2 + 0.5), 5.75, HALL_START + 0.4);
  }
  for (const z of PORTALS) {
    for (const s of [-1, 1]) {
      mesh(new THREE.BoxGeometry(1.1, 5.5, 1.5), M.stone, s * NAVE, 2.75, z);
      mesh(new THREE.BoxGeometry(1.4, 0.4, 1.8), M.stone, s * NAVE, 0.2, z);
    }
    mesh(new THREE.TorusGeometry(NAVE, 0.55, 10, 48, Math.PI), M.stone, 0, 5.5, z).scale.z = 1.4;
    mesh(new THREE.TorusGeometry(NAVE + 0.55, 0.14, 8, 48, Math.PI), M.stone, 0, 5.5, z).scale.z = 6;
  }
  for (let i = 0; i < PORTALS.length - 1; i++) {
    const a = PORTALS[i], b = PORTALS[i + 1];
    for (const f of [1 / 3, 2 / 3]) for (const s of [-1, 1]) column(s * NAVE, a + (b - a) * f);
  }
  for (let z = HALL_START + 1; z > HALL_END - 1; z -= 1.7) mesh(new THREE.BoxGeometry(OUTER * 2 + 1.2, 0.5, 0.35), M.stone, 0, 11.7, z);
  for (const x of [-NAVE, NAVE]) mesh(new THREE.BoxGeometry(0.5, 0.6, len + 2), M.stone, x, 11.2, mid);

  /* rotunda */
  const open = Math.asin(OUTER / RR);
  {
    const wall = mesh(new THREE.CylinderGeometry(RR, RR, 11.5, 96, 1, true, open, Math.PI * 2 - open * 2), M.wall.clone(), 0, 5.75, RZ);
    wall.material.side = THREE.DoubleSide; wall.material.map = wallTex.clone(); wall.material.map.repeat.set(6, 1); wall.material.map.needsUpdate = true;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI / n;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < open + 0.15) continue;
      column(Math.sin(a) * (RR - 1.6), RZ + Math.cos(a) * (RR - 1.6), 6.2, 0.4);
    }
    const ring = mesh(new THREE.TorusGeometry(RR - 1.6, 0.42, 8, 96), M.stone, 0, 6.5, RZ); ring.rotation.x = Math.PI / 2; ring.scale.z = 1.6;
    const cornice = mesh(new THREE.TorusGeometry(RR - 0.2, 0.35, 8, 96, Math.PI * 2 - open * 2), M.stone, 0, 11.6, RZ);
    cornice.rotation.set(Math.PI / 2, 0, Math.PI / 2 + open);
    for (const r of [3, 6, 8.6]) { const l = mesh(new THREE.RingGeometry(r, r + 0.05, 128), new THREE.MeshStandardMaterial({ color: "#c9c5d6", roughness: 0.5 }), 0, 0.01, RZ); l.rotation.x = -Math.PI / 2; l.castShadow = false; }
    for (const s of [-1, 1]) { const b = mesh(new THREE.BoxGeometry(3.2, 0.42, 0.9), M.stone, s * 2.6, 0.21, RZ + 2.2); b.rotation.y = s * 0.25; }
    mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.9, 48), M.stone, 0, 0.45, RZ - 1);
  }

  /* gold-framed picture: width/height in metres, placed on a wall facing +z in local space */
  function framed(parent, tex, w, h, x, y, z, rotY) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; parent.add(g);
    const b = 0.14;
    mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), 0, 0, 0.03, g);
    mesh(new THREE.BoxGeometry(w + b * 2, b, 0.12), M.gold, 0, h / 2 + b / 2, 0.03, g);
    mesh(new THREE.BoxGeometry(w + b * 2, b, 0.12), M.gold, 0, -h / 2 - b / 2, 0.03, g);
    mesh(new THREE.BoxGeometry(b, h, 0.12), M.gold, -w / 2 - b / 2, 0, 0.03, g);
    mesh(new THREE.BoxGeometry(b, h, 0.12), M.gold, w / 2 + b / 2, 0, 0.03, g);
    return g;
  }
  const fit = (ar, maxW, maxH) => (ar > maxW / maxH ? [maxW, maxW / ar] : [maxH * ar, maxH]);

  /* rotunda: the Space Games win */
  const backZ = RZ - RR + 0.35;
  photo("img/news-kabar.jpg", (t, ar) => { const [w, h] = fit(ar, 3.4, 4.2); framed(scene, t, w, h, 0, 3.4, backZ, 0); });
  for (const [img, s] of [["img/games-stage.jpg", -1], ["img/moscow.jpg", 1]]) {
    const a = s * 0.62, r = RR - 0.35;
    photo(img, (t, ar) => { const [w, h] = fit(ar, 2.4, 3.1); framed(scene, t, w, h, Math.sin(a) * r, 3.2, RZ - Math.cos(a) * r, -a); });
  }

  /* exhibits */
  function pedestal(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    mesh(new THREE.BoxGeometry(1.5, 0.12, 1.5), M.stone, 0, 0.06, 0, g);
    mesh(new THREE.BoxGeometry(1.15, 0.96, 1.15), M.stone, 0, 0.6, 0, g);
    mesh(new THREE.BoxGeometry(1.35, 0.08, 1.35), M.stone, 0, 1.12, 0, g);
    mesh(new THREE.BoxGeometry(1.16, 0.02, 1.16), M.gold, 0, 1.0, 0, g);
  }
  function lightbox(url) {
    // a two-sided illuminated photo stand that turns slowly on the pedestal
    const g = new THREE.Group();
    add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12), M.gold), 0, 0.15, 0);
    photo(url, (t, ar) => {
      const [w, h] = fit(ar, 1.25, 1.25);
      const y = 0.3 + h / 2;
      add(g, new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.05), M.gold), 0, y, 0);
      const face = new THREE.MeshStandardMaterial({ map: t, emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.35, roughness: 0.6 });
      const front = add(g, new THREE.Mesh(new THREE.PlaneGeometry(w, h), face), 0, y, 0.027);
      const back = add(g, new THREE.Mesh(new THREE.PlaneGeometry(w, h), face), 0, y, -0.027); back.rotation.y = Math.PI;
      front.castShadow = back.castShadow = false;
    });
    return g;
  }
  const plastic = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45 });
  const metal = new THREE.MeshStandardMaterial({ color: "#b9bcc6", roughness: 0.3, metalness: 0.8 });
  const pcb = new THREE.MeshStandardMaterial({ color: "#1f6b4a", roughness: 0.55 });
  const glow = (hex) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.15, roughness: 0.3 });
  function model(kind, color) {
    const g = new THREE.Group();
    if (kind === "sunflower") {
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.6), plastic("#f4f2ee")), 0, 0.04, 0);
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.18), pcb), -0.12, 0.095, 0.12);
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.06), M.ink), -0.12, 0.12, 0.12);
      const us = new THREE.Group(); us.position.set(0.22, 0.2, 0.18); g.add(us);
      add(us, new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.13, 0.02), pcb));
      for (const s of [-1, 1]) add(us, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 24), metal), s * 0.08, 0, 0.04).rotation.x = Math.PI / 2;
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.02), M.ink), 0.22, 0.13, 0.17);
      add(g, new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.14), plastic("#2f3f9e")), 0, 0.19, -0.08);
      const head = new THREE.Group(); head.position.set(0, 0.34, -0.08); g.add(head);
      add(head, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 16), M.stone), 0, 0.08, 0);
      const face = new THREE.Group(); face.position.y = 0.32; head.add(face);
      const petals = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; add(face, new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.13, 4, 10), petals), Math.cos(a) * 0.17, Math.sin(a) * 0.17, -0.01).rotation.z = a - Math.PI / 2; }
      add(face, new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 32), plastic("#3b2a17"))).rotation.x = Math.PI / 2;
      add(face, new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.12), M.ink), 0, 0, 0.07);
      for (const s of [-1, 1]) add(face, new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), glow("#ff4d3d")), s * 0.06, 0, 0.04);
      add(head, new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), M.ink), 0, 0.22, 0);
      animators.push((t) => { head.rotation.y = Math.sin(t * 0.7) * 0.7; face.rotation.x = Math.sin(t * 0.5) * 0.15; });
    }
    if (kind === "kamkor") {
      add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 12), M.gold), 0, 0.28, -0.05);
      add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.04, 32), M.gold), 0, 0.02, -0.05);
      const unit = new THREE.Group(); unit.position.y = 0.9; g.add(unit);
      add(unit, new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.34, 10, 32), plastic("#f7f6f9"))).scale.z = 0.38;
      add(unit, new THREE.Mesh(new THREE.CircleGeometry(0.13, 40), new THREE.MeshStandardMaterial({ color: "#1d1b22", roughness: 0.15, metalness: 0.3 })), 0, 0.12, 0.085);
      const ring = add(unit, new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 48), glow(color)), 0, 0.12, 0.086);
      add(unit, new THREE.Mesh(new THREE.SphereGeometry(0.035, 18, 12), glow("#e0662f")), 0.08, -0.12, 0.07);
      for (let k = 0; k < 4; k++) add(unit, new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.008, 0.01), M.ink), -0.04, -0.08 - k * 0.03, 0.082);
      const waves = [];
      for (let k = 0; k < 3; k++) {
        const w = add(unit, new THREE.Mesh(new THREE.TorusGeometry(0.22 + k * 0.12, 0.006, 6, 48, Math.PI * 0.6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })), 0, 0.12, 0.12 + k * 0.04);
        w.rotation.z = Math.PI * 0.2; w.castShadow = false; waves.push(w);
      }
      animators.push((t) => {
        ring.material.emissiveIntensity = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2.4));
        waves.forEach((w, k) => { const f = (t * 0.6 + k / 3) % 1; w.scale.setScalar(0.7 + f * 0.8); w.material.opacity = 0.6 * (1 - f); });
      });
    }
    return g;
  }

  HALLS.forEach((p, i) => {
    const side = i % 2 ? 1 : -1, z = EX_Z[i], x = side * 2.7, color = ACCENT[i % ACCENT.length];
    pedestal(x, z);
    const kind = MODEL[p.id];
    const item = kind ? model(kind, color) : lightbox(p.photos[0]);
    item.position.set(x, 1.16, z);
    if (!kind) item.rotation.y = -side * 0.5;
    scene.add(item);
    if (kind === "kamkor" || !kind) spinning.push(item);
    // wall: second photo when there is one, otherwise the cover, otherwise a blueprint
    const wallX = side * (OUTER - 0.02), rot = side * -Math.PI / 2;
    const wallImg = p.photos?.[1] || p.photos?.[0];
    if (wallImg) photo(wallImg, (t, ar) => { const [w, h] = fit(ar, 2.6, 2.6); framed(scene, t, w, h, wallX, 3.3, z, rot); });
    else framed(scene, blueprint(i, color, p.id === "kamkor" ? ["RADAR", "ESP32", "TELEGRAM"] : ["LDR ×2", "PI", "SERVO"]), 2.0, 2.5, wallX, 3.3, z, rot);
  });

  /* rotunda lettering */
  (async () => {
    try { await Promise.race([document.fonts.load("200px Forum"), new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}
    const c = document.createElement("canvas"); c.width = 2048; c.height = 640;
    const g = c.getContext("2d");
    const draw = (txt, size, y, spacing) => {
      g.font = `${size}px Forum, Georgia, serif`;
      if ("letterSpacing" in g) g.letterSpacing = spacing + "px";
      g.textAlign = "center";
      g.fillStyle = "rgba(70,64,105,0.7)"; g.fillText(txt, 1027, y + 4);
      g.fillStyle = "#dcd9e8"; g.fillText(txt, 1024, y);
    };
    draw("МИР×АИР", 260, 300, 30);
    draw("AIIiR · MUSEUM OF IDEAS", 86, 450, 24);
    draw("КГТУ им. И. РАЗЗАКОВА", 60, 560, 20);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; tex.offset.x = 1;
    const arc = 1.7;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(RR - 0.08, RR - 0.08, 3.6, 64, 1, true, Math.PI - arc / 2, arc),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, side: THREE.BackSide, depthWrite: false }));
    band.position.set(0, 9.2, RZ); scene.add(band);
  })();

  /* tour path */
  STOPS.push({ p: new THREE.Vector3(0, 2.5, 18), t: new THREE.Vector3(0, 3.4, -30) });
  EX_Z.forEach((z, i) => {
    const side = i % 2 ? 1 : -1;
    STOPS.push({ p: new THREE.Vector3(side * -0.9, 1.95, z + 4.4), t: new THREE.Vector3(side * 2.7, 1.85, z - 0.2) });
  });
  STOPS.push({ p: new THREE.Vector3(0, 2.1, PORTALS.at(-1) - 0.5), t: new THREE.Vector3(0, 5.2, RZ - RR) });

  /* free walk input */
  const kmap = { KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r" };
  addEventListener("keydown", (e) => {
    if (!free) return;
    const k = kmap[e.code];
    if (k) { keys.add(k); e.preventDefault(); }
    if (e.code === "Escape") toggleFree();
  });
  addEventListener("keyup", (e) => { const k = kmap[e.code]; if (k) keys.delete(k); });
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => { if (!free) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const sens = coarse ? 0.005 : 0.0035;
    look.yaw -= (e.clientX - drag.x) * sens; look.pitch = Math.max(-1.2, Math.min(1.2, look.pitch - (e.clientY - drag.y) * sens));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const endDrag = () => (drag = null);
  canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
  document.querySelectorAll("#pad button").forEach((b) => {
    const k = b.dataset.k;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); keys.add(k); b.setPointerCapture(e.pointerId); });
    const up = () => keys.delete(k);
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
  });

  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = coarse && innerWidth < innerHeight ? 68 : 55;
    camera.updateProjectionMatrix();
  });

  clock = new THREE.Clock();
  prog = scrollProg();
  tourAt(prog, camera.position, camT); camera.lookAt(camT);
  renderer.compile(scene, camera);
  requestAnimationFrame(() => { frameLoop(); setTimeout(() => $("loader").classList.add("done"), 250); });
}

const STOPS = [];
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function tourAt(p, outP, outT) {
  const k = Math.min(N - 1.0001, Math.max(0, p));
  const i = Math.floor(k), f = ease(k - i);
  const a = STOPS[i], b = STOPS[i + 1];
  outP.lerpVectors(a.p, b.p, f);
  outT.lerpVectors(a.t, b.t, f);
  // on narrow screens look slightly down at a hall stop so the exhibit sits above the card
  if (narrow()) {
    const off = (s) => (s >= 1 && s <= H ? 1 : 0);
    const w = off(i) + (off(i + 1) - off(i)) * f;
    outT.y -= 0.75 * w; outP.y += 0.15 * w; outP.z += 0.8 * w;
  }
  const arc = Math.sin(f * Math.PI);
  outP.x *= 1 - 0.7 * arc; outP.y += 0.35 * arc;
}

function inside(x, z) {
  if (z <= HALL_START + 6 && z >= HALL_END - 0.5 && Math.abs(x) <= OUTER - 0.5) return !EX_Z.some((ez, i) => Math.abs(z - ez) < 1.0 && Math.abs(x - (i % 2 ? 2.7 : -2.7)) < 1.0);
  const dz = z - RZ;
  return Math.hypot(x, dz) < RR - 2.3 && Math.hypot(x, dz + 1) > 1.8;
}
function walk(dt) {
  const speed = 4.2 * dt;
  const fw = new THREE.Vector3(-Math.sin(look.yaw), 0, -Math.cos(look.yaw));
  const rt = new THREE.Vector3(-fw.z, 0, fw.x);
  const mv = new THREE.Vector3();
  if (keys.has("f")) mv.add(fw); if (keys.has("b")) mv.sub(fw);
  if (keys.has("r")) mv.add(rt); if (keys.has("l")) mv.sub(rt);
  if (mv.lengthSq()) {
    mv.normalize().multiplyScalar(speed);
    const p = camera.position;
    if (inside(p.x + mv.x, p.z)) p.x += mv.x;
    if (inside(p.x, p.z + mv.z)) p.z += mv.z;
  }
  camera.position.y += (1.75 - camera.position.y) * 0.1;
  camera.rotation.set(look.pitch, look.yaw, 0, "YXZ");
}

function updateUI(p) {
  const near = Math.round(p);
  const stop = Math.abs(p - near) < 0.3 ? near : -1;
  $("intro").classList.toggle("gone", p > 0.25);
  $("hint").classList.toggle("gone", p > 0.08);
  if (stop !== currentStop) {
    currentStop = stop;
    if (stop >= 1 && stop <= H) fillPanel(stop - 1);
    document.querySelectorAll("#rail button").forEach((b, i) => b.classList.toggle("on", i === stop));
  }
  $("panel").classList.toggle("on", !free && stop >= 1 && stop <= H);
  $("final").classList.toggle("on", !free && p > N - 1.35);
}

const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), camT = new THREE.Vector3(), fwd = new THREE.Vector3();
const SUN_OFFSET = new THREE.Vector3(16, 30, 9);
function frameLoop() {
  requestAnimationFrame(frameLoop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!museumOn) return; // reading pages: keep the GPU idle
  if (free) { walk(dt); updateUI(-1); }
  else {
    const target = scrollProg();
    prog += (target - prog) * (reduced ? 1 : 1 - Math.pow(0.0015, dt));
    tourAt(prog, tmpP, tmpT);
    const k = 1 - Math.pow(0.002, dt);
    camera.position.lerp(tmpP, k); camT.lerp(tmpT, k);
    camera.lookAt(camT);
    updateUI(prog);
  }
  if (!reduced) spinning.forEach((m, i) => (m.rotation.y += dt * (0.22 + i * 0.015)));
  const now = reduced ? 0 : clock.elapsedTime;
  animators.forEach((fn) => fn(now));
  camera.getWorldDirection(fwd);
  sun.target.position.copy(camera.position).addScaledVector(fwd, 9).setY(0);
  sun.position.copy(sun.target.position).add(SUN_OFFSET);
  renderer.render(scene, camera);
}

route();

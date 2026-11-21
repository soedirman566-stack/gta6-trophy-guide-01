// Leonida Trophy Guide — an offline tracker for the 55 GTA VI PlayStation 5 trophies.
// Vanilla JS, no libraries, no network beyond this app's own data files. Progress lives in
// localStorage; export and import move it between browsers as a small JSON file.
//
// Preview links (used for the entry's screenshots, handy for sharing a view):
//   ?view=roadmap | ?view=missables | ?spoiler=1 | ?open=<trophy id> | ?seed=demo
// ?seed=demo loads a sample progress state instead of the saved one, without overwriting it.

const STORE_KEY = 'leonida-trophy-guide-v1';
const doc = await (await fetch('data/trophies.json')).json();
const roadmap = await (await fetch('data/roadmap.json')).json();
const TROPHIES = doc.trophies;
const byId = new Map(TROPHIES.map((t) => [t.id, t]));
const byName = new Map(TROPHIES.map((t) => [t.name, t]));

const params = new URLSearchParams(location.search);

// ---------- state ----------
function blankState() {
  return { earned: new Set(), counts: {}, spoiler: false };
}
function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
    if (!raw) return blankState();
    return {
      earned: new Set((raw.earned ?? []).filter((n) => byName.has(n))),
      counts: Object.fromEntries(Object.entries(raw.counts ?? {}).filter(([n]) => byName.has(n))),
      spoiler: Boolean(raw.spoiler),
    };
  } catch {
    return blankState();
  }
}
function demoState() {
  const s = blankState();
  for (const id of [2, 3, 8, 16, 21, 44]) s.earned.add(byId.get(id).name);
  Object.assign(s.counts, {
    [byId.get(15).name]: 132,
    [byId.get(17).name]: 20,
    [byId.get(31).name]: 47,
    [byId.get(42).name]: 19,
  });
  return s;
}
const demo = params.get('seed') === 'demo';
let state = demo ? demoState() : loadState();
if (params.get('spoiler') === '1') state.spoiler = true;

function save() {
  if (demo) return;
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned],
    counts: state.counts,
    spoiler: state.spoiler,
  }));
}

// ---------- view state ----------
const KINDS = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['online', 'Online'],
];
let view = ['roadmap', 'missables'].includes(params.get('view')) ? params.get('view') : 'checklist';
let kindFilter = 'all';
let gradeFilter = 'all';
let query = '';
let hideEarned = false;
let selectedId = Number(params.get('open')) || null;

// ---------- tiny DOM helper ----------
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
function badge(text, cls) {
  return el('span', `badge ${cls}`, text);
}

const isEarned = (t) => state.earned.has(t.name);
const isSpoilered = (t) => state.spoiler && !isEarned(t) && (t.kind === 'story' || t.hidden);
const displayName = (t) => (isSpoilered(t) ? 'Hidden trophy' : t.name);
const displayDesc = (t) => (isSpoilered(t)
  ? 'Spoiler protection is on — the name and description stay hidden until you earn this trophy.'
  : t.description);
const countOf = (t) => Math.min(Number(state.counts[t.name] ?? 0) || 0, t.count ?? 0);

// ---------- header / progress ----------
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
function renderProgress() {
  const total = TROPHIES.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const ring = document.getElementById('ring-fill');
  ring.style.strokeDashoffset = String(226.2 * (1 - done / total));
  document.getElementById('ring-text').textContent = `${pct}%`;
  document.getElementById('progress-line').textContent = `${done} of ${total} earned`;
  const counts = document.getElementById('grade-counts');
  counts.replaceChildren();
  for (const g of GRADES) {
    const all = TROPHIES.filter((t) => t.grade === g);
    const got = all.filter(isEarned).length;
    const cell = el('span', 'gc');
    const dot = el('span', `dot dot-${g}`);
    cell.append(dot, document.createTextNode(`${g}: `), el('b', null, `${got}/${all.length}`));
    counts.append(cell);
  }
  document.getElementById('missable-count').textContent =
    String(TROPHIES.filter((t) => t.missable).length);
}

// ---------- filter chips ----------
function kindCount(kind) {
  if (kind === 'all') return TROPHIES.length;
  if (kind === 'missable') return TROPHIES.filter((t) => t.missable).length;
  return TROPHIES.filter((t) => t.kind === kind).length;
}
function renderChips() {
  const root = document.getElementById('kind-chips');
  root.replaceChildren();
  for (const [kind, label] of KINDS) {
    const chip = el('button', `chip${kindFilter === kind ? ' active' : ''}`);
    chip.type = 'button';
    chip.append(document.createTextNode(`${label} `), el('span', 'n', String(kindCount(kind))));
    chip.addEventListener('click', () => { kindFilter = kind; renderChips(); renderList(); });
    root.append(chip);
  }
}

function visible(t) {
  if (kindFilter === 'missable' && !t.missable) return false;
  if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
  if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
  if (hideEarned && isEarned(t)) return false;
  if (query) {
    const q = query.toLowerCase();
    if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
  }
  return true;
}

// ---------- checklist ----------
function counterWidget(t) {
  const wrap = el('span', 'counter');
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = String(t.count);
  input.value = String(countOf(t));
  input.setAttribute('aria-label', `Progress for ${t.name}`);
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('change', () => {
    const v = Math.max(0, Math.min(t.count, Number(input.value) || 0));
    state.counts[t.name] = v;
    if (v >= t.count) state.earned.add(t.name);
    save();
    renderAll();
  });
  const bar = el('span', 'bar');
  const fill = document.createElement('i');
  fill.style.width = `${(countOf(t) / t.count) * 100}%`;
  bar.append(fill);
  const label = el('span', null, t.count >= 1000 ? `$${countOf(t).toLocaleString('en-US')} / $${t.count.toLocaleString('en-US')}` : `${countOf(t)} / ${t.count}`);
  wrap.append(input, bar, label);
  return wrap;
}

function renderList() {
  const list = document.getElementById('trophy-list');
  list.replaceChildren();
  let shown = 0;
  for (const t of TROPHIES) {
    if (!visible(t)) continue;
    shown += 1;
    const card = el('li', `trophy-card${isEarned(t) ? ' earned' : ''}${selectedId === t.id ? ' selected' : ''}`);
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) state.earned.add(t.name);
      else state.earned.delete(t.name);
      save();
      renderAll();
    });
    const main = el('div', 'card-main');
    const top = el('div', 'card-top');
    top.append(badge(t.grade, `badge-${t.grade}`), el('span', 'trophy-name', displayName(t)));
    if (t.missable) top.append(badge('Missable', 'badge-missable'));
    main.append(top, el('p', 'trophy-desc', displayDesc(t)));
    const meta = el('div', 'card-meta');
    meta.append(badge(t.kind, 'badge-kind'), badge(`Stage ${t.stage}`, 'badge-stage'));
    if (t.count) meta.append(counterWidget(t));
    main.append(meta);
    card.append(box, main);
    card.addEventListener('click', () => { selectedId = t.id; renderList(); renderDetail(); });
    list.append(card);
  }
  document.getElementById('empty-msg').hidden = shown > 0;
}

// ---------- detail panel ----------
function renderDetail() {
  const panel = document.getElementById('detail');
  panel.replaceChildren();
  const t = selectedId ? byId.get(selectedId) : null;
  if (!t) {
    panel.append(el('p', 'placeholder',
      'Pick any trophy to read its full guide here: what to do, where and how as far as the official description supports, when it can be missed, and the sources the guide draws on. The three trophies flagged MISSABLE deserve a look before you finish the story.'));
    return;
  }
  const row = el('div', 'row');
  row.append(badge(t.grade, `badge-${t.grade}`), badge(t.kind, 'badge-kind'), badge(`Roadmap stage ${t.stage}`, 'badge-stage'));
  if (t.missable) row.append(badge('Missable', 'badge-missable'));
  panel.append(row);
  panel.append(el('h2', null, displayName(t)));
  panel.append(el('p', 'official', displayDesc(t)));
  if (t.count) {
    panel.append(el('h3', null, 'Tracked progress'));
    panel.append(counterWidget(t));
  }
  panel.append(el('h3', null, 'Guide'));
  panel.append(el('p', null, isSpoilered(t)
    ? 'The guide for this trophy is hidden by spoiler protection until you earn it.'
    : t.guide));
  const earnLine = el('label', 'earn-line');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(t);
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(t.name);
    else state.earned.delete(t.name);
    save();
    renderAll();
  });
  earnLine.append(box, document.createTextNode('Mark as earned'));
  panel.append(earnLine);
}

// ---------- roadmap view ----------
function renderRoadmap() {
  const root = document.getElementById('roadmap-root');
  root.replaceChildren();
  root.append(el('p', 'view-intro', roadmap.note));
  for (const stage of roadmap.stages) {
    const box = el('section', 'stage');
    const h = el('h2');
    h.append(el('span', 'stage-no', `Stage ${stage.stage} · `), document.createTextNode(stage.title));
    box.append(h, el('p', 'advice', stage.advice));
    if (stage.missables.length) {
      box.append(el('p', 'warn', `Missable in this stage: ${stage.missables.join(', ')} — read their guides before you move on.`));
    }
    const chips = el('div', 'stage-chips');
    for (const name of stage.trophies) {
      const t = byName.get(name);
      const chip = el('button', `stage-chip${isEarned(t) ? ' done' : ''}${t.missable ? ' miss' : ''}`,
        `${isEarned(t) ? '✓ ' : ''}${displayName(t)}`);
      chip.type = 'button';
      chip.addEventListener('click', () => {
        selectedId = t.id;
        switchView('checklist');
        renderList();
        renderDetail();
      });
      chips.append(chip);
    }
    box.append(chips);
    root.append(box);
  }
}

// ---------- missables view ----------
function renderMissables() {
  const root = document.getElementById('missables-root');
  root.replaceChildren();
  for (const t of TROPHIES.filter((x) => x.missable)) {
    const card = el('article', 'miss-card');
    const row = el('div', 'row');
    row.append(badge('Missable', 'badge-missable'), badge(t.grade, `badge-${t.grade}`), badge(`Roadmap stage ${t.stage}`, 'badge-stage'));
    card.append(row);
    card.append(el('h2', null, t.name));
    card.append(el('p', 'official', t.description));
    card.append(el('p', 'guide', t.guide));
    root.append(card);
  }
}

// ---------- views ----------
function switchView(next) {
  view = next;
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.view === view);
  }
  document.getElementById('view-checklist').hidden = view !== 'checklist';
  document.getElementById('view-roadmap').hidden = view !== 'roadmap';
  document.getElementById('view-missables').hidden = view !== 'missables';
  document.getElementById('toolbar').style.display = view === 'checklist' ? '' : 'none';
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}
for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => switchView(tab.dataset.view));
}

// ---------- toolbar wiring ----------
document.getElementById('grade-filter').addEventListener('change', (e) => { gradeFilter = e.target.value; renderList(); });
document.getElementById('search').addEventListener('input', (e) => { query = e.target.value.trim(); renderList(); });
document.getElementById('hide-earned').addEventListener('change', (e) => { hideEarned = e.target.checked; renderList(); });
const spoilerToggle = document.getElementById('spoiler-toggle');
spoilerToggle.checked = state.spoiler;
spoilerToggle.addEventListener('change', () => { state.spoiler = spoilerToggle.checked; save(); renderAll(); });

document.getElementById('export-btn').addEventListener('click', () => {
  const payload = JSON.stringify({ earned: [...state.earned], counts: state.counts, spoiler: state.spoiler }, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const raw = JSON.parse(await file.text());
    const earned = new Set((raw.earned ?? []).filter((n) => byName.has(n)));
    const counts = Object.fromEntries(Object.entries(raw.counts ?? {}).filter(([n]) => byName.has(n)));
    state = { earned, counts, spoiler: Boolean(raw.spoiler) };
    spoilerToggle.checked = state.spoiler;
    save();
    renderAll();
  } catch {
    alert('That file is not a Leonida Trophy Guide progress export.');
  }
  e.target.value = '';
});
document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies and counters?')) return;
  state = blankState();
  spoilerToggle.checked = false;
  save();
  renderAll();
});

// ---------- go ----------
function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}
renderChips();
renderAll();
switchView(view);

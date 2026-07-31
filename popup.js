const getTabs = async () => {
  const tabs = await chrome.tabs.query({});
  const seen = new Set();
  const rows = [];
  for (const t of tabs) {
    if (!t.url || !t.url.startsWith('http') || t.pinned) continue;
    if (seen.has(t.url)) continue;
    seen.add(t.url);
    rows.push({ id: t.id, title: t.title || t.url, url: t.url, windowId: t.windowId, favIconUrl: t.favIconUrl || '' });
  }
  return rows;
};

const markdown = (rows) => {
  const groups = new Map();
  for (const r of rows) {
    const title = (r.title || r.url).replace(/[[\])]/g, c => '\\' + c);
    if (!groups.has(r.windowId)) groups.set(r.windowId, []);
    groups.get(r.windowId).push(`- [${title}](${r.url.replace(/\)/g, '%29')})`);
  }
  const arr = [...groups.values()];
  if (arr.length === 1) return arr[0].join('\n');
  return arr.map((g, i) => `# Window ${i + 1}\n${g.join('\n')}`).join('\n\n');
};

const extractUrls = (text) => [...new Set(
  (text.match(/https?:\/\/[^\s)\]">]+/g) || []).map(u => u.replace(/[.,;!?]+$/, ''))
)];

const listEl = document.getElementById('list');
const listControls = document.querySelector('.list-controls');
const selectAll = document.getElementById('select-all');
const importEl = document.getElementById('import-text');
const importFile = document.getElementById('import-file');
const openBtn = document.getElementById('open-btn');
const copyBtn = document.getElementById('copy-btn');
const fileBtn = document.getElementById('file-btn');
const archiveBtn = document.getElementById('archive-btn');
const mergeBtn = document.getElementById('merge-btn');

let rows = [];
let mode = 'export';

const selectedRows = () => [...listEl.querySelectorAll('input:checked')].map(cb => rows[+cb.dataset.i]);

const flash = (btn, msg) => {
  btn.textContent = msg;
  setTimeout(() => {
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
    updateLabels();
  }, 1500);
};

const updateLabels = () => {
  const checked = listEl.querySelectorAll('input:checked').length;
  const total = listEl.querySelectorAll('input').length;
  selectAll.checked = total > 0 && checked === total;
  selectAll.indeterminate = checked > 0 && checked < total;
  const wins = new Set(rows.map(r => r.windowId)).size;
  mergeBtn.hidden = wins < 2;
  if (!mergeBtn.hidden) mergeBtn.textContent = `Merge ${wins} windows`;
  if (mode === 'export') {
    const n = checked;
    openBtn.textContent = `Open selected (${n})`;
    copyBtn.textContent = `Copy (${n})`;
    fileBtn.textContent = `Download (${n})`;
    archiveBtn.textContent = `Archive & close (${n})`;
  } else {
    openBtn.textContent = 'Open links';
    fileBtn.textContent = 'Choose file';
  }
};

const renderList = () => {
  listEl.textContent = '';
  const byWin = new Map();
  rows.forEach((r, i) => {
    if (!byWin.has(r.windowId)) byWin.set(r.windowId, []);
    byWin.get(r.windowId).push(i);
  });
  const multi = byWin.size > 1;
  let winNum = 0;
  for (const indexes of byWin.values()) {
    if (multi) {
      winNum++;
      const h = document.createElement('div');
      h.className = 'group-head';
      h.textContent = `Window ${winNum}`;
      listEl.appendChild(h);
    }
    for (const i of indexes) {
      const r = rows[i];
      const label = document.createElement('label');
      label.className = 'row';
      label.title = r.url;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.dataset.i = String(i);
      cb.addEventListener('change', updateLabels);
      const icon = document.createElement('img');
      icon.className = 'row-favicon';
      icon.alt = '';
      icon.style.visibility = 'hidden';
      if (r.favIconUrl && r.favIconUrl.startsWith('http')) {
        icon.src = r.favIconUrl;
        icon.addEventListener('load', () => { icon.style.visibility = 'visible'; });
        icon.addEventListener('error', () => { icon.style.visibility = 'hidden'; });
      }
      const span = document.createElement('span');
      span.className = 'row-title';
      span.textContent = r.title;
      const host = document.createElement('span');
      host.className = 'row-host';
      try { host.textContent = new URL(r.url).hostname.replace(/^www\./, ''); } catch {}
      label.append(cb, icon, span, host);
      listEl.appendChild(label);
    }
  }
};

const init = async () => {
  rows = await getTabs();
  const wins = new Set(rows.map(r => r.windowId)).size;
  const n = (x, s) => x === 1 ? s : s + 's';
  document.getElementById('count').textContent =
    `${rows.length} ${n(rows.length, 'tab')} \u00b7 ${wins} ${n(wins, 'window')}`;
  renderList();
  updateLabels();
};

const setMode = (m) => {
  mode = m;
  listEl.hidden = m !== 'export';
  listControls.hidden = m !== 'export';
  importEl.hidden = m !== 'import';
  copyBtn.hidden = m !== 'export';
  archiveBtn.hidden = m !== 'export';
  document.getElementById('tab-export').classList.toggle('active', m === 'export');
  document.getElementById('tab-import').classList.toggle('active', m === 'import');
  updateLabels();
};

const saveMd = (rows) => {
  const md = markdown(rows);
  const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
  const d = new Date();
  const p = (x) => String(x).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `tabs-${stamp}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

const download = () => {
  const sel = selectedRows();
  if (!sel.length) { flash(fileBtn, 'Nothing selected'); return; }
  saveMd(sel);
  flash(fileBtn, 'Downloaded!');
};

openBtn.addEventListener('click', async () => {
  if (mode === 'export') {
    const urls = selectedRows().map(r => r.url);
    if (!urls.length) { flash(openBtn, 'Nothing selected'); return; }
    await chrome.windows.create({ url: urls });
  } else {
    const urls = extractUrls(importEl.value);
    if (!urls.length) { flash(openBtn, 'No links found'); return; }
    await chrome.windows.create({ url: urls });
  }
});

copyBtn.addEventListener('click', async () => {
  const sel = selectedRows();
  if (!sel.length) { flash(copyBtn, 'Nothing selected'); return; }
  await navigator.clipboard.writeText(markdown(sel));
  flash(copyBtn, 'Copied!');
});

fileBtn.addEventListener('click', () => {
  if (mode === 'export') download();
  else importFile.click();
});

archiveBtn.addEventListener('click', async () => {
  const sel = selectedRows();
  if (!sel.length) { flash(archiveBtn, 'Nothing selected'); return; }
  if (!confirm(`Close ${sel.length} tab${sel.length === 1 ? '' : 's'}? The list will be saved to Downloads and copied to clipboard.`)) return;
  saveMd(sel);
  await navigator.clipboard.writeText(markdown(sel));
  try {
    await chrome.tabs.remove(sel.map(r => r.id));
  } catch {}
  rows = await getTabs();
  renderList();
  updateLabels();
  flash(archiveBtn, `Archived & closed ${sel.length}`);
});

mergeBtn.addEventListener('click', async () => {
  const [{ windowId: target }] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tabs = await chrome.tabs.query({});
  const ids = tabs.filter(t => t.windowId !== target && t.url && t.url.startsWith('http')).map(t => t.id);
  if (!ids.length) { flash(mergeBtn, 'Nothing to merge'); return; }
  await chrome.tabs.move(ids, { windowId: target, index: -1 });
  rows = await getTabs();
  renderList();
  updateLabels();
  flash(mergeBtn, `Merged ${ids.length} tabs`);
});

selectAll.addEventListener('change', () => {
  for (const cb of listEl.querySelectorAll('input')) cb.checked = selectAll.checked;
  updateLabels();
});

importFile.addEventListener('change', async () => {
  const f = importFile.files[0];
  if (!f) return;
  importEl.value = await f.text();
  setMode('import');
});

document.getElementById('tab-export').addEventListener('click', () => setMode('export'));
document.getElementById('tab-import').addEventListener('click', () => setMode('import'));

setMode('export');
init();

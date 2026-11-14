// ---------- helpers ----------
const $ = (s) => document.querySelector(s);
const api = (u) => fetch(u).then((r) => r.json());
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const time = (iso) => iso.slice(11, 19);
const mut = (t) => `<span class="mut">${t}</span>`;
const CONF = { high: 'High confidence', correlated: 'Correlated', suspicious: 'Suspicious', none: 'Not observed' };
const COLORS = { critical: 'var(--red)', high: 'var(--org)', medium: 'var(--yel)', low: 'var(--grn)' };
const confBadge = (c) => `<span class="badge b-${c}">${CONF[c]}</span>`;
const sevBadge = (s) => `<span class="badge s-${s}">${esc(s)}</span>`;
const chip = (id) => `<span class="chip mono" data-ev="${esc(id)}">${esc(id)}</span>`;
const chips = (ids) => ids.map(chip).join(' ');
const empty = () => ($('#page').innerHTML = '<div class="card">No correlated attack chain was found in this data.</div>');

// ---------- shared state ----------
let D = null;          // /api/dashboard
let EV = {};           // events by id
let evList = [];       // events sorted by time
let focusAlert = null; // alert to highlight on the next page
const pages = {};      // each page file adds pages.<name> = function
const actions = {      // click handlers keyed by data-<name> attributes
  ev: (id) => showEv(id),
  graph: (id) => { focusAlert = id; location.hash = '#graph'; },
  tl: (id) => { focusAlert = id; location.hash = '#timeline'; },
  close: () => $('#ev').classList.remove('open'),
};

// ---------- evidence drawer (works on every page) ----------
function showEv(id) {
  const e = EV[id];
  if (!e) return;
  const rows = [['User', e.user], ['Route', `${e.src_host} → ${e.dest_host}`], ['Type', e.event_type],
    ['Source IP', e.src_ip], ['Status', e.status], ['Details', e.details]];
  const cited = D.alerts.filter((a) => a.evidence.includes(id));
  $('#ev').innerHTML = `
    <div class="cap">Evidence <button class="btn ghost" data-close="1">Close</button></div>
    <h3 class="mono">${esc(e.id)}</h3>
    <dl><dt>Source</dt><dd>${esc(e.source)}, line ${e.line}</dd>
      <dt>Event time</dt><dd class="mono">${esc(e.timestamp)}</dd>
      ${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v == null ? '<span class="badge warn">missing</span>' : esc(v)}</dd>`).join('')}</dl>
    <div class="cap">Raw log line</div><pre class="raw">${esc(e.raw)}</pre>
    <div class="cap">Cited by alerts</div>
    ${cited.map((a) => `<div>${sevBadge(a.severity)} <b>${a.id}</b> ${esc(a.rule)}</div>`).join('') || mut('No alert cites this event.')}`;
  $('#ev').classList.add('open');
}

// ---------- router ----------
function route() {
  const h = location.hash.slice(1) || 'overview';
  const link = $(`#nav a[href="#${h}"]`);
  if (!link) { location.hash = '#overview'; return; }
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('on', a === link));
  $('#crumb').textContent = link.textContent;
  $('#ev').classList.remove('open');
  if (!pages[h]) { $('#page').innerHTML = '<div class="card">This page is not built yet.</div>'; return; }
  Promise.resolve(pages[h]()).catch((e) => ($('#page').innerHTML = `<div class="card">Something went wrong: ${esc(e.message)}</div>`));
}

async function load() {
  try {
    [D, evList] = await Promise.all([api('/api/dashboard'), api('/api/events')]);
  } catch (e) {
    $('#page').innerHTML = '<div class="card">Could not load data from the server.</div>';
    return;
  }
  EV = Object.fromEntries(evList.map((e) => [e.id, e]));
  $('#badge').textContent = D.is_sample ? 'Simulated data' : 'Uploaded: ' + D.source;
  $('#badge').className = 'badge ' + (D.is_sample ? 'warn' : 'info');
  $('#sys').innerHTML = `Source: ${esc(D.source)}<br>${D.totals.events} events · ${D.totals.alerts} alerts`;
  route();
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  for (const key in actions) {
    const t = e.target.closest(`[data-${key}]`);
    if (t) return actions[key](t.dataset[key]);
  }
});
$('#up').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const fd = new FormData();
  fd.append('logfile', f);
  const r = await fetch('/api/upload', { method: 'POST', body: fd }).then((x) => x.json());
  e.target.value = '';
  if (r.error) { alert(r.error); return; }
  await load();
});
$('#reset').addEventListener('click', async () => {
  await fetch('/api/reset', { method: 'POST' });
  await load();
});
window.addEventListener('hashchange', () => D && route());
window.addEventListener('DOMContentLoaded', load);
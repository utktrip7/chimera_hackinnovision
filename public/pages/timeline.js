pages.timeline = () => {
  const list = D.key_events;
  if (!list.length) return empty();
  const f = focusAlert; focusAlert = null;
  $('#page').innerHTML = `<h2>Event timeline</h2><div class="card"><div class="tl">${list.map((t) => `
    <div class="it ${t.alert === f ? 'focus' : ''}" id="tl-${t.alert}">
      <span class="mono">${time(t.time)} UTC</span> ${sevBadge(t.severity)} <b>${esc(t.rule)}</b> · ${esc(t.stage)}
      ${t.gap ? mut(`(+${t.gap} min)`) : ''}
      <div>${esc(t.text)}</div><div class="mut">Account: ${esc(t.entity)}</div>
      <div>${chips(t.evidence)} <button class="btn ghost" data-graph="${t.alert}">View in graph</button></div>
    </div>`).join('')}</div></div>`;
  const el = f && $('#tl-' + f); if (el) el.scrollIntoView({ block: 'center' });
};

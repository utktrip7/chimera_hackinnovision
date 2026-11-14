(() => {
  let sel = null;
  pages.overview = () => {
    const inv = D.investigation;
    if (!inv) return empty();
    const k = D.kpis, r = D.risk;
    const col = COLORS[r.level];
    const kpi = [['Alerts', k.alerts], ['Compromised accounts', k.accounts], ['Compromised hosts', k.hosts], ['External IPs', k.external_ips], ['Accounts at risk', k.exposed]];
    const sevs = Object.entries(D.severity), tot = sevs.reduce((s, [, n]) => s + n, 0) || 1;
    let acc = 0;
    const grad = sevs.map(([s, n]) => { const a = acc; acc += (n / tot) * 100; return `${COLORS[s] || 'var(--mut)'} ${a}% ${acc}%`; }).join(',');
    const stageAlerts = sel ? D.alerts.filter((a) => a.stage === sel) : [];
    $('#page').innerHTML = `
    <h2>Overview</h2>
    <div class="card hero">
      <div><div class="cap">${esc(inv.id)} · ${confBadge(inv.confidence)}</div>
        <h3>${esc(inv.title)}</h3><p>${esc(inv.summary)}</p>
        <p class="mut">Window ${time(inv.window.start)}–${time(inv.window.end)} UTC · ${inv.duration_minutes} min</p>
        <div class="path">${D.path.map((n) => `<span class="node ${n.external ? 'ext' : ''}">${esc(n.label)}</span>`).join('<span class="arrow">→</span>')}</div>
        <button class="btn" data-go="graph">Open attack graph</button> <button class="btn ghost" data-go="reports">View report</button></div>
      <div class="risk"><div class="ring" style="--p:${r.score};--c:${col}"><div><b>${r.score}</b><span class="mut">${r.level}</span></div></div>
        <ul class="why">${r.breakdown.map((b) => `<li>+${b.points} ${esc(b.label)}</li>`).join('')}</ul></div>
    </div>
    <div class="grid g5">${kpi.map(([l, v]) => `<div class="card kpi"><div class="cap">${l}</div><b>${v}</b></div>`).join('')}</div>
    <div class="cap">Kill-chain coverage (click a stage)</div>
    <div class="grid g5">${D.stages.map((s) => `<div class="card stage st-${s.status} ${sel === s.name ? 'sel' : ''}" data-stage="${esc(s.name)}"><b>${esc(s.name)}</b>${s.count} alert(s)<br>${confBadge(s.status)}</div>`).join('')}</div>
    ${sel ? `<div class="card"><div class="cap">${esc(sel)}</div>${stageAlerts.map((a) => `<div>${sevBadge(a.severity)} <b>${a.id}</b> ${esc(a.reason)} ${chips(a.evidence)}</div>`).join('') || mut('No alerts in this stage.')}</div>` : ''}
    <div class="grid g2">
      <div class="card"><div class="cap">Severity</div><div class="donut-wrap"><div class="donut" style="background:conic-gradient(${grad})"></div>
        <ul class="legend">${sevs.map(([s, n]) => `<li>${sevBadge(s)} ${n}</li>`).join('')}</ul></div></div>
      <div class="card"><div class="cap">Top rules</div>${D.top_rules.map((t) => `<div class="bar"><span>${esc(t.rule)}</span><b>${t.count}</b><i style="width:${(t.count / D.top_rules[0].count) * 100}%"></i></div>`).join('')}</div>
    </div>`;
  };
  actions.stage = (n) => { sel = sel === n ? null : n; pages.overview(); };
  actions.go = (h) => (location.hash = '#' + h);
})();

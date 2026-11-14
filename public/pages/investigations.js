(() => {
  let tab = 'alerts', fSev = '', fConf = '', q = '', openId = null;

  pages.investigations = () => {
    const inv = D.investigation;
    if (!inv) return empty();
    const others = D.totals.alerts - inv.alert_count;
    $('#page').innerHTML = `
    <h2>Investigations</h2>
    <div class="card"><table><thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Risk</th><th>Alerts</th><th>Confidence</th><th>Window (UTC)</th></tr></thead>
      <tbody><tr><td class="mono">${esc(inv.id)}</td><td>${esc(inv.title)}</td><td>${esc(inv.status.replace('_', ' '))}</td>
      <td><div class="bar sm"><b>${D.risk.score}</b><i style="width:${D.risk.score}%"></i></div></td><td>${inv.alert_count}</td>
      <td>${confBadge(inv.confidence)}</td><td class="mono">${time(inv.window.start)} – ${time(inv.window.end)}</td></tr></tbody></table>
      ${others > 0 ? mut(`${others} other alert(s) outside this chain are listed under Alerts as Suspicious.`) : ''}</div>
    <div class="tabs"><button data-tab="alerts">Alerts (${D.alerts.length})</button><button data-tab="root">Root cause and blast radius</button></div>
    <div id="tabbody"></div>`;
    drawTab();
  };

  function drawTab() {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'root') { $('#tabbody').innerHTML = rootTab(); return; }
    const sevs = Object.keys(D.severity);
    $('#tabbody').innerHTML = `
      <div class="filters">
        <select id="fsev"><option value="">All severities</option>${sevs.map((s) => `<option>${esc(s)}</option>`).join('')}</select>
        <select id="fconf"><option value="">All confidence</option><option value="high">High confidence</option><option value="correlated">Correlated</option><option value="suspicious">Suspicious</option></select>
        <input id="fq" placeholder="Alert ID, rule, entity or event ID">
        <button class="btn ghost" id="freset">Reset filters</button>
      </div>
      <div class="card"><table><thead><tr><th>Severity</th><th>Time (UTC)</th><th>Alert</th><th>Entity</th><th>Confidence</th><th>Evidence</th></tr></thead>
        <tbody id="rows"></tbody></table><p class="mut" id="count"></p></div>`;
    $('#fsev').value = fSev;
    $('#fconf').value = fConf;
    $('#fq').value = q;
    $('#fsev').onchange = (e) => { fSev = e.target.value; drawRows(); };
    $('#fconf').onchange = (e) => { fConf = e.target.value; drawRows(); };
    $('#fq').oninput = (e) => { q = e.target.value.toLowerCase(); drawRows(); };
    $('#freset').onclick = () => { fSev = fConf = q = ''; drawTab(); };
    drawRows();
  }

  function drawRows() {
    const list = D.alerts.filter((a) => (!fSev || a.severity === fSev) && (!fConf || a.confidence === fConf) &&
      (!q || [a.id, a.rule, a.entity, a.reason, ...a.evidence].join(' ').toLowerCase().includes(q)));
    $('#rows').innerHTML = list.map((a) => `
      <tr class="row" data-row="${a.id}"><td>${sevBadge(a.severity)}</td><td class="mono">${time(a.time)}</td>
        <td>${esc(a.rule)}<div class="mut mono">${a.id} · ${esc(a.stage)}</div></td><td>${esc(a.entity)}</td>
        <td>${confBadge(a.confidence)}</td><td>${a.evidence.length}</td></tr>
      ${openId === a.id ? `<tr class="detail"><td colspan="6">
        <div><b>Why flagged:</b> ${esc(a.reason)}</div>
        <div><b>Rule:</b> ${esc(a.rule)} · stage: ${esc(a.stage)}</div>
        <div><b>Evidence:</b> ${chips(a.evidence)}</div>
        <div><b>Linked alerts:</b> ${a.linked.length ? a.linked.map((l) => `<span class="chip mono" data-row="${l}">${l}</span>`).join(' ') : mut('none')}</div>
        <button class="btn ghost" data-graph="${a.id}">View in graph</button> <button class="btn ghost" data-tl="${a.id}">View in timeline</button>
      </td></tr>` : ''}`).join('') || '<tr><td colspan="6" class="mut">No alerts match.</td></tr>';
    $('#count').textContent = `Showing ${list.length} of ${D.alerts.length} alerts`;
  }

  function rootTab() {
    const rc = D.root_cause, b = D.blast;
    const list = (a) => (a.length ? a.map((x) => esc(x)).join(', ') : mut('none'));
    return `<div class="grid g2">
      <div class="card"><div class="cap">Root cause · likely initial access</div>
        <p><b>${esc(rc.account)}</b> · ${esc(rc.likely_vector)}</p>
        <p class="mut">Confidence: ${esc(rc.confidence)}. The earliest correlated alert is a best guess, not proof.</p>
        <ul>${rc.why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
        <div>Evidence: ${chips(rc.evidence)}</div></div>
      <div class="card"><div class="cap">Blast radius</div>
        <p><b>Compromised accounts:</b> ${list(b.compromised_accounts)}</p>
        <p><b>Compromised hosts:</b> ${list(b.compromised_hosts)}</p>
        <p><b>External IPs:</b> ${list(b.external_ips)}</p>
        <p><b>Accounts at risk:</b> ${b.exposed_accounts.length ? b.exposed_accounts.map((x) => `${esc(x.user)} (${x.hosts.map(esc).join(', ')}) ${chips(x.evidence)}`).join('<br>') : mut('none')}</p>
        <p><b>Admin escalation:</b> ${b.admin_escalation ? `${esc(b.admin_escalation.account)}: ${esc(b.admin_escalation.detail)} ${chips(b.admin_escalation.evidence)}` : mut('none')}</p>
        <p class="mut">At risk = logged into a compromised host, so credentials may be exposed. Not confirmed compromised.</p></div>
    </div>`;
  }

  actions.row = (id) => { openId = openId === id ? null : id; drawRows(); };
  actions.tab = (t) => { tab = t; drawTab(); };
})();
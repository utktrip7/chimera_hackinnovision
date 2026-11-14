(() => {
  let q = '', only = false;
  pages.logs = () => {
    $('#page').innerHTML = `<h2>Security logs</h2>
      <div class="filters"><input id="lq" placeholder="Search user, host, IP, type, details" value="${esc(q)}">
      <label><input type="checkbox" id="lo" ${only ? 'checked' : ''}> Only events cited by alerts</label></div>
      <div class="card"><table><thead><tr><th>ID</th><th>Time (UTC)</th><th>User</th><th>Route</th><th>Type</th><th>Status</th><th>Alerts</th></tr></thead><tbody id="lrows"></tbody></table><p class="mut" id="lcount"></p></div>`;
    $('#lq').oninput = (e) => { q = e.target.value.toLowerCase(); draw(); };
    $('#lo').onchange = (e) => { only = e.target.checked; draw(); };
    draw();
  };
  function draw() {
    const cites = {};
    D.alerts.forEach((a) => a.evidence.forEach((id) => (cites[id] = (cites[id] || 0) + 1)));
    const list = evList.filter((e) => (!only || cites[e.id]) && (!q || Object.values(e).join(' ').toLowerCase().includes(q)));
    $('#lrows').innerHTML = list.slice(0, 500).map((e) => `<tr class="row" data-ev="${esc(e.id)}"><td class="mono">${esc(e.id)}</td>
      <td class="mono">${esc(e.timestamp ? time(e.timestamp) : '')}</td><td>${esc(e.user)}</td><td>${esc(e.src_host)} → ${esc(e.dest_host)}</td>
      <td>${esc(e.event_type)}</td><td>${esc(e.status)}</td><td>${cites[e.id] ? `<span class="badge s-high">${cites[e.id]}</span>` : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="mut">No events match.</td></tr>';
    $('#lcount').textContent = `Showing ${Math.min(list.length, 500)} of ${evList.length} events`;
  }
})();

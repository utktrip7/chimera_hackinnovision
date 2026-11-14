pages.graph = async () => {
  const g = await api('/api/graph');
  if (!g.edges.length) return empty();
  $('#page').innerHTML = `<h2>Attack graph</h2><div id="cy"></div><div class="card" id="ginfo">${mut('Click an arrow to see why it exists.')}</div>`;
  const cy = cytoscape({
    container: $('#cy'),
    elements: [...g.nodes.map((n) => ({ data: n })), ...g.edges.map((e) => ({ data: e }))],
    layout: { name: 'breadthfirst', directed: true, roots: ['EXTERNAL'], padding: 40 },
    style: [
      { selector: 'node', style: { label: 'data(label)', color: '#fff', 'background-color': '#38bdf8', width: 56, height: 56, 'font-size': 11, 'text-valign': 'center' } },
      { selector: 'node[?external]', style: { 'background-color': '#ef4444' } },
      { selector: 'edge', style: { label: 'data(label)', 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', width: 3, 'line-color': '#f97316', 'target-arrow-color': '#f97316', color: '#cbd5e1', 'font-size': 9, 'text-background-color': '#0a101c', 'text-background-opacity': 1 } },
      { selector: 'edge[severity = "high"]', style: { 'line-color': '#ef4444', 'target-arrow-color': '#ef4444' } },
      { selector: '.sel', style: { width: 6, 'line-color': '#38bdf8', 'target-arrow-color': '#38bdf8' } },
    ],
  });
  const show = (d) => {
    cy.edges().removeClass('sel'); cy.getElementById(d.id).addClass('sel');
    $('#ginfo').innerHTML = `${sevBadge(d.severity)} <b>${d.id} · ${esc(d.label)}</b><p>${esc(d.reason)}</p>
      <p class="mut">${esc(d.user)} · ${esc(d.source)} → ${esc(d.target)} · ${esc(d.time)}</p>Evidence: ${chips(d.evidence)}
      <p><button class="btn ghost" data-tl="${d.id}">View in timeline</button></p>`;
  };
  cy.on('tap', 'edge', (e) => show(e.target.data()));
  if (focusAlert) { const e = cy.getElementById(focusAlert); if (e.length) show(e.data()); focusAlert = null; }
};

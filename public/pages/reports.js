pages.reports = async () => {
  const r = await api('/api/report');
  if (!r.title) return empty();
  const ul = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const b = r.blast_radius, rc = r.root_cause;
  $('#page').innerHTML = `<div class="actions" style="margin-bottom:10px"><button class="btn" onclick="print()">Print / save PDF</button>
    <button class="btn ghost" id="dl">Download JSON</button></div>
    <div class="card report"><h2>${esc(r.title)}</h2><p class="mut">Generated ${esc(r.generated_at)} · ${esc(r.verdict.status.replace('_', ' '))}</p>
    <p>${esc(r.summary)}</p><p class="mut">${esc(r.verdict.note)}</p>
    <h3>Root cause</h3><p><b>${esc(rc.account)}</b> · ${esc(rc.likely_vector)} (confidence: ${esc(rc.confidence)})</p>${ul(rc.why)}<div>${chips(rc.evidence)}</div>
    <h3>Timeline</h3>${r.timeline.map((t) => `<div>${time(t.time)} ${sevBadge(t.severity)} <b>${esc(t.rule)}</b> ${esc(t.text)} ${chips(t.evidence)}</div>`).join('')}
    <h3>Blast radius</h3><p>Accounts: ${esc(b.compromised_accounts.join(', ') || 'none')}<br>Hosts: ${esc(b.compromised_hosts.join(', ') || 'none')}<br>External IPs: ${esc(b.external_ips.join(', ') || 'none')}</p>
    <h3>Recommendations</h3>${ul(r.recommendations)}
    <h3>Evidence (${r.evidence.length} events)</h3><table><tbody>${r.evidence.map((e) => `<tr><td>${chip(e.id)}</td><td class="mono">${esc(e.timestamp)}</td><td>${esc(e.user)}</td><td>${esc(e.details)}</td></tr>`).join('')}</tbody></table>
    <h3>Limitations</h3>${ul(r.limitations)}</div>`;
  $('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })); a.download = 'chimera-report.json'; a.click(); };
};

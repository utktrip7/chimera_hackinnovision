const STAGE_OF = {
  EXTERNAL_LOGIN: 'Initial access',
  OFF_HOURS_HOP: 'Lateral movement',
  PRIVILEGE_CHANGE: 'Privilege escalation',
  EXTERNAL_CONNECTION: 'Command and control',
};
const STAGES = ['Initial access', 'Privilege escalation', 'Lateral movement', 'Command and control', 'Exfiltration'];
const RANK = { suspicious: 1, correlated: 2, high: 3 };

function buildDashboard(events, alerts, chains, inv, blast, source) {
  const eventById = {};
  events.forEach((e) => (eventById[e.id] = e));

  const chainOf = {};
  const linked = {};
  chains.forEach((c) => {
    c.alerts.forEach((id) => (chainOf[id] = c));
    c.links.forEach((l) => {
      (linked[l.from] = linked[l.from] || []).push(l.to);
      (linked[l.to] = linked[l.to] || []).push(l.from);
    });
  });

  // alerts enriched with stage, confidence and links
  const rich = alerts.map((a) => {
    const e = eventById[a.evidence[0]];
    const c = chainOf[a.id];
    let confidence = 'suspicious';
    if (c && c.alerts.length > 1) confidence = 'correlated';
    if (c && c.status === 'likely_attack' && a.severity === 'high') confidence = 'high';
    return {
      ...a, stage: STAGE_OF[a.rule] || 'Other', confidence,
      entity: e.user, host: e.dest_host, time: e.timestamp,
      chain: c ? c.id : null, linked: [...new Set(linked[a.id] || [])],
    };
  });

  const stages = STAGES.map((name) => {
    const list = rich.filter((a) => a.stage === name);
    const best = list.reduce((m, a) => Math.max(m, RANK[a.confidence]), 0);
    return { name, count: list.length, status: ['none', 'suspicious', 'correlated', 'high'][best] };
  });

  const severity = {};
  const rules = {};
  rich.forEach((a) => {
    severity[a.severity] = (severity[a.severity] || 0) + 1;
    rules[a.rule] = (rules[a.rule] || 0) + 1;
  });
  const top_rules = Object.entries(rules).map(([rule, count]) => ({ rule, count })).sort((a, b) => b.count - a.count);

  // explainable risk score: every point has a reason
  const breakdown = [];
  const highs = severity.high || 0;
  const meds = severity.medium || 0;
  if (highs) breakdown.push({ label: `${highs} high-severity alerts`, points: highs * 10 });
  if (meds) breakdown.push({ label: `${meds} medium-severity alerts`, points: meds * 5 });
  if (inv && inv.timeline.length >= 3) breakdown.push({ label: 'Alerts linked into one chain', points: 15 });
  if (blast && blast.admin_escalation) breakdown.push({ label: 'Admin rights granted', points: 20 });
  if (blast && blast.external_ips.length) {
    breakdown.push({ label: 'External IPs involved', points: Math.min(10, blast.external_ips.length * 5) });
  }
  const score = Math.min(100, breakdown.reduce((s, b) => s + b.points, 0));
  const level = score >= 80 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

  let path = [];
  let key_events = [];
  let investigation = null;
  if (inv) {
    inv.timeline.forEach((t, i) => {
      const e = eventById[t.evidence[0]];
      const node = (host) => (host === 'EXTERNAL' ? { label: e.src_ip || 'EXTERNAL', external: true } : { label: host, external: false });
      if (i === 0) path.push(node(e.src_host));
      const next = node(e.dest_host);
      if (next.label !== path[path.length - 1].label) path.push(next);
      key_events.push({
        time: t.time, alert: t.alert, rule: t.rule, severity: t.severity, text: t.text,
        entity: e.user, stage: STAGE_OF[t.rule] || 'Other',
        gap: t.minutes_since_previous, evidence: t.evidence,
      });
    });
    const first = inv.timeline[0];
    const last = inv.timeline[inv.timeline.length - 1];
    investigation = {
      id: 'INV-' + inv.chain.replace('C', '').padStart(3, '0'),
      title: `Possible compromise of ${inv.root_cause.account}`,
      status: inv.status,
      confidence: inv.status === 'likely_attack' ? 'high' : 'suspicious',
      summary: `Chain of ${inv.timeline.length} correlated alerts over ${inv.duration_minutes} minutes. First: ${first.text}. Last: ${last.text}.`,
      window: { start: first.time, end: last.time },
      duration_minutes: inv.duration_minutes,
      alert_count: inv.timeline.length,
      risk: score,
    };
  }

  return {
    source: source.name, is_sample: source.sample,
    totals: { events: events.length, alerts: alerts.length },
    investigation,
    risk: { score, level, breakdown },
    kpis: {
      alerts: alerts.length,
      accounts: blast ? blast.compromised_accounts.length : 0,
      hosts: blast ? blast.compromised_hosts.length : 0,
      external_ips: blast ? blast.external_ips.length : 0,
      exposed: blast ? blast.exposed_accounts.length : 0,
    },
    stages, severity, top_rules, path, key_events, alerts: rich,
    root_cause: inv ? inv.root_cause : null,
    blast,
  };
}

module.exports = buildDashboard;
function blastRadius(events, alerts, chains) {
  const chain = [...chains].sort((a, b) => b.alerts.length - a.alerts.length)[0];
  if (!chain) return null;

  const eventById = {};
  events.forEach((e) => (eventById[e.id] = e));
  const alertById = {};
  alerts.forEach((a) => (alertById[a.id] = a));

  const chainEvents = chain.alerts.map((id) => eventById[alertById[id].evidence[0]]);
  const chainIds = chainEvents.map((e) => e.id);

  const accounts = [...new Set(chainEvents.map((e) => e.user))];
  const hosts = [...new Set(chainEvents.flatMap((e) => [e.src_host, e.dest_host]))]
    .filter((h) => h !== 'EXTERNAL');
  const externalIps = [...new Set(
    chainEvents.filter((e) => e.src_host === 'EXTERNAL' || e.dest_host === 'EXTERNAL')
      .map((e) => e.src_ip)
  )];

  // other users who successfully logged into a compromised host
  const exposed = {};
  events.forEach((e) => {
    if (!chainIds.includes(e.id) && e.event_type === 'login_success' &&
        hosts.includes(e.dest_host) && !accounts.includes(e.user)) {
      if (!exposed[e.user]) exposed[e.user] = { user: e.user, hosts: [], evidence: [] };
      if (!exposed[e.user].hosts.includes(e.dest_host)) exposed[e.user].hosts.push(e.dest_host);
      exposed[e.user].evidence.push(e.id);
    }
  });

  const adminEvent = chainEvents.find(
    (e) => e.event_type === 'privilege_change' && /admin/i.test(e.details)
  );

  return {
    chain: chain.id,
    compromised_accounts: accounts,
    compromised_hosts: hosts,
    external_ips: externalIps,
    exposed_accounts: Object.values(exposed),
    admin_escalation: adminEvent
      ? { account: adminEvent.user, detail: adminEvent.details, evidence: [adminEvent.id] }
      : null,
    risk_level: adminEvent ? 'critical' : 'high',
  };
}

module.exports = blastRadius;
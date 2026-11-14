function buildGraph(events, alerts, chains) {
  const eventById = {};
  events.forEach((e) => (eventById[e.id] = e));
  const alertById = {};
  alerts.forEach((a) => (alertById[a.id] = a));

  const nodes = {};
  const edges = [];

  chains.forEach((chain) => {
    chain.alerts.forEach((alertId) => {
      const a = alertById[alertId];
      const e = eventById[a.evidence[0]];

      [e.src_host, e.dest_host].forEach((host) => {
        if (!nodes[host]) {
          nodes[host] = {
            id: host,
            label: host,
            external: host === "EXTERNAL",
          };
        }
      });

      edges.push({
        id: a.id,
        source: e.src_host,
        target: e.dest_host,
        label: a.rule,
        user: e.user,
        time: e.timestamp,
        severity: a.severity,
        reason: a.reason,
        evidence: a.evidence,
        chain: chain.id,
      });
    });
  });

  return { nodes: Object.values(nodes), edges };
}

module.exports = buildGraph;

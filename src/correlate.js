const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function correlate(events, alerts) {
  const byId = {};
  events.forEach((e) => (byId[e.id] = e));
  const items = alerts.map((a) => ({ alert: a, ev: byId[a.evidence[0]] }));
  const links = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const x = items[i].ev;
      const y = items[j].ev;
      const closeInTime = y.time_ms - x.time_ms <= WINDOW_MS;
      const sameUser = x.user === y.user;
      const hostFlow = x.dest_host === y.src_host;

      if (closeInTime && (sameUser || hostFlow)) {
        links.push({
          from: items[i].alert.id,
          to: items[j].alert.id,
          reason: sameUser
            ? `same user (${x.user})`
            : `${x.dest_host} is where the next event started`,
        });
      }
    }
  }

  // 2. group linked alerts into chains
  const chainOf = {};
  let count = 0;
  items.forEach((it) => {
    const id = it.alert.id;
    const parent = links.find((l) => l.to === id);
    chainOf[id] = parent ? chainOf[parent.from] : "C" + ++count;
  });

  const chains = {};
  items.forEach((it) => {
    const cid = chainOf[it.alert.id];
    if (!chains[cid]) chains[cid] = { id: cid, alerts: [] };
    chains[cid].alerts.push(it.alert.id);
  });

  return Object.values(chains).map((c) => ({
    ...c,
    status: c.alerts.length >= 3 ? "likely_attack" : "suspicious",
    links: links.filter((l) => c.alerts.includes(l.from)),
  }));
}

module.exports = correlate;

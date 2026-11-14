function investigate(events, alerts, chains) {
  const eventById = {};
  events.forEach((e) => (eventById[e.id] = e));
  const alertById = {};
  alerts.forEach((a) => (alertById[a.id] = a));

  // focus on the biggest chain
  const chain = [...chains].sort((a, b) => b.alerts.length - a.alerts.length)[0];
  if (!chain) return null;

  let prevTime = null;
  const timeline = chain.alerts.map((id) => {
    const a = alertById[id];
    const e = eventById[a.evidence[0]];
    const gap = prevTime ? Math.round((e.time_ms - prevTime) / 60000) : 0;
    prevTime = e.time_ms;
    return {
      time: e.timestamp,
      alert: a.id,
      rule: a.rule,
      severity: a.severity,
      text: a.reason,
      minutes_since_previous: gap,
      evidence: a.evidence,
    };
  });

  const first = timeline[0];
  const firstEvent = eventById[first.evidence[0]];
  const external = first.rule === 'EXTERNAL_LOGIN';

  const why = [`Earliest alert in the chain (${first.time})`];
  if (external) why.push(`Login came from outside the network (${firstEvent.src_ip})`);
  why.push(`${timeline.length - 1} later alerts link back to it`);

  const totalMinutes = Math.round(
    (new Date(timeline[timeline.length - 1].time) - new Date(first.time)) / 60000
  );

  return {
    chain: chain.id,
    status: chain.status,
    duration_minutes: totalMinutes,
    timeline,
    root_cause: {
      alert: first.alert,
      account: firstEvent.user,
      likely_vector: external
        ? 'Possible compromised credentials used from an external IP'
        : 'Unknown (earliest suspicious activity)',
      confidence: 'medium',
      why,
      evidence: first.evidence,
    },
  };
}

module.exports = investigate;
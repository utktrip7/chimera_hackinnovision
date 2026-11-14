function detect(events) {
  const alerts = [];

  function addAlert(rule, severity, reason, evidence) {
    alerts.push({
      id: 'A' + (alerts.length + 1),
      rule,
      severity,
      status: 'suspicious',
      reason,
      evidence,
    });
  }

  events.forEach((e) => {
    if (e.event_type === 'login_success' && e.src_host === 'EXTERNAL') {
      addAlert('EXTERNAL_LOGIN', 'medium',
        `${e.user} logged in to ${e.dest_host} from external IP ${e.src_ip}`, [e.id]);
    }

    const hour = new Date(e.time_ms).getUTCHours();
    const isHop = e.event_type === 'login_success' &&
                  e.src_host !== 'EXTERNAL' &&
                  e.src_host !== e.dest_host;

    if (isHop && (hour < 6 || hour >= 22)) {
      addAlert('OFF_HOURS_HOP', 'medium',
        `${e.user} moved from ${e.src_host} to ${e.dest_host} at ${hour}:00 UTC`, [e.id]);
    }

    if (e.event_type === 'privilege_change') {
      addAlert('PRIVILEGE_CHANGE', 'high',
        `${e.user} privilege change on ${e.dest_host}: ${e.details}`, [e.id]);
    }

    if (e.event_type === 'network_connection' && e.dest_host === 'EXTERNAL') {
      addAlert('EXTERNAL_CONNECTION', 'high',
        `${e.src_host} opened an outbound connection to ${e.src_ip}`, [e.id]);
    }
  });

  return alerts;
}

module.exports = detect;
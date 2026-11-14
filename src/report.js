function buildReport(events, inv, blast) {
  if (!inv || !blast) {
    return { summary: 'No correlated attack chain was found in this data.' };
  }

  const cited = new Set();
  inv.timeline.forEach((t) => t.evidence.forEach((id) => cited.add(id)));
  blast.exposed_accounts.forEach((x) => x.evidence.forEach((id) => cited.add(id)));
  if (blast.admin_escalation) blast.admin_escalation.evidence.forEach((id) => cited.add(id));

  const evidence = events
    .filter((e) => cited.has(e.id))
    .map(({ time_ms, ...rest }) => rest);

  const rc = inv.root_cause;
  const last = inv.timeline[inv.timeline.length - 1];

  const recommendations = [
    ...blast.compromised_accounts.map((a) => `Reset credentials and review sessions for ${a}`),
    ...blast.compromised_hosts.map((h) => `Isolate and inspect ${h}`),
    ...blast.external_ips.map((ip) => `Block and investigate external IP ${ip}`),
  ];
  if (blast.admin_escalation) {
    recommendations.push(`Revert and audit admin rights granted to ${blast.admin_escalation.account}`);
  }
  if (blast.exposed_accounts.length) {
    recommendations.push(
      `Consider credential resets for: ${blast.exposed_accounts.map((x) => x.user).join(', ')}`
    );
  }

  return {
    title: 'CHIMERA Investigation Report',
    generated_at: new Date().toISOString(),
    verdict: {
      status: inv.status,
      note: 'Based on correlated log evidence. Needs analyst review before being treated as confirmed.',
    },
    summary:
      `Likely multi-stage attack lasting ${inv.duration_minutes} minutes, starting with ` +
      `${rc.account}. ${blast.compromised_accounts.length} accounts and ` +
      `${blast.compromised_hosts.length} hosts are involved. Last observed step: ${last.text}.`,
    root_cause: rc,
    timeline: inv.timeline,
    blast_radius: blast,
    recommendations,
    evidence,
    limitations: [
      'Findings come only from the uploaded logs. The bundled sample file is simulated, not a real incident.',
      'Detection is rule-based: activity that matches no rule is not seen.',
      'The root cause is the earliest correlated alert; the real entry point may be earlier or outside these logs.',
      'Chain status is "likely", not confirmed.',
    ],
  };
}

module.exports = buildReport;
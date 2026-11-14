function normalizeEvents(rawEvents) {
  const events = rawEvents
    .map((row, index) => {
      const time = new Date(row.timestamp);
      if (isNaN(time)) return null; // skip rows with a broken timestamp

      return {
        id: "E" + (index + 1),
        timestamp: time.toISOString(),
        time_ms: time.getTime(),
        user: row.user.trim().toLowerCase(),
        src_host: row.src_host.trim().toUpperCase(),
        dest_host: row.dest_host.trim().toUpperCase(),
        event_type: row.event_type.trim(),
        src_ip: row.src_ip.trim() || null,
        status: row.status.trim(),
        details: row.details.trim(),
        line: row._line,
        raw: row._raw,
      };
    })
    .filter(Boolean);

  events.sort((a, b) => a.time_ms - b.time_ms);
  return events;
}

module.exports = normalizeEvents;

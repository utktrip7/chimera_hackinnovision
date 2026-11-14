const fs = require('fs');
const { parse } = require('csv-parse/sync');

function loadLogs(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const rows = parse(text, { columns: true, skip_empty_lines: true, info: true, raw: true });
  return rows.map((r) => ({ ...r.record, _line: r.info.lines, _raw: r.raw.trim() }));
}

module.exports = loadLogs;
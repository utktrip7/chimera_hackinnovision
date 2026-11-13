const fs = require('fs');
const { parse } = require('csv-parse/sync');

function loadLogs(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return parse(text, { columns: true, skip_empty_lines: true });
}

module.exports = loadLogs;
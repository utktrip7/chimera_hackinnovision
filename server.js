const express = require('express');
const app = express();
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'CHIMERA' });
});
app.listen(3000, () => {
  console.log('CHIMERA running at http://localhost:3000');
});
app.use(express.static('public'));
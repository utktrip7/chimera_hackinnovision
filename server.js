const express = require("express");
const loadLogs = require("./src/loadLogs");
const normalizeEvents = require("./src/normalize");

const app = express();

app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", project: "CHIMERA" });
});

app.get("/api/events", (req, res) => {
  res.json(normalizeEvents(loadLogs("data/sample_logs.csv")));
});

app.listen(3000, () => {
  console.log("CHIMERA running at http://localhost:3000");
});
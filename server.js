const express = require("express");
const multer = require("multer");
const loadLogs = require("./src/loadLogs");
const normalizeEvents = require("./src/normalize");
const detect = require("./src/detect");
const correlate = require("./src/correlate");
const buildGraph = require("./src/graph");
const investigate = require("./src/investigate");
const blastRadius = require("./src/blast");
const buildReport = require("./src/report");
const buildDashboard = require("./src/dashboard");

const app = express();
const upload = multer({ dest: "uploads/" });

const SAMPLE = "data/sample_logs.csv";
let currentFile = SAMPLE;
let currentName = "sample_logs.csv";

function analyze() {
  const events = normalizeEvents(loadLogs(currentFile));
  events.forEach((e) => (e.source = currentName));
  const alerts = detect(events);
  const chains = correlate(events, alerts);
  return { events, alerts, chains };
}

app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", project: "CHIMERA" });
});

app.get("/api/events", (req, res) => res.json(analyze().events));
app.get("/api/alerts", (req, res) => res.json(analyze().alerts));
app.get("/api/chains", (req, res) => res.json(analyze().chains));

app.get("/api/graph", (req, res) => {
  const { events, alerts, chains } = analyze();
  res.json(buildGraph(events, alerts, chains));
});

app.get("/api/investigation", (req, res) => {
  const { events, alerts, chains } = analyze();
  res.json(investigate(events, alerts, chains));
});

app.get("/api/blast", (req, res) => {
  const { events, alerts, chains } = analyze();
  res.json(blastRadius(events, alerts, chains));
});

app.get("/api/report", (req, res) => {
  const { events, alerts, chains } = analyze();
  res.json(buildReport(events, investigate(events, alerts, chains), blastRadius(events, alerts, chains)));
});

app.get("/api/dashboard", (req, res) => {
  const { events, alerts, chains } = analyze();
  const inv = investigate(events, alerts, chains);
  const blast = blastRadius(events, alerts, chains);
  res.json(buildDashboard(events, alerts, chains, inv, blast, { name: currentName, sample: currentFile === SAMPLE }));
});

app.post("/api/upload", upload.single("logfile"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const prevFile = currentFile;
  const prevName = currentName;
  try {
    currentFile = req.file.path;
    currentName = req.file.originalname;
    const { events, alerts, chains } = analyze();
    res.json({ message: "uploaded", events: events.length, alerts: alerts.length, chains: chains.length });
  } catch (err) {
    currentFile = prevFile; // bad file: go back to the last good one
    currentName = prevName;
    res.status(400).json({ error: "Could not read file: " + err.message });
  }
});

app.post("/api/reset", (req, res) => {
  currentFile = SAMPLE;
  currentName = "sample_logs.csv";
  res.json({ message: "back to sample data" });
});

app.listen(3000, () => {
  console.log("CHIMERA running at http://localhost:3000");
});
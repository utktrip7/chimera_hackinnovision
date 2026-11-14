fetch("/api/graph")
  .then((r) => r.json())
  .then((g) => {
    const elements = [
      ...g.nodes.map((n) => ({ data: n })),
      ...g.edges.map((e) => ({ data: e })),
    ];

    const cy = cytoscape({
      container: document.getElementById("cy"),
      elements,
      layout: {
        name: "breadthfirst",
        directed: true,
        roots: ["EXTERNAL"],
        padding: 40,
      },
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            color: "#fff",
            "background-color": "#3b82f6",
            "text-valign": "center",
            width: 60,
            height: 60,
            "font-size": 11,
          },
        },
        {
          selector: "node[?external]",
          style: { "background-color": "#ef4444" },
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            width: 3,
            "line-color": "#f59e0b",
            "target-arrow-color": "#f59e0b",
            color: "#ddd",
            "font-size": 9,
            "text-background-color": "#111",
            "text-background-opacity": 1,
          },
        },
        {
          selector: 'edge[severity = "high"]',
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
          },
        },
      ],
    });

    cy.on("tap", "edge", (evt) => {
      const d = evt.target.data();
      document.getElementById("info").innerHTML =
        `<b>${d.id} · ${d.label}</b> (${d.severity})<br>` +
        `${d.reason}<br>User: ${d.user} · Time: ${d.time}<br>` +
        `Evidence: ${d.evidence.join(", ")}`;
    });
  });

fetch("/api/investigation")
  .then((r) => r.json())
  .then((inv) => {
    const rc = inv.root_cause;
    const steps = inv.timeline
      .map(
        (t) => `<li>${t.time.slice(11, 16)} UTC · <b>${t.rule}</b> · ${t.text}
        <i>(+${t.minutes_since_previous} min · evidence ${t.evidence.join(", ")})</i></li>`,
      )
      .join("");

    document.getElementById("story").innerHTML =
      `<h3>Chain ${inv.chain}: ${inv.status} (${inv.duration_minutes} min)</h3>
       <b>Likely initial access:</b> ${rc.account} · ${rc.likely_vector}
       (confidence: ${rc.confidence})<br>
       <b>Why:</b> ${rc.why.join("; ")}<br>
       <h4>Timeline</h4><ol>${steps}</ol>`;
  });

/**
 * html-panels.ts — Panel HTML fragments for the AgentSentry dashboard.
 *
 * Each exported function returns a raw HTML string for a specific tab or panel.
 * Imported by html.ts to keep the main template under 500 lines.
 */

/* ------------------------------------------------------------------ */
/*  Dashboard CSS                                                      */
/* ------------------------------------------------------------------ */

export function dashboardCss(): string {
  return `
:root{--bg:#0d1117;--surface:#161b22;--border:#30363d;--text:#e6edf3;--muted:#8b949e;--accent:#58a6ff;--green:#3fb950;--yellow:#d29922;--red:#f85149;--orange:#db6d28;--purple:#bc8cff;--radius:8px;--gap:16px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
header{background:var(--surface);border-bottom:1px solid var(--border);padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
header h1{font-size:16px;font-weight:600}
header .status{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)}
header .dot{width:8px;height:8px;border-radius:50%;background:var(--border)}
header .dot.connected{background:var(--green)}
header .dot.disconnected{background:var(--red)}
.tab-bar{display:flex;background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;gap:0;overflow-x:auto}
.tab-bar button{background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);font-size:13px;font-weight:500;padding:10px 16px;cursor:pointer;transition:color .15s,border-color .15s;white-space:nowrap}
.tab-bar button:hover{color:var(--text)}
.tab-bar button.active{color:var(--accent);border-bottom-color:var(--accent)}
.tab-content{display:none;padding:var(--gap);max-width:1400px;margin:0 auto}
.tab-content.active{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;min-height:120px}
.panel.full{grid-column:1/-1}
.panel h2{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}
.panel h2 .badge{background:var(--bg);padding:2px 8px;border-radius:10px;font-size:11px;font-weight:400}
.event-feed{max-height:600px;overflow-y:auto;font-family:'SF Mono',Menlo,monospace;font-size:12px;line-height:1.8}
.event-row{display:flex;gap:12px;padding:4px 8px;border-radius:4px;transition:background .15s}
.event-row:hover{background:var(--bg)}
.event-row .ts{color:var(--muted);min-width:80px}
.event-row .type{min-width:100px;font-weight:500}
.event-row .data{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.type-tool_use{color:var(--accent)}.type-session_start{color:var(--green)}.type-session_end{color:var(--yellow)}
.type-error{color:var(--red)}.type-metric{color:var(--purple)}.type-heartbeat{color:var(--border)}
.type-decision{color:var(--accent)}.type-violation{color:var(--red)}.type-incident{color:var(--orange)}
.type-pattern{color:var(--purple)}.type-handoff{color:var(--yellow)}.type-audit_finding{color:var(--muted)}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
.stat-card{background:var(--bg);border-radius:var(--radius);padding:12px;text-align:center}
.stat-card .val{font-size:28px;font-weight:700;color:var(--accent)}
.stat-card .label{font-size:11px;color:var(--muted);margin-top:4px}
.health-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.health-card{background:var(--bg);border-radius:var(--radius);padding:12px;text-align:center}
.health-card .label{font-size:11px;color:var(--muted);text-transform:uppercase;margin-bottom:6px}
.health-card .value{font-size:24px;font-weight:700}
.health-card .sub{font-size:11px;color:var(--muted);margin-top:4px}
.check-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px}
.check-row:last-child{border-bottom:none}
.check-row .status-pass{color:var(--green)}.check-row .status-warn{color:var(--yellow)}.check-row .status-fail{color:var(--red)}
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px}
.bar-row .bar-label{min-width:100px;color:var(--muted);text-align:right}
.bar-row .bar-track{flex:1;height:18px;background:var(--bg);border-radius:4px;overflow:hidden}
.bar-row .bar-fill{height:100%;border-radius:4px;min-width:2px;transition:width .3s}
.bar-row .bar-value{min-width:40px;font-weight:600;font-size:12px}
.enablement-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.level-badge{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:var(--accent);color:var(--bg);font-size:18px;font-weight:700}
.level-name{font-size:15px;font-weight:600}
.skill-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.skill-pill{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:500}
.skill-off{background:#8b949e22;color:var(--muted)}.skill-basic{background:#d2992222;color:var(--yellow)}.skill-full{background:#3fb95022;color:var(--green)}
.agent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.agent-card{background:var(--bg);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;gap:6px}
.agent-card .agent-header{display:flex;align-items:center;gap:8px}
.agent-card .agent-dot{width:8px;height:8px;border-radius:50%}
.agent-dot.active{background:var(--green)}.agent-dot.idle{background:var(--yellow)}.agent-dot.busy{background:var(--accent)}.agent-dot.offline{background:var(--muted)}
.agent-card .agent-name{font-weight:600;font-size:14px}
.agent-card .agent-role{font-size:12px;color:var(--muted)}
.agent-card .agent-seen{font-size:11px;color:var(--muted)}
.metrics-pre{font-family:'SF Mono',Menlo,monospace;font-size:11px;color:var(--muted);white-space:pre-wrap;max-height:400px;overflow-y:auto;background:var(--bg);padding:12px;border-radius:var(--radius)}
.plugin-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px}
.plugin-row:last-child{border-bottom:none}
.plugin-row .name{font-weight:500}.plugin-row .meta{color:var(--muted);font-size:12px}
.plugin-row .plugin-info{display:flex;align-items:center;gap:8px}
.source-badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:500;text-transform:uppercase}
.source-core{background:var(--accent);color:var(--bg)}.source-community{background:var(--purple);color:var(--bg)}
.pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px}
.pill-on{background:#3fb95022;color:var(--green)}.pill-off{background:#f8514922;color:var(--red)}
.empty{color:var(--muted);font-size:13px;font-style:italic;padding:20px;text-align:center}
@media(max-width:768px){.tab-content.active{grid-template-columns:1fr}.tab-bar{padding:0 8px}.tab-bar button{padding:10px 10px;font-size:12px}}
`;
}

/* ------------------------------------------------------------------ */
/*  Tab 1: Overview                                                    */
/* ------------------------------------------------------------------ */

export function overviewTab(): string {
  return `
  <div class="tab-content active" id="tab-overview">
    <!-- Stats grid -->
    <div class="panel full">
      <h2>Overview</h2>
      <div class="stats-grid" id="stats-grid">
        <div class="stat-card"><div class="val" id="stat-uptime">--</div><div class="label">Uptime (s)</div></div>
        <div class="stat-card"><div class="val" id="stat-clients">--</div><div class="label">Clients</div></div>
        <div class="stat-card"><div class="val" id="stat-events">--</div><div class="label">Total Events</div></div>
        <div class="stat-card"><div class="val" id="stat-dropped">--</div><div class="label">Events Dropped</div></div>
        <div class="stat-card"><div class="val" id="stat-mem-total">--</div><div class="label">Memory Events</div></div>
        <div class="stat-card"><div class="val" id="stat-feed">0</div><div class="label">Feed Items</div></div>
      </div>
    </div>

    <!-- Event Breakdown by Type -->
    <div class="panel">
      <h2>Event Breakdown by Type</h2>
      <div id="chart-by-type"><div class="empty">No event data</div></div>
    </div>

    <!-- Event Breakdown by Severity -->
    <div class="panel">
      <h2>Event Breakdown by Severity</h2>
      <div id="chart-by-severity"><div class="empty">No event data</div></div>
    </div>

    <!-- Enablement Level -->
    <div class="panel">
      <h2>Enablement Level</h2>
      <div id="enablement-content"><div class="empty">Loading...</div></div>
    </div>

    <!-- Health Status (compact) -->
    <div class="panel">
      <h2>Health Status <span class="badge" id="health-status">--</span></h2>
      <div id="health-checks"></div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/*  Tab 2: Events                                                      */
/* ------------------------------------------------------------------ */

export function eventsTab(): string {
  return `
  <div class="tab-content" id="tab-events">
    <div class="panel full">
      <h2>Live Event Feed <span class="badge" id="feed-count">0</span></h2>
      <div class="event-feed" id="event-feed"></div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/*  Tab 3: System                                                      */
/* ------------------------------------------------------------------ */

export function systemTab(): string {
  return `
  <div class="tab-content" id="tab-system">
    <!-- Streaming Stats -->
    <div class="panel full">
      <h2>Streaming Stats</h2>
      <div class="stats-grid" id="streaming-grid">
        <div class="stat-card"><div class="val" id="stream-buffer">--</div><div class="label">Buffer Size</div></div>
        <div class="stat-card"><div class="val" id="stream-published">--</div><div class="label">Events Published</div></div>
        <div class="stat-card"><div class="val" id="stream-dropped">--</div><div class="label">Events Dropped</div></div>
        <div class="stat-card"><div class="val" id="stream-clients">--</div><div class="label">Clients Connected</div></div>
      </div>
    </div>

    <!-- Metrics -->
    <div class="panel full">
      <h2>Metrics</h2>
      <pre class="metrics-pre" id="metrics-content">Loading...</pre>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/*  Tab 4: Agents                                                      */
/* ------------------------------------------------------------------ */

export function agentsTab(): string {
  return `
  <div class="tab-content" id="tab-agents">
    <div class="panel full">
      <h2>Agents <span class="badge" id="agent-count">0</span></h2>
      <div class="agent-grid" id="agent-grid">
        <div class="empty">Loading agents...</div>
      </div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/*  Tab 5: Plugins                                                     */
/* ------------------------------------------------------------------ */

export function pluginsTab(): string {
  return `
  <div class="tab-content" id="tab-plugins">
    <div class="panel full">
      <h2>Plugins <span class="badge" id="plugin-count">0</span></h2>
      <div id="plugins-list"><div class="empty">Loading plugins...</div></div>
    </div>
  </div>`;
}

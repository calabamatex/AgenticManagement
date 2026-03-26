/**
 * html.ts — Inline HTML template for the AgentSentry v5 real-time dashboard.
 *
 * Returns a self-contained HTML string with all CSS and JS inline.
 * Connects to the SSE endpoint at /events and polls /api/* for data.
 * Panel HTML is split into html-panels.ts to keep each file under 500 lines.
 */

import { overviewTab, eventsTab, systemTab, agentsTab, pluginsTab } from './html-panels';

export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AgentSentry Dashboard v5</title>
<style>
:root{--bg:#0d1117;--surface:#161b22;--border:#30363d;--text:#e6edf3;--muted:#8b949e;--accent:#58a6ff;--green:#3fb950;--yellow:#d29922;--red:#f85149;--orange:#db6d28;--purple:#bc8cff;--radius:8px;--gap:16px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
header{background:var(--surface);border-bottom:1px solid var(--border);padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
header h1{font-size:16px;font-weight:600}
header .status{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)}
header .dot{width:8px;height:8px;border-radius:50%;background:var(--border)}
header .dot.connected{background:var(--green)}
header .dot.disconnected{background:var(--red)}

/* Tab bar */
.tab-bar{display:flex;background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;gap:0;overflow-x:auto}
.tab-bar button{background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);font-size:13px;font-weight:500;padding:10px 16px;cursor:pointer;transition:color .15s,border-color .15s;white-space:nowrap}
.tab-bar button:hover{color:var(--text)}
.tab-bar button.active{color:var(--accent);border-bottom-color:var(--accent)}

/* Tab content */
.tab-content{display:none;padding:var(--gap);max-width:1400px;margin:0 auto}
.tab-content.active{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}

.panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;min-height:120px}
.panel.full{grid-column:1/-1}
.panel h2{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}
.panel h2 .badge{background:var(--bg);padding:2px 8px;border-radius:10px;font-size:11px;font-weight:400}

/* Event feed */
.event-feed{max-height:600px;overflow-y:auto;font-family:'SF Mono',Menlo,monospace;font-size:12px;line-height:1.8}
.event-row{display:flex;gap:12px;padding:4px 8px;border-radius:4px;transition:background .15s}
.event-row:hover{background:var(--bg)}
.event-row .ts{color:var(--muted);min-width:80px}
.event-row .type{min-width:100px;font-weight:500}
.event-row .data{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.type-tool_use{color:var(--accent)}
.type-session_start{color:var(--green)}
.type-session_end{color:var(--yellow)}
.type-error{color:var(--red)}
.type-metric{color:var(--purple)}
.type-heartbeat{color:var(--border)}
.type-decision{color:var(--accent)}
.type-violation{color:var(--red)}
.type-incident{color:var(--orange)}
.type-pattern{color:var(--purple)}
.type-handoff{color:var(--yellow)}
.type-audit_finding{color:var(--muted)}

/* Stats & health */
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
.check-row .status-pass{color:var(--green)}
.check-row .status-warn{color:var(--yellow)}
.check-row .status-fail{color:var(--red)}

/* Bar charts */
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px}
.bar-row .bar-label{min-width:100px;color:var(--muted);text-align:right}
.bar-row .bar-track{flex:1;height:18px;background:var(--bg);border-radius:4px;overflow:hidden}
.bar-row .bar-fill{height:100%;border-radius:4px;min-width:2px;transition:width .3s}
.bar-row .bar-value{min-width:40px;font-weight:600;font-size:12px}

/* Enablement */
.enablement-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.level-badge{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:var(--accent);color:var(--bg);font-size:18px;font-weight:700}
.level-name{font-size:15px;font-weight:600}
.skill-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.skill-pill{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:500}
.skill-off{background:#8b949e22;color:var(--muted)}
.skill-basic{background:#d2992222;color:var(--yellow)}
.skill-full{background:#3fb95022;color:var(--green)}

/* Agent cards */
.agent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.agent-card{background:var(--bg);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;gap:6px}
.agent-card .agent-header{display:flex;align-items:center;gap:8px}
.agent-card .agent-dot{width:8px;height:8px;border-radius:50%}
.agent-dot.active{background:var(--green)}
.agent-dot.idle{background:var(--yellow)}
.agent-dot.busy{background:var(--accent)}
.agent-dot.offline{background:var(--muted)}
.agent-card .agent-name{font-weight:600;font-size:14px}
.agent-card .agent-role{font-size:12px;color:var(--muted)}
.agent-card .agent-seen{font-size:11px;color:var(--muted)}

/* Metrics */
.metrics-pre{font-family:'SF Mono',Menlo,monospace;font-size:11px;color:var(--muted);white-space:pre-wrap;max-height:400px;overflow-y:auto;background:var(--bg);padding:12px;border-radius:var(--radius)}

/* Plugins */
.plugin-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px}
.plugin-row:last-child{border-bottom:none}
.plugin-row .name{font-weight:500}
.plugin-row .meta{color:var(--muted);font-size:12px}
.plugin-row .plugin-info{display:flex;align-items:center;gap:8px}
.source-badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:500;text-transform:uppercase}
.source-core{background:var(--accent);color:var(--bg)}
.source-community{background:var(--purple);color:var(--bg)}
.pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px}
.pill-on{background:#3fb95022;color:var(--green)}
.pill-off{background:#f8514922;color:var(--red)}

.empty{color:var(--muted);font-size:13px;font-style:italic;padding:20px;text-align:center}
@media(max-width:768px){.tab-content.active{grid-template-columns:1fr}.tab-bar{padding:0 8px}.tab-bar button{padding:10px 10px;font-size:12px}}
</style>
</head>
<body>
<header>
  <h1>AgentSentry Dashboard v5</h1>
  <div class="status">
    <span class="dot" id="conn-dot"></span>
    <span id="conn-text">Connecting...</span>
    <span style="margin-left:16px" id="uptime-text"></span>
  </div>
</header>

<nav class="tab-bar">
  <button class="active" data-tab="overview">Overview</button>
  <button data-tab="events">Events</button>
  <button data-tab="system">System</button>
  <button data-tab="agents">Agents</button>
  <button data-tab="plugins">Plugins</button>
</nav>

${overviewTab()}
${eventsTab()}
${systemTab()}
${agentsTab()}
${pluginsTab()}

<script>
(function() {
  'use strict';

  var MAX_FEED = 200;
  var feedCount = 0;
  var sse = null;
  var reconnectTimer = null;
  var activeTab = 'overview';
  var pollTimers = {};

  // ----- Tab Switching -----

  function switchTab(name) {
    activeTab = name;
    document.querySelectorAll('.tab-content').forEach(function(el) {
      el.classList.toggle('active', el.id === 'tab-' + name);
    });
    document.querySelectorAll('.tab-bar button').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === name);
    });
    location.hash = name;
    startPollingForTab(name);
  }

  document.querySelectorAll('.tab-bar button').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Read hash on load
  var initHash = location.hash.replace('#', '');
  if (['overview','events','system','agents','plugins'].indexOf(initHash) !== -1) {
    switchTab(initHash);
  } else {
    switchTab('overview');
  }

  // ----- Polling Manager -----

  function clearAllPolling() {
    Object.keys(pollTimers).forEach(function(k) {
      clearInterval(pollTimers[k]);
    });
    pollTimers = {};
  }

  function startPollingForTab(tab) {
    clearAllPolling();
    // Always poll stats (for header uptime)
    pollStats();
    pollTimers._stats = setInterval(pollStats, 5000);

    if (tab === 'overview') {
      pollHealth();
      pollEnablement();
      pollTimers.health = setInterval(pollHealth, 10000);
      pollTimers.enablement = setInterval(pollEnablement, 30000);
    } else if (tab === 'system') {
      pollStreaming();
      pollMetrics();
      pollTimers.streaming = setInterval(pollStreaming, 5000);
      pollTimers.metrics = setInterval(pollMetrics, 15000);
    } else if (tab === 'agents') {
      pollCoordination();
      pollTimers.coordination = setInterval(pollCoordination, 10000);
    } else if (tab === 'plugins') {
      pollPlugins();
      pollTimers.plugins = setInterval(pollPlugins, 30000);
    }
    // events tab: SSE handles it, no extra polling needed
  }

  // ----- SSE Connection -----

  function connectSSE() {
    if (sse) { sse.close(); sse = null; }
    sse = new EventSource('/events');

    sse.onopen = function() {
      setConnected(true);
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    };

    sse.onerror = function() {
      setConnected(false);
      sse.close();
      sse = null;
      reconnectTimer = setTimeout(connectSSE, 3000);
    };

    var types = ['tool_use','session_start','session_end','error','metric','task','checkpoint','agent',
                 'decision','violation','incident','pattern','handoff','audit_finding'];
    types.forEach(function(t) {
      sse.addEventListener(t, function(e) {
        addEvent(t, e.lastEventId || '', safeJSON(e.data));
      });
    });

    sse.onmessage = function(e) {
      addEvent('event', e.lastEventId || '', safeJSON(e.data));
    };
  }

  function setConnected(ok) {
    var dot = document.getElementById('conn-dot');
    var txt = document.getElementById('conn-text');
    dot.className = 'dot ' + (ok ? 'connected' : 'disconnected');
    txt.textContent = ok ? 'Connected' : 'Disconnected';
  }

  function safeJSON(s) {
    try { return JSON.parse(s); } catch(e) { return s; }
  }

  // ----- Event Feed -----

  function addEvent(type, id, data) {
    feedCount++;
    var feed = document.getElementById('event-feed');
    var row = document.createElement('div');
    row.className = 'event-row';

    var ts = new Date().toLocaleTimeString();
    var summary = typeof data === 'string' ? data : JSON.stringify(data).slice(0, 120);

    row.innerHTML =
      '<span class="ts">' + ts + '</span>' +
      '<span class="type type-' + type + '">' + type + '</span>' +
      '<span class="data">' + escHtml(summary) + '</span>';

    feed.insertBefore(row, feed.firstChild);

    while (feed.children.length > MAX_FEED) {
      feed.removeChild(feed.lastChild);
    }

    document.getElementById('feed-count').textContent = feedCount;
    document.getElementById('stat-feed').textContent = feedCount;
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ----- Polling: Stats -----

  async function pollStats() {
    try {
      var r = await fetch('/api/stats');
      var d = await r.json();
      document.getElementById('stat-uptime').textContent = d.uptime || '--';
      document.getElementById('stat-clients').textContent = d.clients || '0';
      document.getElementById('stat-events').textContent = d.eventsPublished || '0';
      document.getElementById('stat-dropped').textContent = d.eventsDropped || '0';
      document.getElementById('uptime-text').textContent = 'Up ' + (d.uptime || 0) + 's';

      // Memory totals
      if (d.memory) {
        var total = 0;
        if (d.memory.by_type) {
          Object.keys(d.memory.by_type).forEach(function(k) { total += d.memory.by_type[k]; });
        }
        document.getElementById('stat-mem-total').textContent = total;
      }

      // Bar charts (only render when overview tab is active)
      if (activeTab === 'overview') {
        renderBarChartByType(d.memory);
        renderBarChartBySeverity(d.memory);
      }
    } catch(e) {}
  }

  // ----- Bar Charts -----

  var typeColors = {
    decision: 'var(--accent)', violation: 'var(--red)', incident: 'var(--orange)',
    pattern: 'var(--purple)', handoff: 'var(--yellow)', audit_finding: 'var(--muted)'
  };

  var sevColors = {
    low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--orange)', critical: 'var(--red)'
  };

  function renderBarChart(containerId, dataMap, colorMap) {
    var el = document.getElementById(containerId);
    if (!dataMap || Object.keys(dataMap).length === 0) {
      el.innerHTML = '<div class="empty">No event data</div>';
      return;
    }
    var max = 0;
    Object.keys(dataMap).forEach(function(k) { if (dataMap[k] > max) max = dataMap[k]; });
    if (max === 0) max = 1;

    var html = '';
    Object.keys(colorMap).forEach(function(k) {
      var v = dataMap[k] || 0;
      var pct = Math.round((v / max) * 100);
      html += '<div class="bar-row">' +
        '<span class="bar-label">' + k + '</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + colorMap[k] + '"></div></div>' +
        '<span class="bar-value">' + v + '</span></div>';
    });
    el.innerHTML = html;
  }

  function renderBarChartByType(memory) {
    renderBarChart('chart-by-type', memory && memory.by_type, typeColors);
  }

  function renderBarChartBySeverity(memory) {
    renderBarChart('chart-by-severity', memory && memory.by_severity, sevColors);
  }

  // ----- Polling: Health -----

  async function pollHealth() {
    try {
      var r = await fetch('/api/health');
      var d = await r.json();
      document.getElementById('health-status').textContent = d.status || '--';

      var html = '';
      if (d.checks) {
        Object.keys(d.checks).forEach(function(name) {
          var c = d.checks[name];
          html +=
            '<div class="check-row">' +
            '<span>' + name + '</span>' +
            '<span class="status-' + c.status + '">' + c.status +
            (c.latencyMs != null ? ' (' + c.latencyMs + 'ms)' : '') +
            '</span></div>';
        });
      }
      document.getElementById('health-checks').innerHTML = html || '<div class="empty">No checks registered</div>';
    } catch(e) {
      document.getElementById('health-status').textContent = 'error';
      document.getElementById('health-checks').innerHTML = '<div class="empty">Failed to fetch health</div>';
    }
  }

  // ----- Polling: Enablement -----

  async function pollEnablement() {
    try {
      var r = await fetch('/api/enablement');
      if (r.status === 404) {
        document.getElementById('enablement-content').innerHTML = '<div class="empty">Not configured</div>';
        return;
      }
      var d = await r.json();
      var skills = ['save_points','context_health','standing_orders','directive_compliance','small_bets','proactive_safety'];

      var html = '<div class="enablement-header">' +
        '<span class="level-badge">' + (d.level != null ? d.level : '?') + '</span>' +
        '<span class="level-name">' + escHtml(d.name || 'Unknown') + '</span></div>';

      html += '<div class="skill-pills">';
      skills.forEach(function(s) {
        var mode = (d.skills && d.skills[s]) || 'off';
        var cls = mode === 'full' ? 'skill-full' : (mode === 'basic' ? 'skill-basic' : 'skill-off');
        html += '<span class="skill-pill ' + cls + '">' + s.replace(/_/g, ' ') + ': ' + mode + '</span>';
      });
      html += '</div>';

      document.getElementById('enablement-content').innerHTML = html;
    } catch(e) {
      document.getElementById('enablement-content').innerHTML = '<div class="empty">Not configured</div>';
    }
  }

  // ----- Polling: Streaming -----

  async function pollStreaming() {
    try {
      var r = await fetch('/api/streaming');
      if (r.status === 404) {
        document.getElementById('stream-buffer').textContent = '--';
        document.getElementById('stream-published').textContent = '--';
        document.getElementById('stream-dropped').textContent = '--';
        document.getElementById('stream-clients').textContent = '--';
        return;
      }
      var d = await r.json();
      document.getElementById('stream-buffer').textContent = d.bufferSize != null ? d.bufferSize : '--';
      document.getElementById('stream-published').textContent = d.eventsPublished != null ? d.eventsPublished : '--';
      document.getElementById('stream-dropped').textContent = d.eventsDropped != null ? d.eventsDropped : '--';
      document.getElementById('stream-clients').textContent = d.clients != null ? d.clients : '--';
    } catch(e) {
      document.getElementById('stream-buffer').textContent = '--';
      document.getElementById('stream-published').textContent = '--';
      document.getElementById('stream-dropped').textContent = '--';
      document.getElementById('stream-clients').textContent = '--';
    }
  }

  // ----- Polling: Metrics -----

  async function pollMetrics() {
    try {
      var r = await fetch('/api/metrics');
      var text = await r.text();
      document.getElementById('metrics-content').textContent = text || 'No metrics collected yet.';
    } catch(e) {
      document.getElementById('metrics-content').textContent = 'Failed to fetch metrics.';
    }
  }

  // ----- Polling: Coordination (Agents) -----

  async function pollCoordination() {
    try {
      var r = await fetch('/api/coordination');
      if (r.status === 404) {
        document.getElementById('agent-count').textContent = '0';
        document.getElementById('agent-grid').innerHTML = '<div class="empty">No agents registered</div>';
        return;
      }
      var d = await r.json();
      var agents = d.agents || d || [];
      if (!Array.isArray(agents)) agents = [];

      document.getElementById('agent-count').textContent = agents.length;

      if (agents.length === 0) {
        document.getElementById('agent-grid').innerHTML = '<div class="empty">No agents registered</div>';
        return;
      }

      var html = '';
      agents.forEach(function(a) {
        var status = a.status || 'offline';
        var seen = a.lastSeen ? new Date(a.lastSeen).toLocaleTimeString() : 'never';
        html += '<div class="agent-card">' +
          '<div class="agent-header"><span class="agent-dot ' + status + '"></span>' +
          '<span class="agent-name">' + escHtml(a.name || 'unknown') + '</span></div>' +
          '<span class="agent-role">' + escHtml(a.role || '--') + '</span>' +
          '<span class="agent-seen">Last seen: ' + seen + '</span></div>';
      });
      document.getElementById('agent-grid').innerHTML = html;
    } catch(e) {
      document.getElementById('agent-count').textContent = '0';
      document.getElementById('agent-grid').innerHTML = '<div class="empty">No agents registered</div>';
    }
  }

  // ----- Polling: Plugins -----

  async function pollPlugins() {
    try {
      var r = await fetch('/api/plugins');
      var plugins = await r.json();

      document.getElementById('plugin-count').textContent = plugins.length;

      if (!plugins.length) {
        document.getElementById('plugins-list').innerHTML = '<div class="empty">No plugins installed</div>';
        return;
      }

      var html = '';
      plugins.forEach(function(p) {
        var m = p.manifest || {};
        var hooks = (m.hooks && m.hooks.length) || 0;
        var source = m.source || 'community';
        var srcCls = source === 'core' ? 'source-core' : 'source-community';
        html +=
          '<div class="plugin-row">' +
          '<div class="plugin-info">' +
          '<span class="name">' + escHtml(m.name || 'unknown') + '</span> ' +
          '<span class="source-badge ' + srcCls + '">' + source + '</span> ' +
          '<span class="meta">v' + escHtml(m.version || '?') + ' / ' + escHtml(m.category || '?') +
          ' / ' + hooks + ' hook' + (hooks !== 1 ? 's' : '') + '</span>' +
          '</div>' +
          '<span class="pill ' + (p.enabled ? 'pill-on' : 'pill-off') + '">' +
          (p.enabled ? 'enabled' : 'disabled') + '</span></div>';
      });
      document.getElementById('plugins-list').innerHTML = html;
    } catch(e) {
      document.getElementById('plugins-list').innerHTML = '<div class="empty">Failed to fetch plugins</div>';
    }
  }

  // ----- Init -----

  connectSSE();
})();
</script>
</body>
</html>`;
}

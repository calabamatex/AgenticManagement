/**
 * html.ts — Inline HTML template for the AgentSentry v5 real-time dashboard.
 *
 * Returns a self-contained HTML string with all CSS and JS inline.
 * Connects to the SSE endpoint at /events and polls /api/* for data.
 * Panel HTML is split into html-panels.ts to keep each file under 500 lines.
 */

import { dashboardCss, overviewTab, eventsTab, systemTab, agentsTab, pluginsTab } from './html-panels';

export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AgentSentry Dashboard v5</title>
<style>${dashboardCss()}</style>
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

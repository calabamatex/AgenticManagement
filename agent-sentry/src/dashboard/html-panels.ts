/**
 * html-panels.ts — Panel HTML fragments for the AgentSentry dashboard.
 *
 * Each exported function returns a raw HTML string for a specific tab or panel.
 * Imported by html.ts to keep the main template under 500 lines.
 */

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

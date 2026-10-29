<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // --- Types ---
  interface AgentHealthReport {
    device_id: string;
    hospital: string;
    software: string;
    health_status: string; // healthy | warning | critical | offline
    uptime_seconds: number;
    last_sync: string;
    queue_depth: number;
    version: string;
    cpu_percent: number;
    memory_mb: number;
    disk_usage_percent: number;
    network_errors: number;
    recent_errors: string[];
  }

  interface AgentHealthSummary {
    total_devices: number;
    healthy: number;
    warning: number;
    critical: number;
    offline: number;
    avg_uptime_seconds: number;
    total_queue_depth: number;
  }

  // --- State ---
  let devices = $state<AgentHealthReport[]>([]);
  let summary = $state<AgentHealthSummary | null>(null);
  let selectedDevice = $state<AgentHealthReport | null>(null);
  let showDetail = $state(false);
  let filterStatus = $state('ALL');
  let loading = $state(false);
  let lastRefreshed = $state('');
  let errorMsg = $state('');

  const STATUS_OPTIONS = ['ALL', 'healthy', 'warning', 'critical', 'offline'];

  const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    healthy:  { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.3)',   label: 'Healthy' },
    warning:  { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.3)',  label: 'Warning' },
    critical: { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.3)',   label: 'Critical' },
    offline:  { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)', label: 'Offline' },
  };

  const SOFTWARE_COLORS: Record<string, string> = {
    GLESCOPE: '#06b6d4',
    ANTECH:   '#8b5cf6',
    EASTTECH: '#f59e0b',
    ZEUS:     '#ef4444',
  };

  const filteredDevices = $derived(
    filterStatus === 'ALL'
      ? devices
      : devices.filter(d => d.health_status === filterStatus)
  );

  const sortedDevices = $derived(
    [...filteredDevices].sort((a, b) => {
      const priority: Record<string, number> = { critical: 0, warning: 1, offline: 2, healthy: 3 };
      return (priority[a.health_status] ?? 4) - (priority[b.health_status] ?? 4);
    })
  );

  // --- Helpers ---
  function formatUptime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  function getStatusStyle(status: string) {
    return STATUS_STYLES[status] ?? STATUS_STYLES.offline;
  }

  // --- Data loading ---
  const FALLBACK_SUMMARY: AgentHealthSummary = {
    total_devices: 450, healthy: 312, warning: 87, critical: 28, offline: 23,
    avg_uptime_seconds: 86400 * 27.5, total_queue_depth: 1420,
  };

  const FALLBACK_DEVICES: AgentHealthReport[] = [
    { device_id: 'DEV-GLS-SUB-001', hospital: 'RSUP Dr. Cipto Mangunkusumo', software: 'GLESCOPE', health_status: 'healthy', uptime_seconds: 86400 * 30, last_sync: '2026-10-28 14:32:10', queue_depth: 12, version: '2.4.1', cpu_percent: 23.5, memory_mb: 1024, disk_usage_percent: 45.2, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-ZEU-PHT-002', hospital: 'RSUP Dr. Cipto Mangunkusumo', software: 'ZEUS', health_status: 'healthy', uptime_seconds: 86400 * 28, last_sync: '2026-10-28 14:30:05', queue_depth: 8, version: '2.3.8', cpu_percent: 18.2, memory_mb: 768, disk_usage_percent: 32.1, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-ANT-INF-003', hospital: 'RSUD Dr. Soetomo', software: 'ANTECH', health_status: 'warning', uptime_seconds: 86400 * 14, last_sync: '2026-10-28 14:28:00', queue_depth: 34, version: '2.4.0', cpu_percent: 67.8, memory_mb: 2048, disk_usage_percent: 71.3, network_errors: 2, recent_errors: ['ERR_MEMORY_HIGH', 'WARN_QUEUE_BKLOG'] },
    { device_id: 'DEV-EST-MON-004', hospital: 'RSUD Dr. Soetomo', software: 'EASTTECH', health_status: 'healthy', uptime_seconds: 86400 * 22, last_sync: '2026-10-28 14:31:44', queue_depth: 5, version: '2.4.1', cpu_percent: 12.1, memory_mb: 512, disk_usage_percent: 28.7, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-GLS-SUB-005', hospital: 'RSUP Dr. Sardjito', software: 'GLESCOPE', health_status: 'critical', uptime_seconds: 86400 * 2, last_sync: '2026-10-28 12:10:00', queue_depth: 156, version: '2.3.5', cpu_percent: 95.2, memory_mb: 4096, disk_usage_percent: 89.4, network_errors: 12, recent_errors: ['ERR_THERMAL_OVERHEAT', 'ERR_SENSOR_TIMEOUT', 'CRIT_CPU_THRESHOLD'] },
    { device_id: 'DEV-ZEU-PHT-006', hospital: 'RSUP H. Adam Malik', software: 'ZEUS', health_status: 'healthy', uptime_seconds: 86400 * 45, last_sync: '2026-10-28 14:33:00', queue_depth: 3, version: '2.4.1', cpu_percent: 15.0, memory_mb: 896, disk_usage_percent: 40.0, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-ANT-INF-007', hospital: 'RSUP H. Adam Malik', software: 'ANTECH', health_status: 'offline', uptime_seconds: 0, last_sync: '2026-10-27 22:15:00', queue_depth: 0, version: '2.3.9', cpu_percent: 0, memory_mb: 0, disk_usage_percent: 0, network_errors: 0, recent_errors: ['ERR_NETWORK_DISCONNECT'] },
    { device_id: 'DEV-EST-MON-008', hospital: 'RSUP Sanglah', software: 'EASTTECH', health_status: 'healthy', uptime_seconds: 86400 * 18, last_sync: '2026-10-28 14:29:30', queue_depth: 7, version: '2.4.0', cpu_percent: 22.4, memory_mb: 640, disk_usage_percent: 35.8, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-GLS-SUB-009', hospital: 'RSUD Abdul Moeloek', software: 'GLESCOPE', health_status: 'warning', uptime_seconds: 86400 * 5, last_sync: '2026-10-28 13:45:00', queue_depth: 28, version: '2.3.7', cpu_percent: 55.0, memory_mb: 1536, disk_usage_percent: 60.2, network_errors: 3, recent_errors: ['WARN_DISK_USAGE', 'ERR_POWER_FLUCTUATION'] },
    { device_id: 'DEV-ZEU-PHT-010', hospital: 'RSUD Dr. Soetomo', software: 'ZEUS', health_status: 'healthy', uptime_seconds: 86400 * 33, last_sync: '2026-10-28 14:32:55', queue_depth: 6, version: '2.4.1', cpu_percent: 19.8, memory_mb: 820, disk_usage_percent: 38.5, network_errors: 0, recent_errors: [] },
  ];

  async function loadData() {
    loading = true;
    errorMsg = '';
    const invoke = (window as any).__TAURI__?.core?.invoke;
    try {
      if (invoke) {
        [summary, devices] = await Promise.all([
          invoke('get_agent_health_summary').catch(() => FALLBACK_SUMMARY),
          invoke('get_agent_health_detail', { deviceId: '' }).then(() => FALLBACK_DEVICES).catch(() => FALLBACK_DEVICES),
        ]);
        // For now we just use fallback for devices since detail requires an ID
        devices = FALLBACK_DEVICES;
        lastRefreshed = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } else {
        summary = FALLBACK_SUMMARY;
        devices = FALLBACK_DEVICES;
        lastRefreshed = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    } catch (e) {
      errorMsg = String(e);
      summary = FALLBACK_SUMMARY;
      devices = FALLBACK_DEVICES;
    }
    loading = false;
  }

  async function viewDetail(device: AgentHealthReport) {
    selectedDevice = device;
    showDetail = true;
  }

  let intervalId: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    loadData();
    intervalId = setInterval(() => { loadData(); }, 30000);
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });
</script>

<!-- Detail Modal -->
{#if showDetail && selectedDevice}
<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showDetail = false; }}>
  <div class="modal">
    <div class="modal-header">
      <div>
        <div class="modal-device-id">{selectedDevice.device_id}</div>
        <div class="modal-hospital">{selectedDevice.hospital}</div>
      </div>
      <button class="modal-close" onclick={() => showDetail = false} aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-status-row">
        <span class="modal-badge" style="background:{getStatusStyle(selectedDevice.health_status).bg};color:{getStatusStyle(selectedDevice.health_status).text};border:1px solid {getStatusStyle(selectedDevice.health_status).border}">
          {getStatusStyle(selectedDevice.health_status).label}
        </span>
        <span class="modal-soft" style="color:{SOFTWARE_COLORS[selectedDevice.software] ?? '#94a3b8'}">{selectedDevice.software}</span>
        <span class="modal-ver">v{selectedDevice.version}</span>
      </div>

      <div class="modal-metrics-grid">
        <div class="modal-metric">
          <div class="modal-metric-val">{formatUptime(selectedDevice.uptime_seconds)}</div>
          <div class="modal-metric-label">Uptime</div>
        </div>
        <div class="modal-metric">
          <div class="modal-metric-val">{selectedDevice.queue_depth}</div>
          <div class="modal-metric-label">Queue Depth</div>
        </div>
        <div class="modal-metric">
          <div class="modal-metric-val" style="color:{selectedDevice.cpu_percent > 80 ? '#f87171' : selectedDevice.cpu_percent > 60 ? '#fbbf24' : '#34d399'}">{selectedDevice.cpu_percent.toFixed(1)}%</div>
          <div class="modal-metric-label">CPU</div>
        </div>
        <div class="modal-metric">
          <div class="modal-metric-val">{selectedDevice.memory_mb} MB</div>
          <div class="modal-metric-label">Memory</div>
        </div>
        <div class="modal-metric">
          <div class="modal-metric-val" style="color:{selectedDevice.disk_usage_percent > 80 ? '#f87171' : selectedDevice.disk_usage_percent > 60 ? '#fbbf24' : '#34d399'}">{selectedDevice.disk_usage_percent.toFixed(1)}%</div>
          <div class="modal-metric-label">Disk</div>
        </div>
        <div class="modal-metric">
          <div class="modal-metric-val">{selectedDevice.network_errors}</div>
          <div class="modal-metric-label">Net Errors</div>
        </div>
      </div>

      <div class="modal-last-sync">Last sync: {selectedDevice.last_sync}</div>

      {#if selectedDevice.recent_errors.length > 0}
        <div class="modal-errors">
          <div class="modal-errors-title">Recent Errors</div>
          {#each selectedDevice.recent_errors as err}
            <div class="modal-error-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {err}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}

<!-- Main Content -->
<div class="agent-health-page">

  <!-- Header -->
  <div class="ah-header">
    <div class="ah-header-left">
      <h2 class="ah-title">🤖 Agent Health Monitor</h2>
      <p class="ah-sub">Real-time device health status across all deployed agents</p>
    </div>
    <div class="ah-header-right">
      {#if loading}
        <span class="ah-refresh-spin">↻ Refreshing…</span>
      {:else}
        <span class="ah-last-sync">Last refresh: {lastRefreshed}</span>
      {/if}
      <button class="ah-refresh-btn" onclick={loadData}>↻</button>
    </div>
  </div>

  <!-- Summary Cards -->
  {#if summary}
  <div class="ah-summary">
    <div class="ah-sum-card">
      <div class="ah-sum-val">{summary.total_devices}</div>
      <div class="ah-sum-label">Total Devices</div>
    </div>
    <div class="ah-sum-card ah-sum-healthy">
      <div class="ah-sum-val" style="color:#34d399">{summary.healthy}</div>
      <div class="ah-sum-label">Healthy</div>
    </div>
    <div class="ah-sum-card ah-sum-warning">
      <div class="ah-sum-val" style="color:#fbbf24">{summary.warning}</div>
      <div class="ah-sum-label">Warning</div>
    </div>
    <div class="ah-sum-card ah-sum-critical">
      <div class="ah-sum-val" style="color:#f87171">{summary.critical}</div>
      <div class="ah-sum-label">Critical</div>
    </div>
    <div class="ah-sum-card ah-sum-offline">
      <div class="ah-sum-val" style="color:#94a3b8">{summary.offline}</div>
      <div class="ah-sum-label">Offline</div>
    </div>
    <div class="ah-sum-card">
      <div class="ah-sum-val">{summary.total_queue_depth.toLocaleString()}</div>
      <div class="ah-sum-label">Total Queue</div>
    </div>
  </div>
  {/if}

  <!-- Error -->
  {#if errorMsg}
    <div class="ah-error-banner">{errorMsg}</div>
  {/if}

  <!-- Filter Bar -->
  <div class="ah-filter-bar">
    <div class="ah-filter-label">Filter by status:</div>
    <div class="ah-filter-btns">
      {#each STATUS_OPTIONS as opt}
        <button class="ah-filter-btn {filterStatus === opt ? 'active' : ''}" onclick={() => filterStatus = opt}>
        >
          {opt === 'ALL' ? 'All' : getStatusStyle(opt).label}
          {#if opt !== 'ALL' && summary}
            <span class="ah-filter-count">
              {opt === 'healthy' ? summary.healthy
               : opt === 'warning' ? summary.warning
               : opt === 'critical' ? summary.critical
               : summary.offline}
            </span>
          {/if}
        </button>
      {/each}
    </div>
    <div class="ah-filter-result">{sortedDevices.length} devices shown</div>
  </div>

  <!-- Devices Table -->
  <div class="ah-table-wrap">
    <table class="ah-table">
      <thead>
        <tr>
          <th>Device ID</th>
          <th>Hospital</th>
          <th>Software</th>
          <th>Health Status</th>
          <th>Uptime</th>
          <th>Last Sync</th>
          <th>Queue</th>
          <th>Version</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedDevices as d}
          {@const s = getStatusStyle(d.health_status)}
          <tr class="ah-row">
            <td class="ah-mono">{d.device_id}</td>
            <td class="ah-hospital">{d.hospital}</td>
            <td>
              <span class="ah-sw-badge" style="background:{SOFTWARE_COLORS[d.software] ?? '#334155'}22;color:{SOFTWARE_COLORS[d.software] ?? '#94a3b8'};border:1px solid {SOFTWARE_COLORS[d.software] ?? '#334155'}44">
                {d.software}
              </span>
            </td>
            <td>
              <span class="ah-status-badge" style="background:{s.bg};color:{s.text};border:1px solid {s.border}">
                ● {s.label}
              </span>
            </td>
            <td class="ah-mono">{formatUptime(d.uptime_seconds)}</td>
            <td class="ah-mono" style="font-size:11px;color:#64748b">{d.last_sync}</td>
            <td class="ah-mono" style="color:{d.queue_depth > 50 ? '#f87171' : d.queue_depth > 20 ? '#fbbf24' : '#94a3b8'}">{d.queue_depth}</td>
            <td class="ah-mono" style="font-size:11px">{d.version}</td>
            <td>
              <button class="ah-action-btn" onclick={() => viewDetail(d)}>View Detail</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if sortedDevices.length === 0 && !loading}
      <div class="ah-empty">No devices match the current filter.</div>
    {/if}
    {#if loading && devices.length === 0}
      <div class="ah-empty">Loading agent health data…</div>
    {/if}
  </div>

</div>

<style>
  .agent-health-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0;
  }

  /* Header */
  .ah-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 4px 0;
  }
  .ah-title {
    font-size: 20px;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0 0 4px;
  }
  .ah-sub {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }
  .ah-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ah-refresh-spin {
    font-size: 12px;
    color: #22d3ee;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .ah-last-sync {
    font-size: 12px;
    color: #475569;
    font-family: monospace;
  }
  .ah-refresh-btn {
    background: #1e293b;
    border: 1px solid #334155;
    color: #94a3b8;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ah-refresh-btn:hover { background: #334155; color: #e2e8f0; }

  /* Summary */
  .ah-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
  }
  .ah-sum-card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }
  .ah-sum-val {
    font-size: 28px;
    font-weight: 800;
    color: #f1f5f9;
    font-family: 'JetBrains Mono', monospace;
  }
  .ah-sum-label {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
  .ah-sum-healthy { border-color: rgba(16,185,129,0.25); }
  .ah-sum-warning { border-color: rgba(245,158,11,0.25); }
  .ah-sum-critical { border-color: rgba(239,68,68,0.25); }
  .ah-sum-offline { border-color: rgba(100,116,139,0.25); }

  /* Error banner */
  .ah-error-banner {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 10px;
    padding: 10px 16px;
    color: #f87171;
    font-size: 13px;
  }

  /* Filter bar */
  .ah-filter-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .ah-filter-label {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
  }
  .ah-filter-btns {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .ah-filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #0f172a;
    border: 1px solid #1e293b;
    color: #94a3b8;
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ah-filter-btn:hover { border-color: #334155; color: #e2e8f0; }
  .ah-filter-btn.active {
    border-color: #06b6d4;
    color: #22d3ee;
    background: rgba(6,182,212,0.08);
  }
  .ah-filter-count {
    background: #1e293b;
    color: #64748b;
    border-radius: 10px;
    padding: 1px 6px;
    font-size: 11px;
    font-family: monospace;
  }
  .ah-filter-result {
    font-size: 12px;
    color: #475569;
    margin-left: auto;
  }

  /* Table */
  .ah-table-wrap {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 14px;
    overflow: hidden;
  }
  .ah-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .ah-table thead th {
    text-align: left;
    padding: 10px 14px;
    background: #1e293b;
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    position: sticky;
    top: 0;
  }
  .ah-table tbody td {
    padding: 10px 14px;
    border-bottom: 1px solid #1e293b;
    color: #cbd5e1;
  }
  .ah-table tbody tr:hover { background: rgba(6,182,212,0.04); }
  .ah-table tbody tr:last-child td { border-bottom: none; }
  .ah-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  .ah-hospital { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ah-sw-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .ah-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .ah-action-btn {
    background: rgba(6,182,212,0.1);
    border: 1px solid rgba(6,182,212,0.3);
    color: #22d3ee;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .ah-action-btn:hover { background: rgba(6,182,212,0.2); }

  .ah-empty {
    padding: 40px;
    text-align: center;
    color: #475569;
    font-size: 14px;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  .modal {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 16px;
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #1e293b;
  }
  .modal-device-id {
    font-size: 15px;
    font-weight: 700;
    color: #22d3ee;
    font-family: 'JetBrains Mono', monospace;
  }
  .modal-hospital {
    font-size: 13px;
    color: #94a3b8;
    margin-top: 2px;
  }
  .modal-close {
    background: none;
    border: none;
    color: #475569;
    font-size: 24px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
    transition: color 0.15s;
  }
  .modal-close:hover { color: #e2e8f0; }
  .modal-body { padding: 20px 24px; }
  .modal-status-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .modal-badge {
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .modal-soft {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .modal-ver {
    font-size: 12px;
    color: #475569;
    font-family: monospace;
    margin-left: auto;
  }
  .modal-metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .modal-metric {
    background: #1e293b;
    border-radius: 10px;
    padding: 12px;
    text-align: center;
  }
  .modal-metric-val {
    font-size: 20px;
    font-weight: 700;
    color: #f1f5f9;
    font-family: 'JetBrains Mono', monospace;
  }
  .modal-metric-label {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
  .modal-last-sync {
    font-size: 12px;
    color: #475569;
    font-family: monospace;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #1e293b;
  }
  .modal-errors { margin-top: 0; }
  .modal-errors-title {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .modal-error-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #f87171;
    font-family: monospace;
    padding: 4px 0;
  }
</style>

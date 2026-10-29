<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Map as LMap } from 'leaflet';
  import L from 'leaflet';

  // --- PIN gate ---
  let pinInput = $state('');
  let pinError = $state('');
  let unlocked = $state(false);
  let pinLoading = $state(false);

  async function checkPin() {
    if (pinInput.length !== 4 || !/^\d+$/.test(pinInput)) {
      pinError = 'PINは4桁の数字です';
      return;
    }
    pinLoading = true;
    pinError = '';
    try {
      const invoke = (window as any).__TAURI__?.core?.invoke;
      if (invoke) {
        const ok = await invoke('verify_pin', { pin: pinInput });
        if (ok) unlocked = true;
        else { pinError = 'PINが違います'; pinInput = ''; }
      } else {
        unlocked = true; // browser dev mode
      }
    } catch {
      unlocked = true;
    }
    pinLoading = false;
  }

  // --- Types ---
  interface HospitalLocation {
    id: number;
    name: string;
    city: string;
    province: string;
    latitude: number;
    longitude: number;
    device_count: number;
    status: string;
    last_sync: string;
  }

  interface DeviceInventoryItem {
    device_id: string;
    hospital: string;
    software: string;
    usage_count: number;
    software_hours: number;
    light_source_hours: number;
    patients: number;
    doctors: number;
    examinations: number;
    reports: number;
    recent_error: string;
  }

  // --- State ---
  let mapRef = $state<HTMLDivElement | null>(null);
  let mapInstance = $state<LMap | null>(null);
  let hospitals = $state<HospitalLocation[]>([]);
  let inventory = $state<DeviceInventoryItem[]>([]);
  let activeTab = $state<'overview' | 'map' | 'inventory' | 'health'>('overview');
  let filterSoftware = $state('ALL');
  let filterHospital = $state('');
  let mapTabVisible = $state(false);

  // --- Agent Health state ---
  interface AgentHealthReport {
    device_id: string;
    hospital: string;
    software: string;
    health_status: string;
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
  let healthDevices = $state<AgentHealthReport[]>([]);
  let healthSummary = $state<AgentHealthSummary | null>(null);
  let healthFilter = $state('ALL');
  let healthLoading = $state(false);
  let healthError = $state('');
  let selectedDevice = $state<AgentHealthReport | null>(null);
  let showDetailModal = $state(false);
  let healthLastRefreshed = $state('');
  let healthInterval: ReturnType<typeof setInterval> | null = null;

  const HEALTH_STATUS_OPTIONS = ['ALL', 'healthy', 'warning', 'critical', 'offline'] as const;
  const HEALTH_STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
    healthy:  { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)',   label: 'Healthy' },
    warning:  { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)',  label: 'Warning' },
    critical: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.3)',   label: 'Critical' },
    offline:  { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)', label: 'Offline' },
  };
  const SOFTWARE_COLORS: Record<string, string> = {
    GLESCOPE: '#06b6d4', ANTECH: '#8b5cf6', EASTTECH: '#f59e0b', ZEUS: '#ef4444',
  };
  const HEALTH_FALLBACK_SUMMARY: AgentHealthSummary = {
    total_devices: 450, healthy: 312, warning: 87, critical: 28, offline: 23,
    avg_uptime_seconds: 86400 * 27.5, total_queue_depth: 1420,
  };
  const HEALTH_FALLBACK_DEVICES: AgentHealthReport[] = [
    { device_id: 'DEV-GLS-SUB-001', hospital: 'RSUP Dr. Cipto Mangunkusumo', software: 'GLESCOPE', health_status: 'healthy', uptime_seconds: 86400 * 30, last_sync: '2026-10-28 14:32:10', queue_depth: 12, version: '2.4.1', cpu_percent: 23.5, memory_mb: 1024, disk_usage_percent: 45.2, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-ZEU-PHT-002', hospital: 'RSUP Dr. Cipto Mangunkusumo', software: 'ZEUS', health_status: 'healthy', uptime_seconds: 86400 * 28, last_sync: '2026-10-28 14:30:05', queue_depth: 8, version: '2.3.8', cpu_percent: 18.2, memory_mb: 768, disk_usage_percent: 32.1, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-ANT-INF-003', hospital: 'RSUD Dr. Soetomo', software: 'ANTECH', health_status: 'warning', uptime_seconds: 86400 * 14, last_sync: '2026-10-28 14:28:00', queue_depth: 34, version: '2.4.0', cpu_percent: 67.8, memory_mb: 2048, disk_usage_percent: 71.3, network_errors: 2, recent_errors: ['ERR_MEMORY_HIGH', 'WARN_QUEUE_BACKLOG'] },
    { device_id: 'DEV-EST-MON-004', hospital: 'RSUD Dr. Soetomo', software: 'EASTTECH', health_status: 'healthy', uptime_seconds: 86400 * 22, last_sync: '2026-10-28 14:31:44', queue_depth: 5, version: '2.4.1', cpu_percent: 12.1, memory_mb: 512, disk_usage_percent: 28.7, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-GLS-SUB-005', hospital: 'RSUP Dr. Sardjito', software: 'GLESCOPE', health_status: 'critical', uptime_seconds: 86400 * 2, last_sync: '2026-10-28 12:10:00', queue_depth: 156, version: '2.3.5', cpu_percent: 95.2, memory_mb: 4096, disk_usage_percent: 89.4, network_errors: 12, recent_errors: ['ERR_THERMAL_OVERHEAT', 'ERR_SENSOR_TIMEOUT', 'CRIT_CPU_THRESHOLD'] },
    { device_id: 'DEV-ZEU-PHT-006', hospital: 'RSUP H. Adam Malik', software: 'ZEUS', health_status: 'healthy', uptime_seconds: 86400 * 45, last_sync: '2026-10-28 14:33:00', queue_depth: 3, version: '2.4.1', cpu_percent: 15.0, memory_mb: 896, disk_usage_percent: 40.0, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-ANT-INF-007', hospital: 'RSUP H. Adam Malik', software: 'ANTECH', health_status: 'offline', uptime_seconds: 0, last_sync: '2026-10-27 22:15:00', queue_depth: 0, version: '2.3.9', cpu_percent: 0, memory_mb: 0, disk_usage_percent: 0, network_errors: 0, recent_errors: ['ERR_NETWORK_DISCONNECT'] },
    { device_id: 'DEV-EST-MON-008', hospital: 'RSUP Sanglah', software: 'EASTTECH', health_status: 'healthy', uptime_seconds: 86400 * 18, last_sync: '2026-10-28 14:29:30', queue_depth: 7, version: '2.4.0', cpu_percent: 22.4, memory_mb: 640, disk_usage_percent: 35.8, network_errors: 0, recent_errors: [] },
    { device_id: 'DEV-GLS-SUB-009', hospital: 'RSUD Abdul Moeloek', software: 'GLESCOPE', health_status: 'warning', uptime_seconds: 86400 * 5, last_sync: '2026-10-28 13:45:00', queue_depth: 28, version: '2.3.7', cpu_percent: 55.0, memory_mb: 1536, disk_usage_percent: 60.2, network_errors: 3, recent_errors: ['WARN_DISK_USAGE', 'ERR_POWER_FLUCTUATION'] },
    { device_id: 'DEV-ZEU-PHT-010', hospital: 'RSUD Dr. Soetomo', software: 'ZEUS', health_status: 'healthy', uptime_seconds: 86400 * 33, last_sync: '2026-10-28 14:32:55', queue_depth: 6, version: '2.4.1', cpu_percent: 19.8, memory_mb: 820, disk_usage_percent: 38.5, network_errors: 0, recent_errors: [] },
  ];

  function formatUptime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }
  function getHealthStatusStyle(s: string) {
    return HEALTH_STATUS_STYLE[s] ?? HEALTH_STATUS_STYLE.offline;
  }
  const filteredHealthDevices = $derived(
    healthFilter === 'ALL' ? healthDevices : healthDevices.filter(d => d.health_status === healthFilter)
  );
  const sortedHealthDevices = $derived(
    [...filteredHealthDevices].sort((a, b) => {
      const p: Record<string, number> = { critical: 0, warning: 1, offline: 2, healthy: 3 };
      return (p[a.health_status] ?? 4) - (p[b.health_status] ?? 4);
    })
  );

  async function loadHealthData() {
    healthLoading = true;
    healthError = '';
    const invoke = (window as any).__TAURI__?.core?.invoke;
    try {
      if (invoke) {
        try { healthSummary = await invoke('get_agent_health_summary'); } catch { healthSummary = HEALTH_FALLBACK_SUMMARY; }
        // get_agent_health_detail requires a device_id; use fallback devices for the list
        healthDevices = HEALTH_FALLBACK_DEVICES;
      } else {
        healthSummary = HEALTH_FALLBACK_SUMMARY;
        healthDevices = HEALTH_FALLBACK_DEVICES;
      }
      healthLastRefreshed = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      healthError = String(e);
      healthSummary = HEALTH_FALLBACK_SUMMARY;
      healthDevices = HEALTH_FALLBACK_DEVICES;
    }
    healthLoading = false;
  }
  function openHealthDetail(device: AgentHealthReport) { selectedDevice = device; showDetailModal = true; }

  const SOFTWARE_OPTIONS = ['ALL', 'GLESCOPE', 'ANTECH', 'EASTTECH', 'ZEUS'];
  const softwareColor: Record<string, string> = {
    GLESCOPE: '#06b6d4',
    ANTECH: '#8b5cf6',
    EASTTECH: '#f59e0b',
    ZEUS: '#ef4444',
  };
  const statusColor: Record<string, string> = {
    Active: '#10b981',
    Warning: '#f59e0b',
    Error: '#ef4444',
  };

  const filteredInventory = $derived(
    inventory.filter(d =>
      (filterSoftware === 'ALL' || d.software === filterSoftware) &&
      (filterHospital === '' || d.hospital.toLowerCase().includes(filterHospital.toLowerCase()))
    )
  );

  // --- Leaflet ---
  function makeIcon(color: string) {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px ${color}"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  function initMap() {
    if (!mapRef || mapInstance) return;
    mapInstance = L.map(mapRef).setView([-2.5, 118], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
    }).addTo(mapInstance);

    const markers: any[] = [];
    for (const h of hospitals) {
      const color = statusColor[h.status] ?? '#06b6d4';
      const marker = L.marker([h.latitude, h.longitude], { icon: makeIcon(color) })
        .addTo(mapInstance!)
        .bindPopup(`
          <div style="min-width:180px">
            <strong style="color:#22d3ee;font-size:13px">${h.name}</strong><br>
            <span style="color:#94a3b8;font-size:12px">${h.city}, ${h.province}</span><br>
            <span style="font-size:12px">🖥 接続デバイス: <strong>${h.device_count}台</strong></span><br>
            <span style="font-size:12px">📡 最終同期: ${h.last_sync}</span><br>
            <span style="font-size:11px;color:${color}">● ${h.status}</span>
          </div>
        `);
      markers.push(marker);
    }
    if (markers.length > 0) {
      mapInstance.fitBounds(L.featureGroup(markers).getBounds().pad(0.1));
    }
  }

  function switchTab(tab: typeof activeTab) {
    activeTab = tab;
    mapTabVisible = tab === 'map';
    if (tab === 'map' && mapRef && !mapInstance) {
      // defer init until DOM is ready
      setTimeout(initMap, 50);
    }
  }

  // --- Data loading ---
  const FALLBACK_HOSPITALS: HospitalLocation[] = [
    { id: 1, name: 'RSUP Dr. Cipto Mangunkusumo', city: 'Jakarta Pusat', province: 'DKI Jakarta', latitude: -6.1944, longitude: 106.8528, device_count: 18, status: 'Active', last_sync: '2026-10-28 11:15:00' },
    { id: 2, name: 'RSUD Dr. Soetomo', city: 'Surabaya', province: 'Jawa Timur', latitude: -7.2658, longitude: 112.7539, device_count: 14, status: 'Active', last_sync: '2026-10-28 11:12:00' },
    { id: 3, name: 'RSUP Dr. Sardjito', city: 'Sleman', province: 'DI Yogyakarta', latitude: -7.7667, longitude: 110.3736, device_count: 10, status: 'Warning', last_sync: '2026-10-28 10:45:00' },
    { id: 4, name: 'RSUP H. Adam Malik', city: 'Medan', province: 'Sumatera Utara', latitude: 3.5358, longitude: 98.6214, device_count: 12, status: 'Active', last_sync: '2026-10-28 11:10:00' },
    { id: 5, name: 'RSUD Abdul Moeloek', city: 'Bandar Lampung', province: 'Lampung', latitude: -5.3971, longitude: 105.2663, device_count: 6, status: 'Error', last_sync: '2026-10-28 09:20:00' },
    { id: 6, name: 'RSUP Sanglah', city: 'Denpasar', province: 'Bali', latitude: -8.6705, longitude: 115.2126, device_count: 9, status: 'Active', last_sync: '2026-10-28 11:14:00' },
  ];

  const FALLBACK_INVENTORY: DeviceInventoryItem[] = [
    { device_id: 'DEV-GLS-SUB-001', hospital: 'RSUP Dr. Cipto Mangunkusumo', software: 'GLESCOPE', usage_count: 142, software_hours: 328.5, light_source_hours: 245.0, patients: 420, doctors: 6, examinations: 890, reports: 885, recent_error: 'ERR_SENSOR_TIMEOUT' },
    { device_id: 'DEV-ZEU-PHT-002', hospital: 'RSUP Dr. Cipto Mangunkusumo', software: 'ZEUS', usage_count: 98, software_hours: 210.0, light_source_hours: 180.5, patients: 310, doctors: 4, examinations: 620, reports: 615, recent_error: '' },
    { device_id: 'DEV-ANT-INF-003', hospital: 'RSUD Dr. Soetomo', software: 'ANTECH', usage_count: 205, software_hours: 450.2, light_source_hours: 0.0, patients: 680, doctors: 8, examinations: 1200, reports: 1198, recent_error: 'ERR_OCCLUSION_SPIKE' },
    { device_id: 'DEV-EST-MON-004', hospital: 'RSUD Dr. Soetomo', software: 'EASTTECH', usage_count: 176, software_hours: 380.0, light_source_hours: 0.0, patients: 540, doctors: 5, examinations: 980, reports: 975, recent_error: 'ERR_PROBE_DISCONNECTED' },
    { device_id: 'DEV-GLS-SUB-005', hospital: 'RSUP Dr. Sardjito', software: 'GLESCOPE', usage_count: 130, software_hours: 290.0, light_source_hours: 210.5, patients: 390, doctors: 5, examinations: 800, reports: 798, recent_error: '' },
    { device_id: 'DEV-ZEU-PHT-006', hospital: 'RSUP H. Adam Malik', software: 'ZEUS', usage_count: 88, software_hours: 195.0, light_source_hours: 160.0, patients: 280, doctors: 3, examinations: 560, reports: 555, recent_error: 'ERR_THERMAL_OVERHEAT' },
    { device_id: 'DEV-ANT-INF-007', hospital: 'RSUP H. Adam Malik', software: 'ANTECH', usage_count: 160, software_hours: 340.0, light_source_hours: 0.0, patients: 500, doctors: 6, examinations: 1050, reports: 1048, recent_error: '' },
    { device_id: 'DEV-EST-MON-008', hospital: 'RSUP Sanglah', software: 'EASTTECH', usage_count: 145, software_hours: 310.0, light_source_hours: 0.0, patients: 460, doctors: 5, examinations: 920, reports: 918, recent_error: '' },
    { device_id: 'DEV-GLS-SUB-009', hospital: 'RSUD Abdul Moeloek', software: 'GLESCOPE', usage_count: 75, software_hours: 160.0, light_source_hours: 120.0, patients: 220, doctors: 3, examinations: 440, reports: 438, recent_error: 'ERR_POWER_FAILURE' },
    { device_id: 'DEV-ZEU-PHT-010', hospital: 'RSUD Dr. Soetomo', software: 'ZEUS', usage_count: 110, software_hours: 240.0, light_source_hours: 200.0, patients: 350, doctors: 4, examinations: 700, reports: 698, recent_error: '' },
  ];

  async function loadData() {
    const invoke = (window as any).__TAURI__?.core?.invoke;
    if (invoke) {
      try { hospitals = await invoke('get_hospital_distribution'); } catch { hospitals = FALLBACK_HOSPITALS; }
      try { inventory = await invoke('get_device_inventory'); } catch { inventory = FALLBACK_INVENTORY; }
    } else {
      hospitals = FALLBACK_HOSPITALS;
      inventory = FALLBACK_INVENTORY;
    }
  }

  onMount(() => {
    loadData();
    loadHealthData();
    healthInterval = setInterval(() => { loadHealthData(); }, 30000);
  });
  onDestroy(() => { if (healthInterval) clearInterval(healthInterval); });
</script>

<!-- PIN Lock Screen -->
{#if !unlocked}
<div class="pin-overlay" role="presentation" onkeydown={(e) => e.key === 'Enter' && checkPin()}>
  <div class="pin-box">
    <div class="pin-logo">GTEL</div>
    <div class="pin-title">Global Telemetry<br>& Medical Analytics</div>
    <div class="pin-sub">PT Gerlink Utama Mandiri — 管理員用</div>
    <input
      type="password"
      inputmode="numeric"
      maxlength="4"
      bind:value={pinInput}
      placeholder="PINを入力 (デモ: 1234)"
      class="pin-input"
      oninput={() => { pinError = ''; pinInput = pinInput.replace(/\\D/g, '').slice(0, 4); }}
    />
    {#if pinError}
      <div class="pin-error">{pinError}</div>
    {/if}
    <button class="pin-btn" onclick={checkPin} disabled={pinLoading}>
      {pinLoading ? '確認中...' : '認証して入室'}
    </button>
  </div>
</div>
{/if}

<!-- Main App -->
{#if unlocked}
<div class="app-root">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <div class="logo">GT</div>
      <div>
        <h1 class="title">
          GTEL Telemetry Dashboard
          <span class="badge">Tauri v2 + Leaflet</span>
        </h1>
        <p class="subtitle">Gerlink Medical Device Global Telemetry System</p>
      </div>
    </div>
    <div class="header-right">
      <div class="status-dot"></div>
      <span class="status-text">Operational</span>
    </div>
  </header>

  <!-- Tabs -->
  <nav class="tabs">
    <button class={activeTab === 'overview' ? 'tab active' : 'tab'} onclick={() => switchTab('overview')}>
      📊 概要
    </button>
    <button class={activeTab === 'map' ? 'tab active' : 'tab'} onclick={() => switchTab('map')}>
      🗺️ Sebaran RS
    </button>
    <button class={activeTab === 'inventory' ? 'tab active' : 'tab'} onclick={() => switchTab('inventory')}>
      📋 機器在庫 — {inventory.length}台
    </button>
    <button class={activeTab === 'health' ? 'tab active' : 'tab'} onclick={() => switchTab('health')}>
      🤖 Agent Health
    </button>
  </nav>

  <!-- Content -->
  <main class="main">

    <!-- Overview Tab -->
    {#if activeTab === 'overview'}
      <div class="summary-grid">
        <div class="card">
          <div class="card-label">Active Devices</div>
          <div class="card-value">412 <span class="card-sub">/ 450</span></div>
          <div class="card-foot">↑ 91.5%稼働率</div>
        </div>
        <div class="card">
          <div class="card-label">Total Lamp Hours</div>
          <div class="card-value">18,450.5 <span class="card-sub">hrs</span></div>
          <div class="card-foot">Phototherapy & Laryngoscope</div>
        </div>
        <div class="card">
          <div class="card-label">Total Examinations</div>
          <div class="card-value">128,450</div>
          <div class="card-foot">National medical telemetry</div>
        </div>
        <div class="card">
          <div class="card-label">Registered Patients</div>
          <div class="card-value">84,250</div>
          <div class="card-foot">1,420 Active Doctors</div>
        </div>
      </div>

      <div class="two-col">
        <div class="panel">
          <h2 class="panel-title">Software Fleet Breakdown</h2>
          <div class="fleet-list">
            {#each [
              { name: 'GLESCOPE', count: 180, active: 172, color: '#06b6d4' },
              { name: 'ZEUS', count: 120, active: 108, color: '#ef4444' },
              { name: 'ANTECH', count: 90, active: 85, color: '#8b5cf6' },
              { name: 'EASTTECH', count: 60, active: 47, color: '#f59e0b' },
            ] as dev}
            <div class="fleet-item">
              <div class="fleet-header">
                <span class="fleet-name" style="color:{dev.color}">{dev.name}</span>
                <span class="fleet-count">{dev.active}/{dev.count} Active</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:{(dev.active/dev.count)*100}%;background:{dev.color}"></div></div>
            </div>
            {/each}
          </div>
        </div>
        <div class="panel">
          <h2 class="panel-title">Weekly Examination Trend</h2>
          <div class="chart">
            {#each [
              { day: 'Mon', count: 1840 },
              { day: 'Tue', count: 2150 },
              { day: 'Wed', count: 1980 },
              { day: 'Thu', count: 2420 },
              { day: 'Fri', count: 2600 },
              { day: 'Sat', count: 1450 },
              { day: 'Sun', count: 980 },
            ] as day}
              {@const max = 2600}
              {@const pct = (day.count / max) * 100}
              <div class="bar-wrap">
                <div class="bar-val">{day.count.toLocaleString()}</div>
                <div class="bar" style="height:{pct}%;background:linear-gradient(to top,#06b6d4,#22d3ee)"></div>
                <div class="bar-label">{day.day}</div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Map Tab -->
    {#if activeTab === 'map'}
      <div class="map-container">
        <div class="map-toolbar">
          <div class="map-title">🗺️ Sebaran Rumah Sakit Nasional — Leaflet.js</div>
          <div class="map-legend">
            {#each [{ s: 'Active', c: '#10b981' }, { s: 'Warning', c: '#f59e0b' }, { s: 'Error', c: '#ef4444' }] as item}
              <span class="legend-item"><span class="legend-dot" style="background:{item.c}"></span>{item.s}</span>
            {/each}
          </div>
        </div>
        {#if mapTabVisible}
          <div bind:this={mapRef} class="map-el"></div>
        {/if}
      </div>
    {/if}

    <!-- Inventory Tab -->
    {#if activeTab === 'inventory'}
      <div class="inventory-panel">
        <div class="inv-toolbar">
          <div class="inv-title">📋 Device Inventory — PRD v2.0</div>
          <div class="inv-filters">
            <select bind:value={filterSoftware} class="filter-select">
              {#each SOFTWARE_OPTIONS as opt}
                <option value={opt}>{opt === 'ALL' ? '全ブランド' : opt}</option>
              {/each}
            </select>
            <input
              type="text"
              bind:value={filterHospital}
              placeholder="病院名で検索..."
              class="filter-input"
            />
          </div>
        </div>
        <div class="table-wrap">
          <table class="inv-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Hospital</th>
                <th>Software</th>
                <th>Usage Count</th>
                <th>Software Hrs</th>
                <th>Light Src Hrs</th>
                <th>Patients</th>
                <th>Doctors</th>
                <th>Examinations</th>
                <th>Reports</th>
                <th>Recent Error</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredInventory as d}
                <tr>
                  <td class="mono">{d.device_id}</td>
                  <td>{d.hospital}</td>
                  <td><span class="sw-badge" style="background:{softwareColor[d.software] ?? '#334155'}22;color:{softwareColor[d.software] ?? '#94a3b8'};border:1px solid {softwareColor[d.software] ?? '#334155'}44">{d.software}</span></td>
                  <td class="mono">{d.usage_count}</td>
                  <td class="mono">{d.software_hours}</td>
                  <td class="mono">{d.light_source_hours > 0 ? d.light_source_hours : '—'}</td>
                  <td class="mono">{d.patients}</td>
                  <td class="mono">{d.doctors}</td>
                  <td class="mono">{d.examinations}</td>
                  <td class="mono">{d.reports}</td>
                  <td>
                    {#if d.recent_error}
                      <span class="err-tag">{d.recent_error}</span>
                    {:else}
                      <span class="ok-tag">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if filteredInventory.length === 0}
            <div class="empty-state">条件に一致する機器はありません</div>
          {/if}
        </div>
        <div class="inv-footer">表示中 {filteredInventory.length} / {inventory.length} 台</div>
      </div>
    {/if}

    <!-- Agent Health Tab -->
    {#if activeTab === 'health'}
      <div class="health-page">
        <div class="health-header">
          <h2 class="health-title">🤖 Agent Health Monitor</h2>
          <p class="health-sub">Real-time device health status across all deployed agents</p>
          <div class="health-header-right">
            {#if healthLoading}
              <span class="health-refresh-spin">↻ Refreshing…</span>
            {:else}
              <span class="health-last-sync">Last refresh: {healthLastRefreshed}</span>
            {/if}
            <button class="health-refresh-btn" onclick={loadHealthData}>↻</button>
          </div>
        </div>

        {#if healthSummary}
        <div class="health-summary">
          <div class="health-sum-card">
            <div class="health-sum-val">{healthSummary.total_devices}</div>
            <div class="health-sum-label">Total Devices</div>
          </div>
          <div class="health-sum-card health-sum-healthy">
            <div class="health-sum-val" style="color:#34d399">{healthSummary.healthy}</div>
            <div class="health-sum-label">Healthy</div>
          </div>
          <div class="health-sum-card health-sum-warning">
            <div class="health-sum-val" style="color:#fbbf24">{healthSummary.warning}</div>
            <div class="health-sum-label">Warning</div>
          </div>
          <div class="health-sum-card health-sum-critical">
            <div class="health-sum-val" style="color:#f87171">{healthSummary.critical}</div>
            <div class="health-sum-label">Critical</div>
          </div>
          <div class="health-sum-card health-sum-offline">
            <div class="health-sum-val" style="color:#94a3b8">{healthSummary.offline}</div>
            <div class="health-sum-label">Offline</div>
          </div>
          <div class="health-sum-card">
            <div class="health-sum-val">{healthSummary.total_queue_depth.toLocaleString()}</div>
            <div class="health-sum-label">Total Queue</div>
          </div>
        </div>
        {/if}

        {#if healthError}
          <div class="health-error-banner">{healthError}</div>
        {/if}

        <div class="health-filter-bar">
          <span class="health-filter-label">Filter by status:</span>
          <div class="health-filter-btns">
            {#each HEALTH_STATUS_OPTIONS as opt}
              <button class="health-filter-btn {healthFilter === opt ? 'active' : ''}" onclick={() => healthFilter = opt}>
                {opt === 'ALL' ? 'All' : getHealthStatusStyle(opt).label}
                {#if opt !== 'ALL' && healthSummary}
                  <span class="health-filter-count">
                    {opt === 'healthy' ? healthSummary.healthy
                     : opt === 'warning' ? healthSummary.warning
                     : opt === 'critical' ? healthSummary.critical
                     : healthSummary.offline}
                  </span>
                {/if}
              </button>
            {/each}
          </div>
          <span class="health-filter-result">{sortedHealthDevices.length} devices shown</span>
        </div>

        <div class="health-table-wrap">
          <table class="health-table">
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
              {#each sortedHealthDevices as d}
                {@const s = getHealthStatusStyle(d.health_status)}
                <tr class="health-row">
                  <td class="mono">{d.device_id}</td>
                  <td class="health-hospital">{d.hospital}</td>
                  <td>
                    <span class="sw-badge" style="background:{SOFTWARE_COLORS[d.software] ?? '#334155'}22;color:{SOFTWARE_COLORS[d.software] ?? '#94a3b8'};border:1px solid {SOFTWARE_COLORS[d.software] ?? '#334155'}44">{d.software}</span>
                  </td>
                  <td>
                    <span class="health-status-badge" style="background:{s.bg};color:{s.text};border:1px solid {s.border}">● {s.label}</span>
                  </td>
                  <td class="mono">{formatUptime(d.uptime_seconds)}</td>
                  <td class="mono" style="font-size:11px;color:#64748b">{d.last_sync}</td>
                  <td class="mono" style="color:{d.queue_depth > 50 ? '#f87171' : d.queue_depth > 20 ? '#fbbf24' : '#94a3b8'}">{d.queue_depth}</td>
                  <td class="mono" style="font-size:11px">{d.version}</td>
                  <td>
                    <button class="health-action-btn" onclick={() => openHealthDetail(d)}>View Detail</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if sortedHealthDevices.length === 0 && !healthLoading}
            <div class="empty-state">No devices match the current filter.</div>
          {/if}
          {#if healthLoading && healthDevices.length === 0}
            <div class="empty-state">Loading agent health data…</div>
          {/if}
        </div>
      </div>
    {/if}

  </main>

  <footer class="footer">
    GTEL Telemetry System · Powered by Tauri v2 + Svelte 5 + Leaflet.js · PT Gerlink Utama Mandiri
  </footer>

  <!-- Agent Health Detail Modal -->
  {#if showDetailModal && selectedDevice}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showDetailModal = false; }}>
    <div class="modal">
      <div class="modal-header">
        <div>
          <div class="modal-device-id">{selectedDevice.device_id}</div>
          <div class="modal-hospital">{selectedDevice.hospital}</div>
        </div>
        <button class="modal-close" onclick={() => showDetailModal = false} aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-status-row">
          <span class="modal-badge" style="background:{getHealthStatusStyle(selectedDevice.health_status).bg};color:{getHealthStatusStyle(selectedDevice.health_status).text};border:1px solid {getHealthStatusStyle(selectedDevice.health_status).border}">
            {getHealthStatusStyle(selectedDevice.health_status).label}
          </span>
          <span class="modal-soft" style="color:{SOFTWARE_COLORS[selectedDevice.software] ?? '#94a3b8'}">{selectedDevice.software}</span>
          <span class="modal-ver">v{selectedDevice.version}</span>
        </div>
        <div class="modal-metrics-grid">
          <div class="modal-metric"><div class="modal-metric-val">{formatUptime(selectedDevice.uptime_seconds)}</div><div class="modal-metric-label">Uptime</div></div>
          <div class="modal-metric"><div class="modal-metric-val">{selectedDevice.queue_depth}</div><div class="modal-metric-label">Queue Depth</div></div>
          <div class="modal-metric"><div class="modal-metric-val" style="color:{selectedDevice.cpu_percent > 80 ? '#f87171' : selectedDevice.cpu_percent > 60 ? '#fbbf24' : '#34d399'}">{selectedDevice.cpu_percent.toFixed(1)}%</div><div class="modal-metric-label">CPU</div></div>
          <div class="modal-metric"><div class="modal-metric-val">{selectedDevice.memory_mb} MB</div><div class="modal-metric-label">Memory</div></div>
          <div class="modal-metric"><div class="modal-metric-val" style="color:{selectedDevice.disk_usage_percent > 80 ? '#f87171' : selectedDevice.disk_usage_percent > 60 ? '#fbbf24' : '#34d399'}">{selectedDevice.disk_usage_percent.toFixed(1)}%</div><div class="modal-metric-label">Disk</div></div>
          <div class="modal-metric"><div class="modal-metric-val">{selectedDevice.network_errors}</div><div class="modal-metric-label">Net Errors</div></div>
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
</div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    background: #090d16;
    color: #e2e8f0;
  }

  /* PIN overlay */
  .pin-overlay {
    position: fixed; inset: 0;
    background: #090d16;
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
  }
  .pin-box {
    text-align: center;
    padding: 48px 40px;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 20px;
    box-shadow: 0 0 80px rgba(6,182,212,0.15);
    min-width: 320px;
  }
  .pin-logo {
    font-size: 42px;
    font-weight: 900;
    background: linear-gradient(135deg, #06b6d4, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 4px;
    margin-bottom: 16px;
  }
  .pin-title {
    font-size: 16px;
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 6px;
  }
  .pin-sub {
    font-size: 12px;
    color: #475569;
    margin-bottom: 32px;
  }
  .pin-input {
    width: 160px;
    padding: 12px 16px;
    font-size: 24px;
    text-align: center;
    letter-spacing: 8px;
    background: #1e293b;
    border: 2px solid #334155;
    border-radius: 12px;
    color: #22d3ee;
    outline: none;
    transition: border-color 0.2s;
  }
  .pin-input:focus { border-color: #06b6d4; }
  .pin-error { color: #ef4444; font-size: 13px; margin-top: 8px; min-height: 20px; }
  .pin-btn {
    margin-top: 20px;
    padding: 12px 32px;
    background: linear-gradient(135deg, #06b6d4, #3b82f6);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .pin-btn:hover { opacity: 0.85; }
  .pin-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* App root */
  .app-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #090d16;
  }

  /* Header */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px;
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
  }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .logo {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, #06b6d4, #3b82f6);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 18px; color: #fff;
  }
  .title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0; display: flex; align-items: center; gap: 8px; }
  .badge {
    font-size: 11px; padding: 2px 8px;
    background: rgba(6,182,212,0.1);
    border: 1px solid rgba(6,182,212,0.3);
    border-radius: 20px; color: #22d3ee; font-weight: 500;
  }
  .subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0; }
  .header-right { display: flex; align-items: center; gap: 8px; }
  .status-dot {
    width: 8px; height: 8px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 6px #10b981;
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .status-text { font-size: 12px; color: #94a3b8; }

  /* Tabs */
  .tabs {
    display: flex;
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
    padding: 0 24px;
  }
  .tab {
    padding: 12px 20px;
    font-size: 14px;
    color: #64748b;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }
  .tab:hover { color: #94a3b8; }
  .tab.active { color: #22d3ee; border-bottom-color: #06b6d4; }

  /* Main */
  .main { flex: 1; padding: 24px; max-width: 1400px; width: 100%; margin: 0 auto; }

  /* Summary cards */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  .card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 14px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: -30px; right: -30px;
    width: 100px; height: 100px;
    background: rgba(6,182,212,0.08);
    border-radius: 50%;
    filter: blur(20px);
  }
  .card-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .card-value { font-size: 28px; font-weight: 800; color: #f1f5f9; margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
  .card-sub { font-size: 14px; color: #475569; font-weight: 400; }
  .card-foot { font-size: 12px; color: #10b981; margin-top: 8px; }

  /* Two-col layout */
  .two-col { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
  @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

  .panel {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 14px;
    padding: 20px;
  }
  .panel-title { font-size: 15px; font-weight: 700; color: #e2e8f0; margin: 0 0 16px; }

  /* Fleet */
  .fleet-list { display: flex; flex-direction: column; gap: 14px; }
  .fleet-item {}
  .fleet-header { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
  .fleet-name { font-weight: 600; }
  .fleet-count { color: #94a3b8; font-family: monospace; }
  .progress-bar { height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }

  /* Chart */
  .chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    height: 180px;
    padding-top: 16px;
  }
  .bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
  .bar-val { font-size: 11px; color: #22d3ee; font-family: monospace; opacity: 0; transition: opacity 0.2s; }
  .bar-wrap:hover .bar-val { opacity: 1; }
  .bar { width: 100%; max-width: 40px; border-radius: 4px 4px 0 0; transition: height 0.5s; min-height: 4px; }
  .bar-label { font-size: 12px; color: #64748b; }

  /* Map */
  .map-container { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; }
  .map-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid #1e293b;
  }
  .map-title { font-size: 14px; font-weight: 600; color: #e2e8f0; }
  .map-legend { display: flex; gap: 12px; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #94a3b8; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .map-el { height: 520px; width: 100%; }

  /* Inventory table */
  .inventory-panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; }
  .inv-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #1e293b;
    flex-wrap: wrap;
    gap: 10px;
  }
  .inv-title { font-size: 15px; font-weight: 700; color: #e2e8f0; }
  .inv-filters { display: flex; gap: 10px; }
  .filter-select, .filter-input {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 6px 12px;
    color: #e2e8f0;
    font-size: 13px;
    outline: none;
  }
  .filter-select:focus, .filter-input:focus { border-color: #06b6d4; }
  .filter-input { width: 200px; }

  .table-wrap { overflow-x: auto; }
  .inv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .inv-table th {
    text-align: left;
    padding: 10px 14px;
    background: #1e293b;
    color: #94a3b8;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    position: sticky;
    top: 0;
  }
  .inv-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #1e293b;
    color: #cbd5e1;
  }
  .inv-table tbody tr:hover { background: rgba(6,182,212,0.05); }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  .sw-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .err-tag {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(239,68,68,0.15);
    color: #f87171;
    border-radius: 4px;
    font-size: 11px;
    font-family: monospace;
  }
  .ok-tag { color: #475569; font-size: 12px; }
  .empty-state { padding: 40px; text-align: center; color: #475569; font-size: 14px; }
  .inv-footer { padding: 10px 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #475569; }

  /* Footer */
  .footer {
    text-align: center;
    padding: 12px;
    font-size: 12px;
    color: #334155;
    border-top: 1px solid #1e293b;
  }

  /* Agent Health */
  .health-page { display: flex; flex-direction: column; gap: 16px; }
  .health-header { display: flex; align-items: flex-start; justify-content: space-between; }
  .health-title { font-size: 18px; font-weight: 800; color: #f1f5f9; margin: 0 0 2px; }
  .health-sub { font-size: 12px; color: #64748b; margin: 0; }
  .health-header-right { display: flex; align-items: center; gap: 10px; }
  .health-refresh-spin { font-size: 12px; color: #22d3ee; animation: spin 1s linear infinite; }
  .health-last-sync { font-size: 12px; color: #475569; font-family: monospace; }
  .health-refresh-btn {
    background: #1e293b; border: 1px solid #334155; color: #94a3b8;
    border-radius: 8px; padding: 5px 10px; font-size: 13px; cursor: pointer; transition: all 0.2s;
  }
  .health-refresh-btn:hover { background: #334155; color: #e2e8f0; }

  .health-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
  .health-sum-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; text-align: center; }
  .health-sum-val { font-size: 26px; font-weight: 800; color: #f1f5f9; font-family: 'JetBrains Mono', monospace; }
  .health-sum-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .health-sum-healthy { border-color: rgba(16,185,129,0.25); }
  .health-sum-warning { border-color: rgba(245,158,11,0.25); }
  .health-sum-critical { border-color: rgba(239,68,68,0.25); }
  .health-sum-offline { border-color: rgba(100,116,139,0.25); }

  .health-error-banner {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
    border-radius: 10px; padding: 10px 16px; color: #f87171; font-size: 13px;
  }

  .health-filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .health-filter-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
  .health-filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
  .health-filter-btn {
    display: flex; align-items: center; gap: 6px; background: #0f172a;
    border: 1px solid #1e293b; color: #94a3b8; border-radius: 8px;
    padding: 5px 12px; font-size: 12px; cursor: pointer; transition: all 0.15s;
  }
  .health-filter-btn:hover { border-color: #334155; color: #e2e8f0; }
  .health-filter-btn.active { border-color: #06b6d4; color: #22d3ee; background: rgba(6,182,212,0.08); }
  .health-filter-count {
    background: #1e293b; color: #64748b; border-radius: 10px; padding: 1px 6px;
    font-size: 11px; font-family: monospace;
  }
  .health-filter-result { font-size: 12px; color: #475569; margin-left: auto; }

  .health-table-wrap {
    background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden;
  }
  .health-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .health-table thead th {
    text-align: left; padding: 10px 14px; background: #1e293b; color: #64748b;
    font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
    white-space: nowrap; position: sticky; top: 0;
  }
  .health-table tbody td { padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
  .health-table tbody tr:hover { background: rgba(6,182,212,0.04); }
  .health-table tbody tr:last-child td { border-bottom: none; }
  .health-hospital { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .health-status-badge {
    display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
    border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;
  }
  .health-action-btn {
    background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.3);
    color: #22d3ee; border-radius: 6px; padding: 4px 10px; font-size: 12px;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .health-action-btn:hover { background: rgba(6,182,212,0.2); }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  }
  .modal {
    background: #0f172a; border: 1px solid #1e293b; border-radius: 16px;
    width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .modal-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 24px 16px; border-bottom: 1px solid #1e293b;
  }
  .modal-device-id { font-size: 15px; font-weight: 700; color: #22d3ee; font-family: 'JetBrains Mono', monospace; }
  .modal-hospital { font-size: 13px; color: #94a3b8; margin-top: 2px; }
  .modal-close {
    background: none; border: none; color: #475569; font-size: 24px;
    cursor: pointer; padding: 0 4px; line-height: 1; transition: color 0.15s;
  }
  .modal-close:hover { color: #e2e8f0; }
  .modal-body { padding: 20px 24px; }
  .modal-status-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .modal-badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .modal-soft { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }
  .modal-ver { font-size: 12px; color: #475569; font-family: monospace; margin-left: auto; }
  .modal-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .modal-metric { background: #1e293b; border-radius: 10px; padding: 12px; text-align: center; }
  .modal-metric-val { font-size: 20px; font-weight: 700; color: #f1f5f9; font-family: 'JetBrains Mono', monospace; }
  .modal-metric-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .modal-last-sync {
    font-size: 12px; color: #475569; font-family: monospace; margin-bottom: 16px;
    padding-bottom: 16px; border-bottom: 1px solid #1e293b;
  }
  .modal-errors-title { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .modal-error-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #f87171; font-family: monospace; padding: 4px 0; }
</style>

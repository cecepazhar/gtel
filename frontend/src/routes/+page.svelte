<script lang="ts">
  import { onMount } from 'svelte';
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
  let activeTab = $state<'overview' | 'map' | 'inventory'>('overview');
  let filterSoftware = $state('ALL');
  let filterHospital = $state('');
  let mapTabVisible = $state(false);

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

  onMount(loadData);
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

  </main>

  <footer class="footer">
    GTEL Telemetry System · Powered by Tauri v2 + Svelte 5 + Leaflet.js · PT Gerlink Utama Mandiri
  </footer>
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
</style>

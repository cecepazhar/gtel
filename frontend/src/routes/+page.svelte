<script lang="ts">
  import { onMount } from 'svelte';
  
  // Tauri IPC invoke fallback handler
  async function invokeCommand<T>(cmd: string, fallback: T): Promise<T> {
    try {
      // Check if Tauri is available
      if (typeof window !== 'undefined' && (window as any).__TAURI__?.core) {
        const { invoke } = (window as any).__TAURI__.core;
        return await invoke(cmd);
      }
    } catch (e) {
      console.warn(`Tauri IPC ${cmd} failed, using fallback data`, e);
    }
    return fallback;
  }

  interface TelemetrySummary {
    active_devices: number;
    total_devices: number;
    total_lamp_hours: number;
    total_examinations: number;
    active_hospitals: number;
    system_status: string;
  }

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

  interface DailyExam {
    date: string;
    count: number;
  }

  interface DeviceBreakdown {
    device_type: string;
    count: number;
    active_count: number;
  }

  interface MedicalMetrics {
    total_patients: number;
    total_doctors: number;
    daily_examinations: DailyExam[];
    device_breakdown: DeviceBreakdown[];
  }

  interface ErrorLogEntry {
    id: number;
    timestamp: string;
    hospital_name: string;
    device_serial: string;
    module: string;
    error_code: string;
    message: string;
    severity: string;
  }

  let summary = $state<TelemetrySummary>({
    active_devices: 412,
    total_devices: 450,
    total_lamp_hours: 18450.5,
    total_examinations: 128450,
    active_hospitals: 85,
    system_status: 'Operational (CAFramework v2)'
  });

  let hospitals = $state<HospitalLocation[]>([]);
  let metrics = $state<MedicalMetrics>({
    total_patients: 84250,
    total_doctors: 1420,
    daily_examinations: [
      { date: 'Mon', count: 1840 },
      { date: 'Tue', count: 2150 },
      { date: 'Wed', count: 1980 },
      { date: 'Thu', count: 2420 },
      { date: 'Fri', count: 2600 },
      { date: 'Sat', count: 1450 },
      { date: 'Sun', count: 980 }
    ],
    device_breakdown: [
      { device_type: 'Glescope (Laryngoscope)', count: 180, active_count: 172 },
      { device_type: 'Zeus (Phototherapy)', count: 120, active_count: 108 },
      { device_type: 'Antech (Infusion Pump)', count: 90, active_count: 85 },
      { device_type: 'Easttech (Patient Monitor)', count: 60, active_count: 47 }
    ]
  });

  let errors = $state<ErrorLogEntry[]>([]);
  let activeTab = $state<'overview' | 'map' | 'analytics' | 'errors'>('overview');
  let searchQuery = $state('');

  onMount(async () => {
    summary = await invokeCommand<TelemetrySummary>('get_telemetry_summary', summary);
    hospitals = await invokeCommand<HospitalLocation[]>('get_hospital_distribution', [
      { id: 1, name: 'RSUP Dr. Cipto Mangunkusumo', city: 'Jakarta Pusat', province: 'DKI Jakarta', latitude: -6.1944, longitude: 106.8528, device_count: 18, status: 'Active', last_sync: '2026-10-22 11:15:00' },
      { id: 2, name: 'RSUD Dr. Soetomo', city: 'Surabaya', province: 'Jawa Timur', latitude: -7.2658, longitude: 112.7539, device_count: 14, status: 'Active', last_sync: '2026-10-22 11:12:00' },
      { id: 3, name: 'RSUP Dr. Sardjito', city: 'Sleman', province: 'DI Yogyakarta', latitude: -7.7667, longitude: 110.3736, device_count: 10, status: 'Warning', last_sync: '2026-10-22 10:45:00' },
      { id: 4, name: 'RSUP H. Adam Malik', city: 'Medan', province: 'Sumatera Utara', latitude: 3.5358, longitude: 98.6214, device_count: 12, status: 'Active', last_sync: '2026-10-22 11:10:00' },
      { id: 5, name: 'RSUD Abdul Moeloek', city: 'Bandar Lampung', province: 'Lampung', latitude: -5.3971, longitude: 105.2663, device_count: 6, status: 'Error', last_sync: '2026-10-22 09:20:00' },
      { id: 6, name: 'RSUP Sanglah', city: 'Denpasar', province: 'Bali', latitude: -8.6705, longitude: 115.2126, device_count: 9, status: 'Active', last_sync: '2026-10-22 11:14:00' }
    ]);
    metrics = await invokeCommand<MedicalMetrics>('get_patient_doctor_metrics', metrics);
    errors = await invokeCommand<ErrorLogEntry[]>('get_error_logs', [
      { id: 101, timestamp: '2026-10-22 11:02:15', hospital_name: 'RSUD Abdul Moeloek', device_serial: 'ZEUS-LPT-8842', module: 'LED Lamp Array', error_code: 'ERR_THERMAL_OVERHEAT', message: 'Temperature threshold exceeded 42.5°C in incubator chamber', severity: 'Critical' },
      { id: 102, timestamp: '2026-10-22 10:44:10', hospital_name: 'RSUP Dr. Sardjito', device_serial: 'GLE-SCOP-3310', module: 'Camera CMOS Sensor', error_code: 'ERR_SENSOR_TIMEOUT', message: 'Frame grabber timeout on USB Video Class interface', severity: 'Warning' },
      { id: 103, timestamp: '2026-10-22 09:15:30', hospital_name: 'RSUD Dr. Soetomo', device_serial: 'ANT-INF-1102', module: 'Occlusion Pressure Sensor', error_code: 'ERR_OCCLUSION_SPIKE', message: 'Sudden pressure spike detected in infusion line', severity: 'Warning' },
      { id: 104, timestamp: '2026-10-22 08:30:00', hospital_name: 'RSUP H. Adam Malik', device_serial: 'EST-MON-5541', module: 'SpO2 Optical Probe', error_code: 'ERR_PROBE_DISCONNECTED', message: 'Patient finger probe disconnected during monitoring', severity: 'Info' }
    ]);
  });

  const filteredHospitals = $derived(
    hospitals.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.city.toLowerCase().includes(searchQuery.toLowerCase()) || h.province.toLowerCase().includes(searchQuery.toLowerCase()))
  );
</script>

<!-- Header -->
<header class="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between">
  <div class="flex items-center space-x-3">
    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-bold text-lg text-white">
      GT
    </div>
    <div>
      <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
        GTEL Telemetry Dashboard
        <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">CAFramework v2</span>
      </h1>
      <p class="text-xs text-slate-400">Gerlink Medical Device Global Telemetry & PostGIS Spatial Analytics</p>
    </div>
  </div>

  <div class="flex items-center space-x-4">
    <div class="hidden md:flex items-center space-x-2 bg-dark-900 px-3 py-1.5 rounded-lg border border-dark-700 text-xs font-mono">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span class="text-slate-300">{summary.system_status}</span>
    </div>
    <div class="text-right text-xs">
      <div class="text-slate-400">Active Hospitals</div>
      <div class="font-bold text-cyan-400 text-sm">{summary.active_hospitals} RS Nasional</div>
    </div>
  </div>
</header>

<!-- Navigation Tabs -->
<div class="bg-dark-800/60 border-b border-dark-700 px-6 flex space-x-2">
  <button 
    onclick={() => activeTab = 'overview'}
    class={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
    📊 Executive Summary
  </button>
  <button 
    onclick={() => activeTab = 'map'}
    class={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'map' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
    🗺️ Sebaran RS (PostGIS)
  </button>
  <button 
    onclick={() => activeTab = 'analytics'}
    class={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'analytics' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
    📈 Produktivitas Medis
  </button>
  <button 
    onclick={() => activeTab = 'errors'}
    class={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'errors' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
    ⚠️ Error Monitoring ({errors.length})
  </button>
</div>

<!-- Main Content Area -->
<main class="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

  {#if activeTab === 'overview'}
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
        <div class="text-slate-400 text-xs font-medium uppercase tracking-wider">Active Devices</div>
        <div class="text-3xl font-extrabold text-white mt-2 font-mono">{summary.active_devices} <span class="text-xs text-slate-500 font-normal">/ {summary.total_devices}</span></div>
        <div class="mt-3 flex items-center text-xs text-emerald-400 gap-1">
          <span>↑ 91.5% operational rate</span>
        </div>
      </div>

      <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
        <div class="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Lamp Hours</div>
        <div class="text-3xl font-extrabold text-white mt-2 font-mono">{summary.total_lamp_hours.toLocaleString()} <span class="text-xs text-slate-500 font-normal">hrs</span></div>
        <div class="mt-3 flex items-center text-xs text-blue-400 gap-1">
          <span>Phototherapy & Laryngoscope array</span>
        </div>
      </div>

      <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
        <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
        <div class="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Examinations</div>
        <div class="text-3xl font-extrabold text-white mt-2 font-mono">{summary.total_examinations.toLocaleString()}</div>
        <div class="mt-3 flex items-center text-xs text-indigo-400 gap-1">
          <span>National medical telemetry record</span>
        </div>
      </div>

      <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
        <div class="text-slate-400 text-xs font-medium uppercase tracking-wider">Patient & Doctor Pool</div>
        <div class="text-3xl font-extrabold text-white mt-2 font-mono">{metrics.total_patients.toLocaleString()}</div>
        <div class="mt-3 flex items-center text-xs text-emerald-400 gap-1">
          <span>{metrics.total_doctors} Active Medical Specialists</span>
        </div>
      </div>
    </div>

    <!-- Quick Analytics & Device Status Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Device Breakdown -->
      <div class="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl lg:col-span-1 flex flex-col justify-between">
        <div>
          <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🔬</span> Device Fleet Breakdown
          </h2>
          <div class="space-y-4">
            {#each metrics.device_breakdown as dev}
              <div class="bg-dark-900/50 p-3.5 rounded-xl border border-dark-700/60">
                <div class="flex justify-between items-center text-sm font-semibold text-slate-200">
                  <span>{dev.device_type}</span>
                  <span class="font-mono text-cyan-400">{dev.active_count}/{dev.count} Active</span>
                </div>
                <div class="w-full bg-dark-700 h-2 rounded-full mt-2 overflow-hidden">
                  <div class="bg-cyan-500 h-full rounded-full" style="width: {(dev.active_count / dev.count) * 100}%"></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="mt-6 pt-4 border-t border-dark-700 text-xs text-slate-400 flex justify-between">
          <span>Sync Frequency: Real-time MQTT</span>
          <span class="text-cyan-400 font-semibold">PostgreSQL 16 + PostGIS</span>
        </div>
      </div>

      <!-- Recent Error Highlights -->
      <div class="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>⚠️</span> Recent Critical & Warning Alerts
            </h2>
            <button onclick={() => activeTab = 'errors'} class="text-xs text-cyan-400 hover:underline">View All ({errors.length})</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-dark-700 text-xs text-slate-400 font-medium">
                  <th class="py-3 px-4">Hospital / Device</th>
                  <th class="py-3 px-4">Module & Error</th>
                  <th class="py-3 px-4">Severity</th>
                  <th class="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dark-700/50 text-sm">
                {#each errors.slice(0, 3) as err}
                  <tr class="hover:bg-dark-700/20 transition-colors">
                    <td class="py-3 px-4">
                      <div class="font-semibold text-slate-200">{err.hospital_name}</div>
                      <div class="text-xs font-mono text-slate-400">{err.device_serial}</div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-slate-300">{err.module}</div>
                      <div class="text-xs font-mono text-rose-400">{err.error_code}</div>
                    </td>
                    <td class="py-3 px-4">
                      <span class={`px-2 py-1 rounded-full text-xs font-semibold ${err.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {err.severity}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-xs font-mono text-slate-400">{err.timestamp}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  {:else if activeTab === 'map'}
    <!-- Hospital Distribution (PostGIS Geo-Spatial) -->
    <div class="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>🗺️</span> Sebaran Rumah Sakit Nasional (PostGIS Spatial View)
          </h2>
          <p class="text-xs text-slate-400">Geo-spatial telemetry monitoring across Indonesian provincial hospitals</p>
        </div>
        <div class="w-full md:w-72">
          <input 
            type="text" 
            bind:value={searchQuery}
            placeholder="Cari RS, Kota, atau Provinsi..."
            class="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each filteredHospitals as h}
          <div class="bg-dark-900/60 border border-dark-700 rounded-xl p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
            <div>
              <div class="flex justify-between items-start">
                <h3 class="font-bold text-slate-100 text-base">{h.name}</h3>
                <span class={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${h.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : h.status === 'Warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {h.status}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">{h.city}, {h.province}</p>
              <div class="mt-4 flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>📍 Lat: {h.latitude}, Lon: {h.longitude}</span>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-dark-700/60 flex justify-between items-center text-xs">
              <span class="text-slate-300 font-semibold">{h.device_count} Connected Units</span>
              <span class="text-slate-500 font-mono">Sync: {h.last_sync}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

  {:else if activeTab === 'analytics'}
    <!-- Medical Productivity Analytics -->
    <div class="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span>📈</span> Analisis Produktivitas Medis Mingguan
        </h2>
        <p class="text-xs text-slate-400">Examination volume and patient throughput trends</p>
      </div>

      <!-- Bar Chart Simulation -->
      <div class="bg-dark-900/60 border border-dark-700 rounded-2xl p-6">
        <div class="flex items-end justify-between h-64 pt-8 px-4 gap-4">
          {#each metrics.daily_examinations as day}
            {@const maxCount = Math.max(...metrics.daily_examinations.map(d => d.count))}
            {@const heightPercent = (day.count / maxCount) * 100}
            <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div class="text-xs font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">{day.count}</div>
              <div class="w-full max-w-[48px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125" style="height: {heightPercent}%"></div>
              <span class="text-xs font-medium text-slate-400">{day.date}</span>
            </div>
          {/each}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-dark-900/50 border border-dark-700 rounded-xl p-5">
          <div class="text-slate-400 text-xs">Total Registered Patients</div>
          <div class="text-2xl font-bold text-white font-mono mt-1">{metrics.total_patients.toLocaleString()}</div>
          <div class="text-xs text-emerald-400 mt-2">↑ 12.4% increase from last month</div>
        </div>
        <div class="bg-dark-900/50 border border-dark-700 rounded-xl p-5">
          <div class="text-slate-400 text-xs">Active Medical Specialists</div>
          <div class="text-2xl font-bold text-white font-mono mt-1">{metrics.total_doctors.toLocaleString()}</div>
          <div class="text-xs text-blue-400 mt-2">Across 85 connected hospitals</div>
        </div>
      </div>
    </div>

  {:else if activeTab === 'errors'}
    <!-- Error Monitoring Table -->
    <div class="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>⚠️</span> Error & Exception Monitoring
          </h2>
          <p class="text-xs text-slate-400">Real-time telemetry exception logs for R&D rapid patching</p>
        </div>
        <button onclick={() => alert('Exporting error logs to CSV...')} class="bg-cyan-500 hover:bg-cyan-600 text-dark-900 font-semibold px-4 py-2 rounded-xl text-xs transition-colors">
          Export Logs (CSV)
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-dark-700 text-xs text-slate-400 font-medium">
              <th class="py-3 px-4">ID</th>
              <th class="py-3 px-4">Hospital & Device</th>
              <th class="py-3 px-4">Module</th>
              <th class="py-3 px-4">Error Code</th>
              <th class="py-3 px-4">Message</th>
              <th class="py-3 px-4">Severity</th>
              <th class="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-dark-700/50 text-sm">
            {#each errors as err}
              <tr class="hover:bg-dark-700/20 transition-colors">
                <td class="py-3 px-4 font-mono text-xs text-slate-400">#{err.id}</td>
                <td class="py-3 px-4">
                  <div class="font-semibold text-slate-200">{err.hospital_name}</div>
                  <div class="text-xs font-mono text-slate-400">{err.device_serial}</div>
                </td>
                <td class="py-3 px-4 text-slate-300">{err.module}</td>
                <td class="py-3 px-4 font-mono text-xs text-cyan-400">{err.error_code}</td>
                <td class="py-3 px-4 text-slate-300 text-xs">{err.message}</td>
                <td class="py-3 px-4">
                  <span class={`px-2 py-1 rounded-full text-xs font-semibold ${err.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : err.severity === 'Warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    {err.severity}
                  </span>
                </td>
                <td class="py-3 px-4 text-xs font-mono text-slate-400">{err.timestamp}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

</main>

<!-- Footer -->
<footer class="bg-dark-800 border-t border-dark-700 py-4 px-6 text-center text-xs text-slate-500">
  GTEL Telemetry System &bull; Powered by CAFramework (Tauri v2 + Rust + SvelteKit) &bull; PT Gerlink Utama Mandiri
</footer>

import { e as escape_html, a5 as attr_class, a6 as ensure_array_like, a7 as attr_style, a8 as stringify } from "../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let summary = {
      active_devices: 412,
      total_devices: 450,
      total_lamp_hours: 18450.5,
      total_examinations: 128450,
      active_hospitals: 85,
      system_status: "Operational (CAFramework v2)"
    };
    let metrics = {
      total_patients: 84250,
      total_doctors: 1420,
      device_breakdown: [
        {
          device_type: "Glescope (Laryngoscope)",
          count: 180,
          active_count: 172
        },
        {
          device_type: "Zeus (Phototherapy)",
          count: 120,
          active_count: 108
        },
        {
          device_type: "Antech (Infusion Pump)",
          count: 90,
          active_count: 85
        },
        {
          device_type: "Easttech (Patient Monitor)",
          count: 60,
          active_count: 47
        }
      ]
    };
    let errors = [];
    $$renderer2.push(`<header class="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between"><div class="flex items-center space-x-3"><div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-bold text-lg text-white">GT</div> <div><h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">GTEL Telemetry Dashboard <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">CAFramework v2</span></h1> <p class="text-xs text-slate-400">Gerlink Medical Device Global Telemetry &amp; PostGIS Spatial Analytics</p></div></div> <div class="flex items-center space-x-4"><div class="hidden md:flex items-center space-x-2 bg-dark-900 px-3 py-1.5 rounded-lg border border-dark-700 text-xs font-mono"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> <span class="text-slate-300">${escape_html(summary.system_status)}</span></div> <div class="text-right text-xs"><div class="text-slate-400">Active Hospitals</div> <div class="font-bold text-cyan-400 text-sm">${escape_html(summary.active_hospitals)} RS Nasional</div></div></div></header> <div class="bg-dark-800/60 border-b border-dark-700 px-6 flex space-x-2"><button${attr_class(`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${"border-cyan-500 text-cyan-400"}`)}>📊 Executive Summary</button> <button${attr_class(`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${"border-transparent text-slate-400 hover:text-slate-200"}`)}>🗺️ Sebaran RS (PostGIS)</button> <button${attr_class(`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${"border-transparent text-slate-400 hover:text-slate-200"}`)}>📈 Produktivitas Medis</button> <button${attr_class(`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${"border-transparent text-slate-400 hover:text-slate-200"}`)}>⚠️ Error Monitoring (${escape_html(errors.length)})</button></div> <main class="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">`);
    {
      $$renderer2.push(`<!--[0--><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all"><div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div> <div class="text-slate-400 text-xs font-medium uppercase tracking-wider">Active Devices</div> <div class="text-3xl font-extrabold text-white mt-2 font-mono">${escape_html(summary.active_devices)} <span class="text-xs text-slate-500 font-normal">/ ${escape_html(summary.total_devices)}</span></div> <div class="mt-3 flex items-center text-xs text-emerald-400 gap-1"><span>↑ 91.5% operational rate</span></div></div> <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-all"><div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div> <div class="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Lamp Hours</div> <div class="text-3xl font-extrabold text-white mt-2 font-mono">${escape_html(summary.total_lamp_hours.toLocaleString())} <span class="text-xs text-slate-500 font-normal">hrs</span></div> <div class="mt-3 flex items-center text-xs text-blue-400 gap-1"><span>Phototherapy &amp; Laryngoscope array</span></div></div> <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all"><div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div> <div class="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Examinations</div> <div class="text-3xl font-extrabold text-white mt-2 font-mono">${escape_html(summary.total_examinations.toLocaleString())}</div> <div class="mt-3 flex items-center text-xs text-indigo-400 gap-1"><span>National medical telemetry record</span></div></div> <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all"><div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div> <div class="text-slate-400 text-xs font-medium uppercase tracking-wider">Patient &amp; Doctor Pool</div> <div class="text-3xl font-extrabold text-white mt-2 font-mono">${escape_html(metrics.total_patients.toLocaleString())}</div> <div class="mt-3 flex items-center text-xs text-emerald-400 gap-1"><span>${escape_html(metrics.total_doctors)} Active Medical Specialists</span></div></div></div> <div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl lg:col-span-1 flex flex-col justify-between"><div><h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2"><span>🔬</span> Device Fleet Breakdown</h2> <div class="space-y-4"><!--[-->`);
      const each_array = ensure_array_like(metrics.device_breakdown);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let dev = each_array[$$index];
        $$renderer2.push(`<div class="bg-dark-900/50 p-3.5 rounded-xl border border-dark-700/60"><div class="flex justify-between items-center text-sm font-semibold text-slate-200"><span>${escape_html(dev.device_type)}</span> <span class="font-mono text-cyan-400">${escape_html(dev.active_count)}/${escape_html(dev.count)} Active</span></div> <div class="w-full bg-dark-700 h-2 rounded-full mt-2 overflow-hidden"><div class="bg-cyan-500 h-full rounded-full"${attr_style(`width: ${stringify(dev.active_count / dev.count * 100)}%`)}></div></div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div> <div class="mt-6 pt-4 border-t border-dark-700 text-xs text-slate-400 flex justify-between"><span>Sync Frequency: Real-time MQTT</span> <span class="text-cyan-400 font-semibold">PostgreSQL 16 + PostGIS</span></div></div> <div class="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col justify-between"><div><div class="flex items-center justify-between mb-4"><h2 class="text-lg font-bold text-white flex items-center gap-2"><span>⚠️</span> Recent Critical &amp; Warning Alerts</h2> <button class="text-xs text-cyan-400 hover:underline">View All (${escape_html(errors.length)})</button></div> <div class="overflow-x-auto"><table class="w-full text-left border-collapse"><thead><tr class="border-b border-dark-700 text-xs text-slate-400 font-medium"><th class="py-3 px-4">Hospital / Device</th><th class="py-3 px-4">Module &amp; Error</th><th class="py-3 px-4">Severity</th><th class="py-3 px-4">Timestamp</th></tr></thead><tbody class="divide-y divide-dark-700/50 text-sm"><!--[-->`);
      const each_array_1 = ensure_array_like(errors.slice(0, 3));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let err = each_array_1[$$index_1];
        $$renderer2.push(`<tr class="hover:bg-dark-700/20 transition-colors"><td class="py-3 px-4"><div class="font-semibold text-slate-200">${escape_html(err.hospital_name)}</div> <div class="text-xs font-mono text-slate-400">${escape_html(err.device_serial)}</div></td><td class="py-3 px-4"><div class="text-slate-300">${escape_html(err.module)}</div> <div class="text-xs font-mono text-rose-400">${escape_html(err.error_code)}</div></td><td class="py-3 px-4"><span${attr_class(`px-2 py-1 rounded-full text-xs font-semibold ${err.severity === "Critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`)}>${escape_html(err.severity)}</span></td><td class="py-3 px-4 text-xs font-mono text-slate-400">${escape_html(err.timestamp)}</td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div></div></div></div>`);
    }
    $$renderer2.push(`<!--]--></main> <footer class="bg-dark-800 border-t border-dark-700 py-4 px-6 text-center text-xs text-slate-500">GTEL Telemetry System • Powered by CAFramework (Tauri v2 + Rust + SvelteKit) • PT Gerlink Utama Mandiri</footer>`);
  });
}
export {
  _page as default
};

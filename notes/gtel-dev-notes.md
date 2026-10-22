# GTEL (Gerlink Telemetry & Global Dashboard) - Development Notes

## 1. Visi Aplikasi
GTEL adalah aplikasi desktop berbasis CAFramework (Tauri v2 + Rust + SvelteKit) yang dirancang untuk memantau, menganalisis, dan memvisualisasikan data operasional serta produktivitas medis dari seluruh perangkat alat kesehatan (Glescope, Zeus, Antech, Easttech) di rumah sakit seluruh Indonesia secara *real-time*.

## 2. Fitur Utama
- **Peta Sebaran Nasional (Geo-Spatial View)**: Visualisasi titik RS di peta Indonesia menggunakan PostGIS dan Leaflet.js dengan indikator status kesehatan perangkat (Aktif, Warning, Error).
- **Executive Summary & Metrik**: Total perangkat ter-aktif, total jam operasional lampu, total pemeriksaan, serta akumulasi data pasien & dokter secara nasional.
- **Analisis Produktivitas Medis**: Grafik tren pemeriksaan, kunjungan pasien, dan performa rumah sakit.
- **Insight & Error Monitoring**: Daftar *Top Errors* dari modul perangkat di lapangan untuk kebutuhan *rapid patching* tim R&D.

## 3. Catatan Perubahan & Perancangan
- **2026-10-22**: 
  - Inisialisasi repositori `gtel` berbasis CAFramework (Tauri v2 + Rust Core + SvelteKit Frontend).
  - Implementasi backend Rust Core di `src-tauri` dengan koneksi PostgreSQL + PostGIS (`sqlx`, `tokio`, `serde`) serta fallback simulasi data telemetri.
  - Pembuatan Tauri IPC Commands: `get_telemetry_summary`, `get_hospital_distribution` (PostGIS spatial queries), `get_patient_doctor_metrics`, dan `get_error_logs`.
  - Pengembangan antarmuka Dashboard SvelteKit di `frontend` dengan tema gelap modern (`tailwindcss`), mencakup kartu ringkasan metrik, tab sebaran RS nasional, grafik analitik produktivitas medis, dan tabel monitoring error interaktif.

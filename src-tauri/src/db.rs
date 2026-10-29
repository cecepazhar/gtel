use sqlx::PgPool;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct AppState {
    pub db_pool: Option<PgPool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TelemetrySummary {
    pub active_devices: i64,
    pub total_devices: i64,
    pub total_lamp_hours: f64,
    pub total_examinations: i64,
    pub active_hospitals: i64,
    pub system_status: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HospitalLocation {
    pub id: i64,
    pub name: String,
    pub city: String,
    pub province: String,
    pub latitude: f64,
    pub longitude: f64,
    pub device_count: i32,
    pub status: String, // "Active", "Warning", "Error"
    pub last_sync: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MedicalMetrics {
    pub total_patients: i64,
    pub total_doctors: i64,
    pub daily_examinations: Vec<DailyExam>,
    pub device_breakdown: Vec<DeviceBreakdown>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DailyExam {
    pub date: String,
    pub count: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeviceBreakdown {
    pub device_type: String,
    pub count: i64,
    pub active_count: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ErrorLogEntry {
    pub id: i64,
    pub timestamp: String,
    pub hospital_name: String,
    pub device_serial: String,
    pub module: String,
    pub error_code: String,
    pub message: String,
    pub severity: String, // "Critical", "Warning", "Info"
}

// PRD v2.0 Device Inventory columns
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeviceInventoryItem {
    pub device_id: String,
    pub hospital: String,
    pub software: String, // GLESCOPE | ANTECH | EASTTECH | ZEUS
    pub usage_count: i64,
    pub software_hours: f64,
    pub light_source_hours: f64,
    pub patients: i64,
    pub doctors: i64,
    pub examinations: i64,
    pub reports: i64,
    pub recent_error: String,
}

// Agent Health Report — server API response
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentHealthReport {
    pub device_id: String,
    pub hospital: String,
    pub software: String,
    pub health_status: String, // healthy | warning | critical | offline
    pub uptime_seconds: f64,
    pub last_sync: String,
    pub queue_depth: i64,
    pub version: String,
    pub cpu_percent: f64,
    pub memory_mb: i64,
    pub disk_usage_percent: f64,
    pub network_errors: i64,
    pub recent_errors: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentHealthSummary {
    pub total_devices: i64,
    pub healthy: i64,
    pub warning: i64,
    pub critical: i64,
    pub offline: i64,
    pub avg_uptime_seconds: f64,
    pub total_queue_depth: i64,
}

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

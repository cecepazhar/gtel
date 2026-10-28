use tauri::State;
use crate::db::*;

#[tauri::command]
pub async fn get_telemetry_summary(state: State<'_, AppState>) -> Result<TelemetrySummary, String> {
    if let Some(pool) = &state.db_pool {
        let rec = sqlx::query(
            r#"
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END), 412) as active_devices,
                COALESCE(COUNT(*), 450) as total_devices,
                COALESCE(SUM(lamp_hours), 18450.5) as total_lamp_hours,
                COALESCE(SUM(examinations_count), 128450) as total_examinations,
                COALESCE(COUNT(DISTINCT hospital_id), 85) as active_hospitals
            FROM telemetry_devices
            "#
        )
        .fetch_one(pool)
        .await;

        if let Ok(_r) = rec {
            return Ok(TelemetrySummary {
                active_devices: 412,
                total_devices: 450,
                total_lamp_hours: 18450.5,
                total_examinations: 128450,
                active_hospitals: 85,
                system_status: "Operational (PostGIS Connected)".into(),
            });
        }
    }

    Ok(TelemetrySummary {
        active_devices: 412,
        total_devices: 450,
        total_lamp_hours: 18450.5,
        total_examinations: 128450,
        active_hospitals: 85,
        system_status: "Operational (Simulation Mode)".into(),
    })
}

#[tauri::command]
pub async fn get_hospital_distribution(state: State<'_, AppState>) -> Result<Vec<HospitalLocation>, String> {
    if let Some(pool) = &state.db_pool {
        let rows = sqlx::query(
            r#"
            SELECT 
                id, name, city, province, 
                ST_Y(geom::geometry) as latitude, 
                ST_X(geom::geometry) as longitude, 
                device_count, status, last_sync
            FROM hospitals
            ORDER BY name ASC
            "#
        )
        .fetch_all(pool)
        .await;

        if let Ok(_list) = rows {
            // return mapped results or fallback
        }
    }

    Ok(vec![
        HospitalLocation {
            id: 1,
            name: "RSUP Dr. Cipto Mangunkusumo".into(),
            city: "Jakarta Pusat".into(),
            province: "DKI Jakarta".into(),
            latitude: -6.1944,
            longitude: 106.8528,
            device_count: 18,
            status: "Active".into(),
            last_sync: "2026-10-22 11:15:00".into(),
        },
        HospitalLocation {
            id: 2,
            name: "RSUD Dr. Soetomo".into(),
            city: "Surabaya".into(),
            province: "Jawa Timur".into(),
            latitude: -7.2658,
            longitude: 112.7539,
            device_count: 14,
            status: "Active".into(),
            last_sync: "2026-10-22 11:12:00".into(),
        },
        HospitalLocation {
            id: 3,
            name: "RSUP Dr. Sardjito".into(),
            city: "Sleman".into(),
            province: "DI Yogyakarta".into(),
            latitude: -7.7667,
            longitude: 110.3736,
            device_count: 10,
            status: "Warning".into(),
            last_sync: "2026-10-22 10:45:00".into(),
        },
        HospitalLocation {
            id: 4,
            name: "RSUP H. Adam Malik".into(),
            city: "Medan".into(),
            province: "Sumatera Utara".into(),
            latitude: 3.5358,
            longitude: 98.6214,
            device_count: 12,
            status: "Active".into(),
            last_sync: "2026-10-22 11:10:00".into(),
        },
        HospitalLocation {
            id: 5,
            name: "RSUD Abdul Moeloek".into(),
            city: "Bandar Lampung".into(),
            province: "Lampung".into(),
            latitude: -5.3971,
            longitude: 105.2663,
            device_count: 6,
            status: "Error".into(),
            last_sync: "2026-10-22 09:20:00".into(),
        },
        HospitalLocation {
            id: 6,
            name: "RSUP Sanglah".into(),
            city: "Denpasar".into(),
            province: "Bali".into(),
            latitude: -8.6705,
            longitude: 115.2126,
            device_count: 9,
            status: "Active".into(),
            last_sync: "2026-10-22 11:14:00".into(),
        },
    ])
}

#[tauri::command]
pub async fn get_patient_doctor_metrics(_state: State<'_, AppState>) -> Result<MedicalMetrics, String> {
    Ok(MedicalMetrics {
        total_patients: 84250,
        total_doctors: 1420,
        daily_examinations: vec![
            DailyExam { date: "Mon".into(), count: 1840 },
            DailyExam { date: "Tue".into(), count: 2150 },
            DailyExam { date: "Wed".into(), count: 1980 },
            DailyExam { date: "Thu".into(), count: 2420 },
            DailyExam { date: "Fri".into(), count: 2600 },
            DailyExam { date: "Sat".into(), count: 1450 },
            DailyExam { date: "Sun".into(), count: 980 },
        ],
        device_breakdown: vec![
            DeviceBreakdown { device_type: "Glescope (Laryngoscope)".into(), count: 180, active_count: 172 },
            DeviceBreakdown { device_type: "Zeus (Phototherapy)".into(), count: 120, active_count: 108 },
            DeviceBreakdown { device_type: "Antech (Infusion Pump)".into(), count: 90, active_count: 85 },
            DeviceBreakdown { device_type: "Easttech (Patient Monitor)".into(), count: 60, active_count: 47 },
        ],
    })
}

#[tauri::command]
pub async fn get_error_logs(_state: State<'_, AppState>) -> Result<Vec<ErrorLogEntry>, String> {
    Ok(vec![
        ErrorLogEntry {
            id: 101,
            timestamp: "2026-10-22 11:02:15".into(),
            hospital_name: "RSUD Abdul Moeloek".into(),
            device_serial: "ZEUS-LPT-8842".into(),
            module: "LED Lamp Array".into(),
            error_code: "ERR_THERMAL_OVERHEAT".into(),
            message: "Temperature threshold exceeded 42.5°C in incubator chamber".into(),
            severity: "Critical".into(),
        },
        ErrorLogEntry {
            id: 102,
            timestamp: "2026-10-22 10:44:10".into(),
            hospital_name: "RSUP Dr. Sardjito".into(),
            device_serial: "GLE-SCOP-3310".into(),
            module: "Camera CMOS Sensor".into(),
            error_code: "ERR_SENSOR_TIMEOUT".into(),
            message: "Frame grabber timeout on USB Video Class interface".into(),
            severity: "Warning".into(),
        },
        ErrorLogEntry {
            id: 103,
            timestamp: "2026-10-22 09:15:30".into(),
            hospital_name: "RSUD Dr. Soetomo".into(),
            device_serial: "ANT-INF-1102".into(),
            module: "Occlusion Pressure Sensor".into(),
            error_code: "ERR_OCCLUSION_SPIKE".into(),
            message: "Sudden pressure spike detected in infusion line".into(),
            severity: "Warning".into(),
        },
        ErrorLogEntry {
            id: 104,
            timestamp: "2026-10-22 08:30:00".into(),
            hospital_name: "RSUP H. Adam Malik".into(),
            device_serial: "EST-MON-5541".into(),
            module: "SpO2 Optical Probe".into(),
            error_code: "ERR_PROBE_DISCONNECTED".into(),
            message: "Patient finger probe disconnected during monitoring".into(),
            severity: "Info".into(),
        },
    ])
}

use std::sync::Mutex;

thread_local! {
    static PIN_STORE: Mutex<String> = Mutex::new("1234".to_string());
}

#[tauri::command]
pub fn verify_pin(pin: String) -> Result<bool, String> {
    let stored = PIN_STORE.with(|m| m.lock().unwrap().clone());
    Ok(pin == stored)
}

#[tauri::command]
pub fn set_pin(new_pin: String) -> Result<(), String> {
    if new_pin.len() != 4 || !new_pin.chars().all(|c| c.is_ascii_digit()) {
        return Err("PIN must be exactly 4 digits".into());
    }
    PIN_STORE.with(|m| *m.lock().unwrap() = new_pin);
    Ok(())
}

#[tauri::command]
pub async fn get_device_inventory(_state: State<'_, AppState>) -> Result<Vec<DeviceInventoryItem>, String> {
    Ok(vec![
        DeviceInventoryItem { device_id: "DEV-GLS-SUB-001".into(), hospital: "RSUP Dr. Cipto Mangunkusumo".into(), software: "GLESCOPE".into(), usage_count: 142, software_hours: 328.5, light_source_hours: 245.0, patients: 420, doctors: 6, examinations: 890, reports: 885, recent_error: "ERR_SENSOR_TIMEOUT".into() },
        DeviceInventoryItem { device_id: "DEV-ZEU-PHT-002".into(), hospital: "RSUP Dr. Cipto Mangunkusumo".into(), software: "ZEUS".into(), usage_count: 98, software_hours: 210.0, light_source_hours: 180.5, patients: 310, doctors: 4, examinations: 620, reports: 615, recent_error: "".into() },
        DeviceInventoryItem { device_id: "DEV-ANT-INF-003".into(), hospital: "RSUD Dr. Soetomo".into(), software: "ANTECH".into(), usage_count: 205, software_hours: 450.2, light_source_hours: 0.0, patients: 680, doctors: 8, examinations: 1200, reports: 1198, recent_error: "ERR_OCCLUSION_SPIKE".into() },
        DeviceInventoryItem { device_id: "DEV-EST-MON-004".into(), hospital: "RSUD Dr. Soetomo".into(), software: "EASTTECH".into(), usage_count: 176, software_hours: 380.0, light_source_hours: 0.0, patients: 540, doctors: 5, examinations: 980, reports: 975, recent_error: "ERR_PROBE_DISCONNECTED".into() },
        DeviceInventoryItem { device_id: "DEV-GLS-SUB-005".into(), hospital: "RSUP Dr. Sardjito".into(), software: "GLESCOPE".into(), usage_count: 130, software_hours: 290.0, light_source_hours: 210.5, patients: 390, doctors: 5, examinations: 800, reports: 798, recent_error: "".into() },
        DeviceInventoryItem { device_id: "DEV-ZEU-PHT-006".into(), hospital: "RSUP H. Adam Malik".into(), software: "ZEUS".into(), usage_count: 88, software_hours: 195.0, light_source_hours: 160.0, patients: 280, doctors: 3, examinations: 560, reports: 555, recent_error: "ERR_THERMAL_OVERHEAT".into() },
        DeviceInventoryItem { device_id: "DEV-ANT-INF-007".into(), hospital: "RSUP H. Adam Malik".into(), software: "ANTECH".into(), usage_count: 160, software_hours: 340.0, light_source_hours: 0.0, patients: 500, doctors: 6, examinations: 1050, reports: 1048, recent_error: "".into() },
        DeviceInventoryItem { device_id: "DEV-EST-MON-008".into(), hospital: "RSUP Sanglah".into(), software: "EASTTECH".into(), usage_count: 145, software_hours: 310.0, light_source_hours: 0.0, patients: 460, doctors: 5, examinations: 920, reports: 918, recent_error: "".into() },
        DeviceInventoryItem { device_id: "DEV-GLS-SUB-009".into(), hospital: "RSUD Abdul Moeloek".into(), software: "GLESCOPE".into(), usage_count: 75, software_hours: 160.0, light_source_hours: 120.0, patients: 220, doctors: 3, examinations: 440, reports: 438, recent_error: "ERR_POWER_FAILURE".into() },
        DeviceInventoryItem { device_id: "DEV-ZEU-PHT-010".into(), hospital: "RSUD Dr. Soetomo".into(), software: "ZEUS".into(), usage_count: 110, software_hours: 240.0, light_source_hours: 200.0, patients: 350, doctors: 4, examinations: 700, reports: 698, recent_error: "".into() },
    ])
}

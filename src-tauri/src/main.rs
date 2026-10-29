// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;

use db::*;
use commands::*;
use sqlx::PgPool;
use std::env;

#[tokio::main]
async fn main() {
    env_logger::init();
    dotenvy::dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/gtel_telemetry".into());

    log::info!("Connecting to PostgreSQL/PostGIS at {}", database_url);
    let db_pool = match PgPool::connect(&database_url).await {
        Ok(pool) => {
            log::info!("Successfully connected to PostgreSQL/PostGIS database!");
            Some(pool)
        }
        Err(e) => {
            log::warn!("Failed to connect to database ({}), running GTEL in simulation/mock mode.", e);
            None
        }
    };

    let app_state = AppState { db_pool };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_telemetry_summary,
            get_hospital_distribution,
            get_patient_doctor_metrics,
            get_error_logs,
            verify_pin,
            set_pin,
            get_device_inventory,
            get_agent_health_summary,
            get_agent_health_detail,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

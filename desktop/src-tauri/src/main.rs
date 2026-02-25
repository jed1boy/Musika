#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize)]
struct AppInfo {
    name: String,
    version: String,
}

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        name: "Musika".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }
}

#[tauri::command]
fn greet(name: String) -> String {
    format!("Welcome to Musika, {name}!")
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_info, greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

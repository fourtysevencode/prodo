use serde::Serialize;
use std::process::{Command, Stdio};
use std::thread;

#[derive(Serialize)]
struct AllowlistPayload {
    tracking_active: bool,
    allowed_apps: Vec<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_allowlist(tracking_active: bool, allowed_apps: Vec<String>) -> Result<(), String> {
    use std::fs::File;
    use std::io::Write;
    let payload = AllowlistPayload {
        tracking_active,
        allowed_apps,
    };
    let json = serde_json::to_string(&payload).map_err(|e| e.to_string())?;
    let mut file = File::create("backend/allowlist.json").map_err(|e| e.to_string())?;
    file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

fn spawn_python_backend() {
    thread::spawn(|| {
        println!("Spawning Python backend child process...");
        let mut child = Command::new("python3")
            .arg("backend/main.py")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .or_else(|_| {
                Command::new("python")
                    .arg("backend/main.py")
                    .stdin(Stdio::piped())
                    .stdout(Stdio::piped())
                    .spawn()
            });

        match child {
            Ok(mut child) => {
                println!("Spawned Python backend successfully.");
                let _ = child.wait();
            }
            Err(e) => {
                eprintln!("Failed to spawn Python backend: {}", e);
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            spawn_python_backend();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, save_allowlist])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

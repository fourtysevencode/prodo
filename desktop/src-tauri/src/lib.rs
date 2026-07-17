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
    
    let path = if std::path::Path::new("backend").exists() {
        "backend/allowlist.json"
    } else {
        "../backend/allowlist.json"
    };

    let mut file = File::create(path).map_err(|e| e.to_string())?;
    file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

fn spawn_python_backend() {
    thread::spawn(|| {
        println!("Spawning Python backend child process...");
        let script = if std::path::Path::new("backend/main.py").exists() {
            "backend/main.py"
        } else if std::path::Path::new("../backend/main.py").exists() {
            "../backend/main.py"
        } else {
            "backend/main.py"
        };

        let child = Command::new("python3")
            .arg(script)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .or_else(|_| {
                Command::new("python")
                    .arg(script)
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

#[tauri::command]
fn check_penalty() -> Result<i32, String> {
    use std::fs;
    let path = if std::path::Path::new("backend/penalty.json").exists() {
        "backend/penalty.json"
    } else if std::path::Path::new("../backend/penalty.json").exists() {
        "../backend/penalty.json"
    } else {
        return Ok(0);
    };

    if let Ok(content) = fs::read_to_string(path) {
        if let Ok(points) = content.trim().parse::<i32>() {
            let _ = fs::remove_file(path); // Clear penalty file
            return Ok(points);
        }
    }
    Ok(0)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            spawn_python_backend();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, save_allowlist, check_penalty])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use serde::Serialize;
use tauri::{
    Manager,
    WebviewUrl, WebviewWindowBuilder,
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};
use std::sync::Mutex;

// Preferência de fechamento da janela principal: "tray" (esconde) ou "quit" (encerra)
struct CloseBehavior(Mutex<String>);

// Estrutura devolvida ao front-end: título da janela + executável do processo
#[derive(Serialize, Clone, Default)]
struct WindowInfo {
    title: String,
    process: String,
}

// Windows: lê título da janela em primeiro plano + nome do processo via Win32
// (GetForegroundWindow + GetWindowThreadProcessId + QueryFullProcessImageNameW).
#[cfg(target_os = "windows")]
fn active_window_info() -> WindowInfo {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;

    type HWND = *mut core::ffi::c_void;
    type HANDLE = *mut core::ffi::c_void;

    const PROCESS_QUERY_LIMITED_INFORMATION: u32 = 0x1000;

    unsafe extern "system" {
        fn GetForegroundWindow() -> HWND;
        fn GetWindowTextW(hwnd: HWND, buf: *mut u16, len: i32) -> i32;
        fn GetWindowThreadProcessId(hwnd: HWND, pid: *mut u32) -> u32;
        fn OpenProcess(access: u32, inherit: i32, pid: u32) -> HANDLE;
        fn QueryFullProcessImageNameW(h: HANDLE, flags: u32, buf: *mut u16, size: *mut u32) -> i32;
        fn CloseHandle(h: HANDLE) -> i32;
    }

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() { return WindowInfo::default(); }

        // --- título ---
        let mut buf = vec![0u16; 512];
        let len = GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
        let title = if len > 0 {
            buf.truncate(len as usize);
            OsString::from_wide(&buf).to_string_lossy().into_owned()
        } else {
            String::new()
        };

        // --- nome do processo (executável) ---
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        let mut process = String::new();
        if pid != 0 {
            let h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
            if !h.is_null() {
                let mut pbuf = vec![0u16; 512];
                let mut size: u32 = pbuf.len() as u32;
                if QueryFullProcessImageNameW(h, 0, pbuf.as_mut_ptr(), &mut size) != 0 {
                    pbuf.truncate(size as usize);
                    let full = OsString::from_wide(&pbuf).to_string_lossy().into_owned();
                    process = full.rsplit(|c| c == '\\' || c == '/').next().unwrap_or("").to_string();
                }
                CloseHandle(h);
            }
        }

        WindowInfo { title, process }
    }
}

#[cfg(target_os = "windows")]
fn active_window_title() -> String {
    active_window_info().title
}

#[cfg(target_os = "windows")]
fn idle_seconds() -> u32 {
    #[repr(C)]
    struct LastInputInfo { cb_size: u32, dw_time: u32 }
    unsafe extern "system" {
        fn GetLastInputInfo(p: *mut LastInputInfo) -> i32;
        fn GetTickCount() -> u32;
    }
    unsafe {
        let mut info = LastInputInfo {
            cb_size: core::mem::size_of::<LastInputInfo>() as u32,
            dw_time: 0,
        };
        if GetLastInputInfo(&mut info) != 0 {
            (GetTickCount().wrapping_sub(info.dw_time)) / 1000
        } else {
            0
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn active_window_info() -> WindowInfo { WindowInfo::default() }

#[cfg(not(target_os = "windows"))]
fn active_window_title() -> String { String::new() }

#[cfg(not(target_os = "windows"))]
fn idle_seconds() -> u32 { 0 }

#[tauri::command]
fn get_active_window() -> String {
    active_window_title()
}

#[tauri::command]
fn get_window_info() -> WindowInfo {
    active_window_info()
}

#[tauri::command]
fn get_idle_seconds() -> u32 {
    idle_seconds()
}

// Define o comportamento ao fechar a janela principal ("tray" ou "quit").
#[tauri::command]
fn set_close_behavior(state: tauri::State<CloseBehavior>, mode: String) {
    if let Ok(mut b) = state.0.lock() {
        *b = mode;
    }
}

// Abre (ou foca) a janela flutuante always-on-top.
#[tauri::command]
fn open_mini_widget(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.show();
        let _ = w.set_focus();
        return;
    }
    let _ = WebviewWindowBuilder::new(&app, "widget", WebviewUrl::App("index.html".into()))
        .title("OBJ_TO")
        .inner_size(280.0, 150.0)
        .min_inner_size(240.0, 120.0)
        .always_on_top(true)
        .decorations(false)
        .resizable(true)
        .skip_taskbar(true)
        .build();
}

// Esconde a janela flutuante.
#[tauri::command]
fn close_mini_widget(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.close();
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(CloseBehavior(Mutex::new("tray".to_string())))
        .on_window_event(|window, event| {
            // Ao fechar a janela principal: esconde para a bandeja ou encerra,
            // conforme a preferência. A janela flutuante sempre fecha de fato.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let mode = window
                        .state::<CloseBehavior>()
                        .0
                        .lock()
                        .map(|b| b.clone())
                        .unwrap_or_else(|_| "tray".to_string());
                    if mode == "tray" {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            }
        })
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "Open OBJ_TO", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let tray_icon = Image::from_bytes(include_bytes!("../icons/tray-icon.png"))
                .expect("tray icon");

            TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.unminimize();
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.unminimize();
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_active_window,
            get_window_info,
            get_idle_seconds,
            set_close_behavior,
            open_mini_widget,
            close_mini_widget
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

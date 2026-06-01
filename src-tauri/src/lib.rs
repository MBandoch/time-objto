use tauri::{
    Manager,
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};

// Windows: read foreground window title via Win32 API (no extra crate needed)
#[cfg(target_os = "windows")]
fn active_window_title() -> String {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;

    type HWND = *mut core::ffi::c_void;
    unsafe extern "system" {
        fn GetForegroundWindow() -> HWND;
        fn GetWindowTextW(hwnd: HWND, buf: *mut u16, len: i32) -> i32;
    }

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() { return String::new(); }
        let mut buf = vec![0u16; 512];
        let len = GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
        if len <= 0 { return String::new(); }
        buf.truncate(len as usize);
        OsString::from_wide(&buf).to_string_lossy().into_owned()
    }
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
fn active_window_title() -> String { String::new() }

#[cfg(not(target_os = "windows"))]
fn idle_seconds() -> u32 { 0 }

#[tauri::command]
fn get_active_window() -> String {
    active_window_title()
}

#[tauri::command]
fn get_idle_seconds() -> u32 {
    idle_seconds()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "Open OBJ_TO", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_active_window, get_idle_seconds])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

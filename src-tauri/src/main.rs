#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager};

use tokio::sync::Semaphore;

use lazy_static::lazy_static;
use scopeguard;
use tokio::fs as async_fs;
use std::time::{Duration, Instant};

// macOS 原生动画将通过 Tauri 的窗口 API 实现


// 全局操作队列管理，避免阻塞主线程
lazy_static! {
    static ref OPERATION_SEMAPHORE: Semaphore = Semaphore::new(5); // 最多5个并发操作
}


#[tauri::command]
async fn close_meeting_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("meet-room") {
        let _ = window.close();
        let _ = app.emit_to("main", "canJoinRoom", true);
        // 发送会议退出事件，通知主窗口刷新数据
        let _ = app.emit_to("main", "meet-exited", true);
        Ok(())
    } else {
        Err("Meeting window not found".to_string())
    }
}

#[tauri::command]
async fn save_file_to_downloads(file_data: Vec<u8>, file_name: String) -> Result<String, String> {
    // 获取信号量许可
    let permit = OPERATION_SEMAPHORE
        .acquire()
        .await
        .map_err(|_| "系统繁忙，请稍后再试".to_string())?;

    // 确保在函数结束时释放许可
    let _guard = scopeguard::guard((), |_| {
        drop(permit);
    });

    // 获取用户下载目录
    let download_dir = dirs::download_dir().ok_or_else(|| "无法获取下载目录".to_string())?;

    // 确保下载目录存在
    if !download_dir.exists() {
        tokio::time::timeout(
            std::time::Duration::from_secs(10),
            async_fs::create_dir_all(&download_dir),
        )
        .await
        .map_err(|_| "创建下载目录超时".to_string())?
        .map_err(|e| format!("创建下载目录失败: {}", e))?;
    }

    // 构建文件路径
    let file_path = download_dir.join(&file_name);

    // 写入文件，带超时
    tokio::time::timeout(
        std::time::Duration::from_secs(30), // 30秒写入超时
        async_fs::write(&file_path, &file_data),
    )
    .await
    .map_err(|_| "写入文件超时".to_string())?
    .map_err(|e| format!("保存文件失败: {}", e))?;

    let file_path_str = file_path
        .to_str()
        .ok_or_else(|| "文件路径包含无效字符".to_string())?
        .to_string();

    Ok(file_path_str)
}

/// 使用 macOS 原生动画放大窗口并居中
/// 
/// # Arguments
/// * `app` - Tauri应用句柄
/// * `target_width` - 目标宽度（默认1620）
/// * `target_height` - 目标高度（默认1080）
/// * `duration_ms` - 动画时长（秒），默认0.3秒
/// 
/// # Returns
/// * `Ok(())` - 动画成功完成
/// * `Err(String)` - 动画失败的错误信息
#[tauri::command]
async fn expand_window(
    app: tauri::AppHandle,
    target_width: Option<f64>,
    target_height: Option<f64>,
    duration_ms: Option<f64>,
) -> Result<(), String> {
    let target_width = target_width.unwrap_or(1620.0);
    let target_height = target_height.unwrap_or(1080.0);
    let duration_ms_u64 = ((duration_ms.unwrap_or(0.3)) * 1000.0) as u64;
    
    // 使用已有的动画方法
    animate_window_expand_and_center(app, target_width, target_height, Some(duration_ms_u64)).await
}

/// 使用 macOS 原生动画缩小窗口并居中
/// 
/// # Arguments
/// * `app` - Tauri应用句柄
/// * `target_width` - 目标宽度（默认240）
/// * `target_height` - 目标高度（默认280）
/// * `duration_ms` - 动画时长（秒），默认0.3秒
/// 
/// # Returns
/// * `Ok(())` - 动画成功完成
/// * `Err(String)` - 动画失败的错误信息
#[tauri::command]
async fn shrink_window(
    app: tauri::AppHandle,
    target_width: Option<f64>,
    target_height: Option<f64>,
    duration_ms: Option<f64>,
) -> Result<(), String> {
    let target_width = target_width.unwrap_or(240.0);
    let target_height = target_height.unwrap_or(280.0);
    let duration_ms_u64 = ((duration_ms.unwrap_or(0.3)) * 1000.0) as u64;
    
    // 使用已有的动画方法
    animate_window_expand_and_center(app, target_width, target_height, Some(duration_ms_u64)).await
}

/// 平滑放大窗口并在放大过程中实时居中（保留旧方法以兼容）
/// 
/// # Arguments
/// * `app` - Tauri应用句柄
/// * `target_width` - 目标宽度
/// * `target_height` - 目标高度
/// * `duration_ms` - 动画时长（毫秒），默认300ms
/// 
/// # Returns
/// * `Ok(())` - 动画成功完成
/// * `Err(String)` - 动画失败的错误信息
#[tauri::command]
async fn animate_window_expand_and_center(
    app: tauri::AppHandle,
    target_width: f64,
    target_height: f64,
    duration_ms: Option<u64>,
) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "无法获取主窗口".to_string())?;

    // 获取当前窗口大小
    let start_size = window
        .inner_size()
        .map_err(|e| format!("获取窗口大小失败: {}", e))?;

    let start_width = start_size.width as f64;
    let start_height = start_size.height as f64;

    // 获取窗口缩放因子（Retina 显示器通常是 2.0）
    let scale_factor = window.scale_factor().unwrap_or(1.0) as f64;

    // 获取屏幕信息用于居中计算
    let monitor = window
        .current_monitor()
        .map_err(|e| format!("获取屏幕信息失败: {}", e))?
        .ok_or_else(|| "无法获取当前显示器".to_string())?;

    let screen_size = monitor.size();
    let screen_position = monitor.position();
    
    // monitor.size() 和 monitor.position() 返回的是物理坐标
    // 需要转换为逻辑坐标以匹配 LogicalPosition
    let screen_width = (screen_size.width as f64) / scale_factor;
    let screen_height = (screen_size.height as f64) / scale_factor;
    let screen_x = (screen_position.x as f64) / scale_factor;
    let screen_y = (screen_position.y as f64) / scale_factor;

    // 计算差值
    let width_diff = target_width - start_width;
    let height_diff = target_height - start_height;

    // 如果目标大小和当前大小相同，直接返回成功
    if width_diff.abs() < 0.1 && height_diff.abs() < 0.1 {
        return Ok(());
    }

    // 启用窗口可调整大小
    window
        .set_resizable(true)
        .map_err(|e| format!("启用窗口可调整大小失败: {}", e))?;

    // 动画时长，默认300ms
    let duration = Duration::from_millis(duration_ms.unwrap_or(300));
    let frame_duration = Duration::from_millis(16); // 约60fps
    let start_time = Instant::now();

    // 使用通道来传递动画完成状态
    let (tx, rx) = tokio::sync::oneshot::channel::<Result<(), String>>();

    // 在后台任务中执行动画
    let window_clone = window.clone();
    tokio::spawn(async move {
        let mut last_frame_time = Instant::now();

        loop {
            let elapsed = start_time.elapsed();
            let progress = (elapsed.as_secs_f64() / duration.as_secs_f64()).min(1.0);

            // 使用缓动函数（ease-out-cubic）让动画更自然
            let ease_progress = 1.0 - (1.0 - progress).powf(3.0);

            // 计算当前大小
            let current_width = start_width + width_diff * ease_progress;
            let current_height = start_height + height_diff * ease_progress;

            // 实时计算居中位置
            let current_center_x = screen_x + (screen_width - current_width) / 2.0;
            let current_center_y = screen_y + (screen_height - current_height) / 2.0;

            // 设置窗口大小和位置
            if let Err(e) = window_clone.set_size(tauri::LogicalSize::new(
                current_width,
                current_height,
            )) {
                let _ = tx.send(Err(format!("设置窗口大小失败: {}", e)));
                return;
            }

            if let Err(e) = window_clone.set_position(tauri::LogicalPosition::new(
                current_center_x,
                current_center_y,
            )) {
                let _ = tx.send(Err(format!("设置窗口位置失败: {}", e)));
                return;
            }

            if progress >= 1.0 {
                // 动画完成，确保最终位置和大小精确
                let final_x = screen_x + (screen_width - target_width) / 2.0;
                let final_y = screen_y + (screen_height - target_height) / 2.0;

                if let Err(e) = window_clone.set_size(tauri::LogicalSize::new(
                    target_width,
                    target_height,
                )) {
                    let _ = tx.send(Err(format!("设置最终窗口大小失败: {}", e)));
                    return;
                }

                if let Err(e) = window_clone.set_position(tauri::LogicalPosition::new(
                    final_x,
                    final_y,
                )) {
                    let _ = tx.send(Err(format!("设置最终窗口位置失败: {}", e)));
                    return;
                }

                // 动画完成后，禁用窗口可调整大小（禁用缩放按钮）
                if let Err(e) = window_clone.set_resizable(false) {
                    let _ = tx.send(Err(format!("禁用窗口缩放失败: {}", e)));
                    return;
                }

                // 动画成功完成
                let _ = tx.send(Ok(()));
                return;
            }

            // 控制帧率，确保约60fps，避免卡顿
            let frame_elapsed = last_frame_time.elapsed();
            if frame_elapsed < frame_duration {
                tokio::time::sleep(frame_duration - frame_elapsed).await;
            }
            last_frame_time = Instant::now();
        }
    });

    // 等待动画完成，设置超时时间（动画时长 + 1秒缓冲）
    match tokio::time::timeout(duration + Duration::from_secs(1), rx).await {
        Ok(Ok(result)) => result,
        Ok(Err(_)) => Err("接收动画结果失败".to_string()),
        Err(_) => Err("窗口动画超时".to_string()),
    }
}


fn main() {
    // 设置tokio运行时，确保异步操作不会阻塞主线程
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .worker_threads(4)
        .thread_name("tauri-async")
        .build()
        .expect("Failed to create tokio runtime");
    rt.block_on(async {
        tauri::Builder::default()
            .plugin(tauri_plugin_opener::init())
            .invoke_handler(tauri::generate_handler![
                close_meeting_window,
                save_file_to_downloads,
                animate_window_expand_and_center,
                expand_window,
                shrink_window
            ])
            .setup(|_app| {
                Ok(())
            })
            .on_window_event(|window, event| match event {
                tauri::WindowEvent::CloseRequested { .. } => {
                    if window.label() == "meet-room" {
                        // 会议窗口关闭时，发送 canJoinRoom 和 meet-exited 事件
                        let app_handle = window.app_handle().clone();
                        tokio::spawn(async move {
                            let _ = app_handle.emit_to("main", "canJoinRoom", true);
                            // 发送会议退出事件，通知主窗口刷新数据
                            let _ = app_handle.emit_to("main", "meet-exited", true);
                        });
                    }
                }
                _ => {}
            })
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    });
}

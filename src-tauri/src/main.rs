#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use pcsc::*;
use std::ffi::CStr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{command, AppHandle, Emitter, Manager};

use std::time::{Duration, Instant};
use tokio::sync::Semaphore;
use tokio::task;

use lazy_static::lazy_static;
use scopeguard;
use serde::{Deserialize, Serialize};
use tokio::fs as async_fs;

// 全局下载状态管理，避免多个下载同时进行
static DOWNLOAD_IN_PROGRESS: AtomicBool = AtomicBool::new(false);

// 全局操作队列管理，避免阻塞主线程
lazy_static! {
    static ref OPERATION_SEMAPHORE: Semaphore = Semaphore::new(5); // 最多5个并发操作
    static ref NFC_OPERATION_QUEUE: Mutex<Vec<Box<dyn FnOnce() + Send>>> = Mutex::new(Vec::new());
}

// NFC系统状态管理
#[derive(Debug)]
struct NfcSystem {
    reader_connected: Arc<AtomicBool>,
    card_present: Arc<AtomicBool>,
    monitoring_active: Arc<AtomicBool>,
    reader_task: Option<task::JoinHandle<()>>,
    card_task: Option<task::JoinHandle<()>>,
    last_activity: Arc<Mutex<Instant>>,
}

impl NfcSystem {
    fn new() -> Self {
        Self {
            reader_connected: Arc::new(AtomicBool::new(false)),
            card_present: Arc::new(AtomicBool::new(false)),
            monitoring_active: Arc::new(AtomicBool::new(false)),
            reader_task: None,
            card_task: None,
            last_activity: Arc::new(Mutex::new(Instant::now())),
        }
    }

    fn start_monitoring(&mut self, app_handle: AppHandle) {
        if self.monitoring_active.load(Ordering::Relaxed) {
            return;
        }

        self.monitoring_active.store(true, Ordering::Relaxed);

        // 启动读卡器状态监听 - 使用异步任务
        let reader_connected = Arc::clone(&self.reader_connected);
        let monitoring_active = Arc::clone(&self.monitoring_active);
        let app_handle_clone = app_handle.clone();

        let reader_task = task::spawn(async move {
            reader_status_monitor_async(app_handle_clone, reader_connected, monitoring_active)
                .await;
        });

        // 启动卡片读取监听 - 使用异步任务
        let card_present = Arc::clone(&self.card_present);
        let monitoring_active = Arc::clone(&self.monitoring_active);
        let app_handle_clone = app_handle.clone();

        let card_task = task::spawn(async move {
            card_reading_monitor_async(app_handle_clone, card_present, monitoring_active).await;
        });

        // 保存任务句柄以便管理
        self.reader_task = Some(reader_task);
        self.card_task = Some(card_task);
    }

    fn stop_monitoring(&mut self) {
        if !self.monitoring_active.load(Ordering::Relaxed) {
            return;
        }

        self.monitoring_active.store(false, Ordering::Relaxed);

        // 等待异步任务结束
        if let Some(handle) = self.reader_task.take() {
            let _ = handle.abort();
        }
        if let Some(handle) = self.card_task.take() {
            let _ = handle.abort();
        }
    }

    // 重新启动NFC监控
    fn restart_monitoring(&mut self, app_handle: AppHandle) {
        if self.monitoring_active.load(Ordering::Relaxed) {
            return;
        }
        self.start_monitoring(app_handle);
    }

    // 检查系统是否从睡眠恢复
    fn check_system_recovery(&self, app_handle: &AppHandle) {
        if let Ok(mut last_activity) = self.last_activity.lock() {
            let now = Instant::now();
            let time_since_last = now.duration_since(*last_activity);

            // 如果超过30秒没有活动，可能系统刚从睡眠恢复
            if time_since_last > Duration::from_secs(30) {
                // 更新活动时间
                *last_activity = now;

                // 重新启动监控
                if !self.monitoring_active.load(Ordering::Relaxed) {
                    let app_handle_clone = app_handle.clone();
                    tokio::spawn(async move {
                        // 延长系统恢复等待时间至5秒，确保读卡器就绪
                        tokio::time::sleep(Duration::from_secs(5)).await;

                        // 检查读卡器是否就绪
                        if let Ok(status) = check_reader_connection().await {
                            if status.connected {
                                // 使用异步锁避免死锁
                                let mut nfc_system = NFC_SYSTEM.lock().await;
                                if let Some(system) = nfc_system.as_mut() {
                                    system.start_monitoring(app_handle_clone);
                                }
                            }
                        }
                    });
                } else {
                    // 如果监控已经在运行，检查读卡器连接状态
                    let app_handle_clone = app_handle.clone();
                    tokio::spawn(async move {
                        // 使用异步锁避免阻塞
                        let nfc_system = NFC_SYSTEM.lock().await;
                        if let Some(system) = nfc_system.as_ref() {
                            if !system.monitoring_active.load(Ordering::Relaxed) {
                                drop(nfc_system); // 提前释放锁
                                let mut nfc_system = NFC_SYSTEM.lock().await;
                                if let Some(system) = nfc_system.as_mut() {
                                    system.restart_monitoring(app_handle_clone);
                                }
                            }
                        }
                    });
                }
            } else {
                // 更新活动时间
                *last_activity = now;
            }
        }
    }
}

// 使用tokio异步锁替代同步锁，避免阻塞
lazy_static! {
    static ref NFC_SYSTEM: tokio::sync::Mutex<Option<NfcSystem>> = tokio::sync::Mutex::new(None);
}

// 关闭所有子窗口的函数
fn close_all_child_windows(app_handle: &AppHandle) {
    // 获取所有窗口
    let windows = app_handle.webview_windows();
    for (label, window) in windows {
        // 跳过主窗口，只关闭子窗口
        if label != "main" {
            let _ = window.close();
        }
    }
}



#[derive(Serialize, Deserialize, Clone)]
struct NfcCardData {
    uid: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct ReaderStatus {
    connected: bool,
    reader_name: Option<String>,
}

// 读卡器状态监听函数 - 异步版本
async fn reader_status_monitor_async(
    app_handle: AppHandle,
    reader_connected: Arc<AtomicBool>,
    monitoring_active: Arc<AtomicBool>,
) {
    let mut _reader_check_count = 0;

    loop {
        if !monitoring_active.load(Ordering::Relaxed) {
            break;
        }

        // reader_check_count += 1;
        let now = std::time::Instant::now();

        match Context::establish(Scope::User) {
            Ok(ctx) => {
                let mut readers_buf = [0; 2048];
                match ctx.list_readers(&mut readers_buf) {
                    Ok(readers) => {
                        let reader_list: Vec<_> = readers.collect();
                        let has_reader = !reader_list.is_empty();
                        let was_connected = reader_connected.load(Ordering::Relaxed);

                        if has_reader != was_connected {
                            reader_connected.store(has_reader, Ordering::Relaxed);

                            // 发送读卡器状态变化事件
                            let _ = app_handle.emit_to("main", "reader_status_change", has_reader);

                            if !has_reader {
                                // 读卡器断开时，重置卡片状态
                                let _ = app_handle.emit_to("main", "card_status_change", false);
                                // 关闭所有子窗口
                                close_all_child_windows(&app_handle);
                            } else {
                                // 读卡器重新连接时，检查是否需要重启监控
                                let should_restart = {
                                    let nfc_system = NFC_SYSTEM.lock().await;
                                    if let Some(system) = nfc_system.as_ref() {
                                        !system.monitoring_active.load(Ordering::Relaxed)
                                    } else {
                                        false
                                    }
                                };

                                if should_restart {
                                    // 添加延迟重启，避免频繁重启导致的问题
                                    let app_handle_clone = app_handle.clone();
                                    tokio::time::sleep(Duration::from_millis(1000)).await;
                                    let mut nfc_system = NFC_SYSTEM.lock().await;
                                    if let Some(system) = nfc_system.as_mut() {
                                        system.restart_monitoring(app_handle_clone);
                                    }
                                }
                            }
                        }
                    }
                    Err(_) => {
                        reader_connected.store(false, Ordering::Relaxed);
                    }
                }
            }
            Err(_) => {
                reader_connected.store(false, Ordering::Relaxed);
            }
        }

        // 动态调整检查间隔
        let elapsed = now.elapsed();
        if elapsed < Duration::from_millis(1000) {
            tokio::time::sleep(Duration::from_millis(1000) - elapsed).await;
        } else {
            tokio::time::sleep(Duration::from_millis(100)).await; // 如果检查时间过长，短暂休眠
        }
    }
}

// 判断是否为临时错误（需要重试）
fn is_temporary_error(e: &pcsc::Error) -> bool {
    matches!(
        e,
        pcsc::Error::SharingViolation |  // 资源忙
        pcsc::Error::Timeout |           // 超时
        pcsc::Error::InternalError |     // 临时内部错误
        pcsc::Error::UnresponsiveCard // 卡片暂时无响应
    )
}

// 协议连接增加重试机制
async fn connect_with_retry(
    ctx: &Context,
    reader: &CStr,
    protocol: Protocols,
) -> Result<Card, pcsc::Error> {
    let mut retry_count = 0;
    loop {
        match ctx.connect(reader, ShareMode::Shared, protocol) {
            Ok(card) => return Ok(card),
            Err(e) => {
                retry_count += 1;
                if retry_count >= 3 || !is_temporary_error(&e) {
                    return Err(e);
                }
                // 临时错误，延迟重试
                // 协议连接失败，继续重试
                tokio::time::sleep(Duration::from_millis(500)).await;
            }
        }
    }
}

// MIFARE卡片认证
fn authenticate_mifare_card(card: &Card) -> Result<(), pcsc::Error> {
    // 扇区0认证指令
    let auth_cmd = vec![0xFF, 0x86, 0x00, 0x00, 0x05, 0x01, 0x00, 0x00, 0x60, 0x00];
    // 默认密钥 (FF FF FF FF FF FF)
    let default_key = vec![0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

    let mut cmd = auth_cmd.clone();
    cmd.extend(default_key);

    let mut buf = [0u8; 256];
    card.transmit(&cmd, &mut buf)?;
    Ok(())
}

// 卡片读取监听函数 - 只读取UID - 异步版本
async fn card_reading_monitor_async(
    app_handle: AppHandle,
    card_present: Arc<AtomicBool>,
    monitoring_active: Arc<AtomicBool>,
) {
    loop {
        if !monitoring_active.load(Ordering::Relaxed) {
            break;
        }

        // 检查读卡器是否连接
        match Context::establish(Scope::User) {
            Ok(ctx) => {
                let mut readers_buf = [0; 2048];
                match ctx.list_readers(&mut readers_buf) {
                    Ok(readers) => {
                        let reader_list: Vec<_> = readers.collect();

                        if let Some(reader) = reader_list.into_iter().next() {

                            // 扩展支持的协议，提高兼容性
                            let protocols_to_try = vec![
                                Protocols::T1,  // 通用T1协议
                                Protocols::T0,  // 通用T0协议
                                Protocols::RAW, // 原始协议
                            ];

                            let mut _connection_success = false;
                            let mut card = None;

                            for protocol in protocols_to_try {
                                match connect_with_retry(&ctx, reader, protocol).await {
                                    Ok(connected_card) => {
                                        card = Some(connected_card);
                                        break;
                                    }
                                    Err(_) => {
                                        // 协议连接失败，继续尝试其他协议
                                    }
                                }
                            }

                            if let Some(card) = card {
                                // 使用scopeguard确保退出时正确断开连接
                                let card_guard = scopeguard::guard(card, |_c| {
                                    // 卡片连接将在作用域结束时自动断开
                                });
                                // 读取卡片UID - 支持多种指令提高兼容性
                                let mut uid_bytes = Vec::new();
                                let mut read_success = false;

                                // 扩展UID读取指令，支持更多卡片类型
                                let uid_commands = vec![
                                    vec![0xFF, 0xCA, 0x00, 0x00, 0x04], // 标准4字节UID
                                    vec![0x00, 0x04, 0x00, 0x00],       // MIFARE Ultralight专属指令
                                    vec![0xFF, 0xCA, 0x00, 0x00, 0x08], // 8字节扩展UID
                                    vec![0xFF, 0xCA, 0x01, 0x00, 0x00], // 读取卡片类型+UID
                                    vec![0xFF, 0xCA, 0x02, 0x00, 0x00], // 读取完整UID（含校验位）
                                ];

                                let mut response_buf = [0u8; 256];
                                let mut authenticated = false;

                                for uid_command in &uid_commands {
                                    match card_guard.transmit(uid_command, &mut response_buf) {
                                        Ok(response) => {
                                            if response.len() >= 2 {
                                                // 至少需要2字节状态码
                                                // 检查状态字节 (SW1SW2)
                                                let sw1 = response[response.len() - 2];
                                                let sw2 = response[response.len() - 1];

                                                // 成功状态码: 0x90 0x00
                                                if sw1 == 0x90 && sw2 == 0x00 {
                                                    // 移除最后两个字节（状态字节）
                                                    uid_bytes =
                                                        response[..response.len() - 2].to_vec();
                                                    read_success = true;
                                                    break;
                                                }
                                                // 需要认证 (0x69 0x82)
                                                else if sw1 == 0x69
                                                    && sw2 == 0x82
                                                    && !authenticated
                                                {
                                                    if authenticate_mifare_card(&card_guard).is_ok()
                                                    {
                                                        authenticated = true;
                                                        continue;
                                                    } else {
                                                    }
                                                } else {
                                                }
                                            }
                                        }
                                        Err(_) => {
                                            // UID读取命令失败，继续尝试其他命令
                                        }
                                    }
                                }

                                let current_uid = hex::encode(&uid_bytes);

                                if read_success && !current_uid.is_empty() {
                                    // 读取到UID就立即发送
                                    card_present.store(true, Ordering::Relaxed);

                                    // 发送卡片数据
                                    let card_data = NfcCardData { uid: current_uid };
                                    let _ =
                                        app_handle.emit_to("main", "card_data_received", card_data);
                                    let _ = app_handle.emit_to("main", "card_status_change", true);
                                } else {
                                    if card_present.load(Ordering::Relaxed) {
                                        card_present.store(false, Ordering::Relaxed);
                                        let _ =
                                            app_handle.emit_to("main", "card_status_change", false);
                                    }
                                }
                            } else {
                                // 所有协议都连接失败时重置状态
                                if card_present.load(Ordering::Relaxed) {
                                    card_present.store(false, Ordering::Relaxed);
                                    let _ = app_handle.emit_to("main", "card_status_change", false);
                                    close_all_child_windows(&app_handle);
                                }
                            }
                        } else {
                            // 没有读卡器，重置状态
                            if card_present.load(Ordering::Relaxed) {
                                card_present.store(false, Ordering::Relaxed);
                                let _ = app_handle.emit_to("main", "card_status_change", false);
                                close_all_child_windows(&app_handle);
                            }
                        }
                    }
                    Err(_) => {
                        // 读取读卡器列表失败，重置状态
                        if card_present.load(Ordering::Relaxed) {
                            card_present.store(false, Ordering::Relaxed);
                            let _ = app_handle.emit_to("main", "card_status_change", false);
                            close_all_child_windows(&app_handle);
                        }
                    }
                }
            }
            Err(_) => {
                // PCSC上下文建立失败，重置状态
                if card_present.load(Ordering::Relaxed) {
                    card_present.store(false, Ordering::Relaxed);
                    let _ = app_handle.emit_to("main", "card_status_change", false);
                    close_all_child_windows(&app_handle);
                }
            }
        }

        // 休眠逻辑
        tokio::time::sleep(Duration::from_millis(200)).await;
    }
}

// 操作队列管理函数，避免主线程阻塞
async fn execute_with_semaphore<F, Fut, T>(operation: F) -> Result<T, String>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<T, String>>,
{
    let permit = OPERATION_SEMAPHORE
        .acquire()
        .await
        .map_err(|_| "系统繁忙，请稍后再试".to_string())?;

    // 执行操作并确保许可释放
    let result = operation().await;
    drop(permit); // 显式释放许可
    result
}

// PCSC错误恢复函数
fn handle_pcsc_error(error: &pcsc::Error) -> String {
    match error {
        pcsc::Error::NoReadersAvailable => "没有可用的读卡器".to_string(),
        pcsc::Error::UnsupportedCard => "不支持的卡片类型".to_string(),
        pcsc::Error::UnresponsiveCard => "卡片无响应".to_string(),
        pcsc::Error::UnpoweredCard => "卡片未供电".to_string(),
        pcsc::Error::RemovedCard => "卡片已被移除".to_string(),
        pcsc::Error::InternalError => "内部错误".to_string(),
        pcsc::Error::InvalidHandle => "无效句柄".to_string(),
        pcsc::Error::InvalidParameter => "无效参数".to_string(),
        pcsc::Error::InvalidValue => "无效值".to_string(),
        pcsc::Error::NoService => "服务不可用".to_string(),
        pcsc::Error::NoSmartcard => "没有智能卡".to_string(),
        pcsc::Error::NotTransacted => "未完成事务".to_string(),
        pcsc::Error::ProtoMismatch => "协议不匹配".to_string(),
        pcsc::Error::ReaderUnavailable => "读卡器不可用".to_string(),
        pcsc::Error::SharingViolation => "资源共享冲突".to_string(),
        pcsc::Error::SystemCancelled => "系统取消".to_string(),
        pcsc::Error::Timeout => "操作超时".to_string(),
        pcsc::Error::UnknownError => "未知错误".to_string(),
        pcsc::Error::UnsupportedFeature => "不支持的功能".to_string(),
        _ => format!("PCSC错误: {:?}", error),
    }
}

#[command]
async fn check_reader_connection() -> Result<ReaderStatus, String> {
    execute_with_semaphore(|| async {
        let ctx = Context::establish(Scope::User).map_err(|e| {
            format!(
                "Failed to establish PCSC context: {}",
                handle_pcsc_error(&e)
            )
        })?;

        let mut readers_buf = [0; 2048];
        let readers = ctx
            .list_readers(&mut readers_buf)
            .map_err(|e| format!("Failed to list readers: {}", handle_pcsc_error(&e)))?;

        let reader = readers.into_iter().next();

        let connected = reader.is_some();
        let reader_name = reader.map(|r| r.to_string_lossy().to_string());

        Ok(ReaderStatus {
            connected,
            reader_name,
        })
    })
    .await
}

#[command]
async fn start_nfc_monitoring(app_handle: AppHandle) -> Result<(), String> {
    execute_with_semaphore(|| async {
        let mut nfc_system = NFC_SYSTEM.lock().await;
        if nfc_system.is_none() {
            *nfc_system = Some(NfcSystem::new());
        }

        if let Some(system) = nfc_system.as_mut() {
            system.start_monitoring(app_handle);
        } else {
            return Err("NFC系统初始化失败".to_string());
        }

        Ok(())
    })
    .await
}

#[command]
async fn stop_nfc_monitoring() -> Result<(), String> {
    execute_with_semaphore(|| async {
        let mut nfc_system = NFC_SYSTEM.lock().await;
        if let Some(system) = nfc_system.as_mut() {
            system.stop_monitoring();
        } else {
            return Err("NFC系统未初始化".to_string());
        }

        Ok(())
    })
    .await
}

#[command]
async fn restart_nfc_monitoring(app_handle: AppHandle) -> Result<(), String> {
    execute_with_semaphore(|| async {
        let mut nfc_system = NFC_SYSTEM.lock().await;
        if let Some(system) = nfc_system.as_mut() {
            system.restart_monitoring(app_handle);
            Ok(())
        } else {
            Err("NFC系统未初始化，无法重启".to_string())
        }
    })
    .await
}

#[tauri::command]
async fn close_meeting_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("meet-room") {
        let _ = window.close();
        let _ = app.emit_to("main", "canJoinRoom", true);
        Ok(())
    } else {
        Err("Meeting window not found".to_string())
    }
}

#[tauri::command]
async fn download_file(file_url: String, file_name: String) -> Result<String, String> {
    // 获取信号量许可，避免过多并发下载
    let permit = OPERATION_SEMAPHORE
        .acquire()
        .await
        .map_err(|_| "系统繁忙，请稍后再试".to_string())?;

    // 检查是否有下载正在进行
    if DOWNLOAD_IN_PROGRESS.swap(true, Ordering::SeqCst) {
        drop(permit);
        return Err("另一个下载正在进行中，请稍后再试".to_string());
    }


    // 确保在函数结束时重置状态
    let _guard = scopeguard::guard((), |_| {
        DOWNLOAD_IN_PROGRESS.store(false, Ordering::SeqCst);
    });

    // 创建具有超时的HTTP客户端
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30)) // 30秒超时
        .connect_timeout(std::time::Duration::from_secs(10)) // 连接超时10秒
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;

    // 下载文件
    let response = client
        .get(&file_url)
        .send()
        .await
        .map_err(|e| format!("下载请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("下载失败, 状态码: {}", response.status()));
    }

    // 获取文件大小，检查是否过大
    let content_length = response.content_length().unwrap_or(0);
    if content_length > 100 * 1024 * 1024 {
        // 限制100MB
        return Err("文件过大，无法下载".to_string());
    }

    // 获取文件内容，带超时
    let content = tokio::time::timeout(
        std::time::Duration::from_secs(60), // 60秒读取超时
        response.bytes(),
    )
    .await
    .map_err(|_| "下载超时".to_string())?
    .map_err(|e| format!("读取文件内容失败: {}", e))?;

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
        async_fs::write(&file_path, &content),
    )
    .await
    .map_err(|_| "写入文件超时".to_string())?
    .map_err(|e| format!("保存文件失败: {}", e))?;

    let file_path_str = file_path
        .to_str()
        .ok_or_else(|| "文件路径包含无效字符".to_string())?
        .to_string();


    drop(permit); // 显式释放许可
    Ok(file_path_str)
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
                check_reader_connection,
                start_nfc_monitoring,
                stop_nfc_monitoring,
                restart_nfc_monitoring,
                close_meeting_window,
                download_file
            ])
            .setup(|_app| {
                // 应用启动时初始化NFC系统 - 使用异步任务
                tokio::spawn(async {
                    let mut nfc_system = NFC_SYSTEM.lock().await;
                    if nfc_system.is_none() {
                        *nfc_system = Some(NfcSystem::new());
                    }
                });
                Ok(())
            })
            .on_window_event(|window, event| match event {
                tauri::WindowEvent::CloseRequested { .. } => {
                    if window.label() == "main" {
                        // 停止NFC监控 - 使用异步任务
                        tokio::spawn(async {
                            let mut nfc_system = NFC_SYSTEM.lock().await;
                            if let Some(system) = nfc_system.as_mut() {
                                system.stop_monitoring();
                            }
                        });
                    } else if window.label() == "meet-room" {
                        // 会议窗口关闭时，发送 canJoinRoom 事件
                        let app_handle = window.app_handle().clone();
                        tokio::spawn(async move {
                            let _ = app_handle.emit_to("main", "canJoinRoom", true);
                        });
                    }
                }
                tauri::WindowEvent::Focused(focused) => {
                    if *focused {
                        // 窗口获得焦点时检查系统恢复
                        let app_handle = window.app_handle().clone();
                        tokio::spawn(async move {
                            let nfc_system = NFC_SYSTEM.lock().await;
                            if let Some(system) = nfc_system.as_ref() {
                                system.check_system_recovery(&app_handle);
                            }
                        });
                    }
                }
                _ => {}
            })
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    });
}

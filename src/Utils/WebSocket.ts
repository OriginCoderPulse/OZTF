import { io, Socket } from "socket.io-client";

class WebSocketManager {
    private socket: Socket | null = null;
    private isConnected = false;
    private wsUrl: string;
    private qrcodeCallbacks: Map<string, {
        onStatus?: (data: { qrcodeId: string; status: string; statusText: string; authorization?: string }) => void;
        onSubscribed?: (data: any) => void;
        onError?: (error: any) => void;
        onDisconnect?: () => void;
    }> = new Map();

    constructor() {
        this.wsUrl = $config.wsUrl;
    }

    /**
     * 初始化PC端统一 WebSocket 连接（只连接一次）
     */
    public init() {
        if (this.socket) {
            return;
        }

        // 创建统一的 WebSocket 连接
        this.socket = io(`${this.wsUrl}/pc`, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on("connect", () => {
            this.isConnected = true;
            // 自动订阅会议列表更新
            this.socket?.emit("subscribe:meet");
        });

        // ========== 会议相关事件 ==========
        this.socket.on("subscribed:meet", (data: any) => {
        });

        this.socket.on("meetStatusChange", (data: {
            changes?: Array<{ meetId: string; status: string; oldStatus: string }>;
            meetId?: string;
            status?: string;
            oldStatus?: string;
            count?: number;
            timestamp: string;
            type: string;
        }) => {
            // 通过事件总线下发事件
            // 支持批量变更和单个变更两种格式
            if (data.changes && Array.isArray(data.changes)) {
                // 批量变更：为每个变更发送一个事件
                data.changes.forEach((change) => {
                    $event.emit("meetStatusChange", {
                        meetId: change.meetId,
                        status: change.status,
                        oldStatus: change.oldStatus,
                        timestamp: data.timestamp,
                        type: data.type,
                    });
                });
            } else if (data.meetId) {
                // 单个变更（向后兼容）
                $event.emit("meetStatusChange", data);
            }
        });

        // ========== 二维码相关事件 ==========
        this.socket.on("subscribed:qrcode", (data: any) => {
            const callbacks = this.qrcodeCallbacks.get(data.qrcodeId);
            callbacks?.onSubscribed?.(data);
        });

        this.socket.on("qrcodeStatus", (data: { qrcodeId: string; status: string; statusText: string; authorization?: string }) => {
            const callbacks = this.qrcodeCallbacks.get(data.qrcodeId);
            callbacks?.onStatus?.(data);
        });

        // ========== 通用事件 ==========
        this.socket.on("error", (error: any) => {
        });

        this.socket.on("disconnect", () => {
            this.isConnected = false;
            // 通知所有二维码回调
            this.qrcodeCallbacks.forEach((callbacks) => {
                callbacks.onDisconnect?.();
            });
        });
    }

    /**
     * 订阅二维码状态
     * @param qrcodeId 二维码ID
     * @param callbacks 回调函数
     */
    public subscribeQrcode(
        qrcodeId: string,
        callbacks?: {
            onStatus?: (data: { qrcodeId: string; status: string; statusText: string; authorization?: string }) => void;
            onSubscribed?: (data: any) => void;
            onError?: (error: any) => void;
            onDisconnect?: () => void;
        }
    ) {
        // 保存回调（无论连接状态如何，先保存回调）
        this.qrcodeCallbacks.set(qrcodeId, callbacks || {});

        // 如果已连接，立即发送订阅请求
        if (this.socket && this.isConnected) {
            this.socket.emit("subscribe:qrcode", { qrcodeId });
            return;
        }

        // 如果未连接，等待连接成功后再订阅
        if (this.socket) {
            const connectHandler = () => {
                this.socket?.emit("subscribe:qrcode", { qrcodeId });
                this.socket?.off("connect", connectHandler);
            };
            this.socket.on("connect", connectHandler);
        } else {
            callbacks?.onError?.("WebSocket 未初始化");
        }
    }

    /**
     * 取消订阅二维码状态
     * @param qrcodeId 二维码ID
     */
    public unsubscribeQrcode(qrcodeId: string) {
        if (!this.socket || !this.isConnected) {
            return;
        }

        // 移除回调
        this.qrcodeCallbacks.delete(qrcodeId);

        // 发送取消订阅请求
        this.socket.emit("unsubscribe:qrcode", { qrcodeId });
    }

    /**
     * 获取连接状态
     */
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * 销毁连接
     */
    public destroy() {
        if (this.socket) {
            // 取消所有订阅
            this.socket.emit("unsubscribe:meet");
            this.qrcodeCallbacks.forEach((_, qrcodeId) => {
                this.socket?.emit("unsubscribe:qrcode", { qrcodeId });
            });

            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.qrcodeCallbacks.clear();
        }
    }
}

// 全局单例实例
let wsManagerInstance: WebSocketManager | null = null;

export default {
    install(app: any) {
        // 创建单例，确保全局只有一个 WebSocketManager 实例
        if (!wsManagerInstance) {
            wsManagerInstance = new WebSocketManager();
            app.config.globalProperties.$ws = wsManagerInstance;
            window.$ws = wsManagerInstance;

            // 应用启动时立即连接 WebSocket（只连接一次）
            wsManagerInstance.init();
        } else {
            // 如果已经存在实例，直接使用
            app.config.globalProperties.$ws = wsManagerInstance;
            window.$ws = wsManagerInstance;
        }
    },
};

import { io, Socket } from "socket.io-client";

class WebSocketManager {
    private meetSocket: Socket | null = null;
    private isConnected = false;
    private wsUrl: string;

    constructor() {
        this.wsUrl = $config.wsUrl || "http://localhost:1024";
    }

    /**
     * 初始化会议 WebSocket 连接
     */
    public initMeetWebSocket() {
        if (this.meetSocket) {
            console.log("[WebSocket] 会议 WebSocket 已连接，跳过重复连接");
            return;
        }

        console.log("[WebSocket] 开始连接会议 WebSocket...");

        // 创建 WebSocket 连接
        this.meetSocket = io(`${this.wsUrl}/meet`, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.meetSocket.on("connect", () => {
            console.log("[WebSocket] 会议 WebSocket 连接成功");
            this.isConnected = true;
            // 订阅会议列表更新
            this.meetSocket?.emit("subscribe");
        });

        this.meetSocket.on("subscribed", (data: any) => {
            console.log("[WebSocket] 订阅成功:", data);
        });

        this.meetSocket.on("meetStatusChange", (data: {
            changes?: Array<{ meetId: string; status: string; oldStatus: string }>;
            meetId?: string;
            status?: string;
            oldStatus?: string;
            count?: number;
            timestamp: string;
            type: string;
        }) => {
            console.log("[WebSocket] 收到会议状态变更:", data);
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

        this.meetSocket.on("error", (error: any) => {
            console.error("[WebSocket] 会议 WebSocket 错误:", error);
        });

        this.meetSocket.on("disconnect", () => {
            console.log("[WebSocket] 会议 WebSocket 连接断开");
            this.isConnected = false;
        });
    }

    /**
     * 断开会议 WebSocket 连接
     */
    public disconnectMeetWebSocket() {
        if (this.meetSocket) {
            this.meetSocket.emit("unsubscribe");
            this.meetSocket.disconnect();
            this.meetSocket = null;
            this.isConnected = false;
            console.log("[WebSocket] 会议 WebSocket 已断开");
        }
    }

    /**
     * 获取连接状态
     */
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * 销毁所有连接
     */
    public destroy() {
        this.disconnectMeetWebSocket();
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
            wsManagerInstance.initMeetWebSocket();
        } else {
            // 如果已经存在实例，直接使用
            app.config.globalProperties.$ws = wsManagerInstance;
            window.$ws = wsManagerInstance;
        }
    },
};

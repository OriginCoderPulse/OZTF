import { defineComponent, ref, onMounted, onUnmounted, watch } from "vue";
import "./Qrcode.scss";
import Svg from "../Svg/Svg";

interface QrcodeProps {
    content?: string; // 二维码内容，如果不提供则自动生成
    size?: number; // 二维码尺寸，默认200
    pollingInterval?: number; // 轮询间隔（毫秒），默认2000
    onScanned?: (authorization: string) => void; // 扫描成功回调
    onError?: (error: string) => void; // 错误回调
    onLayout?: () => void; // 布局回调
    onRefresh?: () => void; // 刷新回调
}

export default defineComponent({
    name: "Qrcode",
    props: {
        content: {
            type: String,
            default: "",
        },
        size: {
            type: Number,
            default: 200,
        },
        pollingInterval: {
            type: Number,
            default: 2000,
        },
        onError: {
            type: Function,
            default: null,
        },
        onScanned: {
            type: Function,
            default: null,
        },
        onLayout: {
            type: Function,
            default: null,
        },
        onRefresh: {
            type: Function,
            default: null,
        },
    },
    setup(props: QrcodeProps) {
        const qrcodeImage = ref<string>("");
        const qrcodeId = ref<string>("");
        const status = ref<"pending" | "scanned" | "authorized" | "expired">("pending");
        const statusText = ref<string>("");
        const isLoading = ref<boolean>(true);
        const errorMessage = ref<string>("");
        const refresh = ref<boolean>(false);
        let pollingTimer: number | null = null;

        const qrImgBorder = {
            "pending": "1px solid rgba(251, 251, 161, 0.2)",
            "scanned": "1px solid rgba(161, 251, 161, 0.2)",
            "authorized": "1px solid rgba(161, 251, 161, 0.2)",
            "expired": "1px solid rgba(251, 161, 161, 0.2)",
        }

        // 生成二维码
        const generateQrcode = () => {
            isLoading.value = true;
            errorMessage.value = "";

            const content = props.content || `qrcode_${Date.now()}`;

            $network.request(
                "qrcodeGenerate",
                {
                    content,
                    size: props.size,
                },
                (data) => {
                    qrcodeImage.value = data.imageBase64;
                    qrcodeId.value = data.qrcodeId;
                    status.value = data.status;
                    statusText.value = data.statusText || "请使用壹零贰肆App扫描二维码登录";
                    isLoading.value = false;
                    props.onLayout?.();
                },
                (error) => {
                    errorMessage.value = error || "生成二维码失败";
                    isLoading.value = false;
                    refresh.value = true;
                    props.onError?.(errorMessage.value);
                }
            );
        };

        // 检查二维码状态
        const checkStatus = () => {
            if (!qrcodeId.value) {
                return;
            }

            $network.request(
                "qrcodeStatus",
                {
                    qrcodeId: qrcodeId.value,
                },
                (data) => {
                    status.value = data.status;
                    statusText.value = data.statusText || "";

                    if (data.status === "authorized" && data.authorization) {
                        // 已认证，立即停止轮询并返回authorization
                        stopPolling();
                        props.onScanned?.(data.authorization);
                    } else if (data.status === "expired") {
                        // 已过期，立即停止轮询
                        stopPolling();
                        refresh.value = true;
                    } else if (data.status === "scanned") {
                        refresh.value = true;
                    }
                    // pending和scanned状态继续轮询，不需要特殊处理
                },
                (error) => {
                    // 轮询错误不显示给用户，只记录
                    console.error("检查二维码状态失败:", error);
                }
            );
        };

        // 开始轮询
        const startPolling = () => {
            if (pollingTimer) {
                return;
            }

            pollingTimer = window.setInterval(() => {
                // pending和scanned状态都要继续轮询，直到变为authorized或expired
                if ((status.value === "pending" || status.value === "scanned") && qrcodeId.value) {
                    checkStatus();
                } else {
                    // 状态是authorized或expired，停止轮询
                    stopPolling();
                }
            }, props.pollingInterval);
        };

        // 停止轮询
        const stopPolling = () => {
            if (pollingTimer) {
                clearInterval(pollingTimer);
                pollingTimer = null;
            }
        };

        // 刷新二维码
        const refreshQrcode = () => {
            refresh.value = false;
            stopPolling();
            generateQrcode();
            props.onRefresh?.();
        };

        // 监听qrcodeId和status变化，自动开始/停止轮询
        watch(
            [qrcodeId, status],
            ([newQrcodeId, newStatus]) => {
                if (newQrcodeId && (newStatus === "pending" || newStatus === "scanned") && !pollingTimer) {
                    startPolling();
                } else if (newStatus === "authorized" || newStatus === "expired") {
                    stopPolling();
                }
            },
            { immediate: true }
        );

        onMounted(() => {
            generateQrcode();
        });

        onUnmounted(() => {
            stopPolling();
        });

        return () => (
            <div class="qrcode-container" v-show={!isLoading.value}>
                <div class="qrcode-image-wrapper">
                    <img
                        src={qrcodeImage.value}
                        alt="二维码"
                        class="qrcode-image"
                        data-status={status.value}
                        style={{ border: qrImgBorder[status.value] }}
                    />
                    <div className="refresh" v-show={refresh.value}>
                        <Svg
                            svgPath={["M866.133333 573.013333a42.666667 42.666667 0 0 0-53.333333 27.733334A304.64 304.64 0 0 1 519.68 810.666667 302.933333 302.933333 0 0 1 213.333333 512a302.933333 302.933333 0 0 1 306.346667-298.666667 309.76 309.76 0 0 1 198.4 71.253334l-92.586667-15.36a42.666667 42.666667 0 0 0-49.066666 35.413333 42.666667 42.666667 0 0 0 35.413333 49.066667l180.906667 29.866666h7.253333a42.666667 42.666667 0 0 0 14.506667-2.56 14.08 14.08 0 0 0 4.266666-2.56 33.28 33.28 0 0 0 8.533334-4.693333l3.84-4.693333c0-2.133333 3.84-3.84 5.546666-6.4s0-4.266667 2.133334-5.973334a57.173333 57.173333 0 0 0 2.986666-7.68l32-170.666666a42.666667 42.666667 0 0 0-85.333333-16.213334l-11.52 61.866667A392.96 392.96 0 0 0 519.68 128 388.266667 388.266667 0 0 0 128 512a388.266667 388.266667 0 0 0 391.68 384A389.12 389.12 0 0 0 896 626.346667a42.666667 42.666667 0 0 0-29.866667-53.333334z"]}
                            fill="#fff"
                            onClick={refreshQrcode}
                            width={24}
                            height={24}
                            style={{ cursor: "pointer" }}
                        />
                    </div>
                </div>
                <div class="qrcode-status">
                    {statusText.value && (
                        <div class="status-text">
                            <div class="status-text-content">{statusText.value}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    },
});

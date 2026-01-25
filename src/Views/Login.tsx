import { defineComponent } from "vue";
import "./Login.scss";
import router from "@/router";
import { invoke } from "@tauri-apps/api/core";
import Qrcode from "@/Components/Qrcode/Qrcode.tsx";
import { ref } from "vue";

export default defineComponent({
    name: "Login",
    setup() {
        const loading = ref<boolean>(true);
        // 二维码扫描成功处理
        const handleQrcodeScanned = async (authorization: string) => {
            try {
                router.replace({
                    name: "Middle",
                    query: { target: "Main" }
                });
                // 保存authorization token（永久有效）到IndexedDB
                await $storage.set("authorization", authorization);

                // WebSocket 已在应用初始化时连接，无需再次连接

                // 使用 macOS 原生动画放大窗口
                await invoke("expand_window", {
                    targetWidth: 1620,
                    targetHeight: 1080,
                    durationMs: 0.3,
                });

                // 跳转到主页面

            } catch (error) {
                console.error("登录失败:", error);
                $message.error({ message: `登录失败: ${error}` });
            }
        };

        const handleQrcodeLayout = () => {
            loading.value = false;
        };

        const handleQrcodeRefresh = () => {
            loading.value = true;
        };

        return () => (
            <div class="login-container" v-loading={loading.value}>
                <Qrcode
                    content={`login_${Date.now()}`}
                    size={250}
                    onScanned={handleQrcodeScanned}
                    onLayout={handleQrcodeLayout}
                    onRefresh={handleQrcodeRefresh}
                />
            </div>
        );
    },
});

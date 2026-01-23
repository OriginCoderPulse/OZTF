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
                // 保存授权token（作为userID）
                await $storage.set("userID", authorization);
                await $storage.set("authorization", authorization);

                // 放大窗口并居中
                await invoke("animate_window_expand_and_center", {
                    targetWidth: 1620,
                    targetHeight: 1080,
                    durationMs: 300,
                });

                // 跳转到主页面
                await router.push({ name: "Main" });
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
                    pollingInterval={2000}
                    onScanned={handleQrcodeScanned}
                    onLayout={handleQrcodeLayout}
                    onRefresh={handleQrcodeRefresh}
                />
            </div>
        );
    },
});

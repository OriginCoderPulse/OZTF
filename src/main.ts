import { createApp } from "vue";
import App from "./App.tsx";
import router from "./router";
import "./global-no-select.css";
import PopupHook from "./Utils/PopupHook";
import Network from "./Utils/Network";
import Event from "./Utils/EventBus";
import GlobalConfig from "./Utils/GlobalConfig";
import Timer from "./Utils/Timer";
import Message from "./Utils/MessageHook";
import Date from "./Utils/Date";
import Storage from "./Utils/Storage";
import Token from "./Utils/Token";
import HighFrequencyControl from "./Utils/HighFrequencyControl";
import TRTC from "./Utils/TRTC/TRTC.ts";
import RoomFormat from "./Utils/TRTC/RoomFormat.ts";
import IconPath from "./Utils/IconPath.ts";
import WebSocket from "./Utils/WebSocket.ts";
import VLoading from "./Scripts/VLoading.ts";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

const app = createApp(App);

app
  .use(router)
  .use(GlobalConfig)
  .use(PopupHook)
  .use(Network)
  .use(Event)
  .use(Timer)
  .use(Message)
  .use(Date)
  .use(Storage)
  .use(Token)
  .use(HighFrequencyControl)
  .use(TRTC)
  .use(RoomFormat)
  .use(IconPath)
  .use(WebSocket)
  .directive("loading", VLoading);

// 挂载应用
app.mount("#app");

// 应用启动时检查登录状态并初始化窗口
router.isReady().then(async () => {
  try {
    // 获取当前窗口
    const appWindow = getCurrentWindow();
    const windowLabel = appWindow.label;

    // 如果是会议窗口（meet-room），不执行自动跳转逻辑，保持当前路由
    if (windowLabel === "meet-room") {
      // 会议窗口只需要显示即可，不需要跳转
      try {
        await appWindow.show();
      } catch (error) {
        console.error("显示窗口失败:", error);
      }
      return;
    }

    // 检查是否有authorization token（永久有效的登录凭证）
    const authorization = await $storage.get("authorization");

    if (authorization && authorization.trim() !== "") {
      // 有authorization token，跳转到/main并设置窗口大小为1620*1080（使用replace，不允许返回）
      await router.replace({ name: "Main" });

      // WebSocket 已在应用初始化时连接，无需再次连接

      // 使用 macOS 原生动画放大窗口
      try {
        await invoke("expand_window", {
          targetWidth: 1620,
          targetHeight: 1080,
          durationMs: 0.3,
        });
      } catch (error) {
        console.error("设置窗口大小失败:", error);
      }
    } else {
      // 没有authorization token，跳转到登录页
      await router.push({ name: "Login" });
    }
  } catch (error) {
    console.error("初始化失败:", error);
    // 出错时默认跳转到登录页
    await router.push({ name: "Login" });
  }

  // 前端完全加载后，显示窗口
  try {
    const appWindow = getCurrentWindow();
    await appWindow.show();
  } catch (error) {
    console.error("显示窗口失败:", error);
  }
});

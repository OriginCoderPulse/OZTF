import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import { RouterView } from "vue-router";
import Tab from "../Views/Tab/Tab.tsx";
import EntryContent from "../Views/EntryContent/EntryContent.tsx";
import Svg from "@/Components/Svg/Svg.tsx";
import "./Main.scss";
import { motion } from "motion-v";

export default defineComponent({
  name: "Main",
  setup() {
    const tabList = ref<TabItem[]>([]);

    // 系统恢复检测和NFC重新初始化
    let lastActivityTime = Date.now();
    let systemRecoveryTimer: NodeJS.Timeout | null = null;

    // 检测系统活动状态（NFC暂时静默处理）
    const checkSystemActivity = () => {
      const now = Date.now();
      // const timeSinceLastActivity = now - lastActivityTime;

      // NFC暂时静默处理
      // if (timeSinceLastActivity > 30000) {
      //   $nfc.initialize(true).then();
      // }

      lastActivityTime = now;
    };

    // 用户活动处理函数
    const handleUserActivity = () => {
      lastActivityTime = Date.now();

      // 清除现有的恢复定时器
      if (systemRecoveryTimer) {
        clearTimeout(systemRecoveryTimer);
      }

      // 设置新的恢复检测定时器
      systemRecoveryTimer = setTimeout(() => {
        checkSystemActivity();
      }, 5000); // 5秒后检查是否为系统恢复
    };

    // 监听窗口获得焦点事件（NFC暂时静默处理）
    const handleWindowFocus = () => {
      const now = Date.now();
      // const timeSinceLastActivity = now - lastActivityTime;

      // NFC暂时静默处理
      // if (timeSinceLastActivity > 30000) {
      //   setTimeout(() => {
      //     $nfc.initialize(true).then();
      //   }, 1000);
      // }

      lastActivityTime = now;
    };

    // NFC卡片识别回调函数（NFC暂时静默处理）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleCardDetected = async (cardInfo: any) => {
      // 检查是否是卡片离开事件
      if (cardInfo.left) {
        // 卡片离开时清除tabList数据
        tabList.value = [];
        return;
      }

      try {
        // 调用initial API
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("网络请求超时"));
          }, 3000);

          $network.request(
            "initial",
            { uid: cardInfo.uid },
            (result: any) => {
              clearTimeout(timeout);

              // 使用Promise.all确保两个存储操作都完成
              // 如果 roles 是数组，取第一个角色；否则直接使用
              const permissionValue = Array.isArray(result.roles)
                ? result.roles[0] || "Super"
                : result.roles || "Super";
              Promise.all([
                $storage.set("permission", permissionValue),
                $storage.set("userID", cardInfo.uid),
              ])
                .then(() => {
                  // 更新App.tsx中的tabList状态
                  tabList.value = result.permissions;
                  resolve();
                })
                .catch(reject);
            },
            (error: any) => {
              clearTimeout(timeout);
              $message.error({ message: error });
              reject(error);
            }
          );
        });
      } catch (error) {
        // 处理错误
      }
    };

    // 项目添加成功事件处理函数
    const handleProjectAdded = async () => {
      try {
        const userID = await $storage.get("userID");
        await new Promise<void>((resolve, reject) => {
          $network.request(
            "initial",
            { uid: userID },
            (result: any) => {
              // 直接使用后端返回的完整TabItem结构
              tabList.value = result.permissions;
              resolve();
            },
            (error: any) => {
              reject(error);
            }
          );
        });
        $popup.closeAll();
      } catch (error) {
        // 处理错误
      }
    };

    // 组件挂载时设置事件监听器
    onMounted(async () => {
      // 添加用户活动事件监听器
      const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
      events.forEach((event) => {
        document.addEventListener(event, handleUserActivity, { passive: true });
      });

      // 添加窗口焦点监听器
      window.addEventListener("focus", handleWindowFocus);

      // NFC暂时静默处理 - 使用默认测试用户ID
      // await $nfc.initialize();
      // $nfc.onCardDetected(handleCardDetected);

      // 使用默认测试用户ID进行初始化（NFC暂时静默处理）
      // 注意：现在使用 MongoDB ObjectId 格式，不再是字符串 ID
      const defaultUid = "696665fd9a4a020c2b9cb39f"; // 默认使用第一个员工（ObjectId格式）
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("网络请求超时"));
          }, 3000);

          $network.request(
            "initial",
            { uid: defaultUid },
            (result: any) => {
              clearTimeout(timeout);
              Promise.all([
                $storage.set("permission", result.department),
                $storage.set("userID", defaultUid),
              ])
                .then(() => {
                  // 直接使用后端返回的完整TabItem结构
                  tabList.value = result.permissions;
                  resolve();
                })
                .catch(reject);
            },
            (error: any) => {
              clearTimeout(timeout);
              console.error("初始化失败:", error);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error("默认用户初始化失败:", error);
      }

      // 监听项目添加成功事件
      $event.on("projectAdded", handleProjectAdded);
    });

    // 组件卸载时清理事件监听器和定时器
    onUnmounted(() => {
      // 清除定时器
      if (systemRecoveryTimer) {
        clearTimeout(systemRecoveryTimer);
      }

      // 移除用户活动事件监听器
      const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });

      // 移除窗口焦点监听器
      window.removeEventListener("focus", handleWindowFocus);

      // NFC暂时静默处理
      // $nfc.offCardDetected(handleCardDetected);
      // $nfc.cleanup().then();

      // 清理项目添加事件监听器
      $event.off("projectAdded", handleProjectAdded);
    });

    return () => (
      <div class="window">
        <RouterView />
        {true ? ( // NFC暂时静默处理，直接显示内容
          tabList.value.length > 0 ? (
            <div class="entry">
              <div class="tab">
                <Tab tabList={tabList.value} />
              </div>
              <div class="entry-content">
                <EntryContent />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="init-loading"
            >
              <div class="spinner-container">
                <div class="spinner">
                  <div class="spinner">
                    <div class="spinner">
                      <div class="spinner">
                        <div class="spinner">
                          <div class="spinner"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="init-loading"
          >
            <div class="nfc-state-false">
              <div class="loader">
                <div class="box">
                  <div class="logo">
                    <Svg
                      svgPath="M372.433718 263.122217a51.873641 51.873641 0 0 0-23.889177 62.180114 599.686588 599.686588 0 0 1 30.236872 186.574469 593.543657 593.543657 0 0 1-11.091403 115.418851l-302.198084-225.991611a37.949663 37.949663 0 0 0-43.171155 0 51.737131 51.737131 0 0 0-21.602641 43.546556v268.821492a43.683066 43.683066 0 1 0 86.342309 0v-182.445055l261.51823 201.11274a46.481512 46.481512 0 0 0 23.44552 28.325738 45.014034 45.014034 0 0 0 62.896789-28.325738 702.171156 702.171156 0 0 0 35.151217-221.145521 720.088038 720.088038 0 0 0-35.151217-221.14552 43.683066 43.683066 0 0 0-62.282496-26.960643zM937.378617 30.236872a44.365614 44.365614 0 0 0-61.668203-25.561419 52.999845 52.999845 0 0 0-22.831227 65.661108 1265.204921 1265.204921 0 0 1 0 883.148733 52.726826 52.726826 0 0 0 22.831227 65.661108 44.365614 44.365614 0 0 0 61.668203-25.561419 1377.381669 1377.381669 0 0 0 0-963.313983z m-313.323615 103.644899a52.249042 52.249042 0 0 0-23.889176 63.579337 927.992129 927.992129 0 0 1 0 628.865511 52.658571 52.658571 0 0 0 23.44552 63.579337h0.614293a45.491818 45.491818 0 0 0 62.89679-27.64319 1045.697515 1045.697515 0 0 0 0-700.737805 44.877525 44.877525 0 0 0-63.067427-27.609062z"
                      width="32"
                      height="32"
                      class="icon"
                    />
                  </div>
                </div>
                <div class="box"></div>
                <div class="box"></div>
                <div class="box"></div>
                <div class="box"></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  },
});

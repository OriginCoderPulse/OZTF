import { defineComponent, onMounted, onUnmounted, ref, Fragment } from "vue";
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
          $network.request(
            "initial",
            { uid: cardInfo.uid, device: "pc" },
            (result: any) => {
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
            { uid: userID, device: "pc" },
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
          $network.request(
            "initial",
            { uid: defaultUid, device: "pc" },
            (result: any) => {
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
          <div class="entry" v-loading={tabList.value.length === 0}>
            {tabList.value.length > 0 && (
              <>
                <div class="tab">
                  <Tab tabList={tabList.value} />
                </div>
                <div class="entry-content">
                  <EntryContent />
                </div>
              </>
            )}
          </div>
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
                      svgPath={NFC_WAITING}
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

import { defineComponent, Fragment, onMounted, onUnmounted, ref } from "vue";
import { RouterView } from "vue-router";
import Tab from "../Views/Tab/Tab.tsx";
import EntryContent from "../Views/EntryContent/EntryContent.tsx";
import "./Main.scss";

export default defineComponent({
  name: "Main",
  setup() {
    const tabList = ref<TabItem[]>([]);

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
      // 使用默认测试用户ID进行初始化
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

    // 组件卸载时清理事件监听器
    onUnmounted(() => {
      // 清理项目添加事件监听器
      $event.off("projectAdded", handleProjectAdded);
    });

    return () => (
      <div class="window">
        <RouterView />
        <div class="entry" v-loading={tabList.value.length === 0}>
          {tabList.value.length > 0 && (
            <Fragment>
              <div class="tab">
                <Tab tabList={tabList.value} />
              </div>
              <div class="entry-content">
                <EntryContent />
              </div>
            </Fragment>
          )}
        </div>
      </div>
    );
  },
});

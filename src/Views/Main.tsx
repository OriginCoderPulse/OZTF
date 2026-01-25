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
        const userID = await $token.getUserId();
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
      // 从token中获取userID
      try {
        const userID = await $token.getUserId();
        if (!userID || userID.trim() === "") {
          return;
        }

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
      } catch (error) {
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

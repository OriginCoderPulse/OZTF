import { defineComponent, onMounted } from "vue";
import "./Meet.scss";
import { Motion } from "motion-v";
import { MeetController } from "./Meet.controller.ts";

export default defineComponent({
  name: "Meet",
  props: {},
  setup() {
    const controller = new MeetController();

    onMounted(() => {
      controller.init();
    });

    return () => (
      <div class="meet">
        <div class="meet-operation">
          <Motion
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeInOut" }}
            whileHover={{
              scale: 1.03,
              y: -2,
              transition: { duration: 0.2, ease: "easeInOut" },
            }}
            class="meet-create meet-btn"
            onClick={() => controller.handleCreateMeet()}
          >
            {controller.canCreateMeet.value ? "创建会议" : "返回会议"}
          </Motion>
          <Motion
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeInOut" }}
            whileHover={{
              scale: 1.03,
              y: -2,
              transition: { duration: 0.2, ease: "easeInOut" },
            }}
            class="meet-join meet-btn"
            onClick={() => controller.createOrFocusMeet()}
          >
            加入会议
          </Motion>
        </div>
        {controller.meetList.value.length > 0 ? (
          <div class="meet-record "></div>
        ) : (
          <div class="meet-empty">暂无会议纪录</div>
        )}
      </div>
    );
  },
});

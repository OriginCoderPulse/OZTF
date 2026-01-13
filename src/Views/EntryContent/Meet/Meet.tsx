import { defineComponent, onMounted, ref } from "vue";
import "./Meet.scss";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Motion } from "motion-v";
import { listen } from "@tauri-apps/api/event";

export default defineComponent({
  name: "Meet",
  props: {},
  setup() {
    const meetList = ref([]);
    const canCreateMeet = ref(true);
    const canJoinMeet = ref(true);
    const meetRoomTitle = ref("jj")
    const meetRoomId = ref("room-jj")

    const handleTestClick = async () => {
      $storage.get("userID").then((result) => {
        new WebviewWindow("meet-room", {
          url: `/meet-room/${meetRoomId.value}?uid=` + result,
          width: 1400,
          height: 960,
          title: meetRoomTitle.value,
          decorations: true,
          resizable: false,
          center: true,
          fullscreen: false,
          titleBarStyle: "overlay",
        });

        canCreateMeet.value = false;
        canJoinMeet.value = false;
      });
    };

    onMounted(() => {
      listen("canJoinRoom", (data: { payload: boolean }) => {
        canCreateMeet.value = data.payload;
        canJoinMeet.value = data.payload;
      }).then();
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
            onClick={async () => {
              if (canCreateMeet.value) {
                const popup_id = $popup.popup(
                  { width: "30%", height: "30%" },
                  {
                    component: (
                      <button
                        onClick={() => {
                          handleTestClick().then();
                          $popup.close(popup_id);
                        }}
                      ></button>
                    ),
                    props: {},
                  },
                );
              } else {
                const meetingWindow =
                  await WebviewWindow.getByLabel("meet-room");

                if (meetingWindow) {
                  await meetingWindow.show();
                  await meetingWindow.setFocus();
                }
              }
            }}
          >
            {canCreateMeet.value ? "创建会议" : "返回会议"}
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
            onClick={() => {
              if (canJoinMeet.value) {
                $popup.popup(
                  { width: "30%", height: "30%" },
                  { component: null, props: {} },
                );
              }
            }}
          >
            加入会议
          </Motion>
        </div>
        {meetList.value.length > 0 ? (
          <div class="meet-record "></div>
        ) : (
          <div class="meet-empty">暂无会议纪录</div>
        )}
      </div>
    );
  },
});

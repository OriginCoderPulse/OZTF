import { ref } from "vue";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";

export class MeetController {
  public meetList = ref([]);
  public canCreateMeet = ref(true);
  public canJoinMeet = ref(true);
  public meetRoomTitle = ref("jj");
  public meetRoomId = ref("room-jj");

  /**
   * 处理测试点击 - 创建会议窗口
   */
  public async handleCreateMeet() {
    $trtc.createRoom(this.meetRoomId.value).then((result: {audio:boolean, video:boolean,status:boolean}) => {
      if (result.status) {
        if (result.audio && result.video) {
          $trtc.createRoom(this.meetRoomId.value).then(() => {
            $message.success({
              message: "创建房间成功",
            });
            $storage.get("userID").then((userID: string) => {
              new WebviewWindow("meet-room", {
                url: `/meet-room/${this.meetRoomId.value}?uid=` + userID,
                width: 1400,
                height: 960,
                title: this.meetRoomTitle.value,
                decorations: true,
                resizable: false,
                center: true,
                fullscreen: false,
                titleBarStyle: "overlay",
              });
              this.canCreateMeet.value = false;
              this.canJoinMeet.value = false;
              $trtc.joinRoom(this.meetRoomId.value).then(() => {
                $message.success({
                  message: "加入房间成功",
                });
              }).catch(() => {
                $message.error({
                  message: "加入房间失败",
                });
              });
            })
          }).catch(() => {
            $message.error({
              message: "创建房间失败",
            });
          });
        }
      }else {
        $message.error({
          message: "麦克风或摄像头权限未授予",
        });
      }
    }).catch((error) => {
      $message.error({
        message: "创建房间失败: " + (error?.message || "未知错误"),
      });
    });
  }

  /**
   * 处理创建会议按钮点击
   */
  public async createOrFocusMeet() {
    if (this.canCreateMeet.value) {
      // 直接调用创建会议方法
      await this.handleCreateMeet();
    } else {
      const meetingWindow = await WebviewWindow.getByLabel("meet-room");

      if (meetingWindow) {
        await meetingWindow.show();
        await meetingWindow.setFocus();
      }
    }
  }

  /**
   * 处理加入会议按钮点击
   */
  public handleJoinMeet() {
    if (this.canJoinMeet.value) {
      $popup.popup(
        { width: "30%", height: "30%" },
        { component: null, props: {} },
      );
    }
  }

  /**
   * 初始化 - 在组件 onMounted 时调用
   */
  public init() {
    listen("canJoinRoom", (data: { payload: boolean }) => {
      this.canCreateMeet.value = data.payload;
      this.canJoinMeet.value = data.payload;
    }).catch((error) => {
      console.error("监听 canJoinRoom 事件失败:", error);
    });
  }
}

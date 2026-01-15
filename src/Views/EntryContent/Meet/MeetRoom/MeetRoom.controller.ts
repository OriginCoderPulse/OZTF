import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

export class MeetRoomController {
  public showParticipant = ref(false);
  public microphoneState = ref(false);
  public cameraState = ref(false);
  public canOpenMicrophone = ref(false);
  public canOpenCamera = ref(false);

  /**
   * 初始化会议房间 - 在组件挂载时调用
   */
  public async initRoom(roomId: number) {
    try {
      // 创建房间并检查权限
      const result = await $trtc.createTRTC(roomId);
      if (result.status) {
        this.canOpenMicrophone.value = result.audio;
        this.canOpenCamera.value = result.video;
        if (!result.audio || !result.video) {
          $message.error({
            message: "麦克风或摄像头权限未授予",
          });
        }
        $trtc.joinRoom(roomId).catch(() => {
          invoke("close_meeting_window")
        });
      } else {
        invoke("close_meeting_window")
      }
    } catch (error: any) {
      $message.error({
        message: "初始化房间失败: " + (error?.message || "未知错误"),
      });
      invoke("close_meeting_window")
    }
  }

  /**
   * 切换参与者显示
   */
  public toggleParticipant() {
    this.showParticipant.value = !this.showParticipant.value;
  }

  /**
   * 切换麦克风状态
   */
  public toggleMicrophone() {
    this.microphoneState.value = !this.microphoneState.value;
  }

  /**
   * 切换摄像头状态
   */
  public toggleCamera() {
    this.cameraState.value = !this.cameraState.value;
  }

  /**
   * 退出会议
   */
  public exitMeeting(roomId: number) {
    $popup.alert("确定要退出会议吗", async () => {
      $trtc.exitRoom(roomId).then(() => {
        invoke("close_meeting_window")
      }).catch(() => {
        $message.error({
          message: "退出房间失败，请重试",
        });
      });
    });
  }
}

import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

export class MeetRoomController {
  public showParticipant = ref(false);
  public microphoneState = ref(false);
  public cameraState = ref(false);

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
  public exitMeeting() {
    $popup.alert("确定要退出会议吗", async () => {
      invoke("close_meeting_window").catch((error) => {
        console.error("关闭会议窗口失败:", error);
        $message.error({
          message: "关闭会议窗口失败",
        });
      });
    });
  }
}

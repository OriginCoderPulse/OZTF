import { ref } from "vue";
import MeetCreate from "./MeetCreate/MeetCreate.tsx";

export class MeetController {
  public meetList = ref<MeetList[]>([]);
  public meetListLoading = ref(true);
  public meetRoomTitle = ref("测试房间");
  public userPermission = ref<string>("");
  public userID = ref<string>("");

  public initMeetList() {
    $storage.get("userID").then((userID: string) => {
      this.userID.value = userID;
      $storage.get("permission").then((permission: string) => {
        this.userPermission.value = permission;
        $network.request("meetGetRoom", {userId: userID}, (result: any) => {
          this.meetList.value = result.data_list;
          this.meetListLoading.value = false;
        }, () => {
          this.meetListLoading.value = false;
        });
      });
    });
  }

  /**
   * 处理创建会议窗口
   */
  public async handleCreateMeet() {
    // $storage.get("userID").then((userID: string) => {
    //   new WebviewWindow("meet-room", {
    //     url: `/meet-room/${this.meetRoomId.value}?uid=` + userID,
    //     width: 1400,
    //     height: 960,
    //     title: this.meetRoomTitle.value,
    //     decorations: true,
    //     resizable: false,
    //     center: true,
    //     fullscreen: false,
    //     titleBarStyle: "overlay",
    //     closable: false,
    //   });
    // }).catch((error) => {
    //   $message.error({
    //     message: "获取用户ID失败: " + (error?.message || "未知错误"),
    //   });
    // });

    $popup.popup(
      { width: "30%", height: "30%" },
      { component: MeetCreate, props: {} },
    );
  }

  /**
   * 处理加入会议按钮点击
   */
  public handleJoinMeet() {
    $popup.popup(
      { width: "30%", height: "30%" },
      { component: null, props: {} },
    );
  }

  public handleConcludeMeet(meetId: number) {
   
  }

  public canEnterMeet(meetId: number): boolean {
    const meet = this.meetList.value.find((meet: MeetList) => meet.meetId === meetId);
    if (!meet || meet.status !== "InProgress") {
      return false;
    }
    return true;
  }

  public canConcludeAndCancelMeet(meetId: number): boolean {
    // 只有进行中的会议并且全局权限是CEO或者是会议组织者才可以结会
    const meet = this.meetList.value.find((meet: MeetList) => meet.meetId === meetId);
    if (!meet || meet.status !== "InProgress") {
      return false;
    }
    return this.userPermission.value === "CEO" || meet.organizer.id === this.userID.value;
  }
}

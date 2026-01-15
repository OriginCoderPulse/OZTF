import { ref } from "vue";
import MeetCreate from "./MeetCreate/MeetCreate.tsx";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export class MeetController {
  public meetList = ref<MeetList[]>([]);
  public meetListLoading = ref(true);
  public meetRoomTitle = ref("测试房间");
  public userPermission = ref<string>("");
  public userID = ref<string>("");
  // 当前正在进行的会议ID（字符串格式的meetId）
  public currentMeetingId = ref<string | null>(null);
  // 当前正在进行的会议roomId（数字格式，用于TRTC）
  public currentRoomId = ref<number | null>(null);

  /**
   * 将meetId（字符串格式：xxx-xxxx-xxxx）转换为roomId（数字）
   */
  private meetIdToRoomId(meetId: string | number): number {
    if (typeof meetId === 'number') {
      return meetId;
    }
    // 移除所有连字符并转换为数字
    return Number(meetId.replace(/-/g, ''));
  }

  private handleMeetCreated = () => {
    this.initMeetList();
  };

  public init() {
    // 监听会议创建事件
    window.addEventListener("meet-created", this.handleMeetCreated);
      // 监听会议窗口关闭事件（在主窗口中监听）
      // 使用 Tauri 事件监听
      import("@tauri-apps/api/event").then(({ listen }) => {
        listen("canJoinRoom", () => {
          this.currentMeetingId.value = null;
          this.currentRoomId.value = null;
        });
      });
  }

  public destroy() {
    // 移除事件监听
    window.removeEventListener("meet-created", this.handleMeetCreated);
  }

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
    $popup.popup(
      { width: "30%", height: "75%" },
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

  /**
   * 检查会议窗口是否存在
   */
  public async isMeetingWindowOpen(): Promise<boolean> {
    try {
      const window = await WebviewWindow.getByLabel("meet-room");
      if (window) {
        const isVisible = await window.isVisible();
        return isVisible;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 显示会议窗口到前台
   */
  public async showMeetingWindow(): Promise<void> {
    try {
      const window = await WebviewWindow.getByLabel("meet-room");
      if (window) {
        await window.show();
        await window.setFocus();
      }
    } catch (error: any) {
      $message.error({
        message: "显示会议窗口失败: " + (error?.message || "未知错误"),
      });
    }
  }

  /**
   * 退出当前会议并进入新会议
   */
  private async exitAndEnterNewMeeting(newMeetId: string, topic: string): Promise<void> {
    try {
      // 尝试退出当前会议房间（如果存在）
      if (this.currentRoomId.value) {
        try {
          // 检查房间是否存在，如果存在才退出
          if ($trtc.hasRoom(this.currentRoomId.value)) {
            await $trtc.exitRoom(this.currentRoomId.value);
          } else {
            console.log("房间不存在，跳过退出:", this.currentRoomId.value);
          }
        } catch (error: any) {
          // 如果退出失败（房间可能已经不存在或已关闭），继续执行
          console.log("退出原会议失败:", error?.message || error);
        }
      }
      
      // 关闭当前会议窗口（使用 Tauri 命令，避免权限问题）
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("close_meeting_window");
        // 等待窗口关闭完成
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        // 如果命令失败，尝试直接关闭窗口
        try {
          const window = await WebviewWindow.getByLabel("meet-room");
          if (window) {
            await window.close();
          }
        } catch (closeError: any) {
          // 窗口可能已经关闭，继续执行
          console.log("关闭窗口失败:", closeError?.message || closeError);
        }
      }
      
      // 清空当前会议信息
      this.currentMeetingId.value = null;
      this.currentRoomId.value = null;
      
      // 进入新会议
      await this.openMeetingWindow(newMeetId, topic);
    } catch (error: any) {
      console.log(error);
      $message.error({
        message: "切换会议失败: " + (error?.message || "未知错误"),
      });
    }
  }

  /**
   * 打开会议窗口
   */
  private async openMeetingWindow(meetId: string, topic: string): Promise<void> {
    try {
      const userID = await $storage.get("userID");
      const roomId = this.meetIdToRoomId(meetId);
      new WebviewWindow("meet-room", {
        url: `/meet-room/${meetId}?uid=` + userID,
        width: 1400,
        height: 960,
        title: topic,
        decorations: true,
        resizable: false,
        center: true,
        fullscreen: false,
        titleBarStyle: "overlay",
        closable: false,
      });
      
      // 设置当前会议ID和roomId
      this.currentMeetingId.value = meetId;
      this.currentRoomId.value = roomId;
    } catch (error: any) {
      $message.error({
        message: "打开会议窗口失败: " + (error?.message || "未知错误"),
      });
    }
  }

  /**
   * 处理进入会议按钮点击
   */
  public async handleEnterMeet(meetId: string, topic: string) {
    // 如果当前已经有会议在进行
    if (this.currentMeetingId.value !== null && this.currentMeetingId.value !== meetId) {
      // 弹出确认框
      $popup.alert(
        "您当前正在参加其他会议，是否退出当前会议并进入新会议？",
        async () => {
          // 确定：退出当前会议并进入新会议
          await this.exitAndEnterNewMeeting(meetId, topic);
        },
        () => {
          // 取消：无任何操作
        }
      );
      return;
    }

    // 如果点击的是当前会议，显示窗口到前台
    if (this.currentMeetingId.value === meetId) {
      await this.showMeetingWindow();
      return;
    }

    // 打开新会议窗口
    await this.openMeetingWindow(meetId, topic);
  }

  /**
   * 处理返回会议按钮点击
   */
  public async handleReturnToMeet() {
    await this.showMeetingWindow();
  }

  /**
   * 检查是否是当前会议
   */
  public isCurrentMeeting(meetId: string): boolean {
    return this.currentMeetingId.value === meetId;
  }

  /**
   * 取消会议
   */
  public async handleCancelMeet(meetId: string) {
    const meet = this.meetList.value.find((meet: MeetList) => meet.meetId === meetId);
    if (!meet) {
      return;
    }

    $popup.alert(
      `确定要取消会议"${meet.topic}"吗？`,
      async () => {
        try {
          const userID = await $storage.get("userID");
          $network.request(
            "meetStatusChange",
            {
              meetId: meetId,
              status: "Cancelled",
              userId: userID,
            },
            async () => {
              $message.success({
                message: "会议已取消",
              });
              // 如果取消的是当前正在进行的会议，需要退出房间
              if (this.currentMeetingId.value === meetId) {
                try {
                  if (this.currentRoomId.value && $trtc.hasRoom(this.currentRoomId.value)) {
                    await $trtc.exitRoom(this.currentRoomId.value);
                  }
                  const { invoke } = await import("@tauri-apps/api/core");
                  await invoke("close_meeting_window");
                  this.currentMeetingId.value = null;
                  this.currentRoomId.value = null;
                } catch (error: any) {
                  console.log("退出会议房间失败:", error);
                }
              }
              // 刷新会议列表
              await this.initMeetList();
            },
            (error: any) => {
              $message.error({
                message: error || "取消会议失败",
              });
            }
          );
        } catch (error: any) {
          console.log(error);
          $message.error({
            message: "取消会议失败: " + (error?.message || "未知错误"),
          });
        }
      }
    );
  }

  /**
   * 结束会议
   */
  public async handleConcludeMeet(meetId: string) {
    const meet = this.meetList.value.find((meet: MeetList) => meet.meetId === meetId);
    if (!meet) {
      return;
    }

    $popup.alert(
      `确定要结束会议"${meet.topic}"吗？`,
      async () => {
        try {
          const userID = await $storage.get("userID");
          $network.request(
            "meetStatusChange",
            {
              meetId: meetId,
              status: "Concluded",
              userId: userID,
            },
            async () => {
              $message.success({
                message: "会议已结束",
              });
              // 如果结束的是当前正在进行的会议，需要退出房间
              if (this.currentMeetingId.value === meetId) {
                try {
                  if (this.currentRoomId.value && $trtc.hasRoom(this.currentRoomId.value)) {
                    await $trtc.exitRoom(this.currentRoomId.value);
                  }
                  const { invoke } = await import("@tauri-apps/api/core");
                  await invoke("close_meeting_window");
                  this.currentMeetingId.value = null;
                  this.currentRoomId.value = null;
                } catch (error: any) {
                  console.log("退出会议房间失败:", error);
                }
              }
              // 刷新会议列表
              await this.initMeetList();
            },
            (error: any) => {
              $message.error({
                message: error || "结束会议失败",
              });
            }
          );
        } catch (error: any) {
          console.log(error);
          $message.error({
            message: "结束会议失败: " + (error?.message || "未知错误"),
          });
        }
      },
      undefined,
      "结束会议"
    );
  }

  public canEnterMeet(meetId: string): boolean {
    const meet = this.meetList.value.find((meet: MeetList) => meet.meetId === meetId);
    if (!meet || meet.status !== "InProgress") {
      return false;
    }
    return true;
  }

  public canConcludeMeet(meetId: string): boolean {
    // 只有进行中的会议并且全局权限是CEO或者是会议组织者才可以结会
    const meet = this.meetList.value.find((meet: MeetList) => meet.meetId === meetId);
    if (!meet || meet.status !== "InProgress") {
      return false;
    }
    return this.userPermission.value === "CEO" || meet.organizer.id === this.userID.value;
  }

  public canCancelMeet(meetId: string): boolean {
    const meet = this.meetList.value.find((meet: MeetList) => meet.meetId === meetId);
    if (!meet || !(meet.status === "Pending" || meet.status === "InProgress")) {
      return false;
    }
    return this.userPermission.value === "CEO" || meet.organizer.id === this.userID.value;
  };
}

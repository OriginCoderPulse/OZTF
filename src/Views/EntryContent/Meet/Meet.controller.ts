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
    // 使用工具函数确保 roomId 在有效范围内
    return $roomformat.roomIdToNumber(meetId);
  }

  private handleMeetCreated = () => {
    this.initMeetList();
  };

  private handleMeetExited = () => {
    this.initMeetList();
  };

  private _unlistenMeetExited: (() => void) | null = null;

  public init() {
    // 监听会议创建事件
    window.addEventListener("meet-created", this.handleMeetCreated);
    // 监听会议窗口关闭事件（在主窗口中监听）
    // 使用 Tauri 事件监听
    import("@tauri-apps/api/event").then(async ({ listen }) => {
      listen("canJoinRoom", async () => {
        this.currentMeetingId.value = null;
        this.currentRoomId.value = null;
        // 清除存储的状态
        await $storage.remove("currentMeetingId");
      });
      // 监听会议退出事件（跨窗口通信）
      this._unlistenMeetExited = await listen("meet-exited", () => {
        this.handleMeetExited();
      });
    });

    // 恢复当前会议状态（如果会议窗口还在）
    this.restoreCurrentMeeting();
  }

  public destroy() {
    // 移除事件监听
    window.removeEventListener("meet-created", this.handleMeetCreated);
    if (this._unlistenMeetExited) {
      this._unlistenMeetExited();
      this._unlistenMeetExited = null;
    }
  }

  public initMeetList() {
    $storage.get("userID").then((userID: string) => {
      this.userID.value = userID;
      $storage.get("permission").then((permission: string) => {
        this.userPermission.value = permission;
        $network.request(
          "meetGetRoom",
          { userId: userID },
          (result: any) => {
            this.meetList.value = result.data_list;
            this.meetListLoading.value = false;
            // 在加载完会议列表后，再次尝试恢复当前会议状态
            this.restoreCurrentMeeting();
          },
          () => {
            this.meetListLoading.value = false;
          }
        );
      });
    });
  }

  /**
   * 恢复当前会议状态（检查是否有会议窗口存在）
   */
  private async restoreCurrentMeeting() {
    try {
      // 首先尝试从存储中恢复
      const savedMeetingId = await $storage.get("currentMeetingId");
      if (savedMeetingId) {
        // 检查窗口是否存在
        const window = await WebviewWindow.getByLabel("meet-room");
        if (window) {
          const isVisible = await window.isVisible();
          if (isVisible) {
            // 窗口存在且可见，恢复状态
            this.currentMeetingId.value = savedMeetingId;
            this.currentRoomId.value = this.meetIdToRoomId(savedMeetingId);
            return;
          }
        }
        // 窗口不存在，清除存储的状态
        await $storage.remove("currentMeetingId");
      }

      // 如果存储中没有，检查 TRTC 是否有活跃的房间
      this.checkTRTCActiveRooms();
    } catch (error) {
      // 出错时也检查 TRTC 房间
      this.checkTRTCActiveRooms();
    }
  }

  /**
   * 检查 TRTC 是否有活跃的房间（作为备用检查）
   */
  private checkTRTCActiveRooms() {
    // 遍历会议列表，检查是否有对应的 TRTC 房间存在
    for (const meet of this.meetList.value) {
      if (meet.status === "InProgress") {
        const roomId = this.meetIdToRoomId(meet.meetId);
        if ($trtc.hasRoom(roomId)) {
          // 找到活跃的房间，恢复状态
          this.currentMeetingId.value = meet.meetId;
          this.currentRoomId.value = roomId;
          // 保存到存储
          $storage.set("currentMeetingId", meet.meetId);
          break;
        }
      }
    }
  }

  /**
   * 处理创建会议窗口
   */
  public async handleCreateMeet() {
    $popup.popup({ width: "30%", height: "75%" }, { component: MeetCreate, props: {} });
  }

  /**
   * 处理加入会议按钮点击
   */
  public handleJoinMeet() {
    $popup.popup({ width: "30%", height: "30%" }, { component: null, props: {} });
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
        await new Promise((resolve) => setTimeout(resolve, 100));
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
      // 清除存储的状态
      await $storage.remove("currentMeetingId");

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
      // 保存到存储，以便页面重新加载时恢复
      await $storage.set("currentMeetingId", meetId);
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
      $popup.alert("您当前正在参加其他会议，是否退出当前会议并进入新会议？", {
        buttonCount: 2,
        onBtnRight: async () => {
          // 确定：退出当前会议并进入新会议
          await this.exitAndEnterNewMeeting(meetId, topic);
        },
        onBtnLeft: () => {
          // 取消：无任何操作
        },
      });
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

    // 直接执行取消操作，不再弹出确认框
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
              // 清除存储的状态
              await $storage.remove("currentMeetingId");
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

  /**
   * 结束会议
   */
  public async handleConcludeMeet(meetId: string) {
    const meet = this.meetList.value.find((meet: MeetList) => meet.meetId === meetId);
    if (!meet) {
      return;
    }

    // 直接执行结束操作，不再弹出确认框
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
              // 清除存储的状态
              await $storage.remove("currentMeetingId");
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
    // 只有在待开始（Pending）状态时才显示取消按钮
    if (!meet || meet.status !== "Pending") {
      return false;
    }
    return this.userPermission.value === "CEO" || meet.organizer.id === this.userID.value;
  }

  /**
   * 复制会议信息到剪贴板（静默复制，不显示提示）
   */
  public copyMeetingInfo(meet: MeetList) {
    // 获取 web 端基础 URL
    const webBaseURL = import.meta.env.VITE_OZTF_WEB_BASE_URL;
    console.log(webBaseURL, "webBaseURL");
    const externalLink = `${webBaseURL}${meet.meetId}`;

    // 格式化开始时间
    const startTime = meet.startTime
      ? $date.format(meet.startTime, "YYYY-MM-DD HH:mm:ss")
      : "未设置";

    // 构建要复制的文本
    const text = `${$config.appName}邀请您参加会议\n会议名称：${meet.topic}\n会议号：${meet.meetId}\n会议开始时间：${startTime}\n会议时长：${meet.duration}分钟\n会议外部链接：${externalLink}`;

    // 复制到剪贴板（静默复制，不显示提示）
    navigator.clipboard
      .writeText(text)
      .then(() => {
        $message.success({
          message: "会议信息已复制到剪贴板",
        });
      })
      .catch((error: any) => {
        $message.error({
          message: "复制失败: " + (error?.message || "未知错误"),
        });
      });
  }
}

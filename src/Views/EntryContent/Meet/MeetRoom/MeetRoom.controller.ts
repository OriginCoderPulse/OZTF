import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import TRTCSDK from "trtc-sdk-v5";

interface Participant {
  participantId: string; // 内部参与人保留，用于获取姓名；外部参与人可能不存在
  trtcId: string; // TRTC 用户 ID，用于视频流标识
  name: string;
  occupation: string;
  device: string;
  joinTime: string;
  type: "inner" | "out";
}

export class MeetRoomController {
  public showParticipant = ref(false);
  public microphoneState = ref(false);
  public cameraState = ref(false);
  public canOpenMicrophone = ref(false);
  public participantList = ref<Participant[]>([]);
  public userId = ref<string>("");
  public screenShareState = ref(false);
  public canOpenCamera = ref(false);
  public canOpenScreenShare = ref(true);
  public networkState = ref("unknown");
  public isOrganizer = ref(false); // 是否是会议组织者
  public canCopyMeetProperties = ref(false); // 是否可以复制会议信息
  private canShowParticipant = ref(true);
  private _roomId = ref<number>(0);
  private _meetId = ref<string>("");
  private _organizerId = ref<string | null>(null); // 会议组织者ID
  // 会议信息
  private _meetingInfo = ref<{
    meetId: string;
    topic: string;
    startTime: string;
    duration: number;
  } | null>(null);
  // 跟踪每个参与人的视频流状态（使用 trtcId 作为 key）
  private _participantVideoStates = ref<Map<string, boolean>>(new Map());

  /**
   * 初始化会议房间 - 在组件挂载时调用
   */
  public async initRoom(meetId: string, roomId: number) {
    this._roomId.value = roomId;
    this._meetId.value = meetId;
    this.userId.value = await $storage.get("userID");
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
        $trtc
          .joinRoom(roomId)
          .then(async () => {
            // 添加内部参与人
            this.addInnerParticipant(meetId).then(() => {
              this.fetchRoomProperties(meetId).then(() => {
                const viewIdVideo = `${this.userId.value}_remote_video`;
                const viewScreen = `meet-video`;
                this.startRemoteVideoWithRetry(
                  this._roomId.value,
                  this.userId.value,
                  "main",
                  viewIdVideo,
                  0
                );
                this.startRemoteVideoWithRetry(
                  this._roomId.value,
                  this.userId.value,
                  "sub",
                  viewScreen,
                  0
                );
              });
            });

            $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.NETWORK_QUALITY, (event, room) => {
              console.log("网络质量:", event, room);
            });

            // 监听远端音频可用事件 - 当远端用户发布音频时触发
            $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_AUDIO_AVAILABLE, (event) => {
              // 取消静音，开始播放远端音频
              $trtc.muteRemoteAudio(roomId, event.userId, false).catch(() => {
                this.microphoneState.value = false;
              });
            });

            $trtc.listenRoomProperties(
              roomId,
              TRTCSDK.EVENT.REMOTE_VIDEO_AVAILABLE,
              ({ userId, streamType }) => {
                // 忽略自己的视频流
                if (userId === this.userId.value) {
                  return;
                }

                // 使用 TRTC userId 作为 trtcId（所有参与人都使用 trtcId）
                const trtcId = userId;

                if (streamType === TRTCSDK.TYPE.STREAM_TYPE_MAIN) {
                  // 设置该用户的视频流状态为可用（使用 trtcId）
                  this._participantVideoStates.value.set(trtcId, true);
                  // 使用 trtcId 作为 view id，确保与 DOM 中的 id 匹配
                  const viewId = `${trtcId}_remote_video`;
                  const normalizedStreamType = this.normalizeStreamType(streamType);

                  // 尝试启动远端视频，如果 DOM 元素不存在则重试（使用 TRTC userId）
                  this.startRemoteVideoWithRetry(roomId, userId, normalizedStreamType, viewId, 0);
                } else {
                  // 屏幕共享流（STREAM_TYPE_SUB）
                  // 打开屏幕共享后，摄像头继续发流，所以不关闭本地视频流
                  const viewId = `meet-video`;
                  const normalizedStreamType = this.normalizeStreamType(streamType);
                  this.startRemoteVideoWithRetry(roomId, userId, normalizedStreamType, viewId, 0);
                  this.canOpenScreenShare.value = false;
                }
              }
            );

            // 监听远端视频不可用事件 - 当远端用户关闭摄像头时触发
            $trtc.listenRoomProperties(
              roomId,
              TRTCSDK.EVENT.REMOTE_VIDEO_UNAVAILABLE,
              ({ userId, streamType }) => {
                // 忽略自己的视频流
                if (userId === this.userId.value) {
                  return;
                }

                if (streamType === TRTCSDK.TYPE.STREAM_TYPE_SUB) {
                  // 屏幕共享流停止
                  if (this.cameraState.value) {
                    // 如果摄像头状态是开着的：仅关闭屏幕共享流，在主视频页面打开本地视频流，远端的流也要继续发
                    const viewId = `meet-video`;
                    $trtc.openLocalVideo(roomId, viewId).catch(() => {
                      // 静默处理错误
                    });
                  } else {
                    // 如果摄像头状态是关的：主视频窗口什么都不显示，关闭本地视频流，远端视频流，共享屏幕流
                    $trtc.closeLocalVideo(roomId).catch(() => {
                      // 静默处理错误
                    });
                  }
                  this.canOpenScreenShare.value = true;
                } else {
                  // 使用 TRTC userId 作为 trtcId
                  const trtcId = userId;
                  // 设置该用户的视频流状态为不可用（使用 trtcId）
                  this._participantVideoStates.value.set(trtcId, false);
                }
              }
            );

            $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.SCREEN_SHARE_STOPPED, () => {
              // 关闭屏幕共享后
              if (this.cameraState.value) {
                // 如果摄像头状态是开着的：仅关闭屏幕共享流，在主视频页面打开本地视频流，远端的流也要继续发
                const viewId = `meet-video`;
                $trtc.openLocalVideo(roomId, viewId).catch(() => {
                  // 静默处理错误
                });
              } else {
                // 如果摄像头状态是关的：主视频窗口什么都不显示，关闭本地视频流，远端视频流，共享屏幕流
                $trtc.closeLocalVideo(roomId).catch(() => {
                  // 静默处理错误
                });
              }
              this.canOpenScreenShare.value = true;
            });

            // 监听远端用户进入房间事件
            $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_USER_ENTER, (event) => {
              // 忽略自己的事件
              if (event.userId === this.userId.value) {
                return;
              }

              // 取消静音，开始播放远端音频
              $trtc.muteRemoteAudio(roomId, event.userId, false).catch(() => {
                this.microphoneState.value = false;
              });

              // 主动订阅远端用户的视频流（刷新重进后，已存在的用户可能不会触发 REMOTE_VIDEO_AVAILABLE）
              const trtcId = event.userId;
              const viewId = `${trtcId}_remote_video`;
              // 尝试订阅主视频流
              this.startRemoteVideoWithRetry(roomId, event.userId, "main", viewId, 0);

              // 延迟一下再拉取，确保后端数据已更新
              setTimeout(() => {
                const meetId = this._meetId.value;
                if (meetId) {
                  this.fetchRoomProperties(meetId);
                }
              }, 500);
            });

            // 监听远端用户离开房间事件 - 清除状态
            $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_USER_EXIT, (event) => {
              // 使用 TRTC userId 作为 trtcId 清除状态
              const trtcId = event.userId;
              this._participantVideoStates.value.delete(trtcId);
              // 延迟一下再拉取，确保后端数据已更新
              setTimeout(() => {
                const meetId = this._meetId.value;
                if (meetId) {
                  this.fetchRoomProperties(meetId);
                }
              }, 500);
            });
          })
          .catch((error: any) => {
            console.error("加入房间失败:", error);
            // invoke("close_meeting_window")
          });
      }
    } catch (error: any) {
      console.error("初始化房间失败:", error);
      // invoke("close_meeting_window")
    }
  }

  /**
   * 添加内部参与人
   */
  private async addInnerParticipant(meetId: string) {
    try {
      const userID = await $storage.get("userID");
      if (!userID) {
        return;
      }

      // 获取设备信息（简化处理，app端可以标记为'app'）
      const device = "app";
      const joinTime = new Date().toISOString();

      // App 端：TRTC userId = 数据库用户 ID，作为 trtcId
      const trtcId = userID;

      $network.request("meetAddInnerParticipant", {
        meetId,
        participantId: userID,
        trtcId: trtcId,
        participantInfo: JSON.stringify({
          device,
          joinTime,
        }),
      });
    } catch (error: any) { }
  }

  /**
   * 获取会议属性和参会人（内部和外部）
   */
  public async fetchRoomProperties(meetId: string) {
    return new Promise<Participant[]>((resolve, reject) => {
      try {
        if (!meetId) {
          resolve([]);
          return;
        }
        // 重置复制状态
        this.canCopyMeetProperties.value = false;

        $network.request(
          "meetGetRoomProperties",
          { meetId },
          (data: any) => {
            try {
              // 保存会议信息
              this._meetingInfo.value = {
                meetId: data.meetId || "",
                topic: data.topic || "",
                startTime: data.startTime || "",
                duration: data.duration || 0,
              };

              // 保存组织者ID
              if (data.organizerId) {
                this._organizerId.value = data.organizerId;
              }

              // 判断是否是组织者（app端是内部用户，通过比较 userID 和 organizerId）
              if (this._organizerId.value && this.userId.value) {
                this.isOrganizer.value = this.userId.value === this._organizerId.value;
              } else {
                this.isOrganizer.value = false;
              }

              // 合并内部和外部参会人
              const allParticipants: Participant[] = [
                ...(data.innerParticipants || []),
                ...(data.outParticipants || []),
              ];
              // 确保使用新的数组引用，触发响应式更新
              this.participantList.value = [
                ...allParticipants.filter((item) => item.trtcId !== this.userId.value),
              ];
              if (this.canShowParticipant.value)
                this.showParticipant.value =
                  allParticipants.filter((item) => item.trtcId !== this.userId.value).length > 0;

              // 接口完成，允许复制
              this.canCopyMeetProperties.value = true;

              resolve(allParticipants);
            } catch (error: any) {
              reject(error);
            }
          },
          (error: any) => {
            reject(error);
          }
        );
      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * 将 streamType 转换为有效的字符串格式
   */
  private normalizeStreamType(streamType: any): string {
    if (typeof streamType === "string") {
      // 如果是字符串，检查是否为 'main' 或 'sub'
      return streamType === "sub" ? "sub" : "main";
    }
    // 如果是数字，0 或 falsy 值表示主视频流，其他值表示子视频流
    return streamType === 1 || streamType === "sub" ? "sub" : "main";
  }

  /**
   * 启动远端视频，如果 DOM 元素不存在则重试
   */
  private startRemoteVideoWithRetry(
    roomId: number,
    userId: string,
    streamType: string,
    viewId: string,
    retryCount: number,
    maxRetries: number = 5
  ) {
    // 忽略自己的视频流
    if (userId === this.userId.value) {
      return;
    }

    const element = document.getElementById(viewId);

    if (element) {
      // DOM 元素存在，启动远端视频
      $trtc.muteRemoteVideo(roomId, userId, streamType, viewId).catch((error: any) => {
        // 如果是"用户未发布流"的错误，静默处理（等待用户发布流）
        if (error?.message?.includes("does not publishing stream")) {
          return;
        }
      });
    } else {
      // DOM 元素不存在，延迟重试
      if (retryCount < maxRetries) {
        setTimeout(
          () => {
            this.startRemoteVideoWithRetry(
              roomId,
              userId,
              streamType,
              viewId,
              retryCount + 1,
              maxRetries
            );
          },
          200 * (retryCount + 1)
        ); // 递增延迟：200ms, 400ms, 600ms...
      }
    }
  }

  /**
   * 删除内部参与人
   */
  private async removeInnerParticipant(meetId: string): Promise<void> {
    try {
      const userID = await $storage.get("userID");
      if (!userID) {
        console.warn("无法删除内部参与人: userID 不存在");
        return;
      }

      // 使用 Promise 包装网络请求，确保等待完成
      await new Promise<void>((resolve, reject) => {
        $network.request(
          "meetRemoveInnerParticipant",
          {
            meetId,
            participantId: userID,
          },
          () => {
            console.log("成功删除内部参与人:", userID);
            resolve();
          },
          (error: any) => {
            console.error("删除内部参与人失败:", error);
            // 即使失败也继续，不阻塞退出流程
            resolve();
          }
        );
      });
    } catch (error: any) {
      console.error("删除内部参与人异常:", error);
    }
  }

  /**
   * 切换参与者显示
   */
  public toggleParticipant() {
    if (this.showParticipant.value) {
      this.canShowParticipant.value = false;
    } else {
      this.canShowParticipant.value = true;
    }
    this.showParticipant.value = !this.showParticipant.value;
  }

  /**
   * 切换麦克风状态
   */
  public toggleMicrophone() {
    this.microphoneState.value = !this.microphoneState.value;
    if (this.microphoneState.value) {
      $trtc.openLocalAudio(this._roomId.value).catch((error: any) => {
        $message.error({
          message: "开启麦克风失败: " + (error?.message || "未知错误"),
        });
      });
    } else {
      $trtc.closeLocalAudio(this._roomId.value).catch((error: any) => {
        $message.error({
          message: "关闭麦克风失败: " + (error?.message || "未知错误"),
        });
      });
    }
  }

  /**
   * 切换摄像头状态
   */
  public toggleCamera(view: string) {
    this.cameraState.value = !this.cameraState.value;
    if (this.cameraState.value) {
      // 使用 nextTick 确保 DOM 已更新
      setTimeout(() => {
        $trtc.openLocalVideo(this._roomId.value, view).catch((error: any) => {
          $message.error({
            message: "开启摄像头失败: " + (error?.message || "未知错误"),
          });
          // 如果失败，恢复状态
          this.cameraState.value = false;
        });
      }, 0);
    } else {
      // 关闭摄像头时，停止摄像头发流并关闭本地视频
      // 屏幕共享流是独立的，不会受到影响
      $trtc.closeLocalVideo(this._roomId.value).catch((error: any) => {
        $message.error({
          message: "关闭摄像头失败: " + (error?.message || "未知错误"),
        });
      });
    }
  }

  /**
   * 启动远端屏幕共享
   */
  public startRemoteScreen() {
    $trtc.startRemoteScreen(this._roomId.value).then(() => {
      this.screenShareState.value = true;
    });
  }

  /**
   * 停止远端屏幕共享
   */
  public stopRemoteScreen() {
    $trtc.stopRemoteScreen(this._roomId.value).then(() => {
      this.screenShareState.value = false;
    });
  }

  /**
   * 退出会议
   */
  private exitAction = async (roomId: number) => {
    try {
      // 删除内部参与人（确保在退出前完成）
      if (this._meetId.value) {
        await this.removeInnerParticipant(this._meetId.value);
      }

      // 退出 TRTC 房间
      await $trtc.exitRoom(roomId);

      // 关闭窗口，Rust 后端会自动发送 meet-exited 事件
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("close_meeting_window");
    } catch (error: any) {
      console.error("退出会议失败:", error);
      $message.error({
        message: "退出房间失败，请重试",
      });
    }
  };

  /**
   * 结束会议
   */
  public concludeMeeting = async (roomId: number) => {
    try {
      // 删除内部参与人（确保在结束前完成）
      if (this._meetId.value) {
        await this.removeInnerParticipant(this._meetId.value);
      }

      // 获取当前用户ID
      const userID = await $storage.get("userID");
      const data = new TextEncoder().encode("conclude").buffer;

      // 发送 TRTC 自定义消息（通知其他参会人会议已结束）
      $trtc.sendCustomMessage(roomId, 1, data);

      // 更新会议状态
      await new Promise<void>((resolve, reject) => {
        $network.request(
          "meetStatusChange",
          {
            meetId: this._meetId.value,
            status: "Concluded",
            userId: userID,
          },
          () => {
            resolve();
          },
          (error: any) => {
            console.error("结束会议接口调用失败:", error);
            // 即使失败也继续，但记录错误
            resolve();
          }
        );
      });

      // 退出房间
      await $trtc.exitRoom(roomId);

      // 关闭窗口（Rust 后端会自动发送 meet-exited 事件给主窗口）
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("close_meeting_window");
    } catch (error: any) {
      console.error("结束会议失败:", error);
    }
  };

  public exitMeeting(roomId: number) {
    if (this.isOrganizer.value) {
      // 组织者：显示"是否退出/结束会议"，两个按钮"结束会议"和"退出会议"，都执行退出会议
      $popup.alert("是否退出/结束会议", {
        buttonCount: 2,
        btnLeftText: "结束会议",
        btnRightText: "退出会议",
        onBtnLeft: () => this.concludeMeeting(roomId),
        onBtnRight: () => this.exitAction(roomId),
      });
    } else {
      // 非组织者：显示原来的弹框
      $popup.alert("确定要退出会议吗", {
        buttonCount: 2,
        onBtnRight: () => this.exitAction(roomId),
      });
    }
  }

  /**
   * 获取参与人的视频流状态（使用 trtcId）
   */
  public getParticipantVideoState(trtcId: string): boolean {
    return this._participantVideoStates.value.get(trtcId) ?? false;
  }

  /**
   * 复制会议信息到剪贴板
   */
  public copyMeetingInfo() {
    // 获取 web 端基础 URL（从环境变量或配置中获取，如果没有则使用默认值）
    const webBaseURL = $config.meetWebBaseURL;
    console.log(webBaseURL, "webBaseURL");
    const externalLink = `${webBaseURL}${this._meetId.value}`;

    // 格式化开始时间
    const startTime = this._meetingInfo.value?.startTime
      ? $date.format(this._meetingInfo.value?.startTime, "YYYY-MM-DD HH:mm:ss")
      : "未设置";

    // 构建要复制的文本
    const text = `${$config.appName}邀请您参加会议\n会议名称：${this._meetingInfo.value?.topic}\n会议号：${this._meetingInfo.value?.meetId}\n会议开始时间：${startTime}\n会议时长：${this._meetingInfo.value?.duration}分钟\n会议外部链接：${externalLink}`;

    // 复制到剪贴板
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

  /**
   * 清理资源（组件卸载时调用）
   */
  public async cleanup(meetId: string) {
    await this.removeInnerParticipant(meetId);
  }
}

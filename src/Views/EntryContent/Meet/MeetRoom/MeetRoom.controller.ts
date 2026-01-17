import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import TRTCSDK from "trtc-sdk-v5";

interface Participant {
  participantId: string;
  name: string;
  occupation: string;
  device: string;
  joinTime: string;
  type: 'inner' | 'out';
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
  private _roomId = ref<number>(0);
  private _meetId = ref<string>("");
  private _organizerId = ref<string | null>(null); // 会议组织者ID
  // 跟踪每个参与人的视频流状态（使用 participantId 作为 key）
  private _participantVideoStates = ref<Map<string, boolean>>(new Map());
  // TRTC userId 到 participantId 的映射（TRTC userId -> participantId）
  private _trtcUserIdToParticipantId = ref<Map<string, string>>(new Map());

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
        $trtc.joinRoom(roomId).then(async () => {
          // 添加内部参与人
          await this.addInnerParticipant(meetId);

          // 获取所有参会人（内部和外部）
          await this.fetchParticipants(meetId);

          // 建立 TRTC userId 到 participantId 的映射
          // App 端：TRTC userId = 数据库用户 ID，应该匹配内部参与人的 participantId
          this._trtcUserIdToParticipantId.value.set(this.userId.value, this.userId.value);
          // 对于其他参与人，在 REMOTE_USER_ENTER 事件中建立映射

          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.NETWORK_QUALITY, (event) => {
            console.log("网络质量:", event);
          });

          // 监听远端音频可用事件 - 当远端用户发布音频时触发
          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_AUDIO_AVAILABLE, (event) => {
            // 取消静音，开始播放远端音频
            $trtc.muteRemoteAudio(roomId, event.userId, false).catch(() => {
              this.microphoneState.value = false;
            });
          });

          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_VIDEO_AVAILABLE, ({ userId, streamType }) => {

            // 忽略自己的视频流
            if (userId === this.userId.value) {
              return;
            }

            // 查找对应的 participantId（如果映射不存在，使用 userId 作为 fallback）
            const participantId = this._trtcUserIdToParticipantId.value.get(userId) || userId;

            if(streamType === TRTCSDK.TYPE.STREAM_TYPE_MAIN) {
              // 设置该用户的视频流状态为可用（使用 participantId）
              this._participantVideoStates.value.set(participantId, true);
              // 使用 participantId 作为 view id，确保与 DOM 中的 id 匹配
              const viewId = `${participantId}_remote_video`;
              const normalizedStreamType = this.normalizeStreamType(streamType);

              // 尝试启动远端视频，如果 DOM 元素不存在则重试（使用 TRTC userId）
              this.startRemoteVideoWithRetry(roomId, userId, normalizedStreamType, viewId, 0);
            }else {
              $trtc.closeLocalVideo(roomId)
              const viewId = `meet-video`;
              const normalizedStreamType = this.normalizeStreamType(streamType);
              this.startRemoteVideoWithRetry(roomId, userId, normalizedStreamType, viewId, 0);  
              this.canOpenScreenShare.value = false;
            }
          });

          // 监听远端视频不可用事件 - 当远端用户关闭摄像头时触发
          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_VIDEO_UNAVAILABLE, ({ userId, streamType }) => {
            // 忽略自己的视频流
            if (userId === this.userId.value) {
              return;
            }
            
            if(streamType === TRTCSDK.TYPE.STREAM_TYPE_SUB) {
              const viewId = `meet-video`;
              $trtc.openLocalVideo(roomId, viewId);
              this.canOpenScreenShare.value = true;
            }else {
              // 查找对应的 participantId（如果映射不存在，使用 userId 作为 fallback）
              const participantId = this._trtcUserIdToParticipantId.value.get(userId) || userId;
              // 设置该用户的视频流状态为不可用（使用 participantId）
              this._participantVideoStates.value.set(participantId, false);
            }
          });

          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.SCREEN_SHARE_STOPPED, () => {
              const viewId = `meet-video`;
              $trtc.openLocalVideo(roomId, viewId);
              this.canOpenScreenShare.value = true;
          })

          // 监听远端用户进入房间事件
          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_USER_ENTER, (event) => {
            // 取消静音，开始播放远端音频
            $trtc.muteRemoteAudio(roomId, event.userId, false).catch(() => {
              this.microphoneState.value = false;
            });

            // 延迟一下再拉取，确保后端数据已更新
            setTimeout(() => {
              const meetId = this._meetId.value;
              if (meetId) {
                this.fetchParticipants(meetId).then(() => {
                  // 拉取参会人列表后，建立 TRTC userId 到 participantId 的映射
                  this.buildTrtcUserIdMapping(event.userId);
                })
              }
            }, 500);
          });

          // 监听远端用户离开房间事件 - 清除状态
          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_USER_EXIT, (event) => {
            // 查找对应的 participantId 并清除状态
            const participantId = this._trtcUserIdToParticipantId.value.get(event.userId) || event.userId;
            this._participantVideoStates.value.delete(participantId);
            this._trtcUserIdToParticipantId.value.delete(event.userId);
            // 延迟一下再拉取，确保后端数据已更新
            setTimeout(() => {
              const meetId = this._meetId.value;
              if (meetId) {
                this.fetchParticipants(meetId).catch(() => {
                });
              }
            }, 500);
          });
        }).catch((error: any) => {
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

      $network.request(
        "meetAddInnerParticipant",
        {
          meetId,
          participantId: userID,
          participantInfo: JSON.stringify({
            device,
            joinTime
          })
        }
      );
    } catch (error: any) {
    }
  }

  /**
   * 获取所有参会人（内部和外部）
   */
  public async fetchParticipants(meetId: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!meetId) {
          resolve();
          return;
        }
        $network.request(
          "meetGetParticipants",
          { meetId },
          (data: any) => {
            try {
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
                ...(data.outParticipants || [])
              ];
              // 确保使用新的数组引用，触发响应式更新
              this.participantList.value = [...allParticipants];
              this.showParticipant.value = allParticipants.length > 1;

              // 重新建立 TRTC userId 到 participantId 的映射
              this.buildTrtcUserIdMapping();

              resolve();
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
    if (typeof streamType === 'string') {
      // 如果是字符串，检查是否为 'main' 或 'sub'
      return streamType === 'sub' ? 'sub' : 'main';
    }
    // 如果是数字，0 或 falsy 值表示主视频流，其他值表示子视频流
    return streamType === 1 || streamType === 'sub' ? 'sub' : 'main';
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
        if (error?.message?.includes('does not publishing stream')) {
          return;
        }
      });
    } else {
      // DOM 元素不存在，延迟重试
      if (retryCount < maxRetries) {
        setTimeout(() => {
          this.startRemoteVideoWithRetry(roomId, userId, streamType, viewId, retryCount + 1, maxRetries);
        }, 200 * (retryCount + 1)); // 递增延迟：200ms, 400ms, 600ms...
      }
    }
  }

  /**
   * 删除内部参与人
   */
  private async removeInnerParticipant(meetId: string) {
    try {
      const userID = await $storage.get("userID");
      if (!userID) {
        return;
      }

      $network.request(
        "meetRemoveInnerParticipant",
        {
          meetId,
          participantId: userID
        }
      );
    } catch (error: any) {
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
    if (this.microphoneState.value) {
      $trtc.openLocalAudio(this._roomId.value).catch((error: any) => {
        $message.error({
          message: "开启麦克风失败: " + (error?.message || "未知错误"),
        });
      });
    }
    else {
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
    })
  }

  /**
   * 停止远端屏幕共享
   */
  public stopRemoteScreen() {
    $trtc.stopRemoteScreen(this._roomId.value).then(() => {
      this.screenShareState.value = false;
    })
  }

  /**
   * 退出会议
   */
  private exitAction = async (roomId: number) => {
    // 删除内部参与人
    if (this._meetId.value) {
      await this.removeInnerParticipant(this._meetId.value);
    }

    $trtc.exitRoom(roomId).then(async () => {
      // 关闭窗口，Rust 后端会自动发送 meet-exited 事件
      invoke("close_meeting_window")
    }).catch(() => {
      $message.error({
        message: "退出房间失败，请重试",
      });
    });
  };

  /**
   * 结束会议
   */
  public concludeMeeting = async (roomId: number) => {
    try {
      // 获取当前用户ID
      const userID = await $storage.get("userID");
      
      // 发送结束会议消息
      const data = new TextEncoder().encode('conclude').buffer;
      await $trtc.sendCustomMessage(roomId, 1, data);
      
      // 调用结束会议接口（需要传递 meetId, status, userId）
      $network.request("meetStatusChange", {
        meetId: this._meetId.value,
        status: "Concluded",
        userId: userID
      },
      async () => {
        // 退出房间并关闭会议窗口
        try {
          await $trtc.exitRoom(roomId);
          // 关闭窗口，Rust 后端会自动发送 meet-exited 事件
          await invoke("close_meeting_window");
        } catch (error: any) {
          $message.error({
            message: "退出房间失败，请重试",
          });
        }
      },
      (error: any) => {
        $message.error({
          message: "结束会议失败，请重试: " + (error?.message || "未知错误"),
        });
      });
    } catch (error: any) {
      $message.error({
        message: "结束会议失败，请重试: " + (error?.message || "未知错误"),
      });
    }
  };

  public exitMeeting(roomId: number) {
    if (this.isOrganizer.value) {
      // 组织者：显示"是否退出/结束会议"，两个按钮"结束会议"和"退出会议"，都执行退出会议
      $popup.alert("是否退出/结束会议", {
        buttonCount: 2,
        btnLeftText: "退出会议",
        btnRightText: "结束会议",
        onBtnLeft: () => this.exitAction(roomId),
        onBtnRight: () => this.concludeMeeting(roomId),
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
   * 建立 TRTC userId 到 participantId 的映射
   */
  private buildTrtcUserIdMapping(trtcUserId?: string) {
    // 遍历参会人列表，建立映射关系
    this.participantList.value.forEach(participant => {
      // 如果提供了 trtcUserId，只建立该用户的映射
      if (trtcUserId) {
        // 尝试匹配：TRTC userId 可能是数据库 ID 或生成的字符串
        // 对于内部参与人，participantId 是数据库 ID
        // 对于外部参与人，participantId 是生成的字符串
        if (participant.participantId === trtcUserId) {
          this._trtcUserIdToParticipantId.value.set(trtcUserId, participant.participantId);
        }
      } else {
        // 如果没有提供 trtcUserId，为所有参与人建立映射
        // 对于内部参与人，TRTC userId 应该等于 participantId（数据库 ID）
        if (participant.type === 'inner') {
          this._trtcUserIdToParticipantId.value.set(participant.participantId, participant.participantId);
        }
        // 对于外部参与人，需要等待 REMOTE_USER_ENTER 事件来建立映射
      }
    });
  }

  /**
   * 获取参与人的视频流状态
   */
  public getParticipantVideoState(participantId: string): boolean {
    return this._participantVideoStates.value.get(participantId) ?? false;
  }

  /**
   * 清理资源（组件卸载时调用）
   */
  public async cleanup(meetId: string) {
    await this.removeInnerParticipant(meetId);
  }
}

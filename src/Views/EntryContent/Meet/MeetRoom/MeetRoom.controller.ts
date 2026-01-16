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
  public showParticipant = ref(true);
  public microphoneState = ref(false);
  public cameraState = ref(false);
  public canOpenMicrophone = ref(false);
  public participantList = ref<Participant[]>([]);
  public userId = ref<string>("");
  public canOpenCamera = ref(false);
  private _roomId = ref<number>(0);
  private _meetId = ref<string>("");
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

          // 监听远端音频可用事件 - 当远端用户发布音频时触发
          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_AUDIO_AVAILABLE, (event) => {
            // 取消静音，开始播放远端音频
            $trtc.muteRemoteAudio(roomId, event.userId, false).catch(() => {
              this.microphoneState.value = false;
            });
          });

          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_VIDEO_AVAILABLE, ({ userId, streamType }) => {
            console.log("远端视频可用:", userId, streamType);

            // 忽略自己的视频流
            if (userId === this.userId.value) {
              console.log("忽略自己的视频流:", userId);
              return;
            }

            // 查找对应的 participantId（如果映射不存在，使用 userId 作为 fallback）
            const participantId = this._trtcUserIdToParticipantId.value.get(userId) || userId;
            console.log("TRTC userId:", userId, "映射到 participantId:", participantId);

            // 设置该用户的视频流状态为可用（使用 participantId）
            this._participantVideoStates.value.set(participantId, true);

            // 使用 participantId 作为 view id，确保与 DOM 中的 id 匹配
            const viewId = `${participantId}_remote_video`;
            const normalizedStreamType = this.normalizeStreamType(streamType);

            // 尝试启动远端视频，如果 DOM 元素不存在则重试（使用 TRTC userId）
            this.startRemoteVideoWithRetry(roomId, userId, normalizedStreamType, viewId, 0);
          });

          // 监听远端视频不可用事件 - 当远端用户关闭摄像头时触发
          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_VIDEO_UNAVAILABLE, ({ userId, streamType }) => {
            console.log("远端视频不可用:", userId, streamType);
            // 忽略自己的视频流
            if (userId === this.userId.value) {
              return;
            }
            // 查找对应的 participantId（如果映射不存在，使用 userId 作为 fallback）
            const participantId = this._trtcUserIdToParticipantId.value.get(userId) || userId;
            // 设置该用户的视频流状态为不可用（使用 participantId）
            this._participantVideoStates.value.set(participantId, false);
          });

          // 监听远端用户进入房间事件
          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_USER_ENTER, (event) => {
            console.log("远端用户进入房间:", event.userId);
            // 取消静音，开始播放远端音频
            $trtc.muteRemoteAudio(roomId, event.userId, false).catch(() => {
              this.microphoneState.value = false;
            });

            // 延迟一下再拉取，确保后端数据已更新
            setTimeout(() => {
              const meetId = this._meetId.value;
              if (meetId) {
                console.log("REMOTE_USER_ENTER: 开始重新拉取参会人数据");
                this.fetchParticipants(meetId).then(() => {
                  // 拉取参会人列表后，建立 TRTC userId 到 participantId 的映射
                  this.buildTrtcUserIdMapping(event.userId);
                }).catch((error) => {
                  console.error('重新拉取参会人数据失败:', error);
                });
              } else {
                console.warn("REMOTE_USER_ENTER: meetId 为空，无法拉取参会人数据");
              }
            }, 500);

            // 注意：不在这里启动远端视频，因为用户可能还没有发布视频流
            // 视频启动会在 REMOTE_VIDEO_AVAILABLE 事件中自动处理
          });

          // 监听远端用户离开房间事件 - 清除状态
          $trtc.listenRoomProperties(roomId, TRTCSDK.EVENT.REMOTE_USER_EXIT, (event) => {
            console.log("远端用户离开房间:", event.userId);
            // 查找对应的 participantId 并清除状态
            const participantId = this._trtcUserIdToParticipantId.value.get(event.userId) || event.userId;
            this._participantVideoStates.value.delete(participantId);
            this._trtcUserIdToParticipantId.value.delete(event.userId);
            // 延迟一下再拉取，确保后端数据已更新
            setTimeout(() => {
              const meetId = this._meetId.value;
              if (meetId) {
                console.log("REMOTE_USER_EXIT: 开始重新拉取参会人数据");
                this.fetchParticipants(meetId).catch((error) => {
                  console.error('重新拉取参会人数据失败:', error);
                });
              } else {
                console.warn("REMOTE_USER_EXIT: meetId 为空，无法拉取参会人数据");
              }
            }, 500);
          });
        }).catch(() => {
          invoke("close_meeting_window")
        });
      }
    } catch (error: any) {
      invoke("close_meeting_window")
    }
  }

  /**
   * 添加内部参与人
   */
  private async addInnerParticipant(meetId: string) {
    try {
      const userID = await $storage.get("userID");
      if (!userID) {
        console.warn("无法获取用户ID，跳过添加内部参与人");
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
        },
        () => {
          console.log("添加内部参与人成功");
        },
        (error: any) => {
          console.error("添加内部参与人失败:", error);
        }
      );
    } catch (error: any) {
      console.error("添加内部参与人异常:", error);
    }
  }

  /**
   * 获取所有参会人（内部和外部）
   */
  public async fetchParticipants(meetId: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!meetId) {
          console.warn("fetchParticipants: meetId 为空，跳过拉取");
          resolve();
          return;
        }
        console.log("开始拉取参会人数据, meetId:", meetId);
        $network.request(
          "meetGetParticipants",
          { meetId },
          (data: any) => {
            try {
              // 合并内部和外部参会人
              const allParticipants: Participant[] = [
                ...(data.innerParticipants || []),
                ...(data.outParticipants || [])
              ];
              // 确保使用新的数组引用，触发响应式更新
              this.participantList.value = [...allParticipants];
              console.log("获取参会人列表成功，数量:", allParticipants.length, allParticipants);

              // 重新建立 TRTC userId 到 participantId 的映射
              this.buildTrtcUserIdMapping();

              resolve();
            } catch (error: any) {
              console.error("处理参会人数据失败:", error);
              reject(error);
            }
          },
          (error: any) => {
            console.error("获取参会人列表失败:", error);
            reject(error);
          }
        );
      } catch (error: any) {
        console.error("获取参会人列表异常:", error);
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
      console.log("忽略自己的视频流:", userId);
      return;
    }

    const element = document.getElementById(viewId);
    if (element) {
      // DOM 元素存在，启动远端视频
      $trtc.muteRemoteVideo(roomId, userId, streamType, viewId).catch((error: any) => {
        // 如果是"用户未发布流"的错误，静默处理（等待用户发布流）
        if (error?.message?.includes('does not publishing stream')) {
          console.log(`用户 [${userId}] 尚未发布视频流，等待 REMOTE_VIDEO_AVAILABLE 事件`);
          return;
        }
        console.error(`启动远端视频失败 [${userId}]:`, error);
      });
    } else {
      // DOM 元素不存在，延迟重试
      if (retryCount < maxRetries) {
        console.warn(`视频容器元素不存在: ${viewId}，${200 * (retryCount + 1)}ms 后重试 (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          this.startRemoteVideoWithRetry(roomId, userId, streamType, viewId, retryCount + 1, maxRetries);
        }, 200 * (retryCount + 1)); // 递增延迟：200ms, 400ms, 600ms...
      } else {
        console.error(`视频容器元素不存在: ${viewId}，已达到最大重试次数`);
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
        console.warn("无法获取用户ID，跳过删除内部参与人");
        return;
      }

      $network.request(
        "meetRemoveInnerParticipant",
        {
          meetId,
          participantId: userID
        },
        () => {
          console.log("删除内部参与人成功");
        },
        (error: any) => {
          console.error("删除内部参与人失败:", error);
        }
      );
    } catch (error: any) {
      console.error("删除内部参与人异常:", error);
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
        console.error("开启麦克风失败:", error);
        $message.error({
          message: "开启麦克风失败: " + (error?.message || "未知错误"),
        });
      });
    }
    else {
      $trtc.closeLocalAudio(this._roomId.value).catch((error: any) => {
        console.error("关闭麦克风失败:", error);
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
          console.error("开启摄像头失败:", error);
          $message.error({
            message: "开启摄像头失败: " + (error?.message || "未知错误"),
          });
          // 如果失败，恢复状态
          this.cameraState.value = false;
        });
      }, 0);
    } else {
      $trtc.closeLocalVideo(this._roomId.value).catch((error: any) => {
        console.error("关闭摄像头失败:", error);
        $message.error({
          message: "关闭摄像头失败: " + (error?.message || "未知错误"),
        });
      });
    }
  }

  /**
   * 退出会议
   */
  public exitMeeting(roomId: number) {
    $popup.alert("确定要退出会议吗", async () => {
      // 删除内部参与人
      if (this._meetId.value) {
        await this.removeInnerParticipant(this._meetId.value);
      }

      $trtc.exitRoom(roomId).then(() => {
        invoke("close_meeting_window")
      }).catch(() => {
        $message.error({
          message: "退出房间失败，请重试",
        });
      });
    });
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
          console.log("建立映射:", trtcUserId, "->", participant.participantId);
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

import TRTCSDK, { TRTCEventTypes } from "trtc-sdk-v5";

class TRTC {
  private _sdkAppId: number = Number(import.meta.env.VITE_TRTC_APP_ID);
  private _userId: string = "";
  private _userSig: string = "";
  private _sdkSecretKey: string = import.meta.env.VITE_TRTC_SECRET_KEY;
  private _rooms: Map<number, TRTCSDK> = new Map();
  private _initialized: boolean = false;

  constructor() {
    // 不在构造函数中初始化，改为懒加载
  }

  /**
   * 懒加载初始化，只在第一次使用时调用
   */
  private async ensureInitialized() {
    this._userId = await $storage.get("userID");
    return new Promise<void>((resolve) => {
      if (this._initialized) {
        resolve();
      } else {
        const result = $libGenerateTestUserSig.genTestUserSig(
          this._sdkAppId,
          this._userId,
          this._sdkSecretKey,
        );
        if (result.sdkAppId) this._sdkAppId = result.sdkAppId;
        if (result.userSig) this._userSig = result.userSig;
        this._initialized = true;
        resolve();
      }
    })
  }

  /**
   * 检查媒体设备是否可用
   */
  private checkMediaDevicesSupport(): boolean {
    return (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices !== undefined &&
      navigator.mediaDevices.getUserMedia !== undefined
    );
  }

  /**
   * 实际请求媒体设备权限
   */
  private async requestMediaPermissions(): Promise<{ audio: boolean, video: boolean }> {
    if (!this.checkMediaDevicesSupport()) {
      return { audio: false, video: false };
    }

    try {
      // 请求音频和视频权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      });

      // 获取权限状态
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      const audioGranted = audioTracks.length > 0 && audioTracks[0].readyState === 'live';
      const videoGranted = videoTracks.length > 0 && videoTracks[0].readyState === 'live';

      // 停止流以释放资源
      stream.getTracks().forEach(track => track.stop());

      return { audio: audioGranted, video: videoGranted };
    } catch (error: any) {
      console.error("请求媒体权限失败:", error);
      // 如果用户拒绝权限，返回 false
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return { audio: false, video: false };
      }
      // 其他错误（如设备不存在）也返回 false
      return { audio: false, video: false };
    }
  }

  createTRTC(roomId: number): Promise<{ audio: boolean, video: boolean, status: boolean }> {
    return this.ensureInitialized().then(async () => {
      return new Promise<{ audio: boolean, video: boolean, status: boolean }>(async (resolve, reject) => {
        console.log("createTRTC", this._initialized, this._userSig);
        if (!this._initialized || !this._userSig) {
          reject();
          return;
        }

        try {
          const room = TRTCSDK.create();
          this._rooms.set(roomId, room);
          console.log("createRoom", this._rooms, room);

          // 实际请求权限
          const permissions = await this.requestMediaPermissions();
          resolve({
            audio: permissions.audio,
            video: permissions.video,
            status: true
          });
        } catch (error: any) {
          console.error("创建TRTC房间失败:", error);
          resolve({ audio: false, video: false, status: false });
        }

      });
    })
  }

  joinRoom(roomId: number): Promise<void> {
    return this.ensureInitialized().then(() => {
      return this._joinRoomInternal(roomId);
    })
  }

  closeRoom(roomId: number) {
    this._rooms.delete(roomId);
  }

  /**
   * 检查房间是否存在
   */
  hasRoom(roomId: number): boolean {
    return this._rooms.has(roomId);
  }

  exitRoom(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    console.log("exitRoom", room, this._rooms);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.exitRoom().then(() => {
      room.destroy();
      this._rooms.delete(roomId);
    }) as Promise<void>;
  }

  openLocalAudio(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.startLocalAudio() as Promise<void>;
  }

  closeLocalAudio(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.stopLocalAudio() as Promise<void>;
  }

  openLocalVideo(roomId: number, view: string): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }

    // 检查 DOM 元素是否存在
    const element = document.getElementById(view) || document.querySelector(`.${view}`);
    if (!element) {
      return Promise.reject(new Error(`View element '${view}' not found in document`));
    }

    console.log(view)

    return room.startLocalVideo({ view }) as Promise<void>;
  }

  closeLocalVideo(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.stopLocalVideo() as Promise<void>;
  }

  muteRemoteAudio(roomId: number, userId: string, mute: boolean): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.muteRemoteAudio(userId, mute) as Promise<void>;
  }

  muteRemoteVideo(roomId: number, userId: string, streamType: string | number, view: string): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.startRemoteVideo({ userId, streamType: streamType as any, view }) as Promise<void>;
  }

  startRemoteScreen(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.startScreenShare({
      option: {
        profile: {
          width: 1920,
          height: 1080,
          frameRate: 60,
          bitrate: 10000
        }, fillMode: 'cover'
      }
    }) as Promise<void>;
  }

  stopRemoteScreen(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.stopScreenShare() as Promise<void>;
  }

  listenRoomProperties(roomId: number, event: keyof TRTCEventTypes, callback: (event: any, room: TRTCSDK) => void) {
    this._rooms.get(roomId)?.on(event, ((...args: any[]) => {
      callback(args[0], this._rooms.get(roomId) as TRTCSDK);
    }) as any)
  }

  private _joinRoomInternal(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      $message.error({
        message: `Room ${roomId} does not exist`,
      });
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.enterRoom({
      sdkAppId: this._sdkAppId,
      userId: this._userId,
      userSig: this._userSig,
      roomId,
    }) as Promise<void>;
  }

  sendCustomMessage(roomId: number, cmdId: number, data: ArrayBuffer): Promise<unknown> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.sendCustomMessage({cmdId, data}) as unknown as Promise<void>;
  }
}

export default {
  install(app: any) {
    app.config.globalProperties.$trtc = new TRTC();
    window.$trtc = new TRTC();
  },
};

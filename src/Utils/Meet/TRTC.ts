import TRTCSDK from "trtc-sdk-v5";

class TRTC {
  private _sdkAppId: number = 1600122280;
  private _userId: string = "12345";
  private _userSig: string = "";
  private _sdkSecretKey: string = "948f12efcbce9604a29648ed4b0d35441f247457501e77b54b410813e1d7aae9";
  private _rooms: Map<string, TRTCSDK> = new Map();
  private _initialized: boolean = false;

  constructor() {
    // 不在构造函数中初始化，改为懒加载
  }

  /**
   * 懒加载初始化，只在第一次使用时调用
   */
  private ensureInitialized() {
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

  createRoom(roomId: string): Promise<{audio:boolean, video:boolean,status:boolean}> {
    return this.ensureInitialized().then(() => {
      return new Promise<{audio:boolean, video:boolean,status:boolean}>((resolve, reject) => {
        if (!this._initialized || !this._userSig) {
          reject();
        }
        if (!this.checkMediaDevicesSupport()) {
          resolve({audio:false, video:false, status:false});
        }else {
          try {
            const room = TRTCSDK.create();
            this._rooms.set(roomId, room);
            resolve({audio:true, video:true, status:true});
          } catch (error: any) {
            resolve({audio:true, video:true, status:false});
          }
        }
      });
    })
  }

  joinRoom(roomId: string): Promise<void> {
    // 懒加载初始化
    return this.ensureInitialized().then(() => {
      return this._joinRoomInternal(roomId);
    })
  }

  private _joinRoomInternal(roomId: string): Promise<void> {
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
      roomId: Number(roomId),
    }) as Promise<void>;
  }

  leaveRoom(roomId: string): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.exitRoom() as Promise<void>;
  }
}

export default {
  install(app: any) {
    app.config.globalProperties.$trtc = new TRTC();
    window.$trtc = new TRTC();
  },
};

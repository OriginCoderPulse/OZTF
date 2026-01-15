import TRTCSDK, { TRTCEventTypes } from "trtc-sdk-v5";

class TRTC {
  private _sdkAppId: number = 1600122280;
  private _userId: string = "12345";
  private _userSig: string = "";
  private _sdkSecretKey: string = "948f12efcbce9604a29648ed4b0d35441f247457501e77b54b410813e1d7aae9";
  private _rooms: Map<number, TRTCSDK> = new Map();
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

  createRoom(roomId: number): Promise<{audio:boolean, video:boolean,status:boolean}> {
    return this.ensureInitialized().then(() => {
      return new Promise<{audio:boolean, video:boolean,status:boolean}>((resolve, reject) => {
        if (!this._initialized || !this._userSig) {
          reject();
        }
        // 验证 roomId 范围
        if (roomId < 1 || roomId > 4294967294) {
          reject(new Error(`Room ID must be between 1 and 4294967294, got ${roomId}`));
          return;
        }
        try {
          const room = TRTCSDK.create();
          this._rooms.set(roomId, room);
          console.log("createRoom", this._rooms, room);
          if (!this.checkMediaDevicesSupport()) {
            resolve({audio:false, video:false, status:true});
          }else {
            resolve({audio:true, video:true, status:true});
          }
        } catch (error: any) {
          resolve({audio:true, video:true, status:false});
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

  exitRoom(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    console.log("exitRoom",room,this._rooms);
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
    return room.startLocalVideo({ view }) as Promise<void>;
  }

  closeLocalVideo(roomId: number): Promise<void> {
    const room = this._rooms.get(roomId);
    if (!room) {
      return Promise.reject(new Error(`Room ${roomId} does not exist`));
    }
    return room.stopLocalVideo() as Promise<void>;
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
}

export default {
  install(app: any) {
    app.config.globalProperties.$trtc = new TRTC();
    window.$trtc = new TRTC();
  },
};

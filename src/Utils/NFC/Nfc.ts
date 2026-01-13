import { ref, nextTick } from "vue";
import { listen } from "@tauri-apps/api/event";
import tauriOptimizer from "./TauriOptimizer";

interface NfcCardData {
  uid: string;
  left?: boolean; // 标记卡片是否离开
}

interface ReaderStatus {
  connected: boolean;
  reader_name?: string;
}

// 卡片识别回调类型
type CardDetectedCallback = (cardInfo: NfcCardData) => void;

class Nfc {
  private _monitoringActive = ref(false);
  private _readerConnected = ref(false);
  private _cardPresent = ref(false);
  private _cardData = ref<NfcCardData | null>(null);
  private _readerName = ref("");
  private _eventUnlisteners: (() => void)[] = [];
  private _readerCheckClear: (() => void) | null = null;
  private _lastReaderState = false;
  private _lastCardState = false;
  private _isProcessingCard = false;
  private _cardWasRemoved = false; // 卡片是否曾经离开过
  private _hasProcessedFirstCard = false; // 是否已经处理过第一张卡片
  private _pendingCardData: NfcCardData | null = null; // 等待处理的卡片数据
  private _cardDetectedCallbacks: CardDetectedCallback[] = []; // 卡片识别回调函数列表

  get monitoringActive() {
    return this._monitoringActive;
  }

  get readerConnected() {
    return this._readerConnected;
  }

  get cardPresent() {
    return this._cardPresent;
  }

  get cardData() {
    return this._cardData;
  }

  get readerName() {
    return this._readerName;
  }

  // 注册卡片识别回调函数
  onCardDetected(callback: CardDetectedCallback): void {
    this._cardDetectedCallbacks.push(callback);

    // 处理任何待处理的卡片数据
    if (this._pendingCardData) {
      // 延迟执行，确保回调函数完全注册
      nextTick().then(() => {
        const pendingData = this._pendingCardData!;
        this._pendingCardData = null; // 清除待处理数据
        this._initData(pendingData).catch(() => {});
      });
    }
  }

  // 移除卡片识别回调函数
  offCardDetected(callback: CardDetectedCallback): void {
    const index = this._cardDetectedCallbacks.indexOf(callback);
    if (index > -1) {
      this._cardDetectedCallbacks.splice(index, 1);
    }
  }

  private _debouncedReaderStateUpdate = $hfc.debounce(
    async (newState: boolean) => {
      if (this._lastReaderState !== newState) {
        this._lastReaderState = newState;
        await nextTick();
        this._readerConnected.value = newState;

        if (!newState) {
          await nextTick();
          this._cardPresent.value = false;
          this._cardData.value = null;
          this._readerName.value = "";
          $popup.closeAll();
          this._isProcessingCard = false;

          try {
            await $storage.remove("userID");
            await $storage.remove("permission");
          } catch (error) {
            // 清除存储数据失败
          }
        }
      }
    },
    50,
  );

  private _debouncedCardStateUpdate = $hfc.debounce(
    async (newState: boolean) => {
      if (this._lastCardState !== newState) {
        this._lastCardState = newState;
        await nextTick();
        this._cardPresent.value = newState;

        if (!newState) {
          // 卡片被拿起，清除所有状态
          await nextTick();
          this._cardData.value = null;
          $popup.closeAll();
          this._isProcessingCard = false;

          // 卡片已离开，标记为离开状态
          this._cardWasRemoved = true;

          // 触发卡片离开事件，清除tabList数据
          this._cardDetectedCallbacks.forEach((callback) => {
            try {
              // 发送一个特殊的离开事件
              callback({ uid: "", left: true });
            } catch (error) {
              // 忽略回调错误
            }
          });

          try {
            await $storage.remove("userID");
            await $storage.remove("permission");
          } catch (error) {
            // 清除存储数据失败
          }
        }
      }
    },
    50,
  );

  private _setCardFailed(): void {
    // 简化失败处理逻辑
    setTimeout(() => {
      // 失败状态自动重置
    }, 3000);
  }

  private async _cleanupEventListeners(): Promise<void> {
    this._eventUnlisteners.forEach((unlisten) => {
      try {
        unlisten();
      } catch (error) {}
    });
    this._eventUnlisteners = [];
    await nextTick();
    this._monitoringActive.value = false;
  }

  private async _initData(cardInfo: NfcCardData): Promise<void> {
    // 如果正在处理卡片，跳过
    if (this._isProcessingCard) {
      return;
    }

    // 如果已经处理过第一张卡片且卡片没有离开过，跳过（防止同一张卡片一直触发）
    if (this._hasProcessedFirstCard && !this._cardWasRemoved) {
      return;
    }

    this._isProcessingCard = true;

    // 如果是第一次处理卡片
    if (!this._hasProcessedFirstCard) {
      this._hasProcessedFirstCard = true;
    } else {
      // 如果不是第一次，重置离开状态
      this._cardWasRemoved = false;
    }

    const safetyTimer = setTimeout(() => {
      if (this._isProcessingCard) {
        this._isProcessingCard = false;
      }
    }, 4000);

    try {
      // 触发卡片识别回调函数
      this._cardDetectedCallbacks.forEach((callback) => {
        try {
          callback(cardInfo);
        } catch (error) {
          // 忽略回调错误
        }
      });
    } catch (error) {
      this._setCardFailed();
    } finally {
      clearTimeout(safetyTimer);
      this._isProcessingCard = false;
    }
  }

  async startMonitoring(forceRestart = false): Promise<void> {
    try {
      if (this._monitoringActive.value && !forceRestart) {
        return;
      }

      await this._cleanupEventListeners();

      await tauriOptimizer.invokeCommand("start_nfc_monitoring");
      await nextTick();
      this._monitoringActive.value = true;

      const unlisten1 = await listen<boolean>(
        "reader_status_change",
        (event) => {
          this._debouncedReaderStateUpdate(event.payload);
        },
      );

      const unlisten2 = await listen<boolean>("card_status_change", (event) => {
        this._debouncedCardStateUpdate(event.payload);
      });

      const unlisten3 = await listen<NfcCardData>(
        "card_data_received",
        async (event) => {
          // 保存卡片数据，但不立即处理
          await nextTick();
          this._cardData.value = event.payload;

          // 如果已经有回调函数注册，立即处理
          if (this._cardDetectedCallbacks.length > 0) {
            this._initData(event.payload).catch(() => {});
          } else {
            // 否则保存为待处理数据
            this._pendingCardData = event.payload;
          }
        },
      );

      this._eventUnlisteners = [unlisten1, unlisten2, unlisten3];

      // 移除定期重启定时器，避免重复触发卡片处理
    } catch (error) {
      $message?.error?.({ message: `启动NFC监控失败: ${error}` });
    }
  }

  async checkReaderConnection(): Promise<ReaderStatus> {
    try {
      // 使用优化器调用，避免阻塞
      const status: ReaderStatus =
        await tauriOptimizer.invokeCommand<ReaderStatus>(
          "check_reader_connection",
        );
      await nextTick();
      this._readerConnected.value = status.connected;
      this._readerName.value = status.reader_name || "";
      return status;
    } catch (error) {
      await nextTick();
      this._readerConnected.value = false;
      this._readerName.value = "";
      return { connected: false, reader_name: undefined };
    }
  }

  private _startReaderStatusCheck(): void {
    if (this._readerCheckClear) {
      this._readerCheckClear();
    }

    const throttledCheck = $hfc.throttle(async () => {
      if (!this._readerConnected.value) {
        await this.checkReaderConnection();
        if (this._readerConnected.value) {
          await this.startMonitoring(true);
          if (this._readerCheckClear) {
            this._readerCheckClear();
            this._readerCheckClear = null;
          }
        }
      }
    }, 2000);

    const interval = setInterval(throttledCheck, 2000);
    this._readerCheckClear = () => clearInterval(interval);
  }

  async stopMonitoring(): Promise<void> {
    try {
      await tauriOptimizer.invokeCommand("stop_nfc_monitoring");
      await nextTick();
      this._monitoringActive.value = false;
    } catch (error) {
      // 停止NFC监控失败
    }
  }

  async initialize(forceRestart = false): Promise<void> {
    try {
      // 如果是强制重启，先停止现有监控
      if (forceRestart && this._monitoringActive.value) {
        await this.stopMonitoring();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒确保完全停止
      }

      // 检查读卡器连接状态
      const readerStatus = await this.checkReaderConnection();

      if (readerStatus.connected) {
        await this.startMonitoring(forceRestart);

        await new Promise((resolve) => setTimeout(resolve, 500));

        if (this._cardData.value) {
          await nextTick();
          this._cardPresent.value = true;
        } else {
          $popup.closeAll();
        }
      } else {
        this._startReaderStatusCheck();
      }
    } catch (error) {
      $message?.error?.({ message: `NFC初始化失败: ${error}` });
      this._startReaderStatusCheck();
    }
  }

  async cleanup(): Promise<void> {
    await this._cleanupEventListeners();

    if (this._readerCheckClear) {
      this._readerCheckClear();
      this._readerCheckClear = null;
    }

    // 取消所有正在执行的Tauri命令
    tauriOptimizer.cancelAllCommands();

    // 清理相关状态
    this._cardWasRemoved = false;
    this._hasProcessedFirstCard = false;
    this._pendingCardData = null;

    if (this._monitoringActive.value) {
      this.stopMonitoring().then();
    }
  }
}

export default {
  install(app: any) {
    app.config.globalProperties.$nfc = new Nfc();
    window.$nfc = new Nfc();
  },
};

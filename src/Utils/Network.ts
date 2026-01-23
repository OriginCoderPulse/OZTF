import axios, { AxiosInstance, AxiosError } from "axios";

interface RequestConfig {
  urlKey: string;
  params: Object;
  successCallback?: (data: any) => void;
  failCallback?: (error: any) => void;
}

interface RetryConfig {
  isRetry: boolean;
  count: number;
  maxRetries: number;
}

class Network {
  private _instance: AxiosInstance | null = null;
  private _baseURL = "http://localhost:1024/oztf/api/v1/";
  private _timeout = 2500;
  private _isRequestReady = false;
  private _maxRetryRequestMap = new Map<string, RetryConfig>();
  private _requestMap = new Map<string, RequestConfig>();
  private _failedRequests = new Set<string>();
  private _isRetryDialogShown = false;
  // 可重试的错误类型
  private _RETRYABLE_ERRORS = new Set([
    // 网络相关错误
    "ECONNREFUSED",
    "ENOTFOUND",
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNABORTED",
    // HTTP状态码
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
    // 业务错误码（需要重试的）
    "1024-D01", // System busy: Try again later
    "1024-D02", // Quota exceeded: API rate limit reached
    "1024-G01", // Request timeout: Backend processing delayed
    "1024-G02", // Service overloaded: Queue capacity full
  ]);

  private _SERVICE_ERROR_CODES = {
    "1024-B01": "Authentication failed: Invalid or expired token",
    "1024-B02": "Access denied: IP blocked or unauthorized",
    "1024-C01": "Invalid request data: Field validation failed",
    "1024-C02": "The application crashed due to a database connection exception",
    "1024-D01": "System busy: Try again later",
    "1024-D02": "Quota exceeded: API rate limit reached",
    "1024-E01": "Network error: Backend service unavailable",
    "1024-E02": "DNS resolution failed: Invalid domain configuration",
    "1024-F01": "Decryption error: Invalid ciphertext or key",
    "1024-F02": "Invalid signature: Request tampering detected",
    "1024-G01": "Request timeout: Backend processing delayed",
    "1024-G02": "Service overloaded: Queue capacity full",
    "1024-H01": "License expired: Renew service subscription",
    "1024-H02": "Deprecated API version: Upgrade client",
    "1024-I01": "Automated traffic blocked: Robot detection triggered",
    "1024-I02": "CAPTCHA required: Human verification needed",
    "1024-J01": "Unsupported language: Modify Accept-Language header",
    "1024-J02": "Geo blocked: Service unavailable in your region",
  };

  constructor() {
    this._init();
    // 添加页面卸载时的清理
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this._cleanup();
      });
    }
  }

  // 公共清理方法
  public cleanup() {
    this._cleanup();
  }

  private _init() {
    try {
      this._instance = axios.create({
        baseURL: this._baseURL,
        timeout: this._timeout,
      });

      this._instance.interceptors.request.use(
        (config) => {
          return config;
        },
        (error) => {
          Promise.reject().then(error);
        }
      );

      this._instance.interceptors.response.use((response) => {
        return response.data;
      });

      this._isRequestReady = true;
    } catch (err) {
      this._isRequestReady = false;
    }
  }

  request(
    urlKey: string,
    params: Object = {},
    successCallback?: (data: any) => void,
    failCallback?: (error: any) => void
  ) {
    if (!this._isRequestReady) {
      return failCallback?.("Request Plugin Is Not Installed !");
    }

    this._initRetryConfig(urlKey);
    this._executeRequest(urlKey, params, successCallback, failCallback);
  }

  batchRequest(requests: RequestConfig[]): Promise<PromiseSettledResult<any>[]> {
    if (!this._isRequestReady) {
      requests.forEach((req) => req.failCallback?.("Request Plugin Is Not Installed !"));
      return Promise.resolve([]);
    }

    // 重置状态，确保批量请求的干净开始
    this._failedRequests.clear();
    this._isRetryDialogShown = false;

    // 初始化所有请求的重试配置
    requests.forEach((req) => {
      if (req.urlKey) {
        this._initRetryConfig(req.urlKey);
      }
    });

    const promises = requests.map((req) =>
      this._executeRequestPromise(req.urlKey, req.params, req.successCallback, req.failCallback)
    );

    return Promise.allSettled(promises);
  }

  private _initRetryConfig(urlKey: string) {
    const urlConfig = $config.urls[urlKey];
    if (!urlConfig) {
      return; // 如果配置不存在，跳过重试配置
    }
    if (urlConfig.retry && !this._maxRetryRequestMap.has(urlKey)) {
      this._maxRetryRequestMap.set(urlKey, {
        isRetry: false,
        count: 0,
        maxRetries: 5,
      });
    }
  }

  private _executeRequest(
    urlKey: string,
    params: Object = {},
    successCallback?: (data: any) => void,
    failCallback?: (error: any) => void
  ) {
    this._requestMap.set(urlKey, {
      urlKey,
      params,
      successCallback,
      failCallback,
    });

    const urlConfig = $config.urls[urlKey];

    if (!urlConfig) {
      const errorMessage = `API配置不存在: ${urlKey}`;
      failCallback?.(errorMessage);
      return;
    }

    this._instance
      ?.request({
        url: urlConfig.path.join("/"),
        method: urlConfig.method,
        [urlConfig.method.toLowerCase() === "get" ? "params" : "data"]: params,
      })
      .then((responseData: any) => {
        const { meta, data } = responseData;

        // 成功时重置重试配置
        this._maxRetryRequestMap.set(urlKey, {
          isRetry: false,
          count: 0,
          maxRetries: 5,
        });

        // 从失败请求集合中移除
        this._failedRequests.delete(urlKey);

        if (meta && meta.code === "1024-S200") {
          successCallback?.(data);
        } else {
          // 根据错误码判断是否需要重试
          const errorMessage =
            this._SERVICE_ERROR_CODES[meta.code as keyof typeof this._SERVICE_ERROR_CODES] ||
            meta.message;
          const shouldRetry = this._RETRYABLE_ERRORS.has(meta.code);

          if (shouldRetry) {
            // 可重试的错误，进行重试
            this._handleRequestError(urlKey, params, errorMessage, successCallback, failCallback);
          } else {
            // 不可重试的业务错误，直接失败
            failCallback?.(errorMessage);
          }
        }
      })
      .catch((axiosError: AxiosError) => {
        const errorMessage = this._getErrorMessage(axiosError);
        const isNetworkError = this._isNetworkError(axiosError);

        if (isNetworkError) {
          // 网络错误，进行重试
          this._handleRequestError(urlKey, params, errorMessage, successCallback, failCallback);
        } else {
          // 非网络错误（如HTTP状态码错误），直接失败
          failCallback?.(errorMessage);
        }
      });
  }

  private _executeRequestPromise(
    urlKey: string,
    params: Object = {},
    successCallback?: (data: any) => void,
    failCallback?: (error: any) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this._executeRequest(
        urlKey,
        params,
        (data) => {
          successCallback?.(data);
          resolve(data);
        },
        (error) => {
          failCallback?.(error);
          reject(error);
        }
      );
    });
  }

  private _handleRequestError(
    urlKey: string,
    params: Object,
    errorMessage: string,
    successCallback?: (data: any) => void,
    failCallback?: (error: any) => void
  ) {
    const urlConfig = $config.urls[urlKey];

    if (!urlConfig || !urlConfig.retry) {
      failCallback?.(errorMessage);
      return;
    }

    const retryConfig = this._maxRetryRequestMap.get(urlKey);
    if (!retryConfig) {
      // 如果没有重试配置，直接失败
      failCallback?.(errorMessage);
      return;
    }

    // 如果正在重试中，跳过重复重试
    if (retryConfig.isRetry) {
      return;
    }

    // 增加重试计数
    const newCount = retryConfig.count + 1;

    if (newCount <= retryConfig.maxRetries) {
      this._failedRequests.add(urlKey);
      this._retryRequest(urlKey, params, successCallback, failCallback, newCount);
    } else {
      // 重试次数已达上限
      this._failedRequests.add(urlKey);

      // 不在这里立即弹窗，改为延迟检查
      // 这样可以避免单个请求失败就弹窗的情况
      this._scheduleRetryDialogCheck();

      failCallback?.(errorMessage);
    }
  }

  private _isNetworkError(axiosError: AxiosError): boolean {
    // 如果有响应，说明不是网络错误
    if (axiosError.response) {
      return false;
    }

    // 如果有请求但没有响应，说明是网络错误
    if (axiosError.request) {
      return true;
    }

    // 检查错误消息中的网络相关错误
    const networkErrorCodes = [
      "ECONNREFUSED",
      "ENOTFOUND",
      "ECONNRESET",
      "ETIMEDOUT",
      "ECONNABORTED",
    ];
    return networkErrorCodes.some((code) => axiosError.message.includes(code));
  }

  private _getErrorMessage(axiosError: AxiosError): string {
    if (axiosError.response) {
      const status = axiosError.response.status;
      const statusMap: Record<number, string> = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Interface address does not exist",
        408: "Request Timeout",
        429: "Too Many Requests",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
      };

      return statusMap[status] || `HTTP Error: ${status}`;
    } else if (axiosError.request) {
      return "Network error: Request not responded";
    } else {
      return axiosError.message;
    }
  }

  private _retryRequest(
    urlKey: string,
    params: Object = {},
    successCallback?: (data: any) => void,
    failCallback?: (error: any) => void,
    retryCount: number = 1
  ) {
    const retryConfig = this._maxRetryRequestMap.get(urlKey);
    if (!retryConfig) {
      return;
    }

    // 设置重试状态，防止重复重试
    this._maxRetryRequestMap.set(urlKey, {
      count: retryCount,
      isRetry: true,
      maxRetries: retryConfig.maxRetries,
    });

    // 指数退避延迟：1s, 2s, 4s, 8s, 16s (最大30s)
    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);

    $timer.delay(
      `retry_request_${urlKey}`,
      () => {
        // 在执行重试前检查当前状态
        const currentConfig = this._maxRetryRequestMap.get(urlKey);
        if (!currentConfig) {
          return;
        }

        // 确保仍然需要重试
        if (currentConfig.count >= currentConfig.maxRetries) {
          return;
        }

        // 重置重试状态并执行请求
        this._maxRetryRequestMap.set(urlKey, {
          ...currentConfig,
          isRetry: false,
        });

        this._executeRequest(urlKey, params, successCallback, failCallback);
      },
      delay
    );
  }

  private _scheduleRetryDialogCheck() {
    // 如果已经有失败的请求且对话框还没显示，则延迟检查
    if (this._failedRequests.size > 0 && !this._isRetryDialogShown) {
      // 根据失败请求的数量决定延迟时间
      // 单个请求：立即显示弹窗
      // 多个请求：延迟1秒，让更多请求有机会失败
      const delay = this._failedRequests.size === 1 ? 0 : 1000;

      if (delay === 0) {
        // 单个请求立即显示弹窗
        this._checkAndShowRetryDialog();
      } else {
        // 多个请求延迟显示弹窗
        $timer.delay(
          "schedule_retry_dialog_check",
          () => {
            this._checkAndShowRetryDialog();
          },
          delay
        );
      }
    }
  }

  private _checkAndShowRetryDialog() {
    // 如果已经有失败的请求且对话框还没显示，则显示对话框
    if (this._failedRequests.size > 0 && !this._isRetryDialogShown) {
      // 再次检查，确保没有其他对话框正在显示
      if (this._failedRequests.size > 0 && !this._isRetryDialogShown) {
        this._showRetryDialog();
      }
    }
  }

  private _showRetryDialog() {
    if (this._isRetryDialogShown) {
      return;
    }

    this._isRetryDialogShown = true;

    const failedCount = this._failedRequests.size;

    // 构建更详细的消息
    let message = "网络连接异常";
    if (failedCount > 1) {
      message += `，${failedCount}个请求失败`;
    } else {
      message += "，请求失败";
    }
    message += "。请检查网络连接状况，然后点击确定重试。";

    $popup.alert(message, {
      buttonCount: 2,
      onBtnRight: () => {
        this._retryAllFailedRequests();
      },
      onBtnLeft: () => {
        // 用户取消时，清除失败请求列表
        this._failedRequests.clear();
        this._isRetryDialogShown = false;
      },
    });
  }

  private _retryAllFailedRequests() {
    const currentFailedRequests = new Set(this._failedRequests);

    if (currentFailedRequests.size === 0) {
      this._isRetryDialogShown = false;
      return;
    }

    let completedRetries = 0;
    const totalRetries = currentFailedRequests.size;

    currentFailedRequests.forEach((urlKey) => {
      const requestConfig = this._requestMap.get(urlKey);
      const urlConfig = $config.urls[urlKey];

      if (requestConfig && urlConfig && urlConfig.retry) {
        // 重置重试配置，允许重新开始重试
        this._maxRetryRequestMap.set(urlKey, {
          isRetry: false,
          count: 0,
          maxRetries: 5,
        });

        // 为每个重试请求添加成功/失败回调
        const originalSuccessCallback = requestConfig.successCallback;
        const originalFailCallback = requestConfig.failCallback;

        this._executeRequest(
          urlKey,
          requestConfig.params,
          (data) => {
            // 成功时从失败列表中移除
            this._failedRequests.delete(urlKey);
            originalSuccessCallback?.(data);
            this._onRetryCompleted(++completedRetries, totalRetries);
          },
          (error) => {
            originalFailCallback?.(error);
            this._onRetryCompleted(++completedRetries, totalRetries);
          }
        );
      } else {
        // 如果请求配置不完整，直接标记为完成
        this._onRetryCompleted(++completedRetries, totalRetries);
      }
    });

    // 清除失败请求列表（已完成重试的请求会在成功回调中被移除）
    // 失败的请求会保留在列表中，以便后续处理
  }

  private _onRetryCompleted(completedRetries: number, totalRetries: number) {
    if (completedRetries >= totalRetries) {
      // 所有重试都已完成
      const remainingFailed = this._failedRequests.size;

      if (remainingFailed === 0) {
        // 所有重试都成功了
        this._isRetryDialogShown = false;
      } else {
        // 还有失败的请求，延迟重置对话框状态
        $timer.delay(
          "reset_retry_dialog",
          () => {
            this._isRetryDialogShown = false;
          },
          1000
        );
      }
    }
  }

  // 添加清理方法，用于清理状态
  private _cleanup() {
    // 注意：$timer 没有 clear 方法，定时器会在页面刷新时自动清理

    // 清理状态
    this._failedRequests.clear();
    this._maxRetryRequestMap.clear();
    this._requestMap.clear();
    this._isRetryDialogShown = false;
  }
}

export default {
  install(app: any) {
    app.config.globalProperties.$network = new Network();
    window.$network = new Network();
  },
};

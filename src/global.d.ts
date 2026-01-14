import { VNode } from "vue";

declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface ElementClass {
      $props: {};
    }
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }

  interface Window {
    $popup: {
      popup: (
        style: Partial<CSSStyleDeclaration>,
        { component, props },
      ) => string;
      alert: (
        content: string,
        onConfirm?: Function,
        onCancel?: Function,
        title?: string,
      ) => void;
      close: (id: string) => void;
      closeAll: () => void;
    };
    $network: {
      request: (
        urlKey: string,
        params: Object,
        successCallBack?: (data: any) => void,
        failCallBack?: (error: any) => void,
      ) => void;
      batchRequest: (
        requests: Array<{
          urlKey: string;
          params: Object;
          successCallback?: (data: any) => void;
          failCallback?: (error: any) => void;
        }>,
      ) => Promise<PromiseSettledResult<any>[]>;
    };
    $event: {
      on: (event: string, callback: (...args: any[]) => any) => void;
      off: (event: string, callback?: (...args: any[]) => any) => void;
      emit: (event: string, ...args: any[]) => void;
    };
    $config: {
      appName: string;
      urls: {
        [key: string]: {
          method: string["GET" | "POST" | "DELETE" | "PUT"];
          path: string[];
          retry: boolean;
          cache: boolean;
        };
      };
    };
    $timer: {
      delay: (
        event_name: string,
        callback: () => void | Promise<void>,
        delayTime: number,
      ) => () => void;
      regular: (
        event_name: string,
        callback: () => void | Promise<void>,
        intervalTime: number,
      ) => () => void;
    };
    $message: {
      info: ({
        message,
        duration,
      }: {
        message: string;
        duration?: number;
      }) => void;
      error: ({
        message,
        duration,
      }: {
        message: string;
        duration?: number;
      }) => void;
      warning: ({
        message,
        duration,
      }: {
        message: string;
        duration?: number;
      }) => void;
      success: ({
        message,
        duration,
      }: {
        message: string;
        duration?: number;
      }) => void;
    };
    $date: {
      format: (date: Date | string | number, format: string) => string;
      isSameDay: (
        date1: Date | string | number,
        date2: Date | string | number,
      ) => boolean;
      isToday: (date: Date | string | number) => boolean;
    };
    $storage: {
      get: (key: string) => Promise<string>;
      set: (key: string, value: any) => Promise<void>;
      remove: (key: string) => Promise<void>;
      clearAll: () => Promise<void>;
    };
    $hfc: {
      debounce: (
        fn: Function,
        delay: number,
        immediate: boolean = false,
      ) => Function;
      throttle: (
        fn: Function,
        interval: number,
        trailing: boolean = true,
      ) => Function;
    };
    $nfc: {
      readerConnected: { value: boolean };
      cardPresent: { value: boolean };
      cardData: { value: any };
      initialize: (forceRestart?: boolean) => Promise<void>;
      onCardDetected: (
        callback: (cardInfo: { uid: string; left?: boolean }) => void,
      ) => void;
      offCardDetected: (
        callback: (cardInfo: { uid: string; left?: boolean }) => void,
      ) => void;
      cleanup: () => Promise<void>;
    };
    $trtc: {
      createRoom: (roomId: string) => Promise<{audio:boolean, video:boolean,status:boolean}>;
      joinRoom: (roomId: string) => Promise<void>;
      leaveRoom: (roomId: string) => Promise<void>;
    };
    $libGenerateTestUserSig: {
      genTestUserSig: (sdkAppId: number, userId: string, sdkSecretKey: string) => {
        sdkAppId: number;
        userSig: string;
      };
    };
  }

  const $popup: Window["$popup"];
  const $network: Window["$network"];
  const $event: Window["$event"];
  const $config: Window["$config"];
  const $timer: Window["$timer"];
  const $message: Window["$message"];
  const $date: Window["$date"];
  const $storage: Window["$storage"];
  const $hfc: Window["$hfc"];
  const $nfc: Window["$nfc"];
  const $trtc: Window["$trtc"];
  const $libGenerateTestUserSig: Window["$libGenerateTestUserSig"];
}

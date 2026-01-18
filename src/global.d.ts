import { VNode } from "vue";
import { TRTCEventTypes, TRTCSDK } from "trtc-sdk-v5";

declare global {
  namespace JSX {
    interface Element extends VNode { }
    interface ElementClass {
      $props: {};
    }
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }

  interface Window {
    $popup: {
      popup: (style: Partial<CSSStyleDeclaration>, { component, props }) => string;
      alert: (
        content: string,
        options?: {
          title?: string;
          buttonCount?: 1 | 2;
          btnLeftText?: string;
          btnRightText?: string;
          btnOnlyText?: string;
          onBtnOnly?: Function;
          onBtnLeft?: Function;
          onBtnRight?: Function;
        }
      ) => void;
      close: (id: string) => void;
      closeAll: () => void;
    };
    $network: {
      request: (
        urlKey: string,
        params: Object,
        successCallBack?: (data: any) => void,
        failCallBack?: (error: any) => void
      ) => void;
      batchRequest: (
        requests: Array<{
          urlKey: string;
          params: Object;
          successCallback?: (data: any) => void;
          failCallback?: (error: any) => void;
        }>
      ) => Promise<PromiseSettledResult<any>[]>;
    };
    $event: {
      on: (event: string, callback: (...args: any[]) => any) => void;
      off: (event: string, callback?: (...args: any[]) => any) => void;
      emit: (event: string, ...args: any[]) => void;
    };
    $config: {
      appName: string;
      meetWebBaseURL: string;
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
        delayTime: number
      ) => () => void;
      regular: (
        event_name: string,
        callback: () => void | Promise<void>,
        intervalTime: number
      ) => () => void;
    };
    $message: {
      info: ({ message, duration }: { message: string; duration?: number }) => void;
      error: ({ message, duration }: { message: string; duration?: number }) => void;
      warning: ({ message, duration }: { message: string; duration?: number }) => void;
      success: ({ message, duration }: { message: string; duration?: number }) => void;
    };
    $date: {
      format: (date: Date | string | number, format?: string, useLocalTime?: boolean) => string;
      isSameDay: (date1: Date | string | number, date2: Date | string | number) => boolean;
      isToday: (date: Date | string | number) => boolean;
      toUTCString: (date: Date) => string;
      fromUTCString: (utcString: string) => Date;
    };
    $storage: {
      get: (key: string) => Promise<string>;
      set: (key: string, value: any) => Promise<void>;
      remove: (key: string) => Promise<void>;
      clearAll: () => Promise<void>;
    };
    $hfc: {
      debounce: (fn: Function, delay: number, immediate: boolean = false) => Function;
      throttle: (fn: Function, interval: number, trailing: boolean = true) => Function;
    };
    $nfc: {
      readerConnected: { value: boolean };
      cardPresent: { value: boolean };
      cardData: { value: any };
      initialize: (forceRestart?: boolean) => Promise<void>;
      onCardDetected: (callback: (cardInfo: { uid: string; left?: boolean }) => void) => void;
      offCardDetected: (callback: (cardInfo: { uid: string; left?: boolean }) => void) => void;
      cleanup: () => Promise<void>;
    };
    $trtc: {
      createTRTC: (roomId: number) => Promise<{ audio: boolean; video: boolean; status: boolean }>;
      joinRoom: (roomId: number) => Promise<void>;
      exitRoom: (roomId: number) => Promise<void>;
      closeRoom: (roomId: number) => void;
      hasRoom: (roomId: number) => boolean;
      openLocalAudio: (roomId: number) => Promise<void>;
      closeLocalAudio: (roomId: number) => Promise<void>;
      openLocalVideo: (roomId: number, view: string) => Promise<void>;
      closeLocalVideo: (roomId: number) => Promise<void>;
      muteRemoteAudio: (roomId: number, userId: string, mute: boolean) => Promise<void>;
      muteRemoteVideo: (
        roomId: number,
        userId: string,
        streamType: string | number,
        view: string
      ) => Promise<void>;
      startRemoteScreen: (roomId: number) => Promise<void>;
      stopRemoteScreen: (roomId: number) => Promise<void>;
      sendCustomMessage: (roomId: number, cmdId: number, data: ArrayBuffer) => Promise<unknown>;
      listenRoomProperties: (
        roomId: number,
        event: keyof TRTCEventTypes,
        callback: (event: any, room: TRTCSDK) => void
      ) => void;
    };
    $libGenerateTestUserSig: {
      genTestUserSig: (
        sdkAppId: number,
        userId: string,
        sdkSecretKey: string
      ) => {
        sdkAppId: number;
        userSig: string;
      };
    };
    $roomformat: {
      roomIdToNumber: (roomId: string | number) => number;
      numberToRoomId: (numericRoomId: number) => string;
    };
    MEET_ROOM_SHOW_PARTICIPANT_ARROW: string[];
    MEET_ROOM_CAMERA_OFF_PLACEHOLDER: string[];
    MEET_ROOM_MICROPHONE_ON: string[];
    MEET_ROOM_MICROPHONE_OFF: string[];
    MEET_ROOM_CAMERA_ON: string[];
    MEET_ROOM_CAMERA_OFF: string[];
    MEET_ROOM_COPY_MEET_INFO: string[];
    MEET_ROOM_SCREEN_SHARE_STOP: string[];
    MEET_ROOM_SCREEN_SHARE_START: string[];
    MEET_ROOM_ADD_PARTICIPANT: string[];
    MEET_ROOM_EXIT_MEETING: string[]
    MEET_COPY_MEETING_INFO: string[];
    VIDEO_HISTORY: string[];
    VIDEO_BIG_SCREEN: string[];
    HISTORY_VIDEO_FOLD: string[];
    HISTORY_VIDEO_EXPORT: string[];
    STAFF_DETAIL_CLOSE_PDF: string[];
    PROJECT_DETAIL_BTN: string[];
    PROJECT_FEATURE_DETAIL_BTN: string[];
    PROJECT_BUG_DETAIL_BTN: string[];
    PROJECT_ADD: string[];
    NFC_WAITING: string[];
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
  const $roomformat: Window["$roomformat"];
  const MEET_ROOM_SHOW_PARTICIPANT_ARROW: Window["MEET_ROOM_SHOW_PARTICIPANT_ARROW"];
  const MEET_ROOM_CAMERA_OFF_PLACEHOLDER: Window["MEET_ROOM_CAMERA_OFF_PLACEHOLDER"];
  const MEET_ROOM_MICROPHONE_ON: Window["MEET_ROOM_MICROPHONE_ON"];
  const MEET_ROOM_MICROPHONE_OFF: Window["MEET_ROOM_MICROPHONE_OFF"];
  const MEET_ROOM_CAMERA_ON: Window["MEET_ROOM_CAMERA_ON"];
  const MEET_ROOM_CAMERA_OFF: Window["MEET_ROOM_CAMERA_OFF"];
  const MEET_ROOM_COPY_MEET_INFO: Window["MEET_ROOM_COPY_MEET_INFO"];
  const MEET_ROOM_SCREEN_SHARE_STOP: Window["MEET_ROOM_SCREEN_SHARE_STOP"];
  const MEET_ROOM_SCREEN_SHARE_START: Window["MEET_ROOM_SCREEN_SHARE_START"];
  const MEET_ROOM_ADD_PARTICIPANT: Window["MEET_ROOM_ADD_PARTICIPANT"];
  const MEET_ROOM_EXIT_MEETING: Window["MEET_ROOM_EXIT_MEETING"];
  const MEET_COPY_MEETING_INFO: Window["MEET_COPY_MEETING_INFO"];
  const VIDEO_HISTORY: Window["VIDEO_HISTORY"];
  const VIDEO_BIG_SCREEN: Window["VIDEO_BIG_SCREEN"];
  const HISTORY_VIDEO_FOLD: Window["HISTORY_VIDEO_FOLD"];
  const HISTORY_VIDEO_EXPORT: Window["HISTORY_VIDEO_EXPORT"];
  const STAFF_DETAIL_CLOSE_PDF: Window["STAFF_DETAIL_CLOSE_PDF"];
  const PROJECT_DETAIL_BTN: Window["PROJECT_DETAIL_BTN"];
  const PROJECT_FEATURE_DETAIL_BTN: Window["PROJECT_FEATURE_DETAIL_BTN"];
  const PROJECT_BUG_DETAIL_BTN: Window["PROJECT_BUG_DETAIL_BTN"];
  const PROJECT_ADD: Window["PROJECT_ADD"];
  const NFC_WAITING: Window["NFC_WAITING"];
}

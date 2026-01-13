import { onScopeDispose } from "vue";

class Timer {
  private _timers = new Map<string, number | NodeJS.Timeout>();

  delay(eventName: string, callback: Function, delayTime: number): () => void {
    if (this._timers.has(eventName)) {
      throw new Error(`The ${eventName} event already exists!`);
    }

    const timerId = setTimeout(() => {
      try {
        callback();
      } finally {
        this._clear(eventName, "delay");
      }
    }, delayTime);

    this._timers.set(eventName, timerId);

    return () => this._clear(eventName, "delay");
  }

  regular(
    eventName: string,
    callback: Function,
    intervalTime: number,
  ): () => void {
    if (this._timers.has(eventName)) {
      throw new Error(`The ${eventName} event already exists!`);
    }

    const timerId = setInterval(callback, intervalTime);
    this._timers.set(eventName, timerId);

    onScopeDispose(() => this._clear(eventName, "regular"));

    return () => this._clear(eventName, "regular");
  }

  private _clear(eventName: string, clearType: "delay" | "regular"): void {
    const timer = this._timers.get(eventName);
    this._timers.delete(eventName);

    if (clearType === "delay") {
      clearTimeout(timer as NodeJS.Timeout);
    } else if (clearType === "regular") {
      clearInterval(timer as NodeJS.Timeout);
    }
  }
}

export default {
  install(app: any) {
    app.config.globalProperties.$timer = new Timer();
    window.$timer = new Timer();
  },
};

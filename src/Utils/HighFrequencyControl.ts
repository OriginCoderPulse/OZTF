class HighFrequencyControl {
  private timers: Record<string, number | NodeJS.Timeout> = {};
  private lastExecTimes: Record<string, number> = {};

  debounce(fn: Function, delay: number, immediate: boolean = false): Function {
    const timerKey = fn.toString();
    return (...args: any[]) => {
      if (immediate && !this.timers[timerKey]) {
        fn.apply(this, args);
      }
      clearTimeout(this.timers[timerKey] as NodeJS.Timeout);
      this.timers[timerKey] = setTimeout(() => {
        if (!immediate) {
          fn.apply(this, args);
        }
        delete this.timers[timerKey];
      }, delay);
    };
  }

  throttle(fn: Function, interval: number, trailing: boolean = true): Function {
    const timerKey = fn.toString();
    return (...args: any[]) => {
      const now = Date.now();
      if (
        !this.lastExecTimes[timerKey] ||
        now - this.lastExecTimes[timerKey] >= interval
      ) {
        fn.apply(this, args);
        this.lastExecTimes[timerKey] = now;
      } else if (trailing) {
        clearTimeout(this.timers[timerKey] as NodeJS.Timeout);
        this.timers[timerKey] = setTimeout(
          () => {
            fn.apply(this, args);
            this.lastExecTimes[timerKey] = Date.now();
          },
          interval - (now - this.lastExecTimes[timerKey]),
        );
      }
    };
  }
}

export default {
  install(app: any) {
    app.config.globalProperties.$hfc = new HighFrequencyControl();
    window.$hfc = new HighFrequencyControl();
  },
};

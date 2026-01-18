class DateManager {
  /**
   * 格式化日期时间
   * @param date - 日期对象、时间戳或ISO字符串
   * @param format - 格式化字符串，默认 "YYYY-MM-DD hh:mm:ss"
   * @param useLocalTime - 是否使用本地时间，默认true（显示时使用本地时间）
   * @returns 格式化后的字符串
   */
  format(
    date: Date | string | number,
    format: string = "YYYY-MM-DD hh:mm:ss",
    useLocalTime: boolean = true
  ): string {
    let targetDate: Date;

    if (date instanceof Date) {
      targetDate = date;
    } else if (typeof date === "number" || /^\d+$/.test(String(date))) {
      const timestamp = Number(date);
      targetDate = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
    } else {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date format");
      }
    }

    // 如果输入是UTC字符串，转换为本地时间显示
    // 如果输入是Date对象，根据useLocalTime参数决定使用本地时间还是UTC时间
    const year = useLocalTime ? targetDate.getFullYear() : targetDate.getUTCFullYear();
    const shortYear = year.toString().slice(-2);
    const month = useLocalTime ? targetDate.getMonth() + 1 : targetDate.getUTCMonth() + 1;
    const day = useLocalTime ? targetDate.getDate() : targetDate.getUTCDate();
    const hours = useLocalTime ? targetDate.getHours() : targetDate.getUTCHours();
    const minutes = useLocalTime ? targetDate.getMinutes() : targetDate.getUTCMinutes();
    const seconds = useLocalTime ? targetDate.getSeconds() : targetDate.getUTCSeconds();

    return format
      .replace(/YYYY/g, year.toString())
      .replace(/YY/g, shortYear)
      .replace(/MM/g, this._padZero(month))
      .replace(/M/g, month.toString())
      .replace(/DD/g, this._padZero(day))
      .replace(/D/g, day.toString())
      .replace(/HH/g, this._padZero(hours))
      .replace(/hh/g, this._padZero(hours))
      .replace(/H/g, hours.toString())
      .replace(/h/g, hours.toString())
      .replace(/mm/g, this._padZero(minutes))
      .replace(/m/g, minutes.toString())
      .replace(/ss/g, this._padZero(seconds))
      .replace(/s/g, seconds.toString());
  }

  /**
   * 将本地时间转换为UTC时间字符串（用于发送到后端）
   * @param date - 本地时间的Date对象
   * @returns ISO字符串（UTC时间）
   */
  toUTCString(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return date.toISOString();
  }

  /**
   * 将UTC时间字符串转换为本地时间的Date对象（用于显示）
   * @param utcString - UTC时间字符串（ISO格式）
   * @returns 本地时间的Date对象
   */
  fromUTCString(utcString: string): Date {
    return new Date(utcString);
  }

  // 判断是否为同一天
  isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
    const d1 = this._parseDate(date1);
    const d2 = this._parseDate(date2);

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // 判断是否为今天
  isToday(date: Date | string | number): boolean {
    return this.isSameDay(date, new Date());
  }

  // 解析日期（私有方法）
  private _parseDate(date: Date | string | number): Date {
    if (date instanceof Date) {
      return date;
    } else if (typeof date === "number" || /^\d+$/.test(String(date))) {
      const timestamp = Number(date);
      return new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
    } else {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format");
      }
      return parsedDate;
    }
  }

  private _padZero(num: number): string {
    return num.toString().padStart(2, "0");
  }
}

export default {
  install(app: any) {
    app.config.globalProperties.$date = new DateManager();
    window.$date = new DateManager();
  },
};

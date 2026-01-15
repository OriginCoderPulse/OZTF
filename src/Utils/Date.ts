class DateManager {
  format(
    date: Date | string | number,
    format: string = "YYYY-MM-DD hh:mm:ss",
  ): string {
    let targetDate: Date;
    let useUTC = false;

    if (date instanceof Date) {
      targetDate = date;
    } else if (typeof date === "number" || /^\d+$/.test(String(date))) {
      const timestamp = Number(date);
      targetDate = new Date(
        timestamp.toString().length === 10 ? timestamp * 1000 : timestamp,
      );
    } else {
      // 检测是否为 UTC 时间字符串（包含 'Z' 或时区偏移）
      const dateStr = String(date);
      if (dateStr.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
        useUTC = true;
      }
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date format");
      }
    }

    const year = useUTC ? targetDate.getUTCFullYear() : targetDate.getFullYear();
    const shortYear = year.toString().slice(-2);
    const month = useUTC ? targetDate.getUTCMonth() + 1 : targetDate.getMonth() + 1;
    const day = useUTC ? targetDate.getUTCDate() : targetDate.getDate();
    const hours = useUTC ? targetDate.getUTCHours() : targetDate.getHours();
    const minutes = useUTC ? targetDate.getUTCMinutes() : targetDate.getMinutes();
    const seconds = useUTC ? targetDate.getUTCSeconds() : targetDate.getSeconds();

    return format
      .replace(/YYYY/g, year.toString())
      .replace(/YY/g, shortYear)
      .replace(/MM/g, this._padZero(month))
      .replace(/M/g, month.toString())
      .replace(/DD/g, this._padZero(day))
      .replace(/D/g, day.toString())
      .replace(/hh/g, this._padZero(hours))
      .replace(/h/g, hours.toString())
      .replace(/mm/g, this._padZero(minutes))
      .replace(/m/g, minutes.toString())
      .replace(/ss/g, this._padZero(seconds))
      .replace(/s/g, seconds.toString());
  }

  // 判断是否为同一天
  isSameDay(
    date1: Date | string | number,
    date2: Date | string | number,
  ): boolean {
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
      return new Date(
        timestamp.toString().length === 10 ? timestamp * 1000 : timestamp,
      );
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

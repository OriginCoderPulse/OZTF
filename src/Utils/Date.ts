class DateManager {
  format(
    date: Date | string | number,
    format: string = "YYYY-MM-DD hh:mm:ss",
  ): string {
    let targetDate: Date;

    if (date instanceof Date) {
      targetDate = date;
    } else if (typeof date === "number" || /^\d+$/.test(String(date))) {
      const timestamp = Number(date);
      targetDate = new Date(
        timestamp.toString().length === 10 ? timestamp * 1000 : timestamp,
      );
    } else {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date format");
      }
    }

    const year = targetDate.getFullYear();
    const shortYear = year.toString().slice(-2);
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const hours = targetDate.getHours();
    const minutes = targetDate.getMinutes();
    const seconds = targetDate.getSeconds();

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

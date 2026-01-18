import { ref } from "vue";
import { historyVideoConfig } from "./History.config";

export class HistoryVideoController {
  public dateList = ref<any[]>([]);
  public selectedDateTime = ref("");
  public exportProgress = ref(0);
  public exporting = ref(false);
  public initialized = ref(false);

  /**
   * 初始化 - 在组件 onMounted 时调用
   */
  public init() {
    if (this.initialized.value) return;
    this.dateList.value = this.dateTimeArray();
    this.selectedDateTime.value =
      new Date().toLocaleDateString() +
      `-${(new Date().getHours() - 1).toString().padStart(2, "0")}:00`;
    this.initialized.value = true;
  }

  /**
   * 获取最近7天
   */
  private getLast7Days() {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.unshift(date.toLocaleDateString());
    }
    return days;
  }

  /**
   * 生成日期时间数组
   */
  private dateTimeArray() {
    const datedays = this.getLast7Days();
    const dateIcon = historyVideoConfig.icon;
    const dateCur = new Date().toLocaleDateString();

    return datedays.map((date, index) => {
      const timeList =
        date === dateCur
          ? Array.from(
              { length: new Date().getHours() },
              (_, i) => `${i.toString().padStart(2, "0")}:00`
            )
          : Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

      const timeListWithIndex = timeList.map((time, timeIndex) => ({
        time,
        index: timeIndex,
      }));

      return {
        date,
        timeList: timeListWithIndex,
        icon: dateIcon[new Date(date).getDay()],
        fold: date !== dateCur,
        index,
      };
    });
  }

  /**
   * 切换折叠
   */
  public toggleFold(date: any) {
    const targetIndex = this.dateList.value.findIndex((item) => item.date === date.date);
    if (targetIndex !== -1) {
      const newList = [...this.dateList.value];
      const targetItem = newList[targetIndex];
      const willBeExpanded = targetItem.fold; // 如果当前是折叠的，点击后会展开

      // 如果将要展开当前项，先关闭所有其他已展开的项
      if (willBeExpanded) {
        newList.forEach((item, index) => {
          if (index !== targetIndex && !item.fold) {
            newList[index] = {
              ...item,
              fold: true,
            };
          }
        });
      }

      // 切换目标项的折叠状态
      newList[targetIndex] = {
        ...targetItem,
        fold: !targetItem.fold,
      };

      this.dateList.value = newList;
    }
  }

  /**
   * 选择时间
   */
  public selectTime(date: string, time: string) {
    this.selectedDateTime.value = date + "-" + time;
  }

  /**
   * 导出视频
   */
  public exportVideo() {
    if (this.exporting.value) return;
    this.exporting.value = true;
    this.exportProgress.value = 0;
    $timer.regular(
      "exportVideo",
      () => {
        if (this.exportProgress.value < 100) {
          this.exportProgress.value += 2;
        } else {
          this.exporting.value = false;
          this.exportProgress.value = 0;
        }
      },
      1000
    );
  }
}

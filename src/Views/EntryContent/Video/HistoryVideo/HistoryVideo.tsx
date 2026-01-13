/// <reference path="./HistoryVideo.d.ts" />
import { defineComponent, ref } from "vue";
import "./HistoryVideo.scss";
import VideoPlayer from "@/Components/VideoPlayer/VideoPlayer";
import { historyVideoConfig } from "./History.config";
import { Motion } from "motion-v";
import Svg from "@/Components/Svg/Svg.tsx";

export default defineComponent({
  name: "HistoryVideo",
  setup() {
    const getLast7Days = () => {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.unshift(date.toLocaleDateString());
      }
      return days;
    };

    const dateTimeArray = () => {
      const datedays = getLast7Days();
      const dateIcon = historyVideoConfig.icon;
      const dateCur = new Date().toLocaleDateString();

      return datedays.map((date, index) => {
        const timeList = date === dateCur
          ? Array.from(
              { length: new Date().getHours() },
              (_, i) => `${i.toString().padStart(2, "0")}:00`,
            )
          : Array.from(
              { length: 24 },
              (_, i) => `${i.toString().padStart(2, "0")}:00`,
            );
        
        // 为每个时间项添加索引，避免后续使用 indexOf
        const timeListWithIndex = timeList.map((time, timeIndex) => ({
          time,
          index: timeIndex,
        }));

        return {
          date,
          timeList: timeListWithIndex,
          icon: dateIcon[new Date(date).getDay()],
          fold: date !== dateCur,
          index, // 保存索引，避免使用 indexOf
        };
      });
    };

    const toggleFold = (date: any) => {
      // 只更新需要更新的项，避免重新创建整个数组
      const targetIndex = dateList.value.findIndex(item => item.date === date.date);
      if (targetIndex !== -1) {
        const newList = [...dateList.value];
        newList[targetIndex] = {
          ...newList[targetIndex],
          fold: !newList[targetIndex].fold,
        };
        dateList.value = newList;
      }
    };

    const selectTime = (date: string, time: string) => {
      selectedDateTime.value = date + "-" + time;
    };

    const dateList = ref(dateTimeArray());
    const selectedDateTime = ref(
      new Date().toLocaleDateString() +
      `-${(new Date().getHours() - 1).toString().padStart(2, "0")}:00`,
    );
    const exportProgress = ref(0);
    const exporting = ref(false);

    const exportVideo = () => {
      if (exporting.value) return;
      exporting.value = true;
      exportProgress.value = 0;
      $timer.regular(
        "exportVideo",
        () => {
          if (exportProgress.value < 100) {
            exportProgress.value += 2;
          } else {
            exporting.value = false;
            exportProgress.value = 0;
          }
        },
        1000,
      );
    };

    return () => (
      <div class="history-video">
        <div class="history-time-list">
           {dateList.value.map((date: any) => (
            <div key={date.date} class="date-item">
              <Motion
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.2,
                  delay: date.index * 0.05, // 使用保存的索引，减少延迟
                }}
                class="date-content"
              >
                <div class="date-header">
                  <div class="date-icon">
                    {date.icon && Array.isArray(date.icon) ? (
                      <Svg
                        svgPath={date.icon.map((iconItem: any) => ({
                          path: iconItem.path,
                          fill: iconItem.fill
                        }))}
                        width="18"
                        height="18"
                        class="icon"
                        viewBox="0 0 1024 1024"
                      />
                    ) : null}
                  </div>
                  <span class="date-title">{date.date}</span>
                  <div
                    onClick={(e: any) => {
                      e.stopPropagation();
                      toggleFold(date);
                    }}
                    class={["fold-icon", { folded: date.fold }]}
                  >
                    <Svg
                      svgPath="M6 9L12 15L18 9"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </div>
                </div>
                <Motion
                  initial={{ height: 0, opacity: 0, padding: 0 }}
                  animate={{
                    height: date.fold ? 0 : "auto",
                    opacity: date.fold ? 0 : 1,
                    padding: date.fold ? 0 : 8,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  class="time-container"
                >
                  <div class="time-list">
                    {date.timeList.map((timeItem: any) => {
                      const time = timeItem.time;
                      const isActive = selectedDateTime.value === date.date + "-" + time;
                      return (
                        <div
                          key={time}
                          class={{
                            "time-item": true,
                            active: isActive,
                          }}
                          onClick={(e: any) => {
                            e.stopPropagation();
                            selectTime(date.date, time);
                          }}
                        >
                          <Motion
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.15,
                              delay: timeItem.index * 0.02, // 使用保存的索引，减少延迟
                            }}
                            class="time-content"
                          >
                            <span
                              class="time-title"
                              style={{
                                textShadow: isActive ? "0 2px 8px #FFAFAF" : "",
                              }}
                            >
                              {time}
                            </span>
                            <div
                              class="status-dot"
                              style={{
                                backgroundColor: isActive ? "#FFAFAF" : "#999999",
                              }}
                            ></div>
                          </Motion>
                        </div>
                      );
                    })}
                  </div>
                </Motion>
              </Motion>
            </div>
          ))}
        </div>
        <div class="video">
          <VideoPlayer
            videoUrl="http://vjs.zencdn.net/v/oceans.mp4"
            controls={true}
            loop={true}
            videoType="video"
          >
            <div
              class="export-video-progress"
              style={{ "--progress": exportProgress.value / 100 }}
              onClick={exportVideo}
            >
              <div class="export-video">
                <Svg
                  svgPath={[
                    "M641.6 660l-8.64-64 32-4.32a211.2 211.2 0 0 0-26.72-420.32 215.36 215.36 0 0 0-213.12 192 94.56 94.56 0 0 0 0 11.52v41.28h-64V384v-7.04a153.12 153.12 0 0 1 0-19.52A279.84 279.84 0 0 1 636.16 108H640A275.2 275.2 0 0 1 673.28 656z",
                    "M490.4 446.24l-7.52-39.84a182.4 182.4 0 0 1 107.52-162.88l29.12-13.28L646.08 288l-29.12 13.28a117.92 117.92 0 0 0-70.08 101.28l6.24 30.4zM392.96 652.32h-78.72A202.24 202.24 0 0 1 256 256l30.72-9.12 18.24 61.28-30.72 9.12a138.24 138.24 0 0 0 39.68 270.72h78.72zM479.2 512h64v320h-64z",
                    "M510.4 908l-156.32-147.68 43.84-46.4 112.48 106.08 112.8-106.08 43.84 46.56-156.64 147.52z"
                  ]}
                  width="16"
                  height="16"
                  class="icon"
                  fill="#ffffff"
                />
              </div>
            </div>
          </VideoPlayer>
        </div>
      </div>
    );
  },
});

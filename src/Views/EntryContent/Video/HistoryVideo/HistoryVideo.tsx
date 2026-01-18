/// <reference path="./HistoryVideo.d.ts" />
import { defineComponent, onMounted } from "vue";
import "./HistoryVideo.scss";
import VideoPlayer from "@/Components/VideoPlayer/VideoPlayer";
import { Motion } from "motion-v";
import Svg from "@/Components/Svg/Svg.tsx";
import { HistoryVideoController } from "./HistoryVideo.controller.ts";

export default defineComponent({
  name: "HistoryVideo",
  setup() {
    const controller = new HistoryVideoController();

    onMounted(() => {
      controller.init();
    });

    return () => (
      <div class="history-video">
        <div class="history-time-list">
          {controller.dateList.value.map((date: any) => (
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
                      controller.toggleFold(date);
                    }}
                    class={["fold-icon", { folded: date.fold }]}
                  >
                    <Svg
                      svgPath={HISTORY_VIDEO_FOLD}
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
                      const isActive = controller.selectedDateTime.value === date.date + "-" + time;
                      return (
                        <div
                          key={time}
                          class={{
                            "time-item": true,
                            active: isActive,
                          }}
                          onClick={(e: any) => {
                            e.stopPropagation();
                            controller.selectTime(date.date, time);
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
          {controller.initialized.value && (
            <VideoPlayer
              videoUrl="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
              controls={true}
              loop={true}
              videoType="video"
            >
              <div
                class="export-video-progress"
                style={{ "--progress": controller.exportProgress.value / 100 }}
                onClick={controller.exportVideo}
              >
                <div class="export-video">
                  <Svg
                    svgPath={HISTORY_VIDEO_EXPORT}
                    width="16"
                    height="16"
                    class="icon"
                    fill="#ffffff"
                  />
                </div>
              </div>
            </VideoPlayer>
          )}
        </div>
      </div>
    );
  },
});

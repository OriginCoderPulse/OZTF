/// <reference path="./Video.d.ts" />
import { defineComponent } from "vue";
import VideoPlayer from "@/Components/VideoPlayer/VideoPlayer";
import { VideoController } from "./Video.controller.ts";
import "./Video.scss";
import Svg from "@/Components/Svg/Svg.tsx";

export default defineComponent({
  name: "LiveVideo",
  setup() {
    const controller = new VideoController();

    return () => (
      <div class="live-video">
        {controller.videos.slice(0, 9).map((item) => (
          <div class="video-content" key={item}>
            <VideoPlayer videoUrl={item} videoType="stream">
              <div class="show-history-live-video" onClick={() => controller.openHistoryVideo()}>
                <Svg
                  svgPath={VIDEO_HISTORY}
                  width="16"
                  height="16"
                  class="icon"
                  fill="#dddddd"
                />
              </div>
              <div class="show-big-live-video" onClick={() => controller.openLiveVideo(item)}>
                <Svg
                  svgPath={VIDEO_BIG_SCREEN}
                  width="16"
                  height="16"
                  class="icon"
                  fill="#dddddd"
                />
              </div>
            </VideoPlayer>
          </div>
        ))}
      </div>
    );
  },
});

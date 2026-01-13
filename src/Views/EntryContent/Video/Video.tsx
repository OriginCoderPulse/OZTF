/// <reference path="./Video.d.ts" />
import { defineComponent } from "vue";
import VideoPlayer from "@/Components/VideoPlayer/VideoPlayer";
import LargeVideo from "./LargeVideo/LargeVideo.tsx";
import HistoryVideo from "./HistoryVideo/HistoryVideo.tsx";
import "./Video.scss";
import Svg from "@/Components/Svg/Svg.tsx";

export default defineComponent({
  name: "LiveVideo",
  setup() {
    const videos = [
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    ];

    const openLiveVideo = (videoUrl: string) => {
      $popup.popup(
        { padding: "10px" },
        { component: LargeVideo, props: { videoUrl } },
      );
    };

    const openHistoryVideo = () => {
      $popup.popup({ padding: "10px" }, { component: HistoryVideo, props: {} });
    };

    return () => (
      <div class="live-video">
        {videos.slice(0, 9).map((item) => (
          <div class="video-content" key={item}>
            <VideoPlayer videoUrl={item} videoType="stream">
              <div class="show-history-live-video" onClick={openHistoryVideo}>
                <Svg
                  svgPath="M839.104 192.96A460.48 460.48 0 0 0 511.488 57.216a460.352 460.352 0 0 0-327.68 135.744 460.352 460.352 0 0 0-135.744 327.68c0 90.176 25.92 177.6 74.944 252.8a32.192 32.192 0 1 0 53.952-35.2 397.824 397.824 0 0 1-64.512-217.6A399.36 399.36 0 0 1 511.36 121.792c219.968 0 398.848 178.944 398.848 398.848s-178.944 398.848-398.848 398.848a398.08 398.08 0 0 1-206.08-57.28 32.256 32.256 0 0 0-33.408 55.168 462.208 462.208 0 0 0 239.424 66.56 460.288 460.288 0 0 0 327.616-135.68c87.488-87.552 135.744-203.968 135.744-327.68s-48-240.064-135.552-327.616z m-345.472 10.496a40.768 40.768 0 0 0-40.768 40.832v293.504c0 1.408 0.384 2.816 0.512 4.16a40.32 40.32 0 0 0 40.768 35.84l0.128-0.896h231.488a40.832 40.832 0 1 0 0-81.6H534.464V244.288a40.832 40.832 0 0 0-40.832-40.832z m0 0"
                  width="16"
                  height="16"
                  class="icon"
                  fill="#dddddd"
                />
              </div>
              <div
                class="show-big-live-video"
                onClick={() => openLiveVideo(item)}
              >
                <Svg
                  svgPath={[
                    "M244.4 899.1c-11.3 0-21.9-4.3-29.8-12.2l-78.3-78c-16.6-16.6-16.3-44.1 0.8-61.2l0.1-0.1 190.2-189c-23.9-44.3-36.5-93.7-36.5-144.2 0-81.4 31.8-158 89.5-215.5s134.4-89.2 216-89.2 158.3 31.7 216 89.2c57.7 57.6 89.5 134.1 89.5 215.5s-31.8 158-89.5 215.5c-57.7 57.6-134.4 89.2-216 89.2-43.3 0-86.3-9.3-125.7-26.9L275.7 886c-8.2 8.3-19.7 13.1-31.3 13.1zM191 778.6l53.7 53.6 214.8-213.4 19.6 10.6c35.8 19.4 76.4 29.7 117.3 29.7 135.4 0 245.5-109.8 245.5-244.8S731.8 169.5 596.4 169.5 350.9 279.3 350.9 414.3c0 47.1 13.6 93 39.4 132.7l13.3 20.4L191 778.6z",
                    "M596.7 636.7c-122.1 0-221.4-99.6-221.4-222 0-59.3 23.1-115.1 64.9-157 41.8-42 97.4-65.1 156.6-65.1v60c-89 0-161.4 72.7-161.4 162.1 0 89.3 72.4 162 161.4 162 43.1 0 83.6-16.8 114.1-47.4 30.5-30.6 47.3-71.3 47.3-114.6h60c0 59.3-23 115-64.8 157-41.9 41.9-97.5 65-156.7 65z",
                    "M524.9 384.7h143.6v60H524.9z",
                    "M566.7 342.9h60v142.8h-60z"
                  ]}
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

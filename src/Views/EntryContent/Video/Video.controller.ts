import LargeVideo from "./LargeVideo/LargeVideo.tsx";
import HistoryVideo from "./HistoryVideo/HistoryVideo.tsx";

export class VideoController {
  // 视频列表
  public videos = [
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

  /**
   * 打开大屏视频
   */
  public openLiveVideo(videoUrl: string) {
    $popup.popup({ padding: "10px" }, { component: LargeVideo, props: { videoUrl } });
  }

  /**
   * 打开历史视频
   */
  public openHistoryVideo() {
    $popup.popup({ padding: "10px" }, { component: HistoryVideo, props: {} });
  }
}

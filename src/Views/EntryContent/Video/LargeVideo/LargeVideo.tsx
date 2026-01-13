/// <reference path="./LargeVideo.d.ts" />
import { defineComponent } from "vue";
import VideoPlayer from "@/Components/VideoPlayer/VideoPlayer";
import "./LargeVideo.scss";

export default defineComponent({
  name: "LargeVideo",
  props: {
    videoUrl: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="large-video">
        <VideoPlayer videoUrl={props.videoUrl} videoType="stream" />
      </div>
    );
  },
});

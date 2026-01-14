/// <reference path="./LargeVideo.d.ts" />
import { defineComponent, ref, onMounted } from "vue";
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
    const mounted = ref(false);

    onMounted(() => {
      // 延迟加载，等待弹窗完全打开后再加载视频
      setTimeout(() => {
        mounted.value = true;
      }, 200);
    });

    return () => (
      <div class="large-video">
        {mounted.value && (
          <VideoPlayer videoUrl={props.videoUrl} videoType="stream" />
        )}
      </div>
    );
  },
});

import { defineComponent, onUnmounted, watchEffect } from "vue";
import { RowValue, animate, useMotionValue, useTransform } from "motion-v";

export default defineComponent({
  name: "AnimationNumberText",
  props: {
    value: {
      type: Number,
      default: 0,
    },
    format: {
      type: Boolean,
      default: false,
    },
    style: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const count = useMotionValue(0);
    const rounded = useTransform(() => Math.round(count.get()));
    let controls: any;
    watchEffect((cleanup) => {
      controls = animate(count, props.value, { duration: 0.5 });
      cleanup(() => {
        controls?.stop();
      });
    });
    onUnmounted(() => {
      controls?.stop();
    });
    return () => (
      <div class="ant" style={props.style as any}>
        <RowValue value={rounded} />
        {props.format ? "%" : ""}
      </div>
    );
  },
});

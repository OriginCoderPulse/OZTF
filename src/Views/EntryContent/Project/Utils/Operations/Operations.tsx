import { defineComponent } from "vue";
import "./Operations.scss";

export default defineComponent({
  name: "Operations",
  props: {
    projectId: {
      type: [String, Number, null],
      required: true,
    },
  },
  setup() {
    return () => <div class="operations"></div>;
  },
});

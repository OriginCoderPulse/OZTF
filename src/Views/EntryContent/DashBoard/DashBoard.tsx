import { defineComponent } from "vue";
import "./DashBoard.scss";

export default defineComponent({
  name: "DashBoard",
  props: {},
  setup() {
    return () => <div class="dashboard"></div>;
  },
});

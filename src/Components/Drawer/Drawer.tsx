import { defineComponent } from "vue";
import "./Drawer.scss";

export default defineComponent({
  name: "Drawer",
  setup() {
    return () => <div class="drawer"></div>;
  },
});

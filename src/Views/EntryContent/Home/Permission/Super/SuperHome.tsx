import { defineComponent } from "vue";
import "./SuperHome.scss";

export default defineComponent({
  name: "SuperHome",
  setup() {
    return () => (
      <div class="super-home">
        <div class="super-left">
          <div class="super-basic-info"></div>
          <div class="super-l-bottom"></div>
        </div>
        <div class="super-right">
          <div class="super-r-top"></div>
          <div class="super-r-bottom"></div>
        </div>
      </div>
    );
  },
});

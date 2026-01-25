import { defineComponent } from "vue";
import "./CEOHome.scss";

export default defineComponent({
  name: "CEOHome",
  setup() {
    return () => (
      <div class="ceo-home">
        <div class="ceo-left">
          <div class="ceo-basic-info"></div>
          <div class="ceo-l-bottom"></div>
        </div>
        <div class="ceo-right">
          <div class="ceo-r-top"></div>
          <div class="ceo-r-bottom"></div>
        </div>
      </div>
    );
  },
});

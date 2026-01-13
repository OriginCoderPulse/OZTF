/// <reference path="./Finance.d.ts" />

import { defineComponent } from "vue";
import "./Finance.scss";

export default defineComponent({
  name: "Finance",
  props: {},
  setup() {
    return () => <div class="finance"></div>;
  },
});

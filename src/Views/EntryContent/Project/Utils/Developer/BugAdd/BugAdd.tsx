/// <reference path="./BugAdd.d.ts" />

import { defineComponent } from "vue";
import "./BugAdd.scss";

export default defineComponent({
  name: "BugAdd",
  props: {},
  setup() {
    return () => <div class="bug-add"></div>;
  },
});

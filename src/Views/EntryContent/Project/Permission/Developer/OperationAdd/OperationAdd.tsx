/// <reference path="./OperationAdd.d.ts" />

import { defineComponent } from "vue";
import "./OperationAdd.scss";

export default defineComponent({
  name: "OperationAdd",
  props: {},
  setup() {
    return () => <div class="operation-add"></div>;
  },
});

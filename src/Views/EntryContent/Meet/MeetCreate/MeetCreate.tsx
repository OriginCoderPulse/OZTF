import { defineComponent } from "vue";
import "./MeetCreate.scss";

export default defineComponent({
  name: "MeetCreate",
  setup() {
    return () => (
      <div class="meet-create">
        <div class="meet-create-header">
          <div class="meet-create-title">创建会议</div>
        </div>
      </div>
    );
  },
});
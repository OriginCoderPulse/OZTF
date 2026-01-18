import { defineComponent } from "vue";
import { Motion } from "motion-v";
import "./Popup.scss";

export default defineComponent({
  name: "Popup",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    style: Object,
    closePopup: Function,
  },
  setup(props, { slots }) {
    return () => (
      <div class="pop-container">
        <Motion
          v-show={props.visible}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={(e: any) => {
            if (e.target === e.currentTarget && props.closePopup) props.closePopup();
          }}
          style={{
            zIndex: props.style?.zIndex ?? 1000,
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(24, 24, 24, 0.52)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Motion
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            class="main"
            style={{
              width: "80%",
              height: "80%",
              backgroundColor: "#36373A",
              borderRadius: "12px",
              padding: "15px",
              boxSizing: "border-box",
              zIndex: (props.style?.zIndex ?? 1000) + 1,
              ...(props.style || {}),
            }}
          >
            {slots.default?.()}
          </Motion>
        </Motion>
      </div>
    );
  },
});

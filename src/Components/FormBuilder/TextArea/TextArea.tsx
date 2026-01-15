import { defineComponent, computed } from "vue";
import "./TextArea.scss";

export default defineComponent({
  name: "TextArea",
  props: {
    placeHolder: String,
    modelValue: String,
    title: String,
    border: {
      type: Boolean,
      default: true,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    rows: {
      type: Number,
      default: 4,
    },
    resize: {
      type: String,
      default: "vertical",
      validator: (value: string) => {
        return ["none", "both", "horizontal", "vertical"].includes(value);
      },
    },
    style: {
      type: Object as () => Partial<CSSStyleDeclaration>,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const clearValue = () => {
      emit("update:modelValue", "");
    };

    // 计算是否应该显示清除按钮
    const shouldShowClearBtn = computed(() => {
      return props.clearable && props.modelValue && props.modelValue.trim() !== "";
    });

    // 处理输入事件
    const handleInput = (event: Event) => {
      const target = event.target as HTMLTextAreaElement;
      emit("update:modelValue", target.value);
    };

    return () => (
      <div class="textarea-wrapper">
        <textarea
          class={`textarea-component ${props.border ? "with-border" : "no-border"}`}
          value={props.modelValue}
          onInput={handleInput}
          placeholder={props.placeHolder}
          rows={props.rows}
          style={{
            resize: props.resize,
            ...props.style,
          }}
        />
        {shouldShowClearBtn.value && (
          <button class="textarea-clear-btn" onClick={clearValue} type="button">
            ✕
          </button>
        )}
      </div>
    );
  },
});

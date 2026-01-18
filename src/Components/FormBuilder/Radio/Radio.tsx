import { defineComponent } from "vue";
import "./Radio.scss";

export default defineComponent({
  name: "Radio",
  props: {
    modelValue: {
      type: [String, Number],
      default: "",
    },
    options: {
      type: Array,
      default: () => [],
    },
    optionLabel: {
      type: String,
      default: "label",
    },
    optionValue: {
      type: String,
      default: "value",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "change"],
  setup(props, { emit }) {
    const handleRadioChange = (value: any) => {
      // 确保空字符串被正确处理
      const finalValue = value === "" ? "" : value;
      emit("update:modelValue", finalValue);
      emit("change", finalValue);
    };

    return () => (
      <div class="radio-group">
        {props.options.map((option: any, index: number) => {
          const label = option[props.optionLabel] || option.label || "";
          const value = option[props.optionValue] || option.value || "";

          return (
            <label
              key={index}
              class={`radio-item ${props.disabled ? "disabled" : ""} ${props.modelValue === value ? "selected" : ""}`}
            >
              <input
                type="radio"
                value={value}
                checked={props.modelValue === value}
                disabled={props.disabled}
                onChange={() => handleRadioChange(value)}
                class="radio-input"
              />
              <span class="radio-label">{label}</span>
            </label>
          );
        })}
      </div>
    );
  },
});

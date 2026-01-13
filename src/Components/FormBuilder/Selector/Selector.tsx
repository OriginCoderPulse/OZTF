import { defineComponent, ref, computed, onMounted, onUnmounted, Fragment } from "vue";
import { Motion } from "motion-v";
import "./Selector.scss";

export default defineComponent({
  name: "Selector",
  props: {
    modelValue: {
      type: [String, Number, Array],
      default: null
    },
    options: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: "请选择"
    },
    multiple: {
      type: Boolean,
      default: false
    },
    searchable: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: true
    },
    maxHeight: {
      type: String,
      default: "200px"
    },
    optionLabel: {
      type: String,
      default: "label"
    },
    optionValue: {
      type: String,
      default: "value"
    },
    filterable: {
      type: Boolean,
      default: true
    },
    dropdownPlacement: {
      type: String,
      default: 'bottom',
      validator: (value: string) => ['top', 'bottom'].includes(value)
    }
  },
  emits: ['update:modelValue', 'change', 'focus', 'blur', 'search'],
  setup(props, { emit }) {
    const showDropdown = ref(false);
    const searchQuery = ref("");
    const inputRef = ref<HTMLElement>();
    const dropdownRef = ref<HTMLElement>();

    const closeOtherFormComponents = () => {
      const closeEvent = new CustomEvent('closeFormComponents', {
        detail: { source: 'selector' }
      });
      document.dispatchEvent(closeEvent);
    };

    const handleGlobalClose = (_event: any) => {
      // 关闭所有其他表单组件的下拉框，包括其他Selector和Date组件
      if (showDropdown.value) {
        showDropdown.value = false;
        emit('blur');
      }
    };

    const handleDocumentClick = (event: Event) => {
      if (!showDropdown.value) return;

      const target = event.target as Element;

      const isClickInInput = inputRef.value && inputRef.value.contains && inputRef.value.contains(target);

      let isClickInDropdown = false;
      if (dropdownRef.value) {
        if (typeof dropdownRef.value.contains === 'function') {
          isClickInDropdown = dropdownRef.value.contains(target);
        }
      }

      const isClickInside = isClickInInput || isClickInDropdown;

      if (!isClickInside) {
        closeOtherFormComponents();
        showDropdown.value = false;
        emit('blur');
      }
    };

    // 过滤后的选项
    const filteredOptions = computed(() => {
      if (!props.filterable || !searchQuery.value.trim()) {
        return props.options;
      }

      return props.options.filter((option: any) => {
        const label = getOptionLabel(option);
        return label.toLowerCase().includes(searchQuery.value.toLowerCase());
      });
    });

    // 获取选项标签
    const getOptionLabel = (option: any): string => {
      if (typeof option === 'string') return option;
      if (typeof option === 'object' && option !== null) {
        return option[props.optionLabel] || option.label || '';
      }
      return String(option);
    };

    // 获取选项值
    const getOptionValue = (option: any): any => {
      if (typeof option === 'string') return option;
      if (typeof option === 'object' && option !== null) {
        return option[props.optionValue] || option.value || option;
      }
      return option;
    };



    // 当前显示的标签
    const displayLabel = computed(() => {
      if (props.multiple && Array.isArray(props.modelValue)) {
        const selectedLabels = props.modelValue.map(value => {
          const option = props.options.find((opt: any) => getOptionValue(opt) === value);
          return option ? getOptionLabel(option) : '';
        }).filter(Boolean);

        if (selectedLabels.length === 0) {
          return props.placeholder;
        }

        // 超过2个显示前两个 + 剩余数量
        if (selectedLabels.length > 2) {
          const firstTwo = selectedLabels.slice(0, 2);
          const remaining = selectedLabels.length - 2;
          return {
            type: 'multiple-with-plus',
            text: firstTwo.join(', '),
            plusCount: remaining
          };
        }

        return selectedLabels.join(', ');
      } else {
        if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
          return props.placeholder;
        }

        const option = props.options.find((opt: any) => getOptionValue(opt) === props.modelValue);
        return option ? getOptionLabel(option) : String(props.modelValue);
      }
    });

    // 获取placeholder文本（确保返回字符串）
    const placeholderText = computed(() => {
      const label = displayLabel.value;
      if (typeof label === 'string') {
        return label;
      }
      if (label && typeof label === 'object' && label.type === 'multiple-with-plus') {
        return `${label.text} +${label.plusCount}`;
      }
      return props.placeholder;
    });

    // 是否有值
    const hasValue = computed(() => {
      if (props.multiple) {
        return Array.isArray(props.modelValue) && props.modelValue.length > 0;
      } else {
        return props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '';
      }
    });

    // 检查选项是否被选中
    const isOptionSelected = (option: any): boolean => {
      const value = getOptionValue(option);

      if (props.multiple) {
        return Array.isArray(props.modelValue) && props.modelValue.includes(value);
      } else {
        return props.modelValue === value;
      }
    };

    // 选择选项
    const selectOption = (option: any) => {
      const value = getOptionValue(option);

      if (props.multiple) {
        const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
        const index = currentValues.indexOf(value);

        if (index > -1) {
          currentValues.splice(index, 1);
        } else {
          currentValues.push(value);
        }

        emit('update:modelValue', currentValues);
        emit('change', currentValues);
      } else {
        emit('update:modelValue', value);
        emit('change', value);
        showDropdown.value = false;
        searchQuery.value = "";
        emit('blur');
      }
    };

    // 清除选择
    const clearSelection = (event: Event) => {
      event.stopPropagation();

      if (props.multiple) {
        emit('update:modelValue', []);
        emit('change', []);
      } else {
        emit('update:modelValue', null);
        emit('change', null);
      }
    };

    // 切换下拉框
    const toggleDropdown = (event?: Event) => {
      if (props.disabled) return;

      if (event) {
        event.stopPropagation();
      }

      // 总是先关闭其他组件，然后再处理当前组件的状态
      closeOtherFormComponents();

      const newState = !showDropdown.value;
      showDropdown.value = newState;

      if (newState) {
        emit('focus');
        searchQuery.value = "";
      } else {
        emit('blur');
      }
    };

    const handleSearch = (event: Event) => {
      const target = event.target as HTMLInputElement;
      searchQuery.value = target.value;
      emit('search', searchQuery.value);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (!showDropdown.value) return;

      switch (event.key) {
        case 'Escape':
          showDropdown.value = false;
          emit('blur');
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredOptions.value.length > 0) {
            selectOption(filteredOptions.value[0]);
          }
          break;
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('closeFormComponents', handleGlobalClose);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('closeFormComponents', handleGlobalClose);
    });

    return () => (
      <div class="selector" ref={inputRef}>
        <div
          class={`selector-input ${hasValue.value ? 'has-value' : ''} ${props.disabled ? 'disabled' : ''} ${showDropdown.value ? 'focused' : ''}`}
          onClick={(event: Event) => {
            event.stopPropagation();
            toggleDropdown(event);
          }}
        >
          {props.searchable ? (
            <input
              type="text"
              class="search-input"
              placeholder={placeholderText.value}
              value={searchQuery.value}
              onInput={handleSearch}
              onKeydown={handleKeydown}
              onFocus={(e: Event) => {
                e.stopPropagation();
                closeOtherFormComponents();
                if (!showDropdown.value) {
                  showDropdown.value = true;
                  emit('focus');
                }
              }}
              onClick={(e: Event) => {
                e.stopPropagation();
                if (!showDropdown.value) {
                  showDropdown.value = true;
                  emit('focus');
                }
              }}
            />
          ) : (
            <span class={`display-text ${!hasValue.value ? 'placeholder' : ''}`}>
              {typeof displayLabel.value === 'string' ? (
                displayLabel.value
              ) : displayLabel.value && displayLabel.value.type === 'multiple-with-plus' ? (
                <Fragment>
                  {displayLabel.value.text}
                  {' '}
                  <span class="plus-count">+{displayLabel.value.plusCount}</span>
                </Fragment>
              ) : (
                props.placeholder
              )}
            </span>
          )}

          <div class="selector-actions">
            {hasValue.value && props.clearable && !props.disabled && (
              <button
                type="button"
                class="clear-btn"
                onClick={clearSelection}
                title="清除"
              >
                ×
              </button>
            )}
            <div class={`dropdown-arrow ${showDropdown.value ? 'open' : ''}`}>
              ▼
            </div>
          </div>
        </div>

        {showDropdown.value && (
          <Motion
            initial={{opacity: 0, y: props.dropdownPlacement === 'top' ? 10 : -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: props.dropdownPlacement === 'top' ? 10 : -10}}
            transition={{duration: 0.2, ease: 'easeOut'}}
            class={`selector-dropdown ${props.dropdownPlacement === 'top' ? 'dropdown-top' : 'dropdown-bottom'}`}
            ref={dropdownRef}
          >
            <div class="dropdown-content" style={{ maxHeight: props.maxHeight }}>
              {filteredOptions.value.length === 0 ? (
                <div class="no-options">
                  {searchQuery.value ? '未找到匹配项' : '暂无选项'}
                </div>
              ) : (
                filteredOptions.value.map((option: any, index: number) => (
                  <div
                    key={index}
                    class={`dropdown-item ${isOptionSelected(option) ? 'selected' : ''}`}
                    onClick={() => selectOption(option)}
                  >
                    <span class="item-label">{getOptionLabel(option)}</span>
                    {isOptionSelected(option) && (
                      <span class="selected-icon">✓</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </Motion>
        )}
      </div>
    );
  }
});

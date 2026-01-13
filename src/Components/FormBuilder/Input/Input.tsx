import {defineComponent, computed } from "vue";
import "./Input.scss"

export default defineComponent({
    name: 'Input',
    props: {
        placeHolder: String,
        modelValue: String,
        title: String,
        type: {
            type: String,
            default: 'text',
            validator: (value: string) => {
                return ['text', 'password', 'email', 'number', 'tel', 'url', 'search'].includes(value);
            }
        },
        border: {
            type: Boolean,
            default: true
        },
        clearable: {
            type: Boolean,
            default: false
        },
        style: {
            type: Object as () => Partial<CSSStyleDeclaration>,
            default: () => ({})
        }
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        // 根据类型过滤输入值的函数
        const filterValue = (value: string): string => {
            switch (props.type) {
                case 'number':
                    // 只允许数字、小数点和负号
                    value = value.replace(/[^-0-9.]/g, '');
                    // 确保只有一个负号且在开头
                    const parts = value.split('-');
                    if (parts.length > 2) {
                        value = parts[0] + parts.slice(1).join('');
                    } else if (parts.length === 2 && !value.startsWith('-')) {
                        value = value.replace('-', '');
                    }
                    // 确保只有一个点号
                    const dotParts = value.split('.');
                    if (dotParts.length > 2) {
                        value = dotParts[0] + '.' + dotParts.slice(1).join('');
                    }
                    break;
                case 'tel':
                    // 只允许数字、空格、括号、横线、加号
                    value = value.replace(/[^0-9\s\-\(\)\+]/g, '');
                    break;
                default:
                    break;
            }
            return value;
        };



        // 处理粘贴事件
        const handlePaste = (event: ClipboardEvent) => {
            const target = event.target as HTMLInputElement;
            const pastedText = event.clipboardData?.getData('text') || '';
            const filteredText = filterValue(pastedText);

            if (filteredText !== pastedText) {
                event.preventDefault();
                // 手动插入过滤后的文本
                const start = target.selectionStart || 0;
                const end = target.selectionEnd || 0;
                const currentValue = target.value;
                const newValue = currentValue.slice(0, start) + filteredText + currentValue.slice(end);
                const finalValue = filterValue(newValue);

                target.value = finalValue;
                emit('update:modelValue', finalValue);
            }
        };

        const clearValue = () => {
            emit('update:modelValue', '');
        };

        // 计算是否应该显示清除按钮
        const shouldShowClearBtn = computed(() => {
            return props.clearable && props.modelValue && props.modelValue.trim() !== '';
        });

        // 处理键盘按键事件，阻止无效字符输入
        const handleKeydown = (event: KeyboardEvent) => {
            const target = event.target as HTMLInputElement;
            const key = event.key || String.fromCharCode(event.keyCode);

            // 对于number和tel类型，阻止非法的字符输入
            if (props.type === 'number') {
                // 允许的键：数字、删除、退格、方向键、小数点、负号、Ctrl组合键等
                const allowedKeys = [
                    'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End'
                ];

                // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
                    return;
                }

                // 检查是否是数字、小数点或负号
                if (!allowedKeys.includes(key) &&
                    !/[0-9\.\-]/.test(key)) {
                    event.preventDefault();
                    return;
                }

                // 特殊处理：确保只有一个负号且在开头
                if (key === '-' && target.value.includes('-')) {
                    event.preventDefault();
                    return;
                }

                // 特殊处理：确保只有一个点号
                if (key === '.' && target.value.includes('.')) {
                    event.preventDefault();
                    return;
                }
            } else if (props.type === 'tel') {
                // 允许的键
                const allowedKeys = [
                    'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End', ' '
                ];

                // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
                    return;
                }

                // 检查是否是电话号码允许的字符
                if (!allowedKeys.includes(key) &&
                    !/[0-9\-\(\)\+]/.test(key)) {
                    event.preventDefault();
                    return;
                }
            }
        };

        // 处理输入事件（主要用于输入法输入）
        const handleInput = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const originalValue = target.value;
            const filteredValue = filterValue(originalValue);

            if (filteredValue !== originalValue) {
                target.value = filteredValue;
                emit('update:modelValue', filteredValue);
            } else {
                emit('update:modelValue', originalValue);
            }
        };

        return () => (
            <div class="input-wrapper">
                <input
                    class={`input-component ${props.border ? 'with-border' : 'no-border'}`}
                    type={props.type === 'number' || props.type === 'tel' ? 'text' : props.type}
                    value={props.modelValue}
                    onInput={handleInput}
                    onKeydown={handleKeydown}
                    onPaste={handlePaste}
                    placeholder={props.placeHolder}
                    style={props.style}
                />
                {shouldShowClearBtn.value && (
                    <button
                        class="input-clear-btn"
                        onClick={clearValue}
                        type="button"
                    >
                        ✕
                    </button>
                )}
            </div>
        )
    }
})